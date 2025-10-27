// PDF exporter using jsPDF

import { jsPDF } from 'jspdf';
import type { Bounds, ContourData, GeometryObject, ProgressCallback } from '../types';
import { LAYER_CONFIG, isLayerFillable } from '../layers';
import { latLngToXY, getMaxXY } from '../geometry/coordinates';
import { convertAndMergeRoads } from '../roads';

/**
 * Export geometry objects to PDF format
 */
export function exportToPDF(
	objects: GeometryObject[],
	contours: ContourData | null,
	bounds: Bounds,
	zoom: number,
	scale: number,
	onProgress?: ProgressCallback
): string {
	onProgress?.({
		step: 'export',
		percent: 0,
		message: 'PDF-Export wird initialisiert...'
	});

	const maxXY = getMaxXY(bounds);
	const txtSize = (19 - zoom) * 10;

	// Calculate dimensions in mm
	const width = maxXY.x * 1000 * scale;
	const height = (maxXY.y + txtSize + 5) * 1000 * scale;

	// Determine orientation
	const orientation = width > height ? 'l' : 'p';

	// Create PDF document
	const doc = new jsPDF({
		orientation,
		unit: 'mm',
		format: [width, height]
	});

	// Add contours first (background)
	if (contours) {
		onProgress?.({
			step: 'export',
			percent: 10,
			message: 'Höhenlinien werden hinzugefügt...'
		});

		const contourColor = LAYER_CONFIG.contours.color;
		doc.setDrawColor(contourColor);

		for (const contour of contours.contours) {
			const path: any[] = [];

			contour.forEach((coord, index) => {
				const x = (coord.x * maxXY.x * 1000 * scale) / contours.sizeX;
				const y = (coord.y * maxXY.y * 1000 * scale) / contours.sizeY;
				const op = index === 0 ? 'm' : 'l';
				path.push({ op, c: [x, y] });
			});

			if (path.length > 1) {
				doc.path(path).stroke();
			}
		}
	}

	onProgress?.({
		step: 'export',
		percent: 20,
		message: 'Straßen werden zusammengeführt...'
	});

	// Convert and merge roads
	const processedObjects = convertAndMergeRoads(objects);

	onProgress?.({
		step: 'export',
		percent: 30,
		message: 'OSM-Objekte werden zu PDF hinzugefügt...'
	});

	// Separate highways from other objects to control rendering order
	const highways: GeometryObject[] = [];
	const nonHighways: GeometryObject[] = [];
	
	for (const obj of processedObjects) {
		if (obj.type === 'highway') {
			highways.push(obj);
		} else {
			nonHighways.push(obj);
		}
	}

	// First pass: add highways (roads go underneath)
	let processedCount = 0;
	const totalObjects = highways.length + nonHighways.length;

	for (const obj of highways) {
		const layer = obj.type;
		const path = obj.path;

		if (path.length === 0) continue;

		const config = LAYER_CONFIG[layer];
		const color = config?.color || '#FF0000';

		// For highways, render as thick stroke instead of filled polygon
		// to avoid coverage issues with merged roads
		const isHighway = layer === 'highway';

		// Transform coordinates: scale and flip Y axis (PDF Y goes down from top)
		const pdfPath: any[] = [];

		path.forEach((coord, index) => {
			const x = coord.x * 1000 * scale;
			const y = (coord.y - maxXY.y) * -1 * 1000 * scale;
			const op = index === 0 ? 'm' : 'l';
			pdfPath.push({ op, c: [x, y] });
		});

		if (isHighway) {
			// Render as thick stroke (outline)
			doc.setDrawColor(color);
			doc.setLineWidth(0.5 * scale);
			pdfPath.push({ op: 'h' }); // close path
			doc.path(pdfPath).stroke();
		} else {
			// Determine if fillable or stroke-only
			const fillable = isLayerFillable(layer);

			if (fillable) {
				// Remove redundant point and close path
				pdfPath.slice(0, -1).push({ op: 'h' });
				doc.setFillColor(color);
				doc.path(pdfPath).fill();
			} else {
				// Stroke only
				doc.setDrawColor(color);
				doc.path(pdfPath).stroke();
			}
		}

		processedCount++;
		if (processedCount % 100 === 0 && onProgress) {
			const percent = 30 + Math.round((processedCount / totalObjects) * 55);
			onProgress({
				step: 'export',
				percent,
				message: `Objekte werden exportiert: ${processedCount}/${totalObjects}`
			});
		}
	}

	// Second pass: add non-highway objects (buildings, etc. go on top)
	for (const obj of nonHighways) {
		const layer = obj.type;
		const path = obj.path;

		if (path.length === 0) continue;

		const config = LAYER_CONFIG[layer];
		const color = config?.color || '#FF0000';

		// Transform coordinates: scale and flip Y axis (PDF Y goes down from top)
		const pdfPath: any[] = [];

		path.forEach((coord, index) => {
			const x = coord.x * 1000 * scale;
			const y = (coord.y - maxXY.y) * -1 * 1000 * scale;
			const op = index === 0 ? 'm' : 'l';
			pdfPath.push({ op, c: [x, y] });
		});

		// Determine if fillable or stroke-only
		const fillable = isLayerFillable(layer);

		if (fillable) {
			// Remove redundant point and close path
			pdfPath.slice(0, -1).push({ op: 'h' });
			doc.setFillColor(color);
			doc.path(pdfPath).fill();
		} else {
			// Stroke only
			doc.setDrawColor(color);
			doc.path(pdfPath).stroke();
		}

		processedCount++;
		if (processedCount % 100 === 0 && onProgress) {
			const percent = 30 + Math.round((processedCount / totalObjects) * 55);
			onProgress({
				step: 'export',
				percent,
				message: `Objekte werden exportiert: ${processedCount}/${totalObjects}`
			});
		}
	}

	onProgress?.({
		step: 'export',
		percent: 85,
		message: 'Attribution wird hinzugefügt...'
	});

	// Add attribution text
	const textX = (maxXY.x - 5) * 1000 * scale;
	const textY = (maxXY.y + txtSize) * 1000 * scale;
	const fontSize = txtSize * 1000 * scale;

	doc.setTextColor('#FF0000');
	doc.setFontSize(fontSize);
	doc.text('(c) OpenStreetMap.org contributors', textX, textY, { align: 'right' });

	onProgress?.({
		step: 'export',
		percent: 90,
		message: 'PDF wird generiert...'
	});

	// Generate blob URL
	const blobUrl = doc.output('bloburl');

	onProgress?.({
		step: 'export',
		percent: 100,
		message: 'PDF-Export abgeschlossen'
	});

	return String(blobUrl);
}

