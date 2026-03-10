// Overpass API client for fetching OSM data

import type { Bounds, Layer, OSMData, ProgressCallback } from '../types';
import { LAYER_CONFIG } from '../layers';
import * as m from '$lib/paraglide/messages';

// Primary and fallback Overpass API endpoints
const PRIMARY_API = 'https://overpass.private.coffee/api/';
const FALLBACK_API = 'https://overpass-api.de/api/';

// Note: Using overpass.private.coffee as primary
// A free and unlimited Overpass instance operated by Private.coffee
// https://overpass.private.coffee/

/**
 * Construct Overpass API query URL for given bounds and layers
 */
function constructOverpassQuery(apiBase: string, bounds: Bounds, layers: Layer[]): string {
	const bbox = [bounds.south, bounds.west, bounds.north, bounds.east].join(',');

	// Build query parts for each layer
	const queryParts: string[] = [];
	for (const layer of layers) {
		if (layer === 'contours') continue; // Skip contours, handled separately
		const config = LAYER_CONFIG[layer];
		if (config && config.overpassQuery) {
			queryParts.push(config.overpassQuery);
		} else if (!config) {
			console.warn(`Layer config missing for: ${layer}`);
		}
	}

	// Construct full query
	const query = `[out:json][bbox:${bbox}];(${queryParts.join('')});out body;>;out skel qt;`;

	return `${apiBase}interpreter?data=${encodeURIComponent(query)}`;
}

/**
 * Download OSM data from Overpass API with progress tracking
 */
export async function downloadOSMData(
	bounds: Bounds,
	layers: Layer[],
	onProgress?: ProgressCallback
): Promise<OSMData> {
	onProgress?.({ step: 'osm-download', percent: 0, message: m.progress_osm_download() });

	let response: Response;
	const timeout = 120000; // 120 seconds timeout for primary

	try {
		// Try Primary API
		const controller = new AbortController();
		const id = setTimeout(() => controller.abort(), timeout);

		const url = constructOverpassQuery(PRIMARY_API, bounds, layers);
		response = await fetch(url, { signal: controller.signal });
		clearTimeout(id);

		if (!response.ok) {
			throw new Error(`Primary API error: ${response.status}`);
		}
	} catch (primaryError) {
		console.warn('Primary Overpass API failed, switching to fallback:', primaryError);

		if (typeof window !== 'undefined') {
			// Optional: Notify user about fallback if desired, though user asked to just switch
			// alert(m.error_overpass_fallback());
		}

		// Try Fallback API
		const url = constructOverpassQuery(FALLBACK_API, bounds, layers);
		response = await fetch(url);

		if (!response.ok) {
			throw new Error(`Overpass API error (fallback): ${response.status} ${response.statusText}`);
		}
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
				message: m.progress_osm_download_progress({ size: (receivedLength / 1024).toFixed(0) })
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

	// Decode JSON
	const text = new TextDecoder('utf-8').decode(chunksAll);

	onProgress?.({ step: 'osm-download', percent: 100, message: m.progress_osm_downloaded() });

	try {
		const data = JSON.parse(text) as OSMData;
		return data;
	} catch (error) {
		throw new Error(`Failed to parse OSM data: ${error}`);
	}
}
