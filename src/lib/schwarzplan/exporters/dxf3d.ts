// 3D DXF exporter using @tarikjabiri/dxf

import { DxfWriter, Units, point3d } from '@tarikjabiri/dxf';
import type { Bounds, GeometryObject, ProgressCallback, ContourData } from '../types';
import { extrudeBuildings } from '../geometry/buildings';
import { generateTerrainMesh } from '../elevation/terrain';
import { latLngToXY, getMaxXY } from '../geometry/coordinates';
import * as m from '$lib/paraglide/messages';

/**
 * Export geometry objects and terrain to 3D DXF format
 */
export function exportToDXF3D(
	objects: GeometryObject[],
	elevationMatrix: number[][] | null,
	bounds: Bounds,
	zoom: number,
	onProgress?: ProgressCallback,
	contours?: ContourData | null
): string {
	// 1. Init
	notify(onProgress, 0, m.progress_dxf_init());
	const dxf = new DxfWriter();
	dxf.setUnits(Units.Meters);

	// 2. Layers
	notify(onProgress, 10, 'Creating layers...');
	dxf.addLayer('BUILDINGS-3D', 7, 'CONTINUOUS');
	dxf.addLayer('TERRAIN-3D', 3, 'CONTINUOUS');
	dxf.addLayer('OTHER', 1, 'CONTINUOUS');

	// 3. Terrain
	let terrainMesh = null;
	let gridSize = null;
	const maxXY = getMaxXY(bounds);

	if (elevationMatrix) {
		notify(onProgress, 15, 'Generating terrain mesh...');
		terrainMesh = generateTerrainMesh(elevationMatrix, bounds);
		gridSize = { rows: elevationMatrix.length, cols: elevationMatrix[0]?.length || 0 };
	}

	// 4. Buildings
	notify(onProgress, 20, 'Processing buildings...');
	const buildings = objects
		.filter((obj) => obj.type === 'building' && obj.buildingMetadata)
		.map(b => ({
			footprint: b.path,
			metadata: b.buildingMetadata!,
			id: undefined, // Building IDs not strictly needed for DXF export visual
			relationId: b.relationId,
			isOutline: b.isOutline,
			holes: b.holes
		}));

	// Batch process buildings (handles grouping & terrain offset internally)
	const meshes = extrudeBuildings(buildings, terrainMesh || undefined, gridSize || undefined, maxXY);

	// Write meshes to DXF
	dxf.setCurrentLayerName('BUILDINGS-3D');
	let processed = 0;

	for (const mesh of meshes) {
		for (const face of mesh.faces) {
			if (face.length < 3) continue;

			const v1 = mesh.vertices[face[0]];
			const v2 = mesh.vertices[face[1]];
			const v3 = mesh.vertices[face[2]];
			// DXF requires 4 points for a 3dFace; for triangles, repeat the last one
			const v4 = face.length > 3 ? mesh.vertices[face[3]] : v3;

			dxf.add3dFace(
				point3d(v1.x, v1.y, v1.z),
				point3d(v2.x, v2.y, v2.z),
				point3d(v3.x, v3.y, v3.z),
				point3d(v4.x, v4.y, v4.z)
			);
		}

		processed++;
		if (processed % 50 === 0) {
			notify(onProgress, 20 + Math.round((processed / buildings.length) * 50),
				m.progress_dxf_exporting({ current: processed.toString(), total: buildings.length.toString() })
			);
		}
	}

	// 5. Write Terrain
	if (terrainMesh) {
		notify(onProgress, 75, 'Adding terrain mesh...');
		dxf.setCurrentLayerName('TERRAIN-3D');
		for (let i = 0; i < terrainMesh.triangles.length; i += 3) {
			const v1 = terrainMesh.vertices[terrainMesh.triangles[i]];
			const v2 = terrainMesh.vertices[terrainMesh.triangles[i + 1]];
			const v3 = terrainMesh.vertices[terrainMesh.triangles[i + 2]];

			dxf.add3dFace(
				point3d(v1.x, v1.y, v1.z),
				point3d(v2.x, v2.y, v2.z),
				point3d(v3.x, v3.y, v3.z),
				point3d(v3.x, v3.y, v3.z)
			);
		}
	}

	// 6. Attribution
	notify(onProgress, 85, 'Adding attribution...');
	dxf.setCurrentLayerName('OTHER');
	const txtXY = latLngToXY(bounds, bounds.south, bounds.east);
	const txtSize = (19 - zoom) * 10;
	dxf.addText(point3d(txtXY.x, txtXY.y - txtSize, 0), txtSize, '(c) OpenStreetMap.org contributors');

	// 7. Finish
	notify(onProgress, 100, '3D DXF export complete');
	return dxf.stringify();
}

// Helper to keep main function clean
function notify(cb: ProgressCallback | undefined, percent: number, message: string) {
	if (cb) cb({ step: 'export', percent, message });
}
