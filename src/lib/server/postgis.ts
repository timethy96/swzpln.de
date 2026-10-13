// ============================================================================
// PostGIS als Hauptquelle für /api/geodata
//
// Die Datenbank (osm2pgsql, Stil /opt/postgis/import/swzpln.lua auf
// tab-overpass) liefert hier Overpass-JSON im Stil von `out geom`: Ways mit
// Inline-Koordinaten, Multipolygone als Relation mit Inline-Membern. So
// bleiben der Konverter auf swzpln.de und der Parser im Shop unverändert.
// Die Tags werden aus den Spalten nachgebaut, genau so viele, wie die
// Konverter auswerten.
//
// Gestreamt wird zeilenweise über einen Cursor: ein Ausschnitt von 0,5° in
// Berlin sind Hunderttausende Gebäude, der Container hat 512 MB.
// ============================================================================

import pg from 'pg';
import Cursor from 'pg-cursor';
import { env } from '$env/dynamic/private';
import type { Bounds, Layer } from '$lib/schwarzplan/types';

const RAIL = [
	'tram',
	'subway',
	'rail',
	'preserved',
	'narrow_gauge',
	'monorail',
	'miniature',
	'light_rail',
	'funicular'
];
const MAJOR_ROADS = "highway ~ '^(motorway|trunk|primary|secondary|tertiary)(_link)?$'";
const MEDIUM_ROADS =
	"highway !~ '^(footway|path|cycleway|track|service|pedestrian|steps|corridor|bridleway)$'";

const BUILDING_COLS = 'height, min_height, levels, min_level, roof_shape, roof_height';

type Tags = Record<string, string>;
type Row = Record<string, unknown> & { g: string };

/** Je Ebene: Tabelle, Zusatzspalten, Bedingung und die Tags, die daraus werden. */
const LAYERS: Partial<
	Record<Layer, { table: string; cols?: string; where?: string; tags: (r: Row) => Tags }[]>
> = {
	building: [
		{
			table: 'buildings',
			cols: BUILDING_COLS,
			where: 'not part',
			tags: (r) => buildingTags('building', r)
		}
	],
	building_parts: [
		{
			table: 'buildings',
			cols: BUILDING_COLS,
			where: 'part',
			tags: (r) => buildingTags('building:part', r)
		}
	],
	highway: [{ table: 'roads', cols: 'highway', tags: (r) => ({ highway: String(r.highway) }) }],
	railway: [
		{
			table: 'railways',
			cols: 'railway',
			where: `railway in (${RAIL.map((r) => `'${r}'`).join(',')})`,
			tags: (r) => ({ railway: String(r.railway) })
		}
	],
	water: [
		{ table: 'areas', where: "kind = 'water'", tags: () => ({ natural: 'water' }) },
		{ table: 'coastline', tags: () => ({ natural: 'coastline' }) }
	],
	waterway: [
		{ table: 'waterways', cols: 'waterway', tags: (r) => ({ waterway: String(r.waterway) }) }
	],
	green: [{ table: 'areas', where: "kind = 'green'", tags: () => ({ leisure: 'park' }) }],
	forest: [{ table: 'areas', where: "kind = 'forest'", tags: () => ({ landuse: 'forest' }) }],
	farmland: [{ table: 'areas', where: "kind = 'farmland'", tags: () => ({ landuse: 'farmland' }) }]
};

function buildingTags(key: string, r: Row): Tags {
	const t: Tags = { [key]: 'yes' };
	const put = (k: string, v: unknown) => {
		if (v !== null && v !== undefined) t[k] = String(v);
	};
	put('height', r.height);
	put('min_height', r.min_height);
	put('building:levels', r.levels);
	put('building:min_level', r.min_level);
	put('roof:shape', r.roof_shape);
	put('roof:height', r.roof_height);
	return t;
}

let pool: pg.Pool | null = null;
// Nach einem Fehler eine Minute lang gleich Overpass nehmen statt jedes Mal
// auf den Verbindungs-Timeout zu warten
let downUntil = 0;

export function isPostgisEnabled(): boolean {
	return !!env.POSTGIS_URL && Date.now() > downUntil;
}

export function markPostgisDown(): void {
	downUntil = Date.now() + 60_000;
}

function getPool(): pg.Pool {
	if (!pool) {
		pool = new pg.Pool({
			connectionString: env.POSTGIS_URL,
			max: 4,
			idleTimeoutMillis: 30_000,
			connectionTimeoutMillis: 3_000,
			statement_timeout: 60_000
		});
		pool.on('error', (e) => console.error('PostGIS pool error:', e.message));
	}
	return pool;
}

