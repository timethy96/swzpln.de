// Geodata API endpoint - queries PostGIS for map features
// Returns GeoJSON with metadata, or { source: 'unavailable' } for Overpass fallback

import { json, error } from '@sveltejs/kit';
import { checkRateLimit } from '$lib/server/ratelimit';
import { queryGeodata } from '$lib/server/postgis';
import type { RequestHandler } from './$types';
import type { Layer } from '$lib/schwarzplan/types';

const VALID_LAYERS: Set<string> = new Set([
	'building',
	'building_parts',
	'highway',
	'railway',
	'water',
	'waterway',
	'green',
	'forest',
	'farmland',
	'contours'
]);

export const GET: RequestHandler = async ({ url, getClientAddress }) => {
	// Rate limiting: 10 requests per IP per minute
	const clientIP = getClientAddress();
	if (!checkRateLimit(clientIP, 10, 60 * 1000)) {
		throw error(429, 'Too many requests');
	}

	// Parse bounds
	const north = parseFloat(url.searchParams.get('north') || '');
	const south = parseFloat(url.searchParams.get('south') || '');
	const east = parseFloat(url.searchParams.get('east') || '');
	const west = parseFloat(url.searchParams.get('west') || '');

	if (isNaN(north) || isNaN(south) || isNaN(east) || isNaN(west)) {
		throw error(400, 'Invalid bounds parameters');
	}

	if (north <= south) {
		throw error(400, 'North must be greater than south');
	}

	if (north > 90 || south < -90 || east > 180 || west < -180) {
		throw error(400, 'Bounds out of valid range');
	}

	if (north - south > 0.5 || east - west > 0.5) {
		throw error(400, 'Bounding box too large');
	}

	// Parse layers
	const layersParam = url.searchParams.get('layers') || '';
	const layers = layersParam
		.split(',')
		.map((l) => l.trim())
		.filter((l) => VALID_LAYERS.has(l)) as Layer[];

	if (layers.length === 0) {
		throw error(400, 'No valid layers specified');
	}

	try {
		const result = await queryGeodata({ north, south, east, west }, layers);
		return json(result);
	} catch (err) {
		console.error('Geodata API error:', err);
		throw error(502, 'Failed to fetch geodata');
	}
};
