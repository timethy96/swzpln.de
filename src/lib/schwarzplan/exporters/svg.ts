// SVG exporter

import type { Bounds, ContourData, GeometryObject, ProgressCallback } from '../types';
import { LAYER_CONFIG, isLayerFillable, sortObjectsByLayer } from '../layers';
import { getMaxXY } from '../geometry/coordinates';
import * as m from '$lib/paraglide/messages';

export function exportToSVG(
	objects: GeometryObject[],
	contours: ContourData | null,
	bounds: Bounds,
	zoom: number,
	scale: number,
	onProgress?: ProgressCallback,
	buildingStyle?: 'filled' | 'outline'
): string {
	notify(onProgress, 0, m.progress_svg_init());

	const maxXY = getMaxXY(bounds);
	const txtSize = (19 - zoom) * 10;
	// Dimensions in mm
	const width = maxXY.x * 1000 * scale;
	const height = (maxXY.y + txtSize + 5) * 1000 * scale;

	// Prepare data: Roads are already merged in converter
	const mergedObjects = [...objects];

	// Inject contours as GeometryObjects to treat them uniformly in the rendering stack
	if (contours) mergedObjects.push(...fromContours(contours, maxXY, scale));

	const sortedObjects = sortObjectsByLayer(mergedObjects);
	const total = sortedObjects.length;

	// Start SVG
	let svg = `<svg xmlns='http://www.w3.org/2000/svg' version='1.1' xmlns:xlink='http://www.w3.org/1999/xlink' `;
	svg += `width='${width}mm' height='${height}mm' viewBox='0 0 ${width} ${height}'>`;

	notify(onProgress, 20, m.progress_svg_adding_objects());

	let count = 0;
	for (const obj of sortedObjects) {
		const pathStr = objToSVGPath(obj, maxXY, scale, buildingStyle);
		if (pathStr) {
			svg += pathStr;
		}

		count++;
		if (count % 200 === 0) {
			notify(
				onProgress,
				20 + Math.round((count / total) * 70),
				m.progress_dxf_exporting({ current: count.toString(), total: total.toString() })
			);
		}
	}

	// Attribution
	notify(onProgress, 95, m.progress_svg_adding_attribution());
	const textX = maxXY.x * 1000 * scale;
	const textY = (maxXY.y + txtSize) * 1000 * scale;
	svg += `<text x='${textX}' y='${textY}' text-anchor='end' style='font: ${txtSize * 1000 * scale}px sans-serif;' fill='red'>(c) OpenStreetMap.org contributors</text>`;

	svg += '</svg>';
	notify(onProgress, 100, m.progress_svg_complete());
	return svg;
}

// Helpers

function notify(cb: ProgressCallback | undefined, percent: number, message: string) {
	if (cb) cb({ step: 'export', percent, message });
}

function fromContours(
	contours: ContourData,
	maxXY: { x: number; y: number },
	_scale: number
): GeometryObject[] {
	// Temporarily map to layer 'contours' to sort correctly
	return contours.contours.map((c) => ({
		type: 'contours',
		path: c.map((p) => ({
			x: (p.x * maxXY.x) / contours.sizeX,
			y: (p.y * maxXY.y) / contours.sizeY // Normalized relative to maxXY for uniform scaling later
		}))
	}));
}

function objToSVGPath(
	obj: GeometryObject,
	maxXY: { x: number; y: number },
	scale: number,
	buildingStyle?: 'filled' | 'outline'
): string {
	if (obj.path.length === 0) return '';
	const layer = obj.type;
	const config = LAYER_CONFIG[layer];
	const color = config?.color || '#FF0000';

	// Transform: Scale and Flip Y
	const transformFn = (p: { x: number; y: number }) => [
		p.x * 1000 * scale,
		(p.y - maxXY.y) * -1 * 1000 * scale
	];

	const points = obj.path.map(transformFn);
	let d = 'M' + points.map((p) => p.join(',')).join(' ') + 'z';

	// Add holes if any
	if (obj.holes && obj.holes.length > 0) {
		for (const hole of obj.holes) {
			const holePoints = hole.map(transformFn);
			if (holePoints.length > 0) {
				d += ' M' + holePoints.map((p) => p.join(',')).join(' ') + 'z';
			}
		}
	}

	if (layer === 'highway') {
		// Stroke
		return `<path d='${d}z' style='fill:none;stroke:${color};stroke-width:${0.5 * scale}' />`;
	}

	const isBuilding = layer === 'building' || layer === 'building_parts';
	const shouldFill = isLayerFillable(layer) && !(isBuilding && buildingStyle === 'outline');

	if (shouldFill) {
		// Fill
		return `<path d='${d}' style='fill:${color};stroke:none;fill-rule:evenodd' />`; // stroke:none to avoid artifacts
	} else {
		// Stroke (e.g. railway, contours, or outline buildings)
		// Default stroke width (usually 1px/1unit) might be too thick in mm context if not specified.
		// For consistency with contours which use default, we keep default.
		// However, for buildings, maybe we want it matching highway or specific?
		// User asked for "like contour", contours use default here.
		return `<path d='${d}' style='fill:none;stroke:${color}' />`;
	}
}
