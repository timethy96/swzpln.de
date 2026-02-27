// PDF exporter using jsPDF

import { jsPDF } from 'jspdf';
import type { Bounds, ContourData, GeometryObject, ProgressCallback } from '../types';
import { LAYER_CONFIG, isLayerFillable, sortObjectsByLayer } from '../layers';
import { getMaxXY } from '../geometry/coordinates';
import * as m from '$lib/paraglide/messages';

export function exportToPDF(
	objects: GeometryObject[],
	contours: ContourData | null,
	bounds: Bounds,
	zoom: number,
	scale: number,
	onProgress?: ProgressCallback,
	buildingStyle?: 'filled' | 'outline'
): string {
	notify(onProgress, 0, m.progress_pdf_init());

	const maxXY = getMaxXY(bounds);
	// Dims in mm
	const width = maxXY.x * 1000 * scale;
	const txtSize = (19 - zoom) * 10;
	const height = (maxXY.y + txtSize + 5) * 1000 * scale;

	const doc = new jsPDF({
		orientation: width > height ? 'l' : 'p',
		unit: 'mm',
		format: [width, height]
	});

	// Prepare Data
	// Roads are already merged
	const merged = [...objects];
	if (contours) merged.push(...fromContours(contours, maxXY));

	const sorted = sortObjectsByLayer(merged);
	const total = sorted.length;

	notify(onProgress, 20, m.progress_pdf_adding_objects());

	let count = 0;
	for (const obj of sorted) {
		renderObj(doc, obj, maxXY, scale, buildingStyle);

		count++;
		if (count % 200 === 0) {
			notify(onProgress, 20 + Math.round((count / total) * 70), m.progress_dxf_exporting({ current: count.toString(), total: total.toString() }));
		}
	}

	// Attribution
	notify(onProgress, 95, m.progress_pdf_adding_attribution());
	const textX = (maxXY.x - 5) * 1000 * scale;
	const textY = (maxXY.y + txtSize) * 1000 * scale;
	doc.setTextColor('#FF0000');
	doc.setFontSize(txtSize * 1000 * scale);
	doc.text('(c) OpenStreetMap.org contributors', textX, textY, { align: 'right' });

	notify(onProgress, 100, m.progress_pdf_complete());
	return String(doc.output('bloburl'));
}

// Helpers

function notify(cb: ProgressCallback | undefined, percent: number, message: string) {
	if (cb) cb({ step: 'export', percent, message });
}

function fromContours(contours: ContourData, maxXY: { x: number, y: number }): GeometryObject[] {
	return contours.contours.map(c => ({
		type: 'contours',
		path: c.map(p => ({
			// Normalize to match other objects logic
			x: (p.x * maxXY.x) / contours.sizeX,
			y: (p.y * maxXY.y) / contours.sizeY
		}))
	}));
}

function renderObj(
	doc: jsPDF,
	obj: GeometryObject,
	maxXY: { x: number, y: number },
	scale: number,
	buildingStyle?: 'filled' | 'outline'
) {
	if (obj.path.length === 0) return;
	const layer = obj.type;
	const config = LAYER_CONFIG[layer];
	const color = config?.color || '#FF0000';

	// Construct Path ops
	// Construct Path ops
	const ops: any[] = [];

	const addPath = (pts: { x: number, y: number }[]) => {
		pts.forEach((p, i) => {
			const x = p.x * 1000 * scale;
			const y = (p.y - maxXY.y) * -1 * 1000 * scale;
			ops.push({ op: i === 0 ? 'm' : 'l', c: [x, y] });
		});
		// Close the subpath
		ops.push({ op: 'h' });
	};

	addPath(obj.path);

	// Add holes
	if (obj.holes) {
		for (const hole of obj.holes) {
			addPath(hole);
		}
	}

	if (layer === 'highway') {
		doc.setDrawColor(color);
		doc.setLineWidth(0.5 * scale);
		doc.path(ops).stroke();
		return;
	}

	const isBuilding = layer === 'building' || layer === 'building_parts';
	const shouldFill = isLayerFillable(layer) && !(isBuilding && buildingStyle === 'outline');

	if (shouldFill) {
		doc.setFillColor(color);
		// 'evenodd' rule is needed for holes. jsPDF path supports it?
		// jsPDF.path docs say: path(lines, style) where style is stroke/fill.
		// Advanced API might be needed or just assuming non-zero winding if manual 'm' is used.
		// However, standard PDF 'f*' operator corresponds to even-odd.
		// In jsPDF, .fill('evenodd') should work if supported, or passing it as option.


		// 'evenodd' rule would be preferred ('f*') but typing issues prevent easy usage here.
		// We rely on standard non-zero winding. If stitching produces correct alternating winding, holes work.
		doc.path(ops).fill();
	} else {
		// Outline
		doc.setDrawColor(color);
		doc.setLineWidth(0.1 * scale); // default thin stroke for contours etc
		doc.path(ops).stroke();
	}
}
