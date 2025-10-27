// Contour line generation using ml-conrec

import { Conrec } from 'ml-conrec';
import type { ContourData, ContourLine, Coordinate, ProgressCallback } from '../types';
import { getContourInterval } from '../geometry/coordinates';

/**
 * Generate contour lines from elevation matrix
 * @param customInterval - Optional custom interval in meters (overrides zoom-based interval)
 */
export function generateContours(
	elevationMatrix: number[][],
	zoom: number,
	onProgress?: ProgressCallback,
	customInterval?: number
): ContourData | null {
	try {
		onProgress?.({
			step: 'contours',
			percent: 0,
			message: 'Höhenlinien werden generiert...'
		});

		// Validate matrix
		if (!elevationMatrix || elevationMatrix.length === 0 || elevationMatrix[0].length === 0) {
			throw new Error('Invalid elevation matrix');
		}

		const rows = elevationMatrix.length;
		const columns = elevationMatrix[0].length;

		// Verify all rows have same length
		const validMatrix = elevationMatrix.every((row) => row.length === columns);
		if (!validMatrix) {
			throw new Error('Elevation matrix rows have inconsistent lengths');
		}

		onProgress?.({
			step: 'contours',
			percent: 20,
			message: 'Kontur-Intervall wird berechnet...'
		});

		// Use custom interval if provided, otherwise use zoom-based interval
		const interval = customInterval ?? getContourInterval(zoom);

		// Find min and max elevations
		let minElevation = Infinity;
		let maxElevation = -Infinity;

		for (const row of elevationMatrix) {
			for (const elevation of row) {
				if (elevation < minElevation) minElevation = elevation;
				if (elevation > maxElevation) maxElevation = elevation;
			}
		}

		// Generate contour levels
		const startLevel = Math.ceil(minElevation / interval) * interval;
		const levels: number[] = [];
		for (let level = startLevel; level <= maxElevation; level += interval) {
			levels.push(level);
		}

		if (levels.length === 0) {
			console.warn('No contour levels to generate');
			return null;
		}

		onProgress?.({
			step: 'contours',
			percent: 40,
			message: `${levels.length} Höhenniveaus werden generiert...`
		});

		// Create conrec instance
		const conrec = new Conrec(elevationMatrix);

		// Generate contours
		const rawContours = conrec.drawContour({
			levels,
			contourDrawer: 'shape'
		});

		onProgress?.({
			step: 'contours',
			percent: 80,
			message: 'Höhenlinien werden verarbeitet...'
		});

		// Convert contours to our coordinate format
		// ml-conrec returns: { contours: [{ lines: [{x, y}, ...], level, k }, ...] }
		let contours: ContourLine[] = [];
		
		if (rawContours && typeof rawContours === 'object') {
			const contourData = rawContours as { contours: Array<{ lines: Array<{ x: number; y: number }> }> };
			
			if (contourData.contours && Array.isArray(contourData.contours)) {
				// Extract all lines from all contour levels
				for (const contour of contourData.contours) {
					if (contour.lines && Array.isArray(contour.lines)) {
						const points = contour.lines.map((point: { x: number; y: number }) => ({
							x: point.x,
							y: point.y
						}));
						contours.push(points);
					}
				}
			}
		}

		onProgress?.({
			step: 'contours',
			percent: 100,
			message: `${contours.length} Höhenlinien generiert`
		});

		return {
			contours,
			sizeX: columns - 1,
			sizeY: rows - 1
		};
	} catch (error) {
		console.error('Error generating contours:', error);
		onProgress?.({
			step: 'error',
			message: `Fehler bei Höhenlinien-Generierung: ${error}`
		});
		return null;
	}
}

