// Elevation data API endpoint - proxies Open Topo Data API

import { json, error } from '@sveltejs/kit';
import { env } from '$env/dynamic/private';
import type { RequestHandler } from './$types';

const OPENTOPODATA_API_URL = 'https://api.opentopodata.org/v1/mapzen';

// Grid resolution (10x10 points)
const GRID_SIZE = 10;

/**
 * GET endpoint for elevation data
 * Query parameters: north, south, east, west
 */
export const GET: RequestHandler = async ({ url }) => {
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

	try {
		// Create grid of sample points
		const latStep = (north - south) / (GRID_SIZE - 1);
		const lngStep = (east - west) / (GRID_SIZE - 1);

		const locations: string[] = [];
		for (let i = 0; i < GRID_SIZE; i++) {
			for (let j = 0; j < GRID_SIZE; j++) {
				const lat = south + i * latStep;
				const lng = west + j * lngStep;
				locations.push(`${lat},${lng}`);
			}
		}

		// Build API request
		const apiUrl = new URL(OPENTOPODATA_API_URL);
		apiUrl.searchParams.set('locations', locations.join('|'));
		apiUrl.searchParams.set('interpolation', 'bilinear');

	// Make request to Open Topo Data
	const headers: Record<string, string> = {};
	if (env.OPENTOPODATA_API_KEY) {
		headers['x-api-key'] = env.OPENTOPODATA_API_KEY;
		console.log('Elevation API: API key loaded', !!env.OPENTOPODATA_API_KEY);
	} else {
		console.warn('Elevation API: NO API KEY FOUND');
	}

		const response = await fetch(apiUrl.toString(), { headers });

		if (!response.ok) {
			console.error('Open Topo Data API error:', response.status, response.statusText);
			throw error(502, 'Failed to fetch elevation data from upstream API');
		}

		const data = await response.json();

		// Check for API errors
		if (data.error) {
			console.error('Open Topo Data API error:', data.error);
			throw error(502, data.error);
		}

		// Extract elevations into a matrix
		const matrix: number[][] = [];
		let row: number[] = [];
		let count = 0;

		for (const result of data.results) {
			row.push(result.elevation);
			count++;

			if (count % GRID_SIZE === 0) {
				matrix.push(row);
				row = [];
			}
		}

		// Return the elevation matrix
		return json(matrix);
	} catch (err) {
		console.error('Elevation API error:', err);
		if (err && typeof err === 'object' && 'status' in err) {
			throw err; // Re-throw SvelteKit errors
		}
		throw error(500, 'Internal server error while fetching elevation data');
	}
};