/** Schema mit den Sichten welt.* (UNION über alle Kontinente). */
const schema = () => (env.POSTGIS_SCHEMA || 'welt').replace(/[^a-z0-9_]/gi, '');

export type RoadDetail = 'all' | 'medium' | 'major';

/** GeoJSON-Geometrie als Overpass-Elemente (`out geom`). */
export function toElements(
	geojson: { type: string; coordinates: unknown },
	tags: Tags,
	ids: { way: number; rel: number }
): object[] {
	const pts = (ring: number[][]) => ring.map(([lon, lat]) => ({ lat, lon }));
	if (geojson.type === 'LineString') {
		return [{ type: 'way', id: ++ids.way, tags, geometry: pts(geojson.coordinates as number[][]) }];
	}
	const polys =
		geojson.type === 'Polygon'
			? [geojson.coordinates as number[][][]]
			: geojson.type === 'MultiPolygon'
				? (geojson.coordinates as number[][][][])
				: [];
	if (polys.length === 1 && polys[0].length === 1) {
		return [{ type: 'way', id: ++ids.way, tags, geometry: pts(polys[0][0]) }];
	}
	if (polys.length === 0) return [];
	const members = polys.flatMap((rings) =>
		rings.map((ring, i) => ({
			type: 'way',
			ref: ++ids.way,
			role: i === 0 ? 'outer' : 'inner',
			geometry: pts(ring)
		}))
	);
	return [{ type: 'relation', id: ++ids.rel, tags: { type: 'multipolygon', ...tags }, members }];
}

/**
 * Overpass-JSON (`out geom`) für Ausschnitt und Ebenen als Strom. Der erste
 * Datenbankfehler wird geworfen, bevor das erste Byte rausgeht, damit der
 * Aufrufer noch auf Overpass ausweichen kann.
 */
export async function postgisStream(
	bounds: Bounds,
	layers: Layer[],
	roads: RoadDetail = 'all'
): Promise<ReadableStream<Uint8Array>> {
	const client = await getPool().connect();
	const s = schema();
	const queries = layers.flatMap((l) =>
		(LAYERS[l] ?? []).map((q) => {
			const where = [
				'geom && ST_MakeEnvelope($1, $2, $3, $4, 4326)',
				q.where,
				l === 'highway' && roads === 'major' ? MAJOR_ROADS : null,
				l === 'highway' && roads === 'medium' ? MEDIUM_ROADS : null
			].filter(Boolean);
			return {
				sql: `select ST_AsGeoJSON(geom, 7) as g${q.cols ? ', ' + q.cols : ''} from ${s}.${q.table} where ${where.join(' and ')}`,
				tags: q.tags
			};
		})
	);
	const params = [bounds.west, bounds.south, bounds.east, bounds.north];
	const enc = new TextEncoder();
	const ids = { way: 0, rel: 0 };
	let first = true;

	// Alle Abfragen vorab planen lassen: Fehler (DB weg, Schema fehlt)
	// fliegen hier und nicht mitten in der Antwort
	try {
		for (const q of queries) await client.query(`explain ${q.sql}`, params);
	} catch (e) {
		client.release(true);
		throw e;
	}

	let qi = 0;
	let cursor: Cursor<Row> | null = null;
	return new ReadableStream<Uint8Array>({
		start(controller) {
			controller.enqueue(enc.encode('{"version":0.6,"generator":"swzpln-postgis","elements":['));
		},
		async pull(controller) {
			try {
				// Jeder Aufruf muss etwas liefern, sonst ruft der Strom nicht wieder
				for (;;) {
					if (qi >= queries.length) {
						controller.enqueue(enc.encode(']}'));
						controller.close();
						client.release();
						return;
					}
					cursor ??= client.query(new Cursor<Row>(queries[qi].sql, params));
					const rows = await cursor.read(2000);
					if (rows.length === 0) {
						await cursor.close();
						cursor = null;
						qi++;
						continue;
					}
					let out = '';
					for (const r of rows) {
						for (const el of toElements(JSON.parse(r.g), queries[qi].tags(r), ids)) {
							out += (first ? '' : ',') + JSON.stringify(el);
							first = false;
						}
					}
					controller.enqueue(enc.encode(out));
					return;
				}
			} catch (e) {
				client.release(true);
				controller.error(e);
			}
		},
		cancel() {
			client.release(true);
		}
	});
}
