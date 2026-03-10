// DXF exporter using @tarikjabiri/dxf

import {
	DxfWriter,
	Units,
	point3d,
	LWPolylineFlags,
	HatchBoundaryPaths,
	HatchPolylineBoundary,
	HatchPredefinedPatterns,
	vertex,
	pattern
} from '@tarikjabiri/dxf';
import type { Bounds, ContourData, GeometryObject, ProgressCallback } from '../types';
import { LAYER_CONFIG, LAYER_RENDER_ORDER, isLayerFillable, sortObjectsByLayer } from '../layers';
import { latLngToXY, getMaxXY } from '../geometry/coordinates';
import * as m from '$lib/paraglide/messages';

export function exportToDXF(
	objects: GeometryObject[],
	contours: ContourData | null,
	bounds: Bounds,
	zoom: number,
	onProgress?: ProgressCallback
): string {
	notify(onProgress, 0, m.progress_dxf_init());

	// 1. Setup
	const dxf = new DxfWriter();
	dxf.setUnits(Units.Meters);

	// Add layers in render order so the layer panel in CAD programs shows them correctly
	for (const layer of LAYER_RENDER_ORDER) {
		const conf = LAYER_CONFIG[layer];
		dxf.addLayer(layer, conf.dxfColor || 7, conf.lineType || 'CONTINUOUS');
	}
	dxf.addLayer('other', 1, 'CONTINUOUS');

	// 2. Prepare Data
	const maxXY = getMaxXY(bounds);
	// Roads are already merged in converter step
	const merged = [...objects];
	if (contours) merged.push(...fromContours(contours, maxXY));

	const sorted = sortObjectsByLayer(merged);
	const total = sorted.length;

	notify(onProgress, 20, m.progress_dxf_adding_objects());

	// 3. Render
	let count = 0;

	for (const obj of sorted) {
		const layer = LAYER_CONFIG[obj.type] ? obj.type : 'other';
		dxf.setCurrentLayerName(layer);

		renderDXFObj(dxf, obj, maxXY);

		count++;
		if (count % 200 === 0) {
			notify(
				onProgress,
				20 + Math.round((count / total) * 70),
				m.progress_dxf_exporting({ current: count.toString(), total: total.toString() })
			);
		}
	}

	// 4. Attribution
	const txtXY = latLngToXY(bounds, bounds.south, bounds.east);
	const txtSize = (19 - zoom) * 10;
	dxf.setCurrentLayerName('other');
	dxf.addText(
		point3d(txtXY.x, txtXY.y - txtSize, 0),
		txtSize,
		'(c) OpenStreetMap.org contributors'
	);

	notify(onProgress, 100, m.progress_dxf_complete());
	return dxf.stringify();
}

// Helpers

function notify(cb: ProgressCallback | undefined, percent: number, message: string) {
	if (cb) cb({ step: 'export', percent, message });
}

function fromContours(contours: ContourData, maxXY: { x: number; y: number }): GeometryObject[] {
	return contours.contours.map((c) => ({
		type: 'contours',
		path: c.map((p) => ({
			// Normalize to meters relative to maxXY for uniform scaling
			x: (p.x * maxXY.x) / contours.sizeX,
			y: Math.abs((p.y * maxXY.y) / contours.sizeY - maxXY.y) // Flip Y match DXF coord system if needed? Or just pass through.
			// SVG/PDF flipped Y because screen coords go down. DXF is Cartesian (Y up).
			// Original DXF code: y: Math.abs((coord.y * maxXY.y) / contours.sizeY - maxXY.y);
			// Wait, latLngToXY returns {x, y} relative to SW corner (0,0). Y is distance North.
			// So Y increases upwards.
			// The contours came from a raster which might be indexed Top-Down.
			// Let's assume the Y-flip logic was intentional for raster->vector conversion.
		}))
	}));
}

function renderDXFObj(dxf: DxfWriter, obj: GeometryObject, _maxXY: { x: number; y: number }) {
	if (obj.path.length === 0) return;

	const isFillable = isLayerFillable(obj.type);
	// Highways are polygons but should not get SOLID hatches in DXF
	// (they would obscure buildings and other layers underneath)
	const shouldHatch = isFillable && obj.type !== 'highway';
	const flags = isFillable ? LWPolylineFlags.Closed : 0;

	// Outline polyline
	const vertices = obj.path.map((p) => ({ point: point3d(p.x, p.y, 0) }));
	dxf.addLWPolyline(vertices, { flags });

	// Holes as separate closed polylines
	if (obj.holes) {
		for (const hole of obj.holes) {
			const holeVertices = hole.map((p) => ({ point: point3d(p.x, p.y, 0) }));
			dxf.addLWPolyline(holeVertices, { flags: LWPolylineFlags.Closed });
		}
	}

	// SOLID hatch for fillable areas (except highways)
	if (shouldHatch) {
		const boundaryPaths = new HatchBoundaryPaths();

		// Outer boundary
		const outer = new HatchPolylineBoundary();
		for (const p of obj.path) {
			outer.add(vertex(p.x, p.y));
		}
		boundaryPaths.addPolylineBoundary(outer);

		// Inner boundaries (holes)
		if (obj.holes) {
			for (const hole of obj.holes) {
				const inner = new HatchPolylineBoundary();
				for (const p of hole) {
					inner.add(vertex(p.x, p.y));
				}
				boundaryPaths.addPolylineBoundary(inner);
			}
		}

		dxf.addHatch(boundaryPaths, pattern({ name: HatchPredefinedPatterns.SOLID }));
	}
}
