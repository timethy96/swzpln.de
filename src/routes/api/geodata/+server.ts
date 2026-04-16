// Geodata API endpoint - streaming proxy to internal Overpass
// Validates parameters and rate-limits, then streams the raw Overpass response
// through without parsing or caching. The client handles parsing in a Web Worker.

import { error } from '@sveltejs/kit';
import { checkRateLimit } from '$lib/server/ratelimit';
import { isOverpassAvailable, getOverpassUrl, buildOverpassQuery } from '$lib/server/overpass';
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
	// Rate limiting: 60 requests per IP per minute
	const clientIP = getClientAddress();
	if (!checkRateLimit(`geodata:${clientIP}`, 60, 60 * 1000)) {
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

	// Check Overpass availability
	const available = await isOverpassAvailable();
	if (!available) {
		return new Response(JSON.stringify({ source: 'unavailable', layers: {} }), {
			headers: { 'Content-Type': 'application/json' }
		});
	}

	// Build query and stream response from Overpass
	const query = buildOverpassQuery({ north, south, east, west }, layers);
	const overpassUrl = getOverpassUrl();

	try {
		const res = await fetch(overpassUrl, {
			method: 'POST',
			headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
			body: `data=${encodeURIComponent(query)}`,
			signal: AbortSignal.timeout(120000)
		});

		if (!res.ok) {
			throw new Error(`Overpass API error: ${res.status}`);
		}

		// Stream the raw Overpass response through without parsing
		return new Response(res.body, {
			headers: {
				'Content-Type': 'application/json',
				'X-Geodata-Source': 'overpass-proxy'
			}
		});
	} catch (err) {
		console.error('Geodata API error:', err);
		throw error(502, 'Failed to fetch geodata');
	}
};
