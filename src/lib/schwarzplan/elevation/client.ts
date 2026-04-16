// Client-side elevation data fetcher with bicubic interpolation

import type { Bounds, ProgressCallback } from '../types';
import * as m from '$lib/paraglide/messages';

const SAMPLE_GRID_SIZE = 10;
const OUTPUT_GRID_SIZE = 80;

function cubic(p0: number, p1: number, p2: number, p3: number, t: number): number {
	const a = -0.5 * p0 + 1.5 * p1 - 1.5 * p2 + 0.5 * p3;
	const b = p0 - 2.5 * p1 + 2 * p2 - 0.5 * p3;
	const c = -0.5 * p0 + 0.5 * p2;
	const d = p1;
	return a * t * t * t + b * t * t + c * t + d;
}

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
 * Upscale a 10x10 sample matrix to 80x80 using bicubic interpolation
 */
function upscaleMatrix(sampleMatrix: number[][]): number[][] {
	const outputMatrix: number[][] = [];

	for (let i = 0; i < OUTPUT_GRID_SIZE; i++) {
		const rowData: number[] = [];
		for (let j = 0; j < OUTPUT_GRID_SIZE; j++) {
			const x = (j / (OUTPUT_GRID_SIZE - 1)) * (SAMPLE_GRID_SIZE - 1);
			const y = (i / (OUTPUT_GRID_SIZE - 1)) * (SAMPLE_GRID_SIZE - 1);

			const val = bicubicInterpolate(sampleMatrix, x, y);
			rowData.push(Number(val.toFixed(2)));
		}
		outputMatrix.push(rowData);
	}

	return outputMatrix;
}

/**
 * Fetch elevation data from the proxy endpoint and interpolate client-side
 */
export async function fetchElevationData(
	bounds: Bounds,
	onProgress?: ProgressCallback
): Promise<number[][] | null> {
	onProgress?.({
		step: 'elevation-download',
		percent: 0,
		message: m.progress_elevation_requesting()
	});

	try {
		const url = new URL('/api/elevation', window.location.origin);
		url.searchParams.set('north', bounds.north.toString());
		url.searchParams.set('south', bounds.south.toString());
		url.searchParams.set('east', bounds.east.toString());
		url.searchParams.set('west', bounds.west.toString());

		onProgress?.({
			step: 'elevation-download',
			percent: 30,
			message: m.progress_elevation_downloading()
		});

		const response = await fetch(url.toString());

		if (!response.ok) {
			console.error('Elevation API error:', response.status, response.statusText);
			throw new Error(`Elevation API returned ${response.status}`);
		}

		const data = await response.json();
		if (data.error) throw new Error(data.error);

		// Build 10x10 sample matrix from raw OpenTopoData response
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

		onProgress?.({
			step: 'elevation-download',
			percent: 70,
			message: m.progress_elevation_received()
		});

		// Upscale 10x10 → 80x80 via bicubic interpolation
		const matrix = upscaleMatrix(sampleMatrix);

		onProgress?.({
			step: 'elevation-download',
			percent: 100,
			message: m.progress_elevation_received()
		});

		return matrix;
	} catch (error) {
		console.error('Failed to fetch elevation data:', error);
		onProgress?.({
			step: 'error',
			message: m.progress_elevation_failed()
		});
		return null;
	}
}
