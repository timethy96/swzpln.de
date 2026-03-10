// Bounds validation and utility functions

import type { Bounds, ScaleOption } from '../types';
import { latLngToXY } from './coordinates';

/**
 * Validate that bounds are properly formed
 */
export function validateBounds(bounds: Bounds): boolean {
	return (
		bounds.north > bounds.south &&
		bounds.east !== bounds.west &&
		!isNaN(bounds.north) &&
		!isNaN(bounds.south) &&
		!isNaN(bounds.east) &&
		!isNaN(bounds.west) &&
		bounds.north <= 90 &&
		bounds.south >= -90 &&
		bounds.east <= 180 &&
		bounds.west >= -180
	);
}

/**
 * Get the area of bounds in square meters (approximate)
 */
export function getBoundsArea(bounds: Bounds): number {
	const se = latLngToXY(bounds, bounds.south, bounds.east);
	const nw = latLngToXY(bounds, bounds.north, bounds.west);
	return Math.abs(se.x * nw.y);
}

/**
 * All available scales for PDF/SVG export
 */
const ALL_SCALES: ScaleOption[] = [
	{ name: '1:1', scale: 1 },
	{ name: '1:2', scale: 0.5 },
	{ name: '1:5', scale: 0.2 },
	{ name: '1:20', scale: 0.05 },
	{ name: '1:50', scale: 0.02 },
	{ name: '1:100', scale: 0.01 },
	{ name: '1:200', scale: 0.005 },
	{ name: '1:500', scale: 0.002 },
	{ name: '1:1000', scale: 0.001 },
	{ name: '1:2000', scale: 0.0005 },
	{ name: '1:5000', scale: 0.0002 },
	{ name: '1:10.000', scale: 0.0001 },
	{ name: '1:20.000', scale: 0.00005 },
	{ name: '1:50.000', scale: 0.00002 }
];

/**
 * Get suitable scale options for the given bounds
 * Returns up to 3 scales that fit within standard paper sizes
 */
export function getSuitableScales(bounds: Bounds): ScaleOption[] {
	const maxXY = latLngToXY(bounds, bounds.north, bounds.east);
	const scaleSuggestions: ScaleOption[] = [];

	// Maximum size in meters for A0 paper (roughly 5.08m at scale)
	const MAX_PAPER_SIZE_METERS = 5.08;

	for (let i = 0; i < ALL_SCALES.length && scaleSuggestions.length < 3; i++) {
		const scale = ALL_SCALES[i];
		const scaledX = Math.abs(maxXY.x * scale.scale);
		const scaledY = Math.abs(maxXY.y * scale.scale);

		// Check if both dimensions fit within paper size
		if (scaledX < MAX_PAPER_SIZE_METERS && scaledY < MAX_PAPER_SIZE_METERS) {
			scaleSuggestions.push(scale);
		}
	}

	return scaleSuggestions;
}

/**
 * Estimate OSM data file size based on zoom level
 */
export function estimateOsmFilesize(zoom: number): number {
	const zoomFactor = 19 - zoom;
	return 1.1 * 100000 * Math.pow(3, zoomFactor);
}
