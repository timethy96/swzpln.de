// Road width mapping and polygon generation utilities

import type { Coordinate, GeometryObject } from './types';
import polygonClipping from 'polygon-clipping';

/**
 * Road width mapping in meters based on OpenStreetMap highway types
 * These are typical/average widths for visualization purposes
 */
export const HIGHWAY_WIDTHS: Record<string, number> = {
	// Major roads
	motorway: 15,
	motorway_link: 6,
	trunk: 12,
	trunk_link: 6,
	primary: 10,
	primary_link: 6,
	secondary: 8,
	secondary_link: 5,
	tertiary: 6,
	tertiary_link: 5,

	// Minor roads
	unclassified: 5,
	residential: 5,
	living_street: 4,
	service: 3,

	// Pedestrian/cycling
	pedestrian: 3,
	footway: 2,
	path: 1.5,
	cycleway: 2,
	track: 3,

	// Special
	busway: 4,
	bus_guideway: 4,

	// Default
	default: 5
};

export function getRoadWidth(highwayType?: string): number {
	if (!highwayType) return HIGHWAY_WIDTHS.default;
	return HIGHWAY_WIDTHS[highwayType] || HIGHWAY_WIDTHS.default;
}

function getPerpendicularOffset(p1: Coordinate, p2: Coordinate, width: number): Coordinate {
	const dx = p2.x - p1.x;
	const dy = p2.y - p1.y;
	const length = Math.sqrt(dx * dx + dy * dy);
	if (length === 0) return { x: 0, y: 0 };

	const nx = -dy / length;
	const ny = dx / length;

	return {
		x: nx * (width / 2),
		y: ny * (width / 2)
	};
}

function extendPoint(point: Coordinate, direction: Coordinate, distance: number): Coordinate {
	const length = Math.sqrt(direction.x * direction.x + direction.y * direction.y);
	if (length === 0) return point;

	const normalized = {
		x: direction.x / length,
		y: direction.y / length
	};

	return {
		x: point.x + normalized.x * distance,
		y: point.y + normalized.y * distance
	};
}

export function lineToPolygon(path: Coordinate[], width: number): Coordinate[] {
	if (path.length < 2) return path;

	const extensionDistance = width / 2;
	const leftSide: Coordinate[] = [];
	const rightSide: Coordinate[] = [];

	// Start
	const firstDir = { x: path[1].x - path[0].x, y: path[1].y - path[0].y };
	const extendedStart = extendPoint(path[0], { x: -firstDir.x, y: -firstDir.y }, extensionDistance);
	const firstOffset = getPerpendicularOffset(path[0], path[1], width);

	leftSide.push({ x: extendedStart.x + firstOffset.x, y: extendedStart.y + firstOffset.y });
	rightSide.push({ x: extendedStart.x - firstOffset.x, y: extendedStart.y - firstOffset.y });

	// Middle
	for (let i = 0; i < path.length - 1; i++) {
		const p1 = path[i];
		const p2 = path[i + 1];
		const offset = getPerpendicularOffset(p1, p2, width);

		if (i > 0) {
			leftSide.push({ x: p1.x + offset.x, y: p1.y + offset.y });
			rightSide.push({ x: p1.x - offset.x, y: p1.y - offset.y });
		}
	}

	// End
	const lastIdx = path.length - 1;
	const lastDir = {
		x: path[lastIdx].x - path[lastIdx - 1].x,
		y: path[lastIdx].y - path[lastIdx - 1].y
	};
	const extendedEnd = extendPoint(path[lastIdx], lastDir, extensionDistance);
	const lastOffset = getPerpendicularOffset(path[lastIdx - 1], path[lastIdx], width);

	leftSide.push({ x: extendedEnd.x + lastOffset.x, y: extendedEnd.y + lastOffset.y });
	rightSide.push({ x: extendedEnd.x - lastOffset.x, y: extendedEnd.y - lastOffset.y });

	return [...leftSide, ...rightSide.reverse()];
}

export function shouldConvertToPolygon(path: Coordinate[]): boolean {
	if (path.length < 2) return false;
	let totalLength = 0;
	for (let i = 0; i < path.length - 1; i++) {
		const dx = path[i + 1].x - path[i].x;
		const dy = path[i + 1].y - path[i].y;
		totalLength += Math.sqrt(dx * dx + dy * dy);
	}
	return totalLength > 0.001;
}

export function convertAndMergeRoads(objects: GeometryObject[]): GeometryObject[] {
	const result: GeometryObject[] = [];
	const roadPolygons: Array<{ polygon: Coordinate[]; obj: GeometryObject }> = [];

	for (const obj of objects) {
		if (obj.type === 'highway' && shouldConvertToPolygon(obj.path)) {
			const width = getRoadWidth(obj.highwayType);
			const polygon = lineToPolygon(obj.path, width);
			roadPolygons.push({ polygon, obj });
		} else {
			result.push(obj);
		}
	}

	if (roadPolygons.length === 0) return result;
	if (roadPolygons.length === 1) {
		result.push({ ...roadPolygons[0].obj, path: roadPolygons[0].polygon });
		return result;
	}

	const polygonCoords = roadPolygons.map(({ polygon }) => [
		polygon.map((p) => [p.x, p.y] as [number, number])
	]);

	try {
		const merged = polygonClipping.union(polygonCoords[0], ...polygonCoords.slice(1));
		const templateObj = roadPolygons[0].obj; // Use first road generic props

		for (const multiPolygon of merged) {
			for (const ring of multiPolygon) {
				result.push({
					type: 'highway',
					path: ring.map(([x, y]) => ({ x, y })),
					role: templateObj.role,
					highwayType: templateObj.highwayType
				});
			}
		}
	} catch (error) {
		console.warn('Road merging failed:', error);
		for (const { polygon, obj } of roadPolygons) {
			result.push({ ...obj, path: polygon });
		}
	}

	return result;
}
