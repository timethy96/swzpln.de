// Overpass API client for server-side geodata queries
// Replaces PostGIS as the primary data source for map data

import { env } from '$env/dynamic/private';
import type { Bounds, Layer, GeoDataFeature, GeoDataResponse } from '$lib/schwarzplan/types';
import { LAYER_CONFIG } from '$lib/schwarzplan/layers';

// ============================================================================
// Configuration
// ============================================================================

function getOverpassUrl(): string {
	return env.OVERPASS_URL ?? '';
}

const CACHE_TTL_MS = parseInt(env.OVERPASS_CACHE_TTL_HOURS ?? '24', 10) * 3600 * 1000;
const MAX_CACHE_ENTRIES = 100;

// ============================================================================
// Availability Check
// ============================================================================

const CHECK_INTERVAL = 5 * 60 * 1000;
let lastCheck = 0;
let lastAvailable = false;

export async function isOverpassAvailable(): Promise<boolean> {
	const now = Date.now();
	if (now - lastCheck < CHECK_INTERVAL) return lastAvailable;

	const url = getOverpassUrl();
	if (!url) {
		lastCheck = now;
		lastAvailable = false;
		console.info('OVERPASS_URL not set - Overpass disabled, using client-side fallback');
		return false;
	}

	try {
		// Use /api/status instead of a test query — node(1) triggers a dispatcher
		// error on some Overpass instances and causes false negatives.
		const statusUrl = url.replace(/\/api\/interpreter\/?$/, '/api/status');
		const res = await fetch(statusUrl, {
			signal: AbortSignal.timeout(5000)
		});
		lastCheck = now;
		lastAvailable = res.ok;
		return res.ok;
	} catch {
		lastCheck = now;
		lastAvailable = false;
		return false;
	}
}

// ============================================================================
// LRU Cache
// ============================================================================

interface CacheEntry {
	data: GeoDataResponse;
	timestamp: number;
}

const cache = new Map<string, CacheEntry>();

function cacheKey(bounds: Bounds, layers: Layer[]): string {
	const b = `${bounds.south.toFixed(6)},${bounds.west.toFixed(6)},${bounds.north.toFixed(6)},${bounds.east.toFixed(6)}`;
	const l = [...layers].sort().join(',');
	return `${b}|${l}`;
}

function getCached(key: string): GeoDataResponse | null {
	const entry = cache.get(key);
	if (!entry) return null;
	if (Date.now() - entry.timestamp > CACHE_TTL_MS) {
		cache.delete(key);
		return null;
	}
	// Move to end (LRU)
	cache.delete(key);
	cache.set(key, entry);
	return entry.data;
}

function setCache(key: string, data: GeoDataResponse): void {
	// Evict oldest if at capacity
	if (cache.size >= MAX_CACHE_ENTRIES) {
		const oldest = cache.keys().next().value;
		if (oldest !== undefined) cache.delete(oldest);
	}
	cache.set(key, { data, timestamp: Date.now() });
}

// ============================================================================
// Query Builder
// ============================================================================

function buildOverpassQuery(bounds: Bounds, layers: Layer[]): string {
	const bbox = `${bounds.south},${bounds.west},${bounds.north},${bounds.east}`;
	const queryParts: string[] = [];

	for (const layer of layers) {
		if (layer === 'contours') continue;
		const config = LAYER_CONFIG[layer];
		if (config?.overpassQuery) {
			// Inject bbox directly into each statement: nwr["tag"] → nwr(bbox)["tag"]
			const withBbox = config.overpassQuery.replace(/\bnwr\b/g, `nwr(${bbox})`);
			queryParts.push(withBbox);
		}
	}

	return `[out:json];(${queryParts.join('')});out body;>;out skel qt;`;
}

// ============================================================================
// Overpass Response Parsing
// ============================================================================

interface OverpassElement {
	type: 'node' | 'way' | 'relation';
	id: number;
	lat?: number;
	lon?: number;
	nodes?: number[];
	members?: { type: string; ref: number; role: string }[];
	tags?: Record<string, string>;
}

interface OverpassResponse {
	elements: OverpassElement[];
}

