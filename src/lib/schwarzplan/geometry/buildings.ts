import type { Coordinate, Coordinate3D, BuildingMetadata, BuildingMesh } from '../types';
import earcut from 'earcut';
import { interpolateTerrainElevation } from '../elevation/terrain';

const EPSILON = 0.01;

/**
 * Extrude multiple buildings with terrain support and grouping for multi-part structures.
 */
export function extrudeBuildings(
	buildings: Array<{ footprint: Coordinate[]; metadata: BuildingMetadata; id?: number; relationId?: number }>,
	terrainMesh?: { vertices: Coordinate3D[] },
	gridSize?: { rows: number; cols: number },
	maxXY?: { x: number; y: number }
): BuildingMesh[] {
	const meshes: BuildingMesh[] = [];
	const groups = new Map<number, typeof buildings>();
	const singles: typeof buildings = [];

	// 1. Group by relationId
	for (const b of buildings) {
		if (b.relationId) {
			if (!groups.has(b.relationId)) groups.set(b.relationId, []);
			groups.get(b.relationId)!.push(b);
		} else {
			singles.push(b);
		}
	}

	// 2. Process singles
	for (const b of singles) {
		const groundElevation = getGroundElevation(b.footprint, terrainMesh, gridSize, maxXY);
		const mesh = extrudeSingleBuilding(b.footprint, b.metadata, groundElevation);
		mesh.buildingId = b.id;
		meshes.push(mesh);
	}

	// 3. Process groups (Shared Elevation)
	for (const [_, group] of groups) {
		const groundElevation = getGroupElevation(group, terrainMesh, gridSize, maxXY);
		for (const b of group) {
			const mesh = extrudeSingleBuilding(b.footprint, b.metadata, groundElevation);
			mesh.buildingId = b.id;
			meshes.push(mesh);
		}
	}

	return meshes;
}

/**
 * Core extrusion logic for a single building part
 */
export function extrudeSingleBuilding(
	footprint: Coordinate[],
	metadata: BuildingMetadata,
	groundElevation: number = 0
): BuildingMesh {
	const cleanFootprint = cleanPolygon(footprint);
	if (cleanFootprint.length < 3) return { vertices: [], faces: [] };

	const baseHeight = getBaseHeight(metadata, groundElevation);
	const topHeight = getTopHeight(metadata, baseHeight, groundElevation);

	// Volumetric Shapes (Sphere, Cone, Pyramid) - Replaces entire building
	if (isVolumetric(metadata.shape)) {
		return generateVolumetricMesh(cleanFootprint, metadata.shape!, baseHeight, topHeight);
	}

	// Standard Extrusion (Walls + Roof)
	const mesh: BuildingMesh = { vertices: [], faces: [] };
	const roofShape = metadata.roofShape || 'flat';

	// Determine where walls end
	let wallTopZ = topHeight;
	let roofHeight = 0;

	if (metadata.roofHeight) {
		roofHeight = metadata.roofHeight;
	} else if (metadata.roofLevels) {
		roofHeight = metadata.roofLevels * 3;
	} else if (roofShape !== 'flat') {
		// Auto-calculate default roof height if not plain flat
		const radius = calculateAverageRadius(cleanFootprint, calculateCentroid(cleanFootprint));
		roofHeight = Math.min(3, (topHeight - baseHeight), radius);
	}

	// Adjust wall top if roof is purely additive or subtractive? 
	// Standard OSM model: 'height' is top of roof. So walls stop at height - roof_height.
	if (roofShape !== 'flat' && roofHeight > 0) {
		wallTopZ = Math.max(baseHeight, topHeight - roofHeight);
	}

	// 1. Generate Walls
	generateWalls(mesh, cleanFootprint, baseHeight, wallTopZ);

	// 2. Generate Base Cap
	generateCap(mesh, cleanFootprint, baseHeight, true); // true = reverse for bottom visibility

	// 3. Generate Roof
	if (roofShape === 'flat') {
		generateCap(mesh, cleanFootprint, wallTopZ, false);
	} else {
		generateRoofGeometry(mesh, cleanFootprint, roofShape, wallTopZ, topHeight);
	}

	return mesh;
}

// --- Helpers ---

function getGroundElevation(
	footprint: Coordinate[],
	terrain?: { vertices: Coordinate3D[] },
	grid?: { rows: number; cols: number },
	max?: { x: number; y: number }
): number {
	if (!terrain || !grid || !max) return 0;
	return interpolateTerrainElevation(calculateCentroid(footprint), terrain, grid, max);
}

