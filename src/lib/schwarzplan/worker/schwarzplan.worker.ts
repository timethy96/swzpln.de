// Web Worker for Schwarzplan generation

import type { WorkerRequest, WorkerMessage, ProgressInfo } from '../types';
import { osmDataToGeometry } from '../osm/converter';
import { geojsonToGeometry } from '../geojson/converter';
import { generateContours } from '../elevation/contours';
import { exportGeometry } from '../exporters/base';

// Progress callback that sends messages back to main thread
function progressCallback(info: ProgressInfo): void {
	postMessage({
		type: 'progress',
		data: info
	});
}

// Handle messages from main thread
self.onmessage = async (event: MessageEvent<WorkerRequest>) => {
	try {
		const {
			format,
			osmData,
			geodata,
			elevationMatrix,
			bounds,
			layers,
			zoom,
			scale,
			contourInterval,
			buildingStyle
		} = event.data;

		// Step 1: Convert data to geometry (PostGIS or Overpass path)
		const geometryObjects = geodata
			? geojsonToGeometry(geodata, bounds, progressCallback)
			: osmDataToGeometry(osmData!, bounds, progressCallback);

		// Step 2: Generate contours if elevation data is available (for 2D formats)
		let contours = null;

		if (elevationMatrix && layers.includes('contours')) {
			contours = generateContours(elevationMatrix, zoom, progressCallback, contourInterval);
		}

		// Step 3: Export to requested format
		// Note: 3D formats use elevationMatrix directly, 2D formats use contours
		const result = await exportGeometry(
			format,
			geometryObjects,
			contours,
			elevationMatrix,
			bounds,
			zoom,
			scale,
			progressCallback,
			buildingStyle
		);

		// Step 4: Send result back to main thread
		// For binary data (Uint8Array), send as is
		// For string data, send as is
		const message: WorkerMessage = {
			type: 'complete',
			data: result,
			filename: `swzpln.${format}`
		};

		postMessage(message);
	} catch (error) {
		// Send error back to main thread
		const message: WorkerMessage = {
			type: 'error',
			error: error instanceof Error ? error.message : String(error)
		};

		postMessage(message);
	}
};
