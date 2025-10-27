// Overpass API client for fetching OSM data

import type { Bounds, Layer, OSMData, ProgressCallback } from '../types';
import { LAYER_CONFIG } from '../layers';

// Primary and fallback Overpass API endpoints
const PRIMARY_API = 'https://overpass.private.coffee/api/';
const FALLBACK_API = 'https://overpass-api.de/api/';

// Note: Using overpass.private.coffee as primary
// A free and unlimited Overpass instance operated by Private.coffee
// https://overpass.private.coffee/

let activeAPI = PRIMARY_API;

/**
 * Check if an Overpass API endpoint is available
 */
async function checkAPIAvailability(apiUrl: string): Promise<boolean> {
	try {
		const response = await fetch(`${apiUrl}status`, {
			method: 'GET',
			signal: AbortSignal.timeout(5000)
		});
		return response.ok;
	} catch {
		return false;
	}
}

/**
 * Ensure we have an available API endpoint
 */
async function ensureAPIAvailable(): Promise<string> {
	// Check if primary API is available
	const primaryAvailable = await checkAPIAvailability(PRIMARY_API);
	if (primaryAvailable) {
		activeAPI = PRIMARY_API;
		return PRIMARY_API;
	}

	// Fallback to secondary API
	console.warn('Primary Overpass API not available, using fallback');
	activeAPI = FALLBACK_API;

	// Show alert to user about fallback
	if (typeof window !== 'undefined') {
		alert(
			'The primary Overpass API is not available. Switching to a fallback API (overpass-api.de). ' +
				'Please note that you might experience slower downloads and may be subject to additional usage restrictions. ' +
				'More information on overpass-api.de'
		);
	}

	return FALLBACK_API;
}

/**
 * Construct Overpass API query URL for given bounds and layers
 */
function constructOverpassQuery(bounds: Bounds, layers: Layer[]): string {
	const bbox = [bounds.south, bounds.west, bounds.north, bounds.east].join(',');

	// Build query parts for each layer
	const queryParts: string[] = [];
	for (const layer of layers) {
		if (layer === 'contours') continue; // Skip contours, handled separately
		const config = LAYER_CONFIG[layer];
		if (config.overpassQuery) {
			queryParts.push(config.overpassQuery);
		}
	}

	// Construct full query
	const query = `[out:json][bbox:${bbox}];(${queryParts.join('')});out body;>;out skel qt;`;

	return `${activeAPI}interpreter?data=${encodeURIComponent(query)}`;
}

/**
 * Download OSM data from Overpass API with progress tracking
 */
export async function downloadOSMData(
	bounds: Bounds,
	layers: Layer[],
	onProgress?: ProgressCallback
): Promise<OSMData> {
	// Ensure API is available
	await ensureAPIAvailable();

	// Construct query URL
	const url = constructOverpassQuery(bounds, layers);

	onProgress?.({ step: 'osm-download', percent: 0, message: 'OSM-Daten werden heruntergeladen...' });

	// Fetch with streaming
	const response = await fetch(url);

	if (!response.ok) {
		throw new Error(`Overpass API error: ${response.status} ${response.statusText}`);
	}

	const reader = response.body?.getReader();
	if (!reader) {
		throw new Error('Response body is not readable');
	}

	const contentLength = parseInt(response.headers.get('Content-Length') || '0', 10);
	let receivedLength = 0;
	const chunks: Uint8Array[] = [];

	// Read response in chunks with progress
	while (true) {
		const { done, value } = await reader.read();

		if (done) break;

		chunks.push(value);
		receivedLength += value.length;

		// Update progress
		if (contentLength > 0 && onProgress) {
			const percent = Math.round((receivedLength / contentLength) * 100);
			onProgress({
				step: 'osm-download',
				percent,
				message: `OSM-Daten werden heruntergeladen: ${(receivedLength / 1024).toFixed(0)}KB`
			});
		}
	}

	// Combine chunks
	const chunksAll = new Uint8Array(receivedLength);
	let position = 0;
	for (const chunk of chunks) {
		chunksAll.set(chunk, position);
		position += chunk.length;
	}

	// Decode and parse JSON
	const text = new TextDecoder('utf-8').decode(chunksAll);
	onProgress?.({ step: 'osm-download', percent: 100, message: 'OSM-Daten heruntergeladen' });

	try {
		const data = JSON.parse(text) as OSMData;
		return data;
	} catch (error) {
		throw new Error(`Failed to parse OSM data: ${error}`);
	}
}