function getGroupElevation(
	group: Array<{ footprint: Coordinate[] }>,
	terrain?: { vertices: Coordinate3D[] },
	grid?: { rows: number; cols: number },
	max?: { x: number; y: number }
): number {
	if (!terrain || !grid || !max) return 0;

	let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
	for (const part of group) {
		for (const p of part.footprint) {
			if (p.x < minX) minX = p.x;
			if (p.x > maxX) maxX = p.x;
			if (p.y < minY) minY = p.y;
			if (p.y > maxY) maxY = p.y;
		}
	}
	if (minX === Infinity) return 0;

	const centerX = (minX + maxX) / 2;
	const centerY = (minY + maxY) / 2;
	return interpolateTerrainElevation({ x: centerX, y: centerY }, terrain, grid, max);
}

function getBaseHeight(m: BuildingMetadata, ground: number): number {
	if (m.minHeight !== undefined) return ground + m.minHeight;
	if (m.minLevel !== undefined) return ground + (m.minLevel * 3);
	return ground;
}

function getTopHeight(m: BuildingMetadata, base: number, ground: number): number {
	if (m.height !== undefined) {
		const absHeight = ground + m.height;
		return absHeight > base ? absHeight : base + m.height;
	}
	if (m.levels !== undefined) return base + (m.levels * 3);
	return base + 10;
}

function isVolumetric(shape?: string) {
	return shape === 'sphere' || shape === 'cone' || shape === 'pyramid';
}

function generateWalls(mesh: BuildingMesh, footprint: Coordinate[], zBottom: number, zTop: number) {
	if (Math.abs(zTop - zBottom) < 0.1) return;

	const startIdx = mesh.vertices.length;
	const len = footprint.length;

	// Add vertices
	for (const p of footprint) {
		mesh.vertices.push({ x: p.x, y: p.y, z: zBottom });
		mesh.vertices.push({ x: p.x, y: p.y, z: zTop });
	}

	// Add faces
	for (let i = 0; i < len; i++) {
		const next = (i + 1) % len;
		const base = startIdx + i * 2;
		const top = startIdx + i * 2 + 1;
		const nextBase = startIdx + next * 2;
		const nextTop = startIdx + next * 2 + 1;

		mesh.faces.push([base, nextBase, top]);
		mesh.faces.push([nextBase, nextTop, top]);
	}
}

function generateCap(mesh: BuildingMesh, footprint: Coordinate[], z: number, reverse: boolean) {
	const flatCoords: number[] = [];
	for (const p of footprint) flatCoords.push(p.x, p.y);
	const triangles = earcut(flatCoords);
	const startIdx = mesh.vertices.length;

	for (const p of footprint) mesh.vertices.push({ x: p.x, y: p.y, z });

	for (let i = 0; i < triangles.length; i += 3) {
		const i1 = startIdx + triangles[i];
		const i2 = startIdx + triangles[i + 1];
		const i3 = startIdx + triangles[i + 2];
		if (reverse) {
			mesh.faces.push([i3, i2, i1]); // CW
		} else {
			mesh.faces.push([i1, i2, i3]); // CCW
		}
	}
}

function generateRoofGeometry(mesh: BuildingMesh, footprint: Coordinate[], type: string, zBase: number, zApex: number) {
	const center = calculateCentroid(footprint);

	// Dome/Sphere/Onion (Hemispherical Cap)
	if (['dome', 'sphere', 'onion'].includes(type) || type === 'round') {
		generateDome(mesh, footprint, center, zBase, zApex);
		return;
	}

	// Pyramidal/Pitched (Apex Point)
	// Default behavior for unknown roof shapes ensuring closure
	const startIdx = mesh.vertices.length;
	// Reuse last vertices if they match zBase? No, keep it simple, add new ring.
	for (const p of footprint) mesh.vertices.push({ x: p.x, y: p.y, z: zBase });

	const apexIdx = mesh.vertices.length;
	mesh.vertices.push({ x: center.x, y: center.y, z: zApex });

	for (let i = 0; i < footprint.length; i++) {
		const curr = startIdx + i;
		const next = startIdx + ((i + 1) % footprint.length);
		mesh.faces.push([curr, next, apexIdx]);
	}
}

