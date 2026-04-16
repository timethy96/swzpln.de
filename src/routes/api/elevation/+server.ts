// Elevation data API endpoint - streaming proxy to Open Topo Data
// Builds the location query, adds the API key, and streams the raw response.
// Bicubic interpolation happens client-side.

import { error } from '@sveltejs/kit';
import { env } from '$env/dynamic/private';
import { checkRateLimit } from '$lib/server/ratelimit';
import type { RequestHandler } from './$types';

const OPENTOPODATA_API_URL = 'https://api.opentopodata.org/v1/mapzen';
const SAMPLE_GRID_SIZE = 10;

export const GET: RequestHandler = async ({ url, getClientAddress }) => {
	// Rate limiting: 20 requests per IP per minute
	const clientIP = getClientAddress();
	if (!checkRateLimit(`elevation:${clientIP}`, 20, 60 * 1000)) {
		throw error(429, 'Too many requests');
	}

	// Extract bounds from query parameters
	const north = parseFloat(url.searchParams.get('north') || '');
	const south = parseFloat(url.searchParams.get('south') || '');
	const east = parseFloat(url.searchParams.get('east') || '');
	const west = parseFloat(url.searchParams.get('west') || '');

	// Validate inputs
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

	try {
		// Build 10x10 sample grid locations
		const latStep = (north - south) / (SAMPLE_GRID_SIZE - 1);
		const lngStep = (east - west) / (SAMPLE_GRID_SIZE - 1);

		const locations: string[] = [];
		for (let i = 0; i < SAMPLE_GRID_SIZE; i++) {
			for (let j = 0; j < SAMPLE_GRID_SIZE; j++) {
				const lat = Number((south + i * latStep).toFixed(6));
				const lng = Number((west + j * lngStep).toFixed(6));
				locations.push(`${lat},${lng}`);
			}
		}

		const headers: Record<string, string> = {
			Connection: 'close',
			'User-Agent': 'SWZPLN-Elevation-Fetcher/1.0'
		};
		if (env.OPENTOPODATA_API_KEY) {
			headers['x-api-key'] = env.OPENTOPODATA_API_KEY;
		}

		const params = new URLSearchParams({
			locations: locations.join('|'),
			interpolation: 'bilinear'
		});

		const apiUrl = `${OPENTOPODATA_API_URL}?${params.toString()}`;

		const response = await fetch(apiUrl, {
			method: 'GET',
			headers,
			signal: AbortSignal.timeout(30000)
		});

		if (!response.ok) {
			console.error('Open Topo Data API error:', response.status, response.statusText);
			throw new Error(`Upstream API error: ${response.status}`);
		}

		// Stream the raw OpenTopoData response through
		return new Response(response.body, {
			headers: {
				'Content-Type': 'application/json'
			}
		});
	} catch (err: unknown) {
		console.error('Elevation API error:', err);
		throw error(502, 'Failed to fetch elevation data');
	}
};