// Layer classification for Overpass elements (matches PostGIS table mapping)
const LAYER_MATCHERS: Record<string, (tags: Record<string, string>) => boolean> = {
	building: (tags) => !!tags.building && tags.building !== 'no',
	building_parts: (tags) => !!tags['building:part'] && tags['building:part'] !== 'no',
	highway: (tags) => !!tags.highway,
	railway: (tags) => {
		const types = [
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
		return !!tags.railway && types.includes(tags.railway);
	},
	water: (tags) => tags.natural === 'water',
	waterway: (tags) => !!tags.waterway,
	green: (tags) => {
		const greenLanduse = [
			'allotments',
			'meadow',
			'orchard',
			'vineyard',
			'cemetery',
			'grass',
			'plant_nursery',
			'recreation_ground',
			'village_green'
		];
		if (tags.leisure === 'park') return true;
		if (tags.landuse && greenLanduse.includes(tags.landuse)) return true;
		return false;
	},
	forest: (tags) => tags.landuse === 'forest' || tags.natural === 'wood',
	farmland: (tags) => tags.landuse === 'farmland'
};

function classifyElement(tags: Record<string, string>, requestedLayers: Layer[]): string | null {
	for (const layer of requestedLayers) {
		if (layer === 'contours') continue;
		const matcher = LAYER_MATCHERS[layer];
		if (matcher?.(tags)) return layer;
	}
	return null;
}

/**
 * Convert Overpass JSON response to GeoDataResponse format.
 * Builds node index, resolves ways/relations to GeoJSON geometries.
 */
function parseOverpassResponse(data: OverpassResponse, requestedLayers: Layer[]): GeoDataResponse {
	const result: Record<string, GeoDataFeature[]> = {};

	// Build node index
	const nodes = new Map<number, [number, number]>();
	for (const el of data.elements) {
		if (el.type === 'node' && el.lat !== undefined && el.lon !== undefined) {
			nodes.set(el.id, [el.lon, el.lat]);
		}
	}

	// Process ways
	for (const el of data.elements) {
		if (el.type !== 'way' || !el.tags || !el.nodes) continue;

		const layer = classifyElement(el.tags, requestedLayers);
		if (!layer) continue;

		const coords = resolveNodes(el.nodes, nodes);
		if (coords.length < 2) continue;

		const isClosed = el.nodes.length > 2 && el.nodes[0] === el.nodes[el.nodes.length - 1];
		const isPolygonLayer =
			layer === 'building' ||
			layer === 'building_parts' ||
			layer === 'water' ||
			layer === 'green' ||
			layer === 'forest' ||
			layer === 'farmland';

		let geojson: GeoJSON.Geometry;
		if (isClosed && isPolygonLayer) {
			geojson = { type: 'Polygon', coordinates: [coords] };
		} else {
			geojson = { type: 'LineString', coordinates: coords };
		}

		const properties = buildProperties(el.tags, layer);

		if (!result[layer]) result[layer] = [];
		result[layer].push({ geojson, properties });
	}

	// Process multipolygon relations
	for (const el of data.elements) {
		if (el.type !== 'relation' || !el.tags || !el.members) continue;
		if (el.tags.type !== 'multipolygon') continue;

		const layer = classifyElement(el.tags, requestedLayers);
		if (!layer) continue;

		const polygons = resolveMultipolygon(el.members, data.elements, nodes);
		if (polygons.length === 0) continue;

		let geojson: GeoJSON.Geometry;
		if (polygons.length === 1) {
			geojson = { type: 'Polygon', coordinates: polygons[0] };
		} else {
			geojson = { type: 'MultiPolygon', coordinates: polygons };
		}

		const properties = buildProperties(el.tags, layer);

		if (!result[layer]) result[layer] = [];
		result[layer].push({ geojson, properties });
	}

	return { source: 'overpass', layers: result };
}

function resolveNodes(nodeIds: number[], nodes: Map<number, [number, number]>): number[][] {
	const coords: number[][] = [];
	for (const id of nodeIds) {
		const coord = nodes.get(id);
		if (coord) coords.push(coord);
	}
	return coords;
}

function resolveMultipolygon(
	members: { type: string; ref: number; role: string }[],
	elements: OverpassElement[],
	nodes: Map<number, [number, number]>
): number[][][][] {
	// Index ways by ID
	const wayIndex = new Map<number, OverpassElement>();
	for (const el of elements) {
		if (el.type === 'way') wayIndex.set(el.id, el);
	}

	const outerRings: number[][][] = [];
	const innerRings: number[][][] = [];

	for (const member of members) {
		if (member.type !== 'way') continue;
		const way = wayIndex.get(member.ref);
		if (!way?.nodes) continue;

		const coords = resolveNodes(way.nodes, nodes);
		if (coords.length < 3) continue;

		if (member.role === 'inner') {
			innerRings.push(coords);
		} else {
			outerRings.push(coords);
		}
	}

	if (outerRings.length === 0) return [];

	// Simple approach: each outer ring is a polygon, inner rings go to the first polygon
	const polygons: number[][][][] = [];
	for (let i = 0; i < outerRings.length; i++) {
		const rings = [outerRings[i]];
		if (i === 0) {
			rings.push(...innerRings);
		}
		polygons.push(rings);
	}

	return polygons;
}

function buildProperties(
	tags: Record<string, string>,
	layer: string
): Record<string, string | number | null> {
	const props: Record<string, string | number | null> = {};

	if (layer === 'building') {
		props.building = tags.building ?? null;
		props.height = parseFloat(tags.height) || null;
		props.min_height = parseFloat(tags.min_height) || null;
		props.levels = parseFloat(tags['building:levels']) || null;
		props.min_level = parseFloat(tags['building:min_level']) || null;
		props.building_shape = tags['building:shape'] ?? null;
		props.roof_shape = tags['roof:shape'] ?? null;
		props.roof_height = parseFloat(tags['roof:height']) || null;
		props.roof_levels = parseFloat(tags['roof:levels']) || null;
		props.building_material = tags['building:material'] ?? null;
		props.building_colour = tags['building:colour'] ?? tags['building:color'] ?? null;
		props.name = tags.name ?? null;
		props.amenity = tags.amenity ?? null;
		props.architect = tags.architect ?? null;
		props.start_date = tags.start_date ?? null;
		props.heritage = tags.heritage ?? null;
		props.description = tags.description ?? null;
		props.addr_street = tags['addr:street'] ?? null;
		props.addr_housenumber = tags['addr:housenumber'] ?? null;
		props.addr_postcode = tags['addr:postcode'] ?? null;
		props.addr_city = tags['addr:city'] ?? null;
		props.addr_country = tags['addr:country'] ?? null;
	} else if (layer === 'building_parts') {
		props.building_part = tags['building:part'] ?? null;
		props.height = parseFloat(tags.height) || null;
		props.min_height = parseFloat(tags.min_height) || null;
		props.levels = parseFloat(tags['building:levels']) || null;
		props.min_level = parseFloat(tags['building:min_level']) || null;
		props.building_shape = tags['building:shape'] ?? null;
		props.roof_shape = tags['roof:shape'] ?? null;
		props.roof_height = parseFloat(tags['roof:height']) || null;
		props.roof_levels = parseFloat(tags['roof:levels']) || null;
		props.building_material = tags['building:material'] ?? null;
		props.building_colour = tags['building:colour'] ?? tags['building:color'] ?? null;
	} else if (layer === 'highway') {
		props.highway = tags.highway ?? null;
	} else if (layer === 'railway') {
		props.railway = tags.railway ?? null;
	} else if (layer === 'green' || layer === 'forest') {
		props.green_type = tags.landuse ?? tags.leisure ?? tags.natural ?? null;
	}

	return props;
}

// ============================================================================
// Public API
// ============================================================================

/**
 * Query geodata from Overpass for the given bounds and layers.
 * Returns GeoJSON features with metadata, grouped by layer.
 */
export async function queryGeodata(bounds: Bounds, layers: Layer[]): Promise<GeoDataResponse> {
	const available = await isOverpassAvailable();
	if (!available) {
		return { source: 'unavailable', layers: {} };
	}

	const key = cacheKey(bounds, layers);
	const cached = getCached(key);
	if (cached) return cached;

	const query = buildOverpassQuery(bounds, layers);
	const url = getOverpassUrl();

	const res = await fetch(url, {
		method: 'POST',
		headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
		body: `data=${encodeURIComponent(query)}`,
		signal: AbortSignal.timeout(120000)
	});

	if (!res.ok) {
		throw new Error(`Overpass API error: ${res.status}`);
	}

	const contentType = res.headers.get('content-type') ?? '';
	if (!contentType.includes('json')) {
		console.warn(
			`Overpass API returned non-JSON response (${contentType}), falling back to client-side`
		);
		return { source: 'unavailable' as const, layers: {} };
	}

	const data = (await res.json()) as OverpassResponse;
	const result = parseOverpassResponse(data, layers);

	setCache(key, result);
	return result;
}
