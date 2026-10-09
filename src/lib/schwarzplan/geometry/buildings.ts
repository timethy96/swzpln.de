import type {
	Coordinate,
	Coordinate3D,
	BuildingMetadata,
	BuildingMesh,
	GeometryObject
} from '../types';
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

	// If every part in a group starts above ground level, the outline is needed to fill
	// in the missing base (e.g. buildings where all parts have min_height > 0).
	for (const [relationId, group] of groups) {
		const allPartsElevated = group.every(
			(p) => (p.metadata.minHeight ?? (p.metadata.minLevel ?? 0) * 3) > 0
		);
		if (allPartsElevated) {
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

// --- Bäume (Low-Poly: vierkantiger Stamm + sechseckige Doppelpyramide als Krone) ---

const TREE_SIDES = 6;
const DEFAULT_TREE_HEIGHT = 10; // m

/**
 * Alle Bäume (type 'tree') als ein gemeinsames Mesh, 20 Dreiecke je Baum.
 * Höhe aus dem height-Tag, sonst 10 m.
 */
export function generateTrees(
	objects: GeometryObject[],
	terrainMesh?: { vertices: Coordinate3D[] },
	gridSize?: { rows: number; cols: number },
	maxXY?: { x: number; y: number }
): BuildingMesh {
	const mesh: BuildingMesh = { vertices: [], faces: [] };
	for (const tree of objects) {
		if (tree.type !== 'tree' || !tree.radius) continue;
		const c = tree.path[0];
		const r = tree.radius;
		const h = parseFloat(tree.tags?.height ?? '') || DEFAULT_TREE_HEIGHT;
		const z0 = getGroundElevation([c], terrainMesh, gridSize, maxXY);

		// Stamm bis in die Krone hinein
		const t = Math.max(0.15, r * 0.08);
		const trunk = [-1, 1, 1, -1].map((sx, i) => ({ x: c.x + sx * t, y: c.y + (i < 2 ? -t : t) }));
		generateWalls(mesh, trunk, z0, z0 + h * 0.4);

		// Krone: Ring auf 60 % der Höhe, Spitzen oben und auf 30 %
		const s = mesh.vertices.length;
		for (let i = 0; i < TREE_SIDES; i++) {
			const a = (i * 2 * Math.PI) / TREE_SIDES;
			mesh.vertices.push({ x: c.x + r * Math.cos(a), y: c.y + r * Math.sin(a), z: z0 + h * 0.6 });
		}
		const top = mesh.vertices.length;
		mesh.vertices.push({ x: c.x, y: c.y, z: z0 + h }, { x: c.x, y: c.y, z: z0 + h * 0.3 });
		for (let i = 0; i < TREE_SIDES; i++) {
			const curr = s + i;
			const next = s + ((i + 1) % TREE_SIDES);
			mesh.faces.push([curr, next, top]);
			mesh.faces.push([next, curr, top + 1]);
		}
	}
	return mesh;
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

	// Sattel- und Tonnendach: Firstlage aus Grundriss bzw. roof:direction/roof:orientation
	const profile = ROOF_PROFILES[roofShape];
	const frame = profile ? getRoofFrame(cleanFootprint, metadata) : undefined;
	const halfSpan = frame ? (frame.vMax - frame.vMin) / 2 : 0;

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
		const buildingHeight = topHeight - baseHeight;
		roofHeight = Math.min(Math.max(1, halfSpan * 0.4), buildingHeight * 0.4);
	} else if (roofShape === 'cone' || roofShape === 'pyramid') {
		const radius = calculateAverageRadius(cleanFootprint, calculateCentroid(cleanFootprint));
		roofHeight = radius;
	} else if (roofShape !== 'flat') {
		// Auto-calculate default roof height if not plain flat
		const radius = calculateAverageRadius(cleanFootprint, calculateCentroid(cleanFootprint));
		roofHeight = Math.min(3, topHeight - baseHeight, radius);
	}

	// Dach nie höher als das Gebäude, ein Tonnendach nie höher als ein Halbkreis über der Spannweite
	roofHeight = Math.min(roofHeight, topHeight - baseHeight);
	if (roofShape === 'round') roofHeight = Math.min(roofHeight, halfSpan);

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
		if (profile && frame) {
			// ponytail: Innenhöfe (holes) werden vom Dach überdeckt, wie bisher
			generateProfileRoof(mesh, cleanFootprint, frame, profile, wallTopZ, roofHeight);
		} else {
			generateRoofGeometry(mesh, cleanFootprint, roofShape, wallTopZ, wallTopZ + roofHeight);
		}
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

// --- Satteldach / Tonnendach (Profil quer zum First) ---

// Dachprofile quer zum First: t läuft von -1 (Traufe) über 0 (First) bis 1 (Traufe),
// h ist der Anteil der Dachhöhe. Zwischen den Stützstellen ist das Dach eben.
interface RoofProfile {
	t: number[];
	h: number[];
}

const ROUND_SEGMENTS = 12;
const ROOF_PROFILES: Record<string, RoofProfile> = {
	round: {
		t: Array.from(
			{ length: ROUND_SEGMENTS + 1 },
			(_, i) => -Math.cos((i * Math.PI) / ROUND_SEGMENTS)
		),
		h: Array.from({ length: ROUND_SEGMENTS + 1 }, (_, i) =>
			Math.sin((i * Math.PI) / ROUND_SEGMENTS)
		)
	},
	gabled: { t: [-1, 0, 1], h: [0, 1, 0] }
};

// Lage des Firsts: ridge = Firstrichtung, span = quer dazu, vMin/vMax = Ausdehnung quer zum First
export interface RoofFrame {
	origin: Coordinate;
	ridge: Coordinate;
	span: Coordinate;
	vMin: number;
	vMax: number;
}

export function getRoofFrame(footprint: Coordinate[], metadata: BuildingMetadata): RoofFrame {
	let ridge = longAxis(footprint);
	if (metadata.roofDirection !== undefined) {
		// roof:direction zeigt hangabwärts (0° = Nord, im Uhrzeigersinn), der First liegt quer dazu
		const a = (metadata.roofDirection * Math.PI) / 180;
		ridge = { x: Math.cos(a), y: -Math.sin(a) };
	} else if (metadata.roofOrientation === 'across') {
		ridge = { x: -ridge.y, y: ridge.x };
	}
	const span = { x: -ridge.y, y: ridge.x };
	const origin = footprint[0];
	let vMin = Infinity;
	let vMax = -Infinity;
	for (const p of footprint) {
		const v = (p.x - origin.x) * span.x + (p.y - origin.y) * span.y;
		vMin = Math.min(vMin, v);
		vMax = Math.max(vMax, v);
	}
	return { origin, ridge, span, vMin, vMax };
}

type RoofPoint = { x: number; y: number; t: number };

function generateProfileRoof(
	mesh: BuildingMesh,
	footprint: Coordinate[],
	frame: RoofFrame,
	profile: RoofProfile,
	zBase: number,
	roofHeight: number
) {
	if (roofHeight < 0.1 || frame.vMax - frame.vMin < EPSILON) return;
	const { origin, span, vMin, vMax } = frame;
	const ring: RoofPoint[] = footprint.map((p) => ({
		x: p.x,
		y: p.y,
		t: (2 * ((p.x - origin.x) * span.x + (p.y - origin.y) * span.y - vMin)) / (vMax - vMin) - 1
	}));
	const zOf = (t: number) => zBase + roofHeight * profileAt(profile, t);

	// 1. Dachfläche: Grundriss in Streifen zwischen den Profilknicken schneiden.
	//    Je Streifen ist das Dach eben, so folgt es jedem Grundriss (auch L-Formen, Kurven).
	for (let k = 0; k < profile.t.length - 1; k++) {
		const strip = clipAt(clipAt(ring, profile.t[k], true), profile.t[k + 1], false);
		if (strip.length < 3) continue;
		const startIdx = mesh.vertices.length;
		const flat: number[] = [];
		for (const p of strip) {
			mesh.vertices.push({ x: p.x, y: p.y, z: zOf(p.t) });
			flat.push(p.x, p.y);
		}
		const tri = earcut(flat);
		for (let i = 0; i < tri.length; i += 3) {
			mesh.faces.push([startIdx + tri[i], startIdx + tri[i + 1], startIdx + tri[i + 2]]);
		}
	}

	// 2. Wände zwischen Traufhöhe und Dach (Giebel); Kanten an den Profilknicken teilen
	const dense: RoofPoint[] = [];
	for (let i = 0; i < ring.length; i++) {
		const a = ring[i];
		const b = ring[(i + 1) % ring.length];
		dense.push(a);
		const cuts = profile.t.filter((t) => t > Math.min(a.t, b.t) && t < Math.max(a.t, b.t));
		if (a.t > b.t) cuts.reverse();
		for (const t of cuts) dense.push(pointAt(a, b, t));
	}
	for (let i = 0; i < dense.length; i++) {
		const a = dense[i];
		const b = dense[(i + 1) % dense.length];
		const za = zOf(a.t);
		const zb = zOf(b.t);
		if (Math.max(za, zb) - zBase < 0.01) continue;
		const s = mesh.vertices.length;
		mesh.vertices.push(
			{ x: a.x, y: a.y, z: zBase },
			{ x: a.x, y: a.y, z: za },
			{ x: b.x, y: b.y, z: zBase },
			{ x: b.x, y: b.y, z: zb }
		);
		mesh.faces.push([s, s + 2, s + 1]);
		mesh.faces.push([s + 2, s + 3, s + 1]);
	}
}

function profileAt(profile: RoofProfile, t: number): number {
	const { t: ts, h } = profile;
	let i = 1;
	while (i < ts.length - 1 && t > ts[i]) i++;
	const s = Math.min(1, Math.max(0, (t - ts[i - 1]) / (ts[i] - ts[i - 1])));
	return h[i - 1] + s * (h[i] - h[i - 1]);
}

// Sutherland-Hodgman an der Geraden t = bound (above: Teil mit t >= bound behalten)
function clipAt(poly: RoofPoint[], bound: number, above: boolean): RoofPoint[] {
	const inside = (p: RoofPoint) => (above ? p.t >= bound : p.t <= bound);
	const out: RoofPoint[] = [];
	for (let i = 0; i < poly.length; i++) {
		const a = poly[i];
		const b = poly[(i + 1) % poly.length];
		if (inside(a)) out.push(a);
		if (inside(a) !== inside(b)) out.push(pointAt(a, b, bound));
	}
	return out;
}

function pointAt(a: RoofPoint, b: RoofPoint, t: number): RoofPoint {
	const s = (t - a.t) / (b.t - a.t);
	return { x: a.x + s * (b.x - a.x), y: a.y + s * (b.y - a.y), t };
}

// Längsachse des flächenkleinsten umschließenden Rechtecks. Anders als die längste Kante
// ist sie unabhängig davon, in wie viele Stücke die Längsseiten zerlegt sind.
function longAxis(polygon: Coordinate[]): Coordinate {
	const hull = convexHull(polygon);
	let bestArea = Infinity;
	let axis = { x: 1, y: 0 };
	for (let i = 0; i < hull.length; i++) {
		const a = hull[i];
		const b = hull[(i + 1) % hull.length];
		const len = Math.hypot(b.x - a.x, b.y - a.y);
		if (len < 1e-9) continue;
		const u = { x: (b.x - a.x) / len, y: (b.y - a.y) / len };
		let uMin = Infinity,
			uMax = -Infinity,
			nMin = Infinity,
			nMax = -Infinity;
		for (const p of hull) {
			const pu = p.x * u.x + p.y * u.y;
			const pn = -p.x * u.y + p.y * u.x;
			uMin = Math.min(uMin, pu);
			uMax = Math.max(uMax, pu);
			nMin = Math.min(nMin, pn);
			nMax = Math.max(nMax, pn);
		}
		const area = (uMax - uMin) * (nMax - nMin);
		if (area < bestArea - 1e-9) {
			bestArea = area;
			axis = uMax - uMin >= nMax - nMin ? u : { x: -u.y, y: u.x };
		}
	}
	return axis;
}

function convexHull(points: Coordinate[]): Coordinate[] {
	const pts = [...points].sort((a, b) => a.x - b.x || a.y - b.y);
	const cross = (o: Coordinate, a: Coordinate, b: Coordinate) =>
		(a.x - o.x) * (b.y - o.y) - (a.y - o.y) * (b.x - o.x);
	const half = (list: Coordinate[]) => {
		const h: Coordinate[] = [];
		for (const p of list) {
			while (h.length >= 2 && cross(h[h.length - 2], h[h.length - 1], p) <= 0) h.pop();
			h.push(p);
		}
		h.pop();
		return h;
	};
	return half(pts).concat(half(pts.reverse()));
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