function generateDome(mesh: BuildingMesh, footprint: Coordinate[], center: Coordinate, zBase: number, zTop: number) {
	const radius = calculateAverageRadius(footprint, center);
	const height = zTop - zBase;
	const latSegments = 8; // Simplified for performance
	const lonSegments = 16;
	const startIdx = mesh.vertices.length;

	for (let lat = 0; lat <= latSegments; lat++) {
		const theta = (lat * (Math.PI / 2)) / latSegments;
		const sinTheta = Math.sin(theta);
		const cosTheta = Math.cos(theta);

		for (let lon = 0; lon <= lonSegments; lon++) {
			const phi = (lon * 2 * Math.PI) / lonSegments;
			const x = center.x + radius * sinTheta * Math.cos(phi);
			const y = center.y + radius * sinTheta * Math.sin(phi);
			const z = zBase + height * cosTheta;
			mesh.vertices.push({ x, y, z });
		}
	}

	// Connect faces
	for (let lat = 0; lat < latSegments; lat++) {
		for (let lon = 0; lon < lonSegments; lon++) {
			const first = startIdx + lat * (lonSegments + 1) + lon;
			const second = first + lonSegments + 1;
			mesh.faces.push([first, second, first + 1]);
			mesh.faces.push([second, second + 1, first + 1]);
		}
	}
}

function generateVolumetricMesh(footprint: Coordinate[], shape: string, zBottom: number, zTop: number): BuildingMesh {
	// Sphere, Cone, Pyramid
	const mesh: BuildingMesh = { vertices: [], faces: [] };
	const center = calculateCentroid(footprint);
	const radius = calculateAverageRadius(footprint, center);

	if (shape === 'sphere') {
		// Full sphere
		const latSegments = 16;
		const lonSegments = 24;
		const h = zTop - zBottom;
		const r = h / 2; // Radius based on height
		const zCenter = zBottom + r;

		const startIdx = 0;
		for (let lat = 0; lat <= latSegments; lat++) {
			const theta = (lat * Math.PI) / latSegments;
			const sinTheta = Math.sin(theta);
			const cosTheta = Math.cos(theta);
			for (let lon = 0; lon <= lonSegments; lon++) {
				const phi = (lon * 2 * Math.PI) / lonSegments;
				const x = center.x + radius * sinTheta * Math.cos(phi); // Use footprint radius for XY
				const y = center.y + radius * sinTheta * Math.sin(phi);
				const z = zCenter + r * (-cosTheta); // Use height radius for Z
				mesh.vertices.push({ x, y, z });
			}
		}

		for (let lat = 0; lat < latSegments; lat++) {
			for (let lon = 0; lon < lonSegments; lon++) {
				const first = startIdx + lat * (lonSegments + 1) + lon;
				const second = first + lonSegments + 1;
				mesh.faces.push([first, first + 1, second]);
				mesh.faces.push([second, first + 1, second + 1]);
			}
		}
	} else {
		// Cone/Pyramid (Same logic as roof)
		// 1. Base Cap
		generateCap(mesh, footprint, zBottom, true);
		// 2. Walls/Slope to Apex
		const startIdx = mesh.vertices.length;
		for (const p of footprint) mesh.vertices.push({ x: p.x, y: p.y, z: zBottom });
		const apexIdx = mesh.vertices.length;
		mesh.vertices.push({ x: center.x, y: center.y, z: zTop });

		for (let i = 0; i < footprint.length; i++) {
			const curr = startIdx + i;
			const next = startIdx + ((i + 1) % footprint.length);
			mesh.faces.push([curr, next, apexIdx]);
		}
	}

	return mesh;
}


// --- Geom Utils ---

function cleanPolygon(points: Coordinate[]): Coordinate[] {
	if (points.length < 3) return [];
	const cleaned = [points[0]];
	for (let i = 1; i < points.length; i++) {
		const prev = cleaned[cleaned.length - 1];
		if (distSq(points[i], prev) > EPSILON * EPSILON) {
			cleaned.push(points[i]);
		}
	}
	// Remove closing point if duplicate
	if (cleaned.length > 2 && distSq(cleaned[0], cleaned[cleaned.length - 1]) < EPSILON * EPSILON) {
		cleaned.pop();
	}
	// CCW Winding
	let area = 0;
	for (let i = 0; i < cleaned.length; i++) {
		const j = (i + 1) % cleaned.length;
		area += (cleaned[j].x - cleaned[i].x) * (cleaned[j].y + cleaned[i].y);
	}
	if (area > 0) cleaned.reverse();
	return cleaned;
}

function distSq(p1: Coordinate, p2: Coordinate) {
	return (p1.x - p2.x) ** 2 + (p1.y - p2.y) ** 2;
}

function calculateCentroid(polygon: Coordinate[]): Coordinate {
	let sx = 0, sy = 0;
	for (const p of polygon) { sx += p.x; sy += p.y; }
	return { x: sx / polygon.length, y: sy / polygon.length };
}

function calculateAverageRadius(polygon: Coordinate[], center: Coordinate): number {
	let sum = 0;
	for (const p of polygon) sum += Math.sqrt(distSq(p, center));
	return sum / polygon.length;
}


