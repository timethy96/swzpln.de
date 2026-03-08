import type {
	Bounds,
	Coordinate,
	GeometryObject,
	OSMData,
	ProgressCallback,
	BuildingMetadata,
	OSMRelation
} from '../types';
import { classifyTags, isUnderground } from '../layers';
import { latLngToXY } from '../geometry/coordinates';
import * as m from '$lib/paraglide/messages';
import type { Layer } from '$lib/schwarzplan/types';
import { convertAndMergeRoads } from '../roads';

type ParsedWay = {
	layer: Layer | null;
	nodes: number[];
	tags?: Record<string, string>;
	relationId?: number;
	isOutline?: boolean;
};

// --- Main Export ---

export function osmDataToGeometry(
	osmData: OSMData,
	bounds: Bounds,
	onProgress?: ProgressCallback
): GeometryObject[] {
	notify(onProgress, 0, m.progress_osm_parse());

	// 1. Index Elements
	const { nodes, ways, relations } = indexElements(osmData, bounds);

	const geometryObjects: GeometryObject[] = [];

	// 2. Process Relations (Building parts grouping & Multipolygon stitching)
	for (const rel of relations) {
		const result = processRelation(rel, ways, nodes);
		if (result) geometryObjects.push(...result);
	}

	// 3. Process Ways (Standard geometry)
	const linearLayers = ['highway', 'railway', 'waterway'];
	const linearSegments: Map<string, Coordinate[][]> = new Map();

	const wayObjects = Array.from(ways.values())
		.filter(w => w.layer !== null) // Skip suppressed ways
		.map(w => {
			// If it's a linear layer, we buffer it for stitching
			if (linearLayers.includes(w.layer!) && !w.tags?.area) {
				// If special highway type (e.g. roundabout), maybe keep separate?
				// But for standard plan viewing, stitching is better.
				// We group by "layer" + "highwayType" (if available) to not stitch unrelated things?
				// Actually, just layer might be enough, but usually we want to stitch segments of same type.
				// For simplicity, let's stitch per layer.
				// Or maybe per layer+type? e.g. primary road with primary road.
				const key = w.layer + (w.tags?.highway ? `:${w.tags.highway}` : '');

				const coords = getWayCoords(w, nodes);
				if (coords.length > 1) {
					if (!linearSegments.has(key)) linearSegments.set(key, []);
					linearSegments.get(key)!.push(coords);
				}
				return null; // Deferred
			}

			return createWayObject(w, nodes);
		})
		.filter((o): o is GeometryObject => o !== null);

	geometryObjects.push(...wayObjects);

	// 4. Process Stitched Linear Segments
	for (const [key, segments] of linearSegments) {
		const [layer, type] = key.split(':');
		// Highways are not "closedOnly", so we pass false
		const stitched = stitchWays(segments, false);

		for (const path of stitched) {
			geometryObjects.push({
				type: layer as any,
				path,
				highwayType: type
			});
		}
	}

	notify(onProgress, 95, `Merging roads...`);

	// 5. Buffer and Union Roads
	// This converts linear highways into buffered polygons and merges adjacent ones
	const mergedObjects = convertAndMergeRoads(geometryObjects);

	notify(onProgress, 98, 'Resolving 3D building parts...');

	// 6. Resolve Building Outlines vs Parts via Spatial Containment
	const buildings = mergedObjects.filter(o => o.type === 'building' && o.buildingMetadata);
	const parts = buildings.filter(b => b.buildingMetadata!.isPart);
	const potentialOutlines = buildings.filter(b => !b.buildingMetadata!.isPart && !b.isOutline);

	for (const outline of potentialOutlines) {
		const outlineBBox = getBBox(outline.path);

		for (const part of parts) {
			const partBBox = getBBox(part.path);
			if (bboxIntersect(outlineBBox, partBBox)) {
				const centroid = calculateCentroid(part.path);
				if (isPointInPolygon(centroid, outline.path)) {
					// Don't let parts from other building relations suppress this outline
					if (part.relationId && outline.relationId && part.relationId !== outline.relationId) continue;

					// Only suppress outline if the part has a meaningful 3D body.
					// Dome-only parts (height == roofHeight, no levels) are roof decorations,
					// not full building replacements — they shouldn't suppress the outline.
					const partMeta = part.buildingMetadata;
					if (!partMeta) continue;
					const hasBody = (partMeta.height && partMeta.height > (partMeta.roofHeight || 0)) || !!partMeta.levels;
					if (!hasBody) continue;

					outline.isOutline = true;

					// Group them so they share base elevation
					if (!part.relationId) {
						// Create a pseudo relation ID
						const pseudoId = outline.relationId || Math.floor(Math.random() * -1000000);
						outline.relationId = pseudoId;
						part.relationId = pseudoId;
					} else if (!outline.relationId) {
						outline.relationId = part.relationId;
					}


					// Continue checking other parts in this outline
				}
			}
		}
	}

	notify(onProgress, 100, `Done: ${mergedObjects.length} objects`);
	return mergedObjects;
}

