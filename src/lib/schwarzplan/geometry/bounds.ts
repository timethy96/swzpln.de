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

// PDF spec (≤1.6) caps pages at 14400 × 14400 user-space units.
// At the default user unit of 1/72 inch that is 200 inch = 5.08 m per side.
const MAX_PDF_PAGE_SIZE_METERS = 5.08;

/**
 * Get suitable scale options for the given bounds
 * Returns up to 3 scales that produce a page within the PDF spec size limit
 */
export function getSuitableScales(bounds: Bounds, zoom: number): ScaleOption[] {
	const maxXY = latLngToXY(bounds, bounds.north, bounds.east);
	const scaleSuggestions: ScaleOption[] = [];

	// Mirror the exporters' paper-height formula (pdf.ts / svg.ts) so the
	// check reflects the actual emitted page size including the attribution.
	const txtSize = (19 - zoom) * 10;
	const effectiveHeight = maxXY.y + txtSize + 5;

	for (let i = 0; i < ALL_SCALES.length && scaleSuggestions.length < 3; i++) {
		const scale = ALL_SCALES[i];
		const scaledX = maxXY.x * scale.scale;
		const scaledY = effectiveHeight * scale.scale;

		if (scaledX < MAX_PDF_PAGE_SIZE_METERS && scaledY < MAX_PDF_PAGE_SIZE_METERS) {
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
