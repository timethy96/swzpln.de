// Client-side elevation data fetcher

import type { Bounds, ProgressCallback } from '../types';
import * as m from '$lib/paraglide/messages';

/**
 * Fetch elevation matrix from the API endpoint
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
		// Build API URL
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

		const matrix = await response.json();

		onProgress?.({
			step: 'elevation-download',
			percent: 100,
			message: m.progress_elevation_received()
		});

		// Validate matrix structure
		if (!Array.isArray(matrix) || matrix.length === 0) {
			throw new Error('Invalid elevation matrix received');
		}

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


