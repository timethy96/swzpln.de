// Overpass API helpers for the streaming proxy endpoint
// The server no longer parses or caches Overpass responses — it streams them
// through to the client, which handles parsing in a Web Worker.

import { env } from '$env/dynamic/private';
import type { Bounds, Layer } from '$lib/schwarzplan/types';
import { LAYER_CONFIG } from '$lib/schwarzplan/layers';

// ============================================================================
// Configuration
// ============================================================================

export function getOverpassUrl(): string {
	return env.OVERPASS_URL ?? '';
}

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
// Query Builder
// ============================================================================

export function buildOverpassQuery(bounds: Bounds, layers: Layer[]): string {
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
