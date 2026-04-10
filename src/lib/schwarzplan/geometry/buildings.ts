import type { Coordinate, Coordinate3D, BuildingMetadata, BuildingMesh } from '../types';
import earcut from 'earcut';
import { interpolateTerrainElevation } from '../elevation/terrain';

const EPSILON = 0.01;

/**
 * Extrude multiple buildings with terrain support and grouping for multi-part structures.
 */
export function extrudeBuildings(
	buildings: Array<{
		footprint: Coordinate[];
		metadata: BuildingMetadata;
		id?: number;
		relationId?: number;
		isOutline?: boolean;
		holes?: Coordinate[][];
	}>,
	terrainMesh?: { vertices: Coordinate3D[] },
	gridSize?: { rows: number; cols: number },
	maxXY?: { x: number; y: number }
): BuildingMesh[] {
	const meshes: BuildingMesh[] = [];
	const groups = new Map<number, typeof buildings>();
	const singles: typeof buildings = [];

	// 1. Group by relationId — collect outlines separately so we can add them back as
	//    a ground-floor base when all parts in a group are elevated (min_height > 0).
	const outlines = new Map<number, (typeof buildings)[0]>();
	for (const b of buildings) {
		if (b.isOutline) {
			if (b.relationId) outlines.set(b.relationId, b);
			continue;
		}
		if (b.relationId) {
			if (!groups.has(b.relationId)) groups.set(b.relationId, []);
			groups.get(b.relationId)!.push(b);
		} else {
			singles.push(b);
		}
	}

	// If any part in a group starts above ground level, the outline is needed as the
	// base/fill for areas not covered by ground-level parts (e.g. Humboldt Forum portal
	// passages: bridge sections float at min_height=28m above an open carriageway).
	for (const [relationId, group] of groups) {
		const hasElevatedParts = group.some(
			(p) => (p.metadata.minHeight ?? (p.metadata.minLevel ?? 0) * 3) > 0
		);
		if (hasElevatedParts) {
			const outline = outlines.get(relationId);
			if (outline) group.push(outline);
		}
	}

	// 2. Process singles
	for (const b of singles) {
		const groundElevation = getGroundElevation(b.footprint, terrainMesh, gridSize, maxXY);
		const mesh = extrudeSingleBuilding(b.footprint, b.metadata, groundElevation, b.holes);
		mesh.buildingId = b.id;
		meshes.push(mesh);
	}

	// 3. Process groups (Shared Elevation)
	for (const [, group] of groups) {
		const groundElevation = getGroupElevation(group, terrainMesh, gridSize, maxXY);
		for (const b of group) {
			const mesh = extrudeSingleBuilding(b.footprint, b.metadata, groundElevation, b.holes);
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
	groundElevation: number = 0,
	holes?: Coordinate[][]
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
	} else if (roofShape === 'dome' || roofShape === 'sphere' || roofShape === 'onion') {
		const domeCentroid = calculateAreaCentroid(cleanFootprint);
		const radius = calculateAverageRadius(cleanFootprint, domeCentroid);
		const buildingHeight = topHeight - baseHeight;
		roofHeight = Math.min(radius, buildingHeight * 0.5);
	} else if (roofShape === 'round') {
		// Barrel vault: proportional to span but never more than 40% of building height
		const span = calculateInscribedRadius(cleanFootprint, calculateAreaCentroid(cleanFootprint));
		const buildingHeight = topHeight - baseHeight;
		roofHeight = Math.min(Math.max(1, span * 0.4), buildingHeight * 0.4);
	} else if (roofShape === 'cone' || roofShape === 'pyramid') {
		const radius = calculateAverageRadius(cleanFootprint, calculateCentroid(cleanFootprint));
		roofHeight = radius;
	} else if (roofShape !== 'flat') {
		// Auto-calculate default roof height if not plain flat
		const radius = calculateAverageRadius(cleanFootprint, calculateCentroid(cleanFootprint));
		roofHeight = Math.min(3, topHeight - baseHeight, radius);
	}

	// Adjust wall top if roof is purely additive or subtractive?
	// Standard OSM model: 'height' is top of roof. So walls stop at height - roof_height.
	if (roofShape !== 'flat' && roofHeight > 0) {
		wallTopZ = Math.max(baseHeight, topHeight - roofHeight);
	}

	// Clean holes
	const cleanHoles = holes?.map((h) => cleanPolygon(h)).filter((h) => h.length >= 3);

	// 1. Generate Walls (outer + inner hole walls)
	generateWalls(mesh, cleanFootprint, baseHeight, wallTopZ);
	if (cleanHoles) {
		for (const hole of cleanHoles) {
			generateWalls(mesh, hole, baseHeight, wallTopZ);
		}
	}

	// 2. Generate Base Cap (with holes cut out)
	generateCap(mesh, cleanFootprint, baseHeight, true, cleanHoles);

	// 3. Generate Roof
	if (roofShape === 'flat') {
		generateCap(mesh, cleanFootprint, wallTopZ, false, cleanHoles);
	} else {
		// Close building body at wall top (like Rhino's "Cap" command)
		generateCap(mesh, cleanFootprint, wallTopZ, false, cleanHoles);
		generateRoofGeometry(mesh, cleanFootprint, roofShape, wallTopZ, wallTopZ + roofHeight);
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

	let minX = Infinity,
		minY = Infinity,
		maxX = -Infinity,
		maxY = -Infinity;
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
	if (m.minLevel !== undefined) return ground + m.minLevel * 3;
	return ground;
}

function getTopHeight(m: BuildingMetadata, base: number, ground: number): number {
	if (m.height !== undefined) {
		const absHeight = ground + m.height;
		return absHeight > base ? absHeight : base + m.height;
	}
	if (m.levels !== undefined) return base + m.levels * 3;
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

function generateCap(
	mesh: BuildingMesh,
	footprint: Coordinate[],
	z: number,
	reverse: boolean,
	holes?: Coordinate[][]
) {
	const flatCoords: number[] = [];
	for (const p of footprint) flatCoords.push(p.x, p.y);

	// Earcut hole support: append hole vertices and track hole start indices
	const holeIndices: number[] = [];
	if (holes && holes.length > 0) {
		for (const hole of holes) {
			holeIndices.push(flatCoords.length / 2);
			for (const p of hole) flatCoords.push(p.x, p.y);
		}
	}

	const triangles = earcut(flatCoords, holeIndices.length > 0 ? holeIndices : undefined);
	const startIdx = mesh.vertices.length;

	// Add all vertices (outer ring + holes)
	for (const p of footprint) mesh.vertices.push({ x: p.x, y: p.y, z });
	if (holes) {
		for (const hole of holes) {
			for (const p of hole) mesh.vertices.push({ x: p.x, y: p.y, z });
		}
	}

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

function generateRoofGeometry(
	mesh: BuildingMesh,
	footprint: Coordinate[],
	type: string,
	zBase: number,
	zApex: number
) {
	const center = calculateCentroid(footprint);

	// Dome/Sphere/Onion (Hemispherical Cap)
	if (['dome', 'sphere', 'onion'].includes(type)) {
		generateDome(mesh, footprint, center, zBase, zApex);
		return;
	}

	// Barrel Vault / Half-Cylinder (round)
	if (type === 'round') {
		generateBarrelVault(mesh, footprint, center, zBase, zApex);
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

function generateDome(
	mesh: BuildingMesh,
	footprint: Coordinate[],
	center: Coordinate,
	zBase: number,
	zTop: number
) {
	// Average radius for natural dome size
	const domeCenter = calculateAreaCentroid(footprint);
	const radius = calculateAverageRadius(footprint, domeCenter);
	const height = zTop - zBase;
	const latSegments = 8;
	const lonSegments = 16;
	const startIdx = mesh.vertices.length;

	// Apex (North Pole)
	mesh.vertices.push({ x: domeCenter.x, y: domeCenter.y, z: zTop });

	// Rings (lat = 1 to latSegments)
	// lat=0 is the apex, lat=latSegments is the base ring
	for (let lat = 1; lat <= latSegments; lat++) {
		const theta = (lat * (Math.PI / 2)) / latSegments;
		const sinTheta = Math.sin(theta);
		const cosTheta = Math.cos(theta);

		for (let lon = 0; lon < lonSegments; lon++) {
			const phi = (lon * 2 * Math.PI) / lonSegments;
			// Scale XY radius to match the footprint radius horizontally, but keep spherical curve
			const x = domeCenter.x + radius * sinTheta * Math.cos(phi);
			const y = domeCenter.y + radius * sinTheta * Math.sin(phi);
			const z = zBase + height * cosTheta;
			mesh.vertices.push({ x, y, z });
		}
	}

	// Connect faces
	// 1. Apex cap (Triangle fan)
	for (let lon = 0; lon < lonSegments; lon++) {
		const curr = startIdx + 1 + lon;
		const next = startIdx + 1 + ((lon + 1) % lonSegments);
		// CCW winding: Apex, Next, Current (since we look from outside)
		mesh.faces.push([startIdx, next, curr]);
	}

	// 2. Rings
	for (let lat = 1; lat < latSegments; lat++) {
		const ringStart = startIdx + 1 + (lat - 1) * lonSegments;
		const nextRingStart = ringStart + lonSegments;

		for (let lon = 0; lon < lonSegments; lon++) {
			const curr = ringStart + lon;
			const next = ringStart + ((lon + 1) % lonSegments);
			const currBelow = nextRingStart + lon;
			const nextBelow = nextRingStart + ((lon + 1) % lonSegments);

			// Two triangles per quad (CCW winding)
			mesh.faces.push([curr, currBelow, next]);
			mesh.faces.push([next, currBelow, nextBelow]);
		}
	}
}

function generateBarrelVault(
	mesh: BuildingMesh,
	footprint: Coordinate[],
	center: Coordinate,
	zBase: number,
	zTop: number
) {
	const roofHeight = zTop - zBase;
	if (roofHeight < 0.1) return;

	// Find the building's principal axis (longest edge = ridge direction)
	let maxEdgeLen = 0;
	let ridgeDir = { x: 1, y: 0 };
	for (let i = 0; i < footprint.length; i++) {
		const next = (i + 1) % footprint.length;
		const dx = footprint[next].x - footprint[i].x;
		const dy = footprint[next].y - footprint[i].y;
		const len = Math.sqrt(dx * dx + dy * dy);
		if (len > maxEdgeLen) {
			maxEdgeLen = len;
			ridgeDir = { x: dx / len, y: dy / len };
		}
	}
	// Span direction (perpendicular to ridge)
	const spanDir = { x: -ridgeDir.y, y: ridgeDir.x };

	// Project all footprint vertices onto oriented axes
	let minRidge = Infinity,
		maxRidge = -Infinity;
	let minSpan = Infinity,
		maxSpan = -Infinity;
	for (const p of footprint) {
		const rProj = (p.x - center.x) * ridgeDir.x + (p.y - center.y) * ridgeDir.y;
		const sProj = (p.x - center.x) * spanDir.x + (p.y - center.y) * spanDir.y;
		if (rProj < minRidge) minRidge = rProj;
		if (rProj > maxRidge) maxRidge = rProj;
		if (sProj < minSpan) minSpan = sProj;
		if (sProj > maxSpan) maxSpan = sProj;
	}

	const halfSpan = (maxSpan - minSpan) / 2;
	const spanCenter = (minSpan + maxSpan) / 2;

	// Half-cylinder: two semicircular arch profiles connected with quads
	const archSegments = 12;
	const startIdx = mesh.vertices.length;
	const vps = archSegments + 1;

	for (const ridgePos of [minRidge, maxRidge]) {
		for (let i = 0; i <= archSegments; i++) {
			const angle = (i / archSegments) * Math.PI;
			const spanOffset = spanCenter + halfSpan * Math.cos(angle);
			const z = zBase + roofHeight * Math.sin(angle);

			const x = center.x + ridgeDir.x * ridgePos + spanDir.x * spanOffset;
			const y = center.y + ridgeDir.y * ridgePos + spanDir.y * spanOffset;
			mesh.vertices.push({ x, y, z });
		}
	}

	// Curved barrel surface
	for (let i = 0; i < archSegments; i++) {
		const a0 = startIdx + i;
		const a1 = startIdx + i + 1;
		const b0 = startIdx + vps + i;
		const b1 = startIdx + vps + i + 1;
		mesh.faces.push([a0, b0, a1]);
		mesh.faces.push([a1, b0, b1]);
	}

	// Gable walls (semicircular end caps)
	for (let section = 0; section < 2; section++) {
		const sectionStart = startIdx + section * vps;
		const baseCenterIdx = mesh.vertices.length;
		const ridgePos = section === 0 ? minRidge : maxRidge;
		mesh.vertices.push({
			x: center.x + ridgeDir.x * ridgePos + spanDir.x * spanCenter,
			y: center.y + ridgeDir.y * ridgePos + spanDir.y * spanCenter,
			z: zBase
		});

		for (let i = 0; i < archSegments; i++) {
			if (section === 0) {
				mesh.faces.push([baseCenterIdx, sectionStart + i + 1, sectionStart + i]);
			} else {
				mesh.faces.push([baseCenterIdx, sectionStart + i, sectionStart + i + 1]);
			}
		}
	}
}

function generateVolumetricMesh(
	footprint: Coordinate[],
	shape: string,
	zBottom: number,
	zTop: number
): BuildingMesh {
	// Sphere, Cone, Pyramid
	const mesh: BuildingMesh = { vertices: [], faces: [] };
	const center = calculateCentroid(footprint);
	const radius = calculateAverageRadius(footprint, center);

	if (shape === 'sphere') {
		// Full sphere
		const latSegments = 16;
		const lonSegments = 24;
		const r = radius; // ALWAYS use footprint radius for a perfect sphere, ignoring arbitrary flat heights
		const zCenter = zBottom + r;
		const startIdx = 0;

		// North Pole (Apex)
		mesh.vertices.push({ x: center.x, y: center.y, z: zCenter + r });

		// Rings
		for (let lat = 1; lat < latSegments; lat++) {
			const theta = (lat * Math.PI) / latSegments;
			const sinTheta = Math.sin(theta);
			const cosTheta = Math.cos(theta);

			for (let lon = 0; lon < lonSegments; lon++) {
				const phi = (lon * 2 * Math.PI) / lonSegments;
				const x = center.x + r * sinTheta * Math.cos(phi);
				const y = center.y + r * sinTheta * Math.sin(phi);
				const z = zCenter + r * cosTheta; // Note: using cosTheta from +Z to -Z, but wait! we want bottom to be zBottom.
				// For lat=1 (near north pole), theta is small, cosTheta is ~1. z = zCenter + r.
				// Since we want Z to match original bounding, we should stick to standard logic:
				mesh.vertices.push({ x, y, z });
			}
		}

		// South Pole (Bottom)
		const bottomIdx = mesh.vertices.length;
		mesh.vertices.push({ x: center.x, y: center.y, z: zCenter - r });

		// Connect Faces
		// 1. North Pole Cap (CCW)
		for (let lon = 0; lon < lonSegments; lon++) {
			const curr = startIdx + 1 + lon;
			const next = startIdx + 1 + ((lon + 1) % lonSegments);
			mesh.faces.push([startIdx, curr, next]);
		}

		// 2. Rings
		for (let lat = 1; lat < latSegments - 1; lat++) {
			const ringStart = startIdx + 1 + (lat - 1) * lonSegments;
			const nextRingStart = ringStart + lonSegments;

			for (let lon = 0; lon < lonSegments; lon++) {
				const curr = ringStart + lon;
				const next = ringStart + ((lon + 1) % lonSegments);
				const currBelow = nextRingStart + lon;
				const nextBelow = nextRingStart + ((lon + 1) % lonSegments);

				mesh.faces.push([curr, currBelow, next]);
				mesh.faces.push([next, currBelow, nextBelow]);
			}
		}

		// 3. South Pole Cap (CCW)
		const lastRingStart = startIdx + 1 + (latSegments - 2) * lonSegments;
		for (let lon = 0; lon < lonSegments; lon++) {
			const curr = lastRingStart + lon;
			const next = lastRingStart + ((lon + 1) % lonSegments);
			mesh.faces.push([bottomIdx, next, curr]);
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
	let sx = 0,
		sy = 0;
	for (const p of polygon) {
		sx += p.x;
		sy += p.y;
	}
	return { x: sx / polygon.length, y: sy / polygon.length };
}

function calculateAverageRadius(polygon: Coordinate[], center: Coordinate): number {
	let sum = 0;
	for (const p of polygon) sum += Math.sqrt(distSq(p, center));
	return sum / polygon.length;
}

function calculateInscribedRadius(polygon: Coordinate[], center: Coordinate): number {
	// Perpendicular distance from center to the nearest edge (= inscribed circle radius)
	let minDist = Infinity;
	for (let i = 0; i < polygon.length; i++) {
		const j = (i + 1) % polygon.length;
		const dx = polygon[j].x - polygon[i].x;
		const dy = polygon[j].y - polygon[i].y;
		const edgeLen = Math.sqrt(dx * dx + dy * dy);
		if (edgeLen < 1e-10) continue;
		const dist =
			Math.abs((center.x - polygon[i].x) * dy - (center.y - polygon[i].y) * dx) / edgeLen;
		if (dist < minDist) minDist = dist;
	}
	return minDist === Infinity ? 0 : minDist;
}

function calculateAreaCentroid(polygon: Coordinate[]): Coordinate {
	let cx = 0,
		cy = 0,
		signedArea = 0;
	const n = polygon.length;
	for (let i = 0; i < n; i++) {
		const j = (i + 1) % n;
		const cross = polygon[i].x * polygon[j].y - polygon[j].x * polygon[i].y;
		cx += (polygon[i].x + polygon[j].x) * cross;
		cy += (polygon[i].y + polygon[j].y) * cross;
		signedArea += cross;
	}
	signedArea /= 2;
	if (Math.abs(signedArea) < 1e-10) return calculateCentroid(polygon); // Degenerate fallback
	cx /= 6 * signedArea;
	cy /= 6 * signedArea;
	return { x: cx, y: cy };
}
