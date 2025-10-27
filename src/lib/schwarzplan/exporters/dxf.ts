// DXF exporter using @tarikjabiri/dxf

import { DxfWriter, Units, point3d, LWPolylineFlags } from '@tarikjabiri/dxf';
import type { Bounds, ContourData, GeometryObject, ProgressCallback } from '../types';
import { LAYER_CONFIG, isLayerFillable } from '../layers';
import { latLngToXY, getMaxXY } from '../geometry/coordinates';
import { convertAndMergeRoads } from '../roads';

/**
 * Export geometry objects to DXF format
 */
export function exportToDXF(
	objects: GeometryObject[],
	contours: ContourData | null,
	bounds: Bounds,
	zoom: number,
	onProgress?: ProgressCallback
): string {
	onProgress?.({
		step: 'export',
		percent: 0,
		message: 'DXF-Export wird initialisiert...'
	});

	// Create DXF writer
	const dxf = new DxfWriter();
	dxf.setUnits(Units.Meters);

	// Add layers for each type present in objects
	const layersUsed = new Set(objects.map((obj) => obj.type));

	for (const layer of layersUsed) {
		const config = LAYER_CONFIG[layer];
		if (config) {
			dxf.addLayer(layer, config.dxfColor || 7, config.lineType || 'CONTINUOUS');
		}
	}

	// Add contours layer if needed
	if (contours) {
		const contourConfig = LAYER_CONFIG.contours;
		dxf.addLayer('contours', contourConfig.dxfColor || 6, contourConfig.lineType || 'CONTINUOUS');
	}

	// Add "other" layer for unclassified objects
	dxf.addLayer('other', 1, 'CONTINUOUS');

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
		message: 'OSM-Objekte werden zu DXF hinzugefügt...'
	});

	// Calculate text size and position for attribution
	const txtXY = latLngToXY(bounds, bounds.south, bounds.east);
	const maxXY = getMaxXY(bounds);
	const txtSize = (19 - zoom) * 10;

	// Add attribution text on "other" layer
	dxf.addText(
		point3d(txtXY.x, txtXY.y - txtSize, 0),
		txtSize,
		'(c) OpenStreetMap.org contributors'
	);

	// Add objects (group by layer for better organization)
	let processedCount = 0;
	const totalObjects = processedObjects.length;

	// Group objects by layer
	const objectsByLayer = new Map<string, GeometryObject[]>();
	for (const obj of processedObjects) {
		const layerName = layersUsed.has(obj.type) ? obj.type : 'other';
		if (!objectsByLayer.has(layerName)) {
			objectsByLayer.set(layerName, []);
		}
		objectsByLayer.get(layerName)!.push(obj);
	}

	// Add objects layer by layer
	for (const [layerName, layerObjects] of objectsByLayer) {
		// Set the current layer
		dxf.setCurrentLayerName(layerName);
		
		for (const obj of layerObjects) {
			const path = obj.path;
			if (path.length === 0) continue;

			// Convert path to LWPolyline vertices
			const vertices = path.map((coord) => ({
				point: point3d(coord.x, coord.y, 0)
			}));

			// Check if should be closed
			const shouldClose = isLayerFillable(obj.type);
			const flags = shouldClose ? LWPolylineFlags.Closed : 0;

			// Add polyline with flags
			dxf.addLWPolyline(vertices, { flags });

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
	}

	// Add contours if available
	if (contours) {
		onProgress?.({
			step: 'export',
			percent: 85,
			message: 'Höhenlinien werden hinzugefügt...'
		});

		for (const contour of contours.contours) {
			const vertices = contour.map((coord) => {
				const x = (coord.x * maxXY.x) / contours.sizeX;
				const y = Math.abs((coord.y * maxXY.y) / contours.sizeY - maxXY.y);
				return { point: point3d(x, y, 0) };
			});

			if (vertices.length > 1) {
				dxf.addLWPolyline(vertices);
			}
		}
	}

	onProgress?.({
		step: 'export',
		percent: 95,
		message: 'DXF-Datei wird finalisiert...'
	});

	// Generate DXF string
	const dxfString = dxf.stringify();

	onProgress?.({
		step: 'export',
		percent: 100,
		message: 'DXF-Export abgeschlossen'
	});

	return dxfString;
}

