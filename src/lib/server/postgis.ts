// PostGIS client for server-side geodata queries
// Primary data source for map data, with Overpass as client-side fallback

import pg from 'pg';
import { env } from '$env/dynamic/private';
import type { Bounds, Layer, GeoDataFeature, GeoDataResponse } from '$lib/schwarzplan/types';

const { Pool } = pg;

// ============================================================================
// Pool Management
// ============================================================================

let pool: pg.Pool | null = null;
let poolChecked = false;

function getPool(): pg.Pool | null {
	if (poolChecked) return pool;
	poolChecked = true;

	const connStr = env.POSTGIS_URL ?? '';
	if (!connStr) {
		console.info('POSTGIS_URL not set - PostGIS disabled, using Overpass fallback');
		return null;
	}

	pool = new Pool({
		connectionString: connStr,
		max: 5,
		idleTimeoutMillis: 30000,
		connectionTimeoutMillis: 5000
	});

	pool.on('error', (err) => {
		console.error('PostGIS pool error:', err.message);
	});

	return pool;
}

// ============================================================================
// Availability Check (cached for 5 minutes)
// ============================================================================

const POSTGIS_CHECK_INTERVAL = 5 * 60 * 1000;
let lastCheck = 0;
let lastAvailable = false;

export async function isPostgisAvailable(): Promise<boolean> {
	const now = Date.now();
	if (now - lastCheck < POSTGIS_CHECK_INTERVAL) return lastAvailable;

	const p = getPool();
	if (!p) {
		lastCheck = now;
		lastAvailable = false;
		return false;
	}

	try {
		await p.query('SELECT 1');
		lastCheck = now;
		lastAvailable = true;
		return true;
	} catch {
		lastCheck = now;
		lastAvailable = false;
		return false;
	}
}

// ============================================================================
// Query Geodata
// ============================================================================

// Map our Layer types to PostGIS table/query configurations
const LAYER_QUERIES: Record<string, { table: string; columns: string; where?: string }> = {
	building: {
		table: 'buildings',
		columns: `osm_id, ST_AsGeoJSON(geom) as geojson, building, height, min_height, levels, min_level,
			building_shape, roof_shape, roof_height, roof_levels, building_material, building_colour,
			name, amenity, architect, start_date, heritage, description,
			addr_street, addr_housenumber, addr_postcode, addr_city, addr_country`
	},
	building_parts: {
		table: 'building_parts',
		columns: `osm_id, ST_AsGeoJSON(geom) as geojson, building_part, height, min_height, levels, min_level,
			building_shape, roof_shape, roof_height, roof_levels, building_material, building_colour`
	},
	highway: {
		table: 'roads',
		columns: 'ST_AsGeoJSON(geom) as geojson, highway'
	},
	railway: {
		table: 'railway',
		columns: 'ST_AsGeoJSON(geom) as geojson, railway'
	},
	water: {
		table: 'water',
		columns: 'ST_AsGeoJSON(geom) as geojson'
	},
	waterway: {
		table: 'waterways',
		columns: 'ST_AsGeoJSON(geom) as geojson'
	},
	green: {
		table: 'green',
		columns: 'ST_AsGeoJSON(geom) as geojson, green_type',
		where: "green_type NOT IN ('wood', 'forest')"
	},
	forest: {
		table: 'green',
		columns: 'ST_AsGeoJSON(geom) as geojson, green_type',
		where: "green_type IN ('wood', 'forest')"
	},
	farmland: {
		table: 'farmland',
		columns: 'ST_AsGeoJSON(geom) as geojson'
	}
};

/**
 * Query geodata from PostGIS for the given bounds and layers.
 * Returns GeoJSON features with metadata, grouped by layer.
 */
export async function queryGeodata(bounds: Bounds, layers: Layer[]): Promise<GeoDataResponse> {
	const available = await isPostgisAvailable();
	if (!available) {
		return { source: 'unavailable', layers: {} };
	}

	const p = getPool()!;
	const result: Record<string, GeoDataFeature[]> = {};
	const queries: Promise<void>[] = [];

	for (const layer of layers) {
		if (layer === 'contours') continue; // Contours come from elevation API

		const config = LAYER_QUERIES[layer];
		if (!config) continue;

		const envelope = 'ST_MakeEnvelope($1, $2, $3, $4, 4326)';
		const whereClause = config.where
			? `geom && ${envelope} AND ${config.where}`
			: `geom && ${envelope}`;

		const sql = `SELECT ${config.columns} FROM ${config.table} WHERE ${whereClause}`;
		const params = [bounds.west, bounds.south, bounds.east, bounds.north];

		queries.push(
			p.query(sql, params).then((res) => {
				const features: GeoDataFeature[] = [];
				for (const row of res.rows) {
					const { geojson: geojsonStr, ...properties } = row;
					features.push({
						geojson: JSON.parse(geojsonStr),
						properties
					});
				}
				result[layer] = features;
			})
		);
	}

	await Promise.all(queries);
	return { source: 'postgis', layers: result };
}
