// SVG exporter

import type { Bounds, ContourData, GeometryObject, ProgressCallback } from '../types';
import { LAYER_CONFIG, isLayerFillable } from '../layers';
import { latLngToXY, getMaxXY } from '../geometry/coordinates';
import { convertAndMergeRoads } from '../roads';

/**
 * Export geometry objects to SVG format
 */
export function exportToSVG(
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
		message: 'SVG-Export wird initialisiert...'
	});

	const maxXY = getMaxXY(bounds);
	const txtSize = (19 - zoom) * 10;

	// Calculate dimensions in mm
	const width = maxXY.x * 1000 * scale;
	const height = (maxXY.y + txtSize + 5) * 1000 * scale;

	// Start SVG document
	let svg = `<svg xmlns='http://www.w3.org/2000/svg' version='1.1' xmlns:xlink='http://www.w3.org/1999/xlink' `;
	svg += `width='${width}mm' height='${height}mm' `;
	svg += `viewBox='0 0 ${width} ${height}'>`;

	onProgress?.({
		step: 'export',
		percent: 10,
		message: 'Straßen werden zusammengeführt...'
	});

	// Convert and merge roads
	const processedObjects = convertAndMergeRoads(objects);

	onProgress?.({
		step: 'export',
		percent: 20,
		message: 'OSM-Objekte werden zu SVG hinzugefügt...'
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

		// Transform coordinates: scale and flip Y axis (SVG Y goes down)
		const transformedPath = path.map((coord) => {
			const x = coord.x * 1000 * scale;
			const y = (coord.y - maxXY.y) * -1 * 1000 * scale;
			return [x, y];
		});

		// For highways, render as thick stroke instead of filled polygon
		// to avoid coverage issues with merged roads
		const isHighway = layer === 'highway';

		// Build path string
		if (isHighway) {
			// Render as closed path with thick stroke, no fill
			const closedPathString = 'M' + transformedPath.map((p) => p.join(',')).join(' ') + 'z';
			svg += `<path d='${closedPathString}' style='fill:none;stroke:${color};stroke-width:${0.5 * scale}' />`;
		} else {
			// For other layers, use original logic
			const pathString = 'M' + transformedPath.map((p) => p.join(',')).join(' ');
			const fillable = isLayerFillable(layer);
			
			if (fillable) {
				// Remove last point and close path
				const closedPath = transformedPath.slice(0, -1);
				const closedPathString = 'M' + closedPath.map((p) => p.join(',')).join(' ') + 'z';
				svg += `<path d='${closedPathString}' style='fill:${color}' />`;
			} else {
				// Stroke only
				svg += `<path d='${pathString}' style='fill:none;stroke:${color}' />`;
			}
		}

		processedCount++;
		if (processedCount % 100 === 0 && onProgress) {
			const percent = 20 + Math.round((processedCount / totalObjects) * 60);
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

		// Transform coordinates: scale and flip Y axis (SVG Y goes down)
		const transformedPath = path.map((coord) => {
			const x = coord.x * 1000 * scale;
			const y = (coord.y - maxXY.y) * -1 * 1000 * scale;
			return [x, y];
		});

		// For other layers, use original logic
		const pathString = 'M' + transformedPath.map((p) => p.join(',')).join(' ');
		const fillable = isLayerFillable(layer);
		
		if (fillable) {
			// Remove last point and close path
			const closedPath = transformedPath.slice(0, -1);
			const closedPathString = 'M' + closedPath.map((p) => p.join(',')).join(' ') + 'z';
			svg += `<path d='${closedPathString}' style='fill:${color}' />`;
		} else {
			// Stroke only
			svg += `<path d='${pathString}' style='fill:none;stroke:${color}' />`;
		}

		processedCount++;
		if (processedCount % 100 === 0 && onProgress) {
			const percent = 20 + Math.round((processedCount / totalObjects) * 60);
			onProgress({
				step: 'export',
				percent,
				message: `Objekte werden exportiert: ${processedCount}/${totalObjects}`
			});
		}
	}

	// Add contours if available
	if (contours) {
		onProgress?.({
			step: 'export',
			percent: 85,
			message: 'Höhenlinien werden hinzugefügt...'
		});

		const contourColor = LAYER_CONFIG.contours.color;

		for (const contour of contours.contours) {
			const transformedContour = contour.map((coord) => {
				const x = (coord.x * maxXY.x * 1000 * scale) / contours.sizeX;
				const y = (coord.y * maxXY.y * 1000 * scale) / contours.sizeY;
				return [x, y];
			});

			const pathString = 'M' + transformedContour.map((p) => p.join(',')).join(' ');
			svg += `<path d='${pathString}' style='fill:none;stroke:${contourColor}' />`;
		}
	}

	onProgress?.({
		step: 'export',
		percent: 90,
		message: 'Attribution wird hinzugefügt...'
	});

	// Add attribution text
	const textX = maxXY.x * 1000 * scale;
	const textY = (maxXY.y + txtSize) * 1000 * scale;
	const fontSize = txtSize * 1000 * scale;

	svg += `<text x='${textX}' y='${textY}' text-anchor='end' `;
	svg += `style='font: ${fontSize}px sans-serif;' fill='red'>`;
	svg += `(c) OpenStreetMap.org contributors</text>`;

	// Close SVG
	svg += '</svg>';

	onProgress?.({
		step: 'export',
		percent: 100,
		message: 'SVG-Export abgeschlossen'
	});

	return svg;
}


