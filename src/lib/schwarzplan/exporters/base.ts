// Base exporter that delegates to specific format exporters

import type { Bounds, ContourData, ExportFormat, GeometryObject, ProgressCallback } from '../types';
import { exportToDXF } from './dxf';
import { exportToSVG } from './svg';
import { exportToPDF } from './pdf';
import { exportToDXF3D } from './dxf3d';
import { exportToIFC } from './ifc';
import { exportToOBJ } from './obj';
import * as m from '$lib/paraglide/messages';

/**
 * Export geometry objects to the specified format
 * Returns string for text-based formats, Uint8Array for binary formats
 */
export async function exportGeometry(
	format: ExportFormat,
	objects: GeometryObject[],
	contours: ContourData | null,
	elevationMatrix: number[][] | null,
	bounds: Bounds,
	zoom: number,
	scale: number | undefined,
	onProgress?: ProgressCallback,
	buildingStyle?: 'filled' | 'outline'
): Promise<string | Uint8Array> {
	switch (format) {
		case 'dxf':
			return exportToDXF(objects, contours, bounds, zoom, onProgress);

		case 'svg':
			if (!scale) {
				throw new Error(m.error_scale_required_svg());
			}
			return exportToSVG(objects, contours, bounds, zoom, scale, onProgress, buildingStyle);

		case 'pdf':
			if (!scale) {
				throw new Error(m.error_scale_required_pdf());
			}
			return exportToPDF(objects, contours, bounds, zoom, scale, onProgress, buildingStyle);

		case 'dxf3d':
			return exportToDXF3D(objects, elevationMatrix, bounds, zoom, onProgress, contours);

		case 'ifc':
			return await exportToIFC(objects, elevationMatrix, bounds, onProgress);

		case 'obj':
			return await exportToOBJ(objects, elevationMatrix, bounds, onProgress);

		default:
			throw new Error(m.error_unsupported_format({ format }));
	}
}

/**
 * Trigger download of exported file
 */
export function downloadFile(
	filename: string,
	content: string | Uint8Array | Blob,
	mimeType: string
): void {
	let blob: Blob;

	// Convert content to Blob
	if (typeof content === 'string') {
		// Check if it's a blob URL
		if (content.startsWith('blob:')) {
			const a = document.createElement('a');
			a.href = content;
			a.download = filename;
			document.body.appendChild(a);
			a.click();
			document.body.removeChild(a);
			return;
		}
		blob = new Blob([content], { type: mimeType });
	} else if (content instanceof Uint8Array) {
		blob = new Blob([content], { type: mimeType });
	} else {
		blob = content;
	}

	// Create object URL and trigger download
	const url = URL.createObjectURL(blob);
	const a = document.createElement('a');
	a.href = url;
	a.download = filename;
	document.body.appendChild(a);
	a.click();
	document.body.removeChild(a);

	// Clean up
	setTimeout(() => URL.revokeObjectURL(url), 100);
}

/**
 * Get MIME type for export format
 */
export function getMimeType(format: ExportFormat): string {
	switch (format) {
		case 'dxf':
		case 'dxf3d':
			return 'application/dxf';
		case 'svg':
			return 'image/svg+xml';
		case 'pdf':
			return 'application/pdf';
		case 'ifc':
			return 'application/x-step'; // IFC uses STEP format
		case 'obj':
			return 'model/obj';
		default:
			return 'application/octet-stream';
	}
}

/**
 * Get filename for export format
 */
export function getFilename(format: ExportFormat): string {
	// Map format to file extension
	const extensionMap: Record<ExportFormat, string> = {
		dxf: 'dxf',
		svg: 'svg',
		pdf: 'pdf',
		dxf3d: 'dxf',
		ifc: 'ifc',
		obj: 'obj'
	};

	const extension = extensionMap[format] || format;
	return `swzpln.${extension}`;
}
