// Road width mapping and polygon generation utilities

import type { Coordinate, GeometryObject } from './types';
import polygonClipping from 'polygon-clipping';

/**
 * Road width mapping in meters based on OpenStreetMap highway types
 * These are typical/average widths for visualization purposes
 */
export const HIGHWAY_WIDTHS: Record<string, number> = {
	// Major roads
	motorway: 15, // Typically 2-4 lanes each direction
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
	
	// Default for unknown types
	default: 5
};

/**
 * Get road width in meters for a given highway type
 */
export function getRoadWidth(highwayType?: string): number {
	if (!highwayType) return HIGHWAY_WIDTHS.default;
	return HIGHWAY_WIDTHS[highwayType] || HIGHWAY_WIDTHS.default;
}

/**
 * Calculate perpendicular offset vector for a line segment
 */
function getPerpendicularOffset(p1: Coordinate, p2: Coordinate, width: number): Coordinate {
	// Calculate direction vector
	const dx = p2.x - p1.x;
	const dy = p2.y - p1.y;
	
	// Calculate length
	const length = Math.sqrt(dx * dx + dy * dy);
	if (length === 0) return { x: 0, y: 0 };
	
	// Normalize and rotate 90 degrees
	const nx = -dy / length;
	const ny = dx / length;
	
	// Scale by half width (offset on one side)
	return {
		x: nx * (width / 2),
		y: ny * (width / 2)
	};
}

/**
 * Extend a point along a direction vector
 */
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

/**
 * Convert a line path to a polygon by offsetting both sides
 * Returns a closed polygon path representing the road surface
 * Roads are extended slightly beyond endpoints to ensure overlap at intersections
 */
export function lineToPolygon(path: Coordinate[], width: number): Coordinate[] {
	if (path.length < 2) return path;
	
	// Extension distance: half the road width to ensure overlap
	const extensionDistance = width / 2;
	
	const leftSide: Coordinate[] = [];
	const rightSide: Coordinate[] = [];
	
	// Extend the first segment backward
	const firstDir = {
		x: path[1].x - path[0].x,
		y: path[1].y - path[0].y
	};
	const extendedStart = extendPoint(path[0], { x: -firstDir.x, y: -firstDir.y }, extensionDistance);
	
	// Add extended start point
	const firstOffset = getPerpendicularOffset(path[0], path[1], width);
	leftSide.push({
		x: extendedStart.x + firstOffset.x,
		y: extendedStart.y + firstOffset.y
	});
	rightSide.push({
		x: extendedStart.x - firstOffset.x,
		y: extendedStart.y - firstOffset.y
	});
	
	// Process each segment (skip first, already handled)
	for (let i = 0; i < path.length - 1; i++) {
		const p1 = path[i];
		const p2 = path[i + 1];
		
		const offset = getPerpendicularOffset(p1, p2, width);
		
		// Add offset points on both sides (only for i > 0)
		if (i > 0) {
			leftSide.push({
				x: p1.x + offset.x,
				y: p1.y + offset.y
			});
			
			rightSide.push({
				x: p1.x - offset.x,
				y: p1.y - offset.y
			});
		}
	}
	
	// Extend the last segment forward
	const lastIdx = path.length - 1;
	const lastDir = {
		x: path[lastIdx].x - path[lastIdx - 1].x,
		y: path[lastIdx].y - path[lastIdx - 1].y
	};
	const extendedEnd = extendPoint(path[lastIdx], lastDir, extensionDistance);
	
	// Add extended end point
	const lastOffset = getPerpendicularOffset(path[lastIdx - 1], path[lastIdx], width);
	leftSide.push({
		x: extendedEnd.x + lastOffset.x,
		y: extendedEnd.y + lastOffset.y
	});
	
	rightSide.push({
		x: extendedEnd.x - lastOffset.x,
		y: extendedEnd.y - lastOffset.y
	});
	
	// Combine: left side forward + right side reversed + close
	const polygon = [...leftSide, ...rightSide.reverse()];
	
	return polygon;
}

/**
 * Check if a path is long enough to be converted to a polygon
 * Very short paths can cause artifacts
 */
export function shouldConvertToPolygon(path: Coordinate[]): boolean {
	if (path.length < 2) return false;
	
	// Calculate total path length
	let totalLength = 0;
	for (let i = 0; i < path.length - 1; i++) {
		const dx = path[i + 1].x - path[i].x;
		const dy = path[i + 1].y - path[i].y;
		totalLength += Math.sqrt(dx * dx + dy * dy);
	}
	
	// Only convert if path is longer than 1 meter
	return totalLength > 0.001; // 1mm in km units
}

/**
 * Convert geometry objects to road polygons and merge overlapping ones
 * This creates a unified road network where intersections are properly merged
 */
export function convertAndMergeRoads(objects: GeometryObject[]): GeometryObject[] {
	const result: GeometryObject[] = [];
	const roadPolygons: Array<{ polygon: Coordinate[]; obj: GeometryObject }> = [];
	
	// First pass: convert highways to polygons, keep others as-is
	for (const obj of objects) {
		if (obj.type === 'highway' && shouldConvertToPolygon(obj.path)) {
			const width = getRoadWidth(obj.highwayType);
			const polygon = lineToPolygon(obj.path, width);
			roadPolygons.push({ polygon, obj });
		} else {
			result.push(obj);
		}
	}
	
	// If no roads or only one, no merging needed
	if (roadPolygons.length === 0) {
		return result;
	}
	
	if (roadPolygons.length === 1) {
		result.push({
			...roadPolygons[0].obj,
			path: roadPolygons[0].polygon
		});
		return result;
	}
	
	// Convert to polygon-clipping format: [[[x, y], [x, y], ...]]
	const polygonCoords = roadPolygons.map(({ polygon }) => 
		[polygon.map(p => [p.x, p.y] as [number, number])]
	);
	
	try {
		// Union all road polygons together
		const merged = polygonClipping.union(polygonCoords[0], ...polygonCoords.slice(1));
		
		// Convert merged polygons back to GeometryObjects
		// Use the first road's properties as the template
		const templateObj = roadPolygons[0].obj;
		
		for (const multiPolygon of merged) {
			for (const ring of multiPolygon) {
				// Convert back to Coordinate[]
				const path: Coordinate[] = ring.map(([x, y]) => ({ x, y }));
				
				result.push({
					type: 'highway',
					path,
					role: templateObj.role,
					highwayType: templateObj.highwayType
				});
			}
		}
	} catch (error) {
		// If merging fails, fall back to individual polygons
		console.warn('Road merging failed, using individual polygons:', error);
		for (const { polygon, obj } of roadPolygons) {
			result.push({
				...obj,
				path: polygon
			});
		}
	}
	
	return result;
}

