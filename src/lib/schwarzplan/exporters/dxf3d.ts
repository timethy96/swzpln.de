// 3D DXF exporter — writes incrementally to Uint8Array to avoid string allocation overflow

import type { Bounds, GeometryObject, ProgressCallback, ContourData } from '../types';
import { extrudeBuildings } from '../geometry/buildings';
import { generateTerrainMesh } from '../elevation/terrain';
import { latLngToXY, getMaxXY } from '../geometry/coordinates';
import * as m from '$lib/paraglide/messages';

// ============================================================================
// Minimal incremental DXF writer
// Encodes each entity as a small Uint8Array chunk to avoid one giant string.
// ============================================================================

class IncrementalDxfWriter {
	private chunks: Uint8Array[] = [];
	private encoder = new TextEncoder();
	private currentLayer = '';

	private write(text: string): void {
		this.chunks.push(this.encoder.encode(text));
	}

	writeHeader(units = 4 /* Millimeters */): void {
		this.write(
			'0\r\nSECTION\r\n2\r\nHEADER\r\n' +
				'9\r\n$ACADVER\r\n1\r\nAC1015\r\n' +
				`9\r\n$INSUNITS\r\n70\r\n${units}\r\n` +
				'0\r\nENDSEC\r\n'
		);
	}

	writeTables(layers: Array<{ name: string; color: number }>): void {
		let content =
			'0\r\nSECTION\r\n2\r\nTABLES\r\n' +
			'0\r\nTABLE\r\n2\r\nLAYER\r\n' +
			`70\r\n${layers.length}\r\n`;

		for (const layer of layers) {
			content +=
				'0\r\nLAYER\r\n' +
				`2\r\n${layer.name}\r\n` +
				'70\r\n0\r\n' +
				`62\r\n${layer.color}\r\n` +
				'6\r\nCONTINUOUS\r\n';
		}

		content += '0\r\nENDTABLE\r\n0\r\nENDSEC\r\n';
		this.write(content);
	}

	beginEntities(): void {
		this.write('0\r\nSECTION\r\n2\r\nENTITIES\r\n');
	}

	setLayer(name: string): void {
		this.currentLayer = name;
	}

	add3dFace(
		v1: { x: number; y: number; z: number },
		v2: { x: number; y: number; z: number },
		v3: { x: number; y: number; z: number },
		v4: { x: number; y: number; z: number }
	): void {
		this.write(
			`0\r\n3DFACE\r\n8\r\n${this.currentLayer}\r\n` +
				`10\r\n${v1.x}\r\n20\r\n${v1.y}\r\n30\r\n${v1.z}\r\n` +
				`11\r\n${v2.x}\r\n21\r\n${v2.y}\r\n31\r\n${v2.z}\r\n` +
				`12\r\n${v3.x}\r\n22\r\n${v3.y}\r\n32\r\n${v3.z}\r\n` +
				`13\r\n${v4.x}\r\n23\r\n${v4.y}\r\n33\r\n${v4.z}\r\n`
		);
	}

	addText(pos: { x: number; y: number; z: number }, height: number, text: string): void {
		this.write(
			`0\r\nTEXT\r\n8\r\n${this.currentLayer}\r\n` +
				`10\r\n${pos.x}\r\n20\r\n${pos.y}\r\n30\r\n${pos.z}\r\n` +
				`40\r\n${height}\r\n1\r\n${text}\r\n`
		);
	}

	endEntities(): void {
		this.write('0\r\nENDSEC\r\n0\r\nEOF\r\n');
	}

	toUint8Array(): Uint8Array {
		const totalLength = this.chunks.reduce((sum, c) => sum + c.length, 0);
		const result = new Uint8Array(totalLength);
		let offset = 0;
		for (const chunk of this.chunks) {
			result.set(chunk, offset);
			offset += chunk.length;
		}
		return result;
	}
}

// ============================================================================
// Exporter
// ============================================================================

export function exportToDXF3D(
	objects: GeometryObject[],
	elevationMatrix: number[][] | null,
	bounds: Bounds,
	zoom: number,
	onProgress?: ProgressCallback,
	_contours?: ContourData | null
): Uint8Array {
	// 1. Init
	notify(onProgress, 0, m.progress_dxf_init());
	const dxf = new IncrementalDxfWriter();

	dxf.writeHeader(6 /* Meters */);
	dxf.writeTables([
		{ name: 'BUILDINGS-3D', color: 7 },
		{ name: 'TERRAIN-3D', color: 3 },
		{ name: 'OTHER', color: 1 }
	]);
	dxf.beginEntities();

	// 2. Terrain
	const maxXY = getMaxXY(bounds);
	let terrainMesh = null;
	let gridSize = null;

	if (elevationMatrix) {
		notify(onProgress, 15, 'Generating terrain mesh...');
		terrainMesh = generateTerrainMesh(elevationMatrix, bounds);
		gridSize = { rows: elevationMatrix.length, cols: elevationMatrix[0]?.length || 0 };
	}

	// 3. Buildings
	notify(onProgress, 20, 'Processing buildings...');
	const buildings = objects
		.filter((obj) => obj.type === 'building' && obj.buildingMetadata)
		.map((b) => ({
			footprint: b.path,
			metadata: b.buildingMetadata!,
			id: undefined,
			relationId: b.relationId,
			isOutline: b.isOutline,
			holes: b.holes
		}));

	const meshes = extrudeBuildings(
		buildings,
		terrainMesh || undefined,
		gridSize || undefined,
		maxXY
	);

	dxf.setLayer('BUILDINGS-3D');
	let processed = 0;

	for (const mesh of meshes) {
		for (const face of mesh.faces) {
			if (face.length < 3) continue;

			const v1 = mesh.vertices[face[0]];
			const v2 = mesh.vertices[face[1]];
			const v3 = mesh.vertices[face[2]];
			const v4 = face.length > 3 ? mesh.vertices[face[3]] : v3;

			dxf.add3dFace(v1, v2, v3, v4);
		}

		processed++;
		if (processed % 50 === 0) {
			notify(
				onProgress,
				20 + Math.round((processed / buildings.length) * 50),
				m.progress_dxf_exporting({
					current: processed.toString(),
					total: buildings.length.toString()
				})
			);
		}
	}

	// 4. Terrain mesh
	if (terrainMesh) {
		notify(onProgress, 75, 'Adding terrain mesh...');
		dxf.setLayer('TERRAIN-3D');

		for (let i = 0; i < terrainMesh.triangles.length; i += 3) {
			const v1 = terrainMesh.vertices[terrainMesh.triangles[i]];
			const v2 = terrainMesh.vertices[terrainMesh.triangles[i + 1]];
			const v3 = terrainMesh.vertices[terrainMesh.triangles[i + 2]];
			dxf.add3dFace(v1, v2, v3, v3);
		}
	}

	// 5. Attribution
	notify(onProgress, 85, 'Adding attribution...');
	dxf.setLayer('OTHER');
	const txtXY = latLngToXY(bounds, bounds.south, bounds.east);
	const txtSize = (19 - zoom) * 10;
	dxf.addText(
		{ x: txtXY.x, y: txtXY.y - txtSize, z: 0 },
		txtSize,
		'(c) OpenStreetMap.org contributors'
	);

	dxf.endEntities();

	notify(onProgress, 100, '3D DXF export complete');
	return dxf.toUint8Array();
}

function notify(cb: ProgressCallback | undefined, percent: number, message: string) {
	if (cb) cb({ step: 'export', percent, message });
}
