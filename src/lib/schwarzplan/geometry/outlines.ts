// Shared building outline resolution logic
// Resolves building outlines vs parts via spatial containment

import type { Coordinate, GeometryObject, BuildingMetadata } from '../types';

/**
 * Resolve building outlines vs parts via spatial containment.
 * Marks buildings as outlines when they contain building parts with meaningful 3D bodies.
 * Mutates the objects in place.
 */
export function resolveBuildingOutlines(objects: GeometryObject[]): void {
	const buildings = objects.filter((o) => o.type === 'building' && o.buildingMetadata);
	const parts = buildings.filter((b) => b.buildingMetadata!.isPart);
	const potentialOutlines = buildings.filter((b) => !b.buildingMetadata!.isPart && !b.isOutline);

	// Process smallest outlines first so the tightest-fitting polygon claims its parts before
	// a larger enclosing building can steal them.
	potentialOutlines.sort((a, b) => polygonArea(a.path) - polygonArea(b.path));

	for (const outline of potentialOutlines) {
		const outlineBBox = getBBox(outline.path);

		// Pass 1: collect all contained parts, split into body parts and roof-only parts.
		const bodyParts: GeometryObject[] = [];
		const roofOnlyParts: GeometryObject[] = [];

		for (const part of parts) {
			const partBBox = getBBox(part.path);
			if (!bboxIntersect(outlineBBox, partBBox)) continue;

			const centroid = calculateCentroid(part.path);
			if (!isPointInPolygon(centroid, outline.path)) continue;

			// Once a part is linked to any relation, don't let a different outline steal it.
			if (part.relationId && part.relationId !== outline.relationId) continue;

			const partMeta = part.buildingMetadata;
			if (!partMeta) continue;
			const hasBody =
				(partMeta.height && partMeta.height > (partMeta.roofHeight || 0)) || !!partMeta.levels;

			if (hasBody) {
				bodyParts.push(part);
			} else {
				roofOnlyParts.push(part);
			}
		}

		const allContained = [...bodyParts, ...roofOnlyParts];
		if (allContained.length === 0) continue;

		// Pass 2: only suppress the outline when body parts collectively cover a
		// significant portion of its footprint.  A single small decorative part
		// (dome base, tower) should not hide an entire building.
		const outlineArea = polygonArea(outline.path);
		const bodyArea = bodyParts.reduce((sum, p) => sum + polygonArea(p.path), 0);
		const shouldSuppress = outlineArea > 0 && bodyArea / outlineArea >= 0.3;

		if (shouldSuppress) {
			outline.isOutline = true;
		}

		// Group all contained parts with the outline so they share base elevation.
		const groupId = outline.relationId || Math.floor(Math.random() * -1000000);
		outline.relationId = groupId;
		for (const part of allContained) {
			if (!part.relationId) {
				part.relationId = groupId;
			}
		}

		// For roof-only parts inside an unsuppressed outline, place them on top of the
		// outline rather than at ground level (their OSM data typically lacks min_height).
		if (!shouldSuppress) {
			const outlineHeight = outline.buildingMetadata?.height;
			if (outlineHeight) {
				for (const part of roofOnlyParts) {
					const meta = part.buildingMetadata!;
					if (meta.minHeight == null) {
						meta.minHeight = outlineHeight;
						// Recalculate total height to include the new base
						if (meta.roofHeight && meta.height != null) {
							meta.height = outlineHeight + meta.roofHeight;
						}
					}
				}
			}
		}
	}
}

/**
 * Extract BuildingMetadata from PostGIS column values.
 * Applies the same defaults as the OSM converter.
 */
export function buildMetadataFromColumns(props: {
	height?: number | null;
	min_height?: number | null;
	levels?: number | null;
	min_level?: number | null;
	building_shape?: string | null;
	roof_shape?: string | null;
	roof_height?: number | null;
	roof_levels?: number | null;
	isPart?: boolean;
}): BuildingMetadata | undefined {
	const meta: BuildingMetadata = {
		height: props.height ?? undefined,
		minHeight: props.min_height ?? undefined,
		levels: props.levels ?? undefined,
		minLevel: props.min_level ?? undefined,
		shape: ['sphere', 'cone', 'pyramid', 'cylinder'].includes(props.building_shape || '')
			? props.building_shape!
			: undefined,
		roofShape: props.roof_shape ?? undefined,
		roofHeight: props.roof_height ?? undefined,
		roofLevels: props.roof_levels ?? undefined,
		isPart: props.isPart || undefined
	};

	// Clean undefined keys
	(Object.keys(meta) as Array<keyof BuildingMetadata>).forEach(
		(key) => meta[key] === undefined && delete meta[key]
	);

	// Defaults if missing
	if (!meta.height && !meta.levels && !props.isPart) {
		meta.height = 10;
		meta.levels = 3;
	} else if (meta.levels && !meta.height) {
		meta.height = meta.levels * 3;
	}
	if (meta.minLevel && !meta.minHeight) {
		meta.minHeight = meta.minLevel * 3;
	}

	// Infer height from roof:height for parts that only specify a roof
	if (!meta.height && !meta.levels && meta.roofHeight) {
		meta.height = (meta.minHeight || 0) + meta.roofHeight;
	}

	return Object.keys(meta).length > 0 ? meta : undefined;
}

// --- Geometry Helpers ---

interface BBox {
	minX: number;
	minY: number;
	maxX: number;
	maxY: number;
}

function polygonArea(polygon: Coordinate[]): number {
	let area = 0;
	const n = polygon.length;
	for (let i = 0; i < n; i++) {
		const j = (i + 1) % n;
		area += polygon[i].x * polygon[j].y;
		area -= polygon[j].x * polygon[i].y;
	}
	return Math.abs(area) / 2;
}

function getBBox(polygon: Coordinate[]): BBox {
	let minX = Infinity,
		minY = Infinity,
		maxX = -Infinity,
		maxY = -Infinity;
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
	let sx = 0,
		sy = 0;
	if (polygon.length === 0) return { x: 0, y: 0 };
	const len = pointsEqual(polygon[0], polygon[polygon.length - 1])
		? polygon.length - 1
		: polygon.length;
	const count = len > 0 ? len : polygon.length;
	for (let i = 0; i < count; i++) {
		sx += polygon[i].x;
		sy += polygon[i].y;
	}
	return { x: sx / count, y: sy / count };
}

function isPointInPolygon(p: Coordinate, polygon: Coordinate[]): boolean {
	let inside = false;
	for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
		const xi = polygon[i].x,
			yi = polygon[i].y;
		const xj = polygon[j].x,
			yj = polygon[j].y;

		const intersect = yi > p.y !== yj > p.y && p.x < ((xj - xi) * (p.y - yi)) / (yj - yi) + xi;
		if (intersect) inside = !inside;
	}
	return inside;
}

function pointsEqual(a: Coordinate, b: Coordinate): boolean {
	return Math.abs(a.x - b.x) < 1e-6 && Math.abs(a.y - b.y) < 1e-6;
}
