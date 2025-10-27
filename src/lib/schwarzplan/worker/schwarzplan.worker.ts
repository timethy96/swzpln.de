// Web Worker for Schwarzplan generation

import type { WorkerRequest, WorkerMessage, ProgressInfo } from '../types';
import { osmDataToGeometry } from '../osm/converter';
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
		const { format, osmData, elevationMatrix, bounds, layers, zoom, scale, contourInterval } = event.data;

		// Step 1: Convert OSM data to geometry
		const geometryObjects = osmDataToGeometry(osmData, bounds, progressCallback);

		// Step 2: Generate contours if elevation data is available
		let contours = null;
		
		if (elevationMatrix && layers.includes('contours')) {
			contours = generateContours(elevationMatrix, zoom, progressCallback, contourInterval);
		}

		// Step 3: Export to requested format
		const result = exportGeometry(format, geometryObjects, contours, bounds, zoom, scale, progressCallback);

		// Step 4: Send result back to main thread
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