// --- Indexing ---

function indexElements(osmData: OSMData, bounds: Bounds) {
	const nodes = new Map<number, Coordinate>();
	const ways = new Map<number, ParsedWay>();
	const relations: OSMRelation[] = [];

	for (const el of osmData.elements) {
		if (el.type === 'node') {
			nodes.set(el.id, latLngToXY(bounds, el.lat, el.lon));
		} else if (el.type === 'way') {
			ways.set(el.id, {
				layer: resolveLayer(classifyTags(el.tags)),
				nodes: el.nodes,
				tags: el.tags
			});
		} else if (el.type === 'relation') {
			relations.push(el);
		}
	}
	return { nodes, ways, relations };
}

// --- Relation Processing ---

function processRelation(
	rel: OSMRelation,
	ways: Map<number, ParsedWay>,
	nodes: Map<number, Coordinate>
): GeometryObject[] | null {
	const layer = classifyTags(rel.tags);

	// A. Building Relations (Group parts) — skip if underground
	if ((layer === 'building' || rel.tags?.building) && !isUnderground(rel.tags || {})) {
		linkBuildingParts(rel, ways);
		// Fall through: A building relation might also define geometry (e.g. outline/multipolygon)
	}

	// B. Multipolygon Geometry (Stitching)
	if (layer && rel.tags?.type === 'multipolygon') {
		return createMultipolygonObjects(rel, layer, ways, nodes);
	}

	return null;
}

function linkBuildingParts(rel: OSMRelation, ways: Map<number, ParsedWay>) {
	let hasParts = false;
	for (const member of rel.members) {
		if (member.type !== 'way') continue;
		const way = ways.get(member.ref);
		if (way?.tags?.['building:part'] && way.tags['building:part'] !== 'no' && !isUnderground(way.tags)) {
			hasParts = true;
			way.relationId = rel.id;
			way.layer = 'building';
		}
	}

	if (hasParts) {
		for (const member of rel.members) {
			if (member.type !== 'way') continue;
			const way = ways.get(member.ref);
			if (way && (member.role === 'outline' || !way.tags?.['building:part'] || way.tags['building:part'] === 'no')) {
				way.isOutline = true;
				// Also group the outline with the relation so it belongs to the same building
				way.relationId = rel.id;
			}
		}
	}
}

function createMultipolygonObjects(
	rel: OSMRelation,
	layer: Layer,
	ways: Map<number, ParsedWay>,
	nodes: Map<number, Coordinate>
): GeometryObject[] {
	const outerWays: Coordinate[][] = [];
	const innerWays: Coordinate[][] = [];

	for (const member of rel.members) {
		if (member.type !== 'way') continue;
		const way = ways.get(member.ref);
		if (!way) continue;

		const coords = getWayCoords(way, nodes);
		if (coords.length < 2) continue;

		if (member.role === 'outer') outerWays.push(coords);
		else if (member.role === 'inner') innerWays.push(coords);

		// Suppress member drawing if it matches parent layer to avoid dupes
		if (way.layer === layer) way.layer = null;
	}

	if (outerWays.length === 0) return [];

	const stitchedOuter = stitchWays(outerWays);
	const stitchedInner = stitchWays(innerWays);
	const buildingMeta = layer === 'building' ? extractBuildingMetadata(rel.tags) : undefined;

	// Assign holes to containing outer rings
	return stitchedOuter.map(poly => {
		const holes = stitchedInner.filter(hole => isPointInPolygon(hole[0], poly));

		const obj: GeometryObject = {
			type: layer,
			path: poly,
			relationId: rel.id,
			holes
		};
		if (buildingMeta) {
			obj.buildingMetadata = buildingMeta;
			if (rel.tags) obj.tags = rel.tags;
		}
		return obj;
	});
}

// --- Way Processing ---

function createWayObject(way: ParsedWay, nodes: Map<number, Coordinate>): GeometryObject | null {
	const path = getWayCoords(way, nodes);
	if (path.length === 0) return null;

	const obj: GeometryObject = {
		type: way.layer!, // Checked before calling
		path,
		highwayType: way.tags?.highway,
		relationId: way.relationId,
		isOutline: way.isOutline
	};

	if (way.layer === 'building') {
		obj.buildingMetadata = extractBuildingMetadata(way.tags);
		if (way.tags) obj.tags = way.tags;
	}

	return obj;
}

function getWayCoords(way: ParsedWay, nodes: Map<number, Coordinate>): Coordinate[] {
	return way.nodes
		.map(id => nodes.get(id))
		.filter((c): c is Coordinate => c !== undefined);
}

// --- Geometry Helpers ---

/** 
 * Stitches segments into closed polygons. 
 * Greedy endpoint matching. 
 */
/** 
 * Stitches segments into combined paths.
 * Supports both closed rings and open linear chains.
 */
