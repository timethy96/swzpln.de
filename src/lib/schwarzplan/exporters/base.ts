// Base exporter that delegates to specific format exporters

import type {
	Bounds,
	ContourData,
	ExportFormat,
	GeometryObject,
	ProgressCallback
} from '../types';
import { exportToDXF } from './dxf';
import { exportToSVG } from './svg';
import { exportToPDF } from './pdf';

/**
 * Export geometry objects to the specified format
 */
export function exportGeometry(
	format: ExportFormat,
	objects: GeometryObject[],
	contours: ContourData | null,
	bounds: Bounds,
	zoom: number,
	scale: number | undefined,
	onProgress?: ProgressCallback
): string {
	switch (format) {
		case 'dxf':
			return exportToDXF(objects, contours, bounds, zoom, onProgress);

		case 'svg':
			if (!scale) {
				throw new Error('Scale is required for SVG export');
			}
			return exportToSVG(objects, contours, bounds, zoom, scale, onProgress);

		case 'pdf':
			if (!scale) {
				throw new Error('Scale is required for PDF export');
			}
			return exportToPDF(objects, contours, bounds, zoom, scale, onProgress);

		default:
			throw new Error(`Unsupported export format: ${format}`);
	}
}

/**
 * Trigger download of exported file
 */
export function downloadFile(filename: string, content: string | Blob, mimeType: string): void {
	const blob = typeof content === 'string' ? new Blob([content], { type: mimeType }) : content;

	// For PDF blob URLs, we can use them directly
	if (typeof content === 'string' && content.startsWith('blob:')) {
		const a = document.createElement('a');
		a.href = content;
		a.download = filename;
		document.body.appendChild(a);
		a.click();
		document.body.removeChild(a);
		return;
	}

	// For other formats, create object URL
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
			return 'application/dxf';
		case 'svg':
			return 'image/svg+xml';
		case 'pdf':
			return 'application/pdf';
		default:
			return 'application/octet-stream';
	}
}

/**
 * Get filename for export format
 */
export function getFilename(format: ExportFormat): string {
	return `swzpln.${format}`;
}


