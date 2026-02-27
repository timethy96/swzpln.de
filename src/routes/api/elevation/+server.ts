// Elevation data API endpoint - proxies Open Topo Data API

import { json, error } from '@sveltejs/kit';
import { env } from '$env/dynamic/private';
import type { RequestHandler } from './$types';

const OPENTOPODATA_API_URL = 'https://api.opentopodata.org/v1/mapzen';

// Sample resolution (10x10 grid to match PHP implementation)
const SAMPLE_GRID_SIZE = 10;
// Output resolution (Upscaled for smooth mesh)
const OUTPUT_GRID_SIZE = 80;

/**
 * Cubic interpolation helper
 */
function cubic(p0: number, p1: number, p2: number, p3: number, t: number): number {
	const a = -0.5 * p0 + 1.5 * p1 - 1.5 * p2 + 0.5 * p3;
	const b = p0 - 2.5 * p1 + 2 * p2 - 0.5 * p3;
	const c = -0.5 * p0 + 0.5 * p2;
	const d = p1;
	return a * t * t * t + b * t * t + c * t + d;
}

/**
 * Bicubic interpolation for a grid
 */
function bicubicInterpolate(matrix: number[][], x: number, y: number): number {
	const rows = matrix.length;
	const cols = matrix[0].length;

	const xi = Math.floor(x);
	const yi = Math.floor(y);
	const dx = x - xi;
	const dy = y - yi;

	const p: number[][] = [];

	for (let j = -1; j <= 2; j++) {
		const rowArr: number[] = [];
		for (let i = -1; i <= 2; i++) {
			// Clamp indices to edges
			const r = Math.max(0, Math.min(rows - 1, yi + j));
			const c = Math.max(0, Math.min(cols - 1, xi + i));
			rowArr.push(matrix[r][c]);
		}
		p.push(rowArr);
	}

	const arr = [];
	for (let j = 0; j < 4; j++) {
		arr.push(cubic(p[j][0], p[j][1], p[j][2], p[j][3], dx));
	}

	return cubic(arr[0], arr[1], arr[2], arr[3], dy);
}

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
		// 1. Fetch coarse sample grid
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

		// Prepare headers
		const headers: Record<string, string> = {
			'Connection': 'close',
			'User-Agent': 'SWZPLN-Elevation-Fetcher/1.0'
		};
		if (env.OPENTOPODATA_API_KEY) {
			headers['x-api-key'] = env.OPENTOPODATA_API_KEY;
		}

		const locationsString = locations.join('|');
		const params = new URLSearchParams({
			locations: locationsString,
			interpolation: 'bilinear'
		});

		// Use GET request like PHP implementation
		const apiUrl = `${OPENTOPODATA_API_URL}?${params.toString()}`;

		const controller = new AbortController();
		const timeoutId = setTimeout(() => controller.abort(), 30000);

		const response = await fetch(apiUrl, {
			method: 'GET',
			headers,
			signal: controller.signal
		});

		clearTimeout(timeoutId);

		if (!response.ok) {
			console.error('Open Topo Data API error:', response.status, response.statusText);
			throw new Error(`Upstream API error: ${response.status}`);
		}

		const data = await response.json();
		if (data.error) throw new Error(data.error);

		// Build sample matrix from single response
		const sampleMatrix: number[][] = [];
		let row: number[] = [];
		let count = 0;

		for (const result of data.results) {
			row.push(result.elevation);
			count++;

			if (count % SAMPLE_GRID_SIZE === 0) {
				sampleMatrix.push(row);
				row = [];
			}
		}

		// 2. Upscale to high-resolution grid using local bicubic interpolation
		const outputMatrix: number[][] = [];

		for (let i = 0; i < OUTPUT_GRID_SIZE; i++) {
			const rowData: number[] = [];
			for (let j = 0; j < OUTPUT_GRID_SIZE; j++) {
				// Map output grid position to sample grid coordinates
				const x = (j / (OUTPUT_GRID_SIZE - 1)) * (SAMPLE_GRID_SIZE - 1);
				const y = (i / (OUTPUT_GRID_SIZE - 1)) * (SAMPLE_GRID_SIZE - 1);

				const val = bicubicInterpolate(sampleMatrix, x, y);
				rowData.push(Number(val.toFixed(2)));
			}
			outputMatrix.push(rowData);
		}

		return json(outputMatrix);
	} catch (err: any) {
		console.error('Elevation API error:', err);
		throw error(502, err.message || 'Failed to fetch elevation data');
	}
};