function stitchWays(segments: Coordinate[][], closedOnly: boolean = false): Coordinate[][] {
	const policies: Coordinate[][] = [];
	const pool = [...segments];

	while (pool.length > 0) {
		const ring = [...pool.shift()!];
		let changed = true;

		// Grow path until closed or no matches found
		while (changed) {
			changed = false;
			const start = ring[0];
			const end = ring[ring.length - 1];

			if (pointsEqual(start, end)) break; // Closed

			for (let i = 0; i < pool.length; i++) {
				const seg = pool[i];
				const sStart = seg[0];
				const sEnd = seg[seg.length - 1];

				if (pointsEqual(end, sStart)) {
					ring.push(...seg.slice(1));
				} else if (pointsEqual(end, sEnd)) {
					ring.push(...seg.slice(0, -1).reverse());
				} else if (pointsEqual(start, sEnd)) {
					ring.unshift(...seg.slice(0, -1));
				} else if (pointsEqual(start, sStart)) {
					ring.unshift(...seg.slice(1).reverse());
				} else {
					continue;
				}

				pool.splice(i, 1);
				changed = true;
				break;
			}
		}

		if (!closedOnly || pointsEqual(ring[0], ring[ring.length - 1])) {
			if (ring.length > 1) policies.push(ring);
		}
	}
	return policies;
}

function pointsEqual(a: Coordinate, b: Coordinate): boolean {
	return Math.abs(a.x - b.x) < 1e-6 && Math.abs(a.y - b.y) < 1e-6;
}

function isPointInPolygon(p: Coordinate, polygon: Coordinate[]): boolean {
	let inside = false;
	for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
		const xi = polygon[i].x, yi = polygon[i].y;
		const xj = polygon[j].x, yj = polygon[j].y;

		const intersect = ((yi > p.y) !== (yj > p.y)) &&
			(p.x < (xj - xi) * (p.y - yi) / (yj - yi) + xi);
		if (intersect) inside = !inside;
	}
	return inside;
}

// --- Utils ---

function resolveLayer(layer: Layer | null): Layer | null {
	return layer === 'building_parts' ? 'building' : layer;
}

function notify(cb: ProgressCallback | undefined, percent: number, message: string) {
	cb?.({ step: 'osm-parse', percent, message });
}

function extractBuildingMetadata(tags?: Record<string, string>): BuildingMetadata | undefined {
	if (!tags) return undefined;
	if (!tags.building && (!tags['building:part'] || tags['building:part'] === 'no')) return undefined;

	const getVal = (k: string) => parseFloat(tags[k]);

	const meta: BuildingMetadata = {
		height: getVal('height') || undefined,
		levels: getVal('building:levels') || undefined,
		minHeight: getVal('min_height') || undefined,
		minLevel: getVal('building:min_level') || undefined,
		roofHeight: getVal('roof:height') || undefined,
		roofLevels: getVal('roof:levels') || undefined,
		roofShape: tags['roof:shape'],
		shape: ['sphere', 'cone', 'pyramid', 'cylinder'].includes(tags['building:shape'] || '')
			? tags['building:shape']
			: undefined,
		isPart: (tags['building:part'] && tags['building:part'] !== 'no' && !tags.building) ? true : undefined
	};

	// Clean undefined keys
	Object.keys(meta).forEach(key => (meta as any)[key] === undefined && delete (meta as any)[key]);

	// Defaults if missing
	if (!meta.height && !meta.levels && (!tags['building:part'] || tags['building:part'] === 'no')) {
		meta.height = 10;
		meta.levels = 3;
	} else if (meta.levels && !meta.height) {
		meta.height = meta.levels * 3;
	}
	if (meta.minLevel && !meta.minHeight) {
		meta.minHeight = meta.minLevel * 3;
	}

	// Infer height from roof:height for parts that only specify a roof (e.g. dome with roof:height=42)
	if (!meta.height && !meta.levels && meta.roofHeight) {
		meta.height = (meta.minHeight || 0) + meta.roofHeight;
	}

	return Object.keys(meta).length > 0 ? meta : undefined;
}

interface BBox {
	minX: number;
	minY: number;
	maxX: number;
	maxY: number;
}

function getBBox(polygon: Coordinate[]): BBox {
	let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
	for (const p of polygon) {
		if (p.x < minX) minX = p.x;
		if (p.x > maxX) maxX = p.x;
		if (p.y < minY) minY = p.y;
		if (p.y > maxY) maxY = p.y;
	}
	return { minX, minY, maxX, maxY };
}

function bboxIntersect(a: BBox, b: BBox): boolean {
	return a.minX <= b.maxX && a.maxX >= b.minX && a.minY <= b.maxY && a.maxY >= b.minY;
}

function calculateCentroid(polygon: Coordinate[]): Coordinate {
	let sx = 0, sy = 0;
	if (polygon.length === 0) return { x: 0, y: 0 };
	const len = pointsEqual(polygon[0], polygon[polygon.length - 1]) ? polygon.length - 1 : polygon.length;
	const count = len > 0 ? len : polygon.length;
	for (let i = 0; i < count; i++) {
		sx += polygon[i].x;
		sy += polygon[i].y;
	}
	return { x: sx / count, y: sy / count };
}
