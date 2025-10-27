// Convert OSM JSON data to geometry objects

import type {
	Bounds,
	Coordinate,
	GeometryObject,
	OSMData,
	OSMElement,
	ProgressCallback
} from '../types';
import { classifyTags } from '../layers';
import { latLngToXY } from '../geometry/coordinates';

/**
 * Convert OSM JSON data to an array of geometry objects
 */
export function osmDataToGeometry(
	osmData: OSMData,
	bounds: Bounds,
	onProgress?: ProgressCallback
): GeometryObject[] {
	const elements = osmData.elements;
	const totalElements = elements.length;

	onProgress?.({
		step: 'osm-parse',
		percent: 0,
		message: 'OSM-Daten werden analysiert...'
	});

	// Index nodes by ID for quick lookup
	const nodes = new Map<number, Coordinate>();
	const ways = new Map<number, { layer: string | null; nodes: number[]; tags?: Record<string, string> }>();
	const relations: Array<{ layer: string | null; members: Array<{ ref: number; role: string }> }> =
		[];

	let processedCount = 0;

	// First pass: process all elements
	for (const element of elements) {
		switch (element.type) {
			case 'node':
				// Convert node coordinates to XY
				const coord = latLngToXY(bounds, element.lat, element.lon);
				nodes.set(element.id, coord);
				break;

			case 'way':
				// Store way with its nodes and tags
				const wayLayer = classifyTags(element.tags);
				ways.set(element.id, {
					layer: wayLayer,
					nodes: element.nodes,
					tags: element.tags
				});
				break;

			case 'relation':
				// Store relation with its members
				const relLayer = classifyTags(element.tags);
				relations.push({
					layer: relLayer,
					members: element.members
						.filter((m) => m.type === 'way')
						.map((m) => ({ ref: m.ref, role: m.role }))
				});
				break;
		}

		// Update progress every 100 elements
		processedCount++;
		if (processedCount % 100 === 0 && onProgress) {
			const percent = Math.round((processedCount / totalElements) * 50); // First 50%
			onProgress({
				step: 'osm-parse',
				percent,
				message: `Elemente werden verarbeitet: ${processedCount}/${totalElements}`
			});
		}
	}

	// Second pass: apply relation tags to ways
	for (const relation of relations) {
		if (!relation.layer) continue;

		for (const member of relation.members) {
			const way = ways.get(member.ref);
			if (way) {
				// Override way layer with relation layer
				ways.set(member.ref, {
					...way,
					layer: relation.layer
				});
			}
		}
	}

	// Third pass: convert ways to geometry objects
	const geometryObjects: GeometryObject[] = [];
	let wayCount = 0;
	const totalWays = ways.size;

	for (const [wayId, way] of ways) {
		if (!way.layer) continue;

		// Build path from node coordinates
		const path: Coordinate[] = [];
		for (const nodeId of way.nodes) {
			const coord = nodes.get(nodeId);
			if (coord) {
				// Copy coordinate to avoid mutations
				path.push({ x: coord.x, y: coord.y });
			}
		}

		// Only add if we have a valid path
		if (path.length > 0) {
			geometryObjects.push({
				type: way.layer as any,
				path,
				role: undefined,
				// Capture highway type for width calculation
				highwayType: way.tags?.highway
			});
		}

		// Update progress every 100 ways
		wayCount++;
		if (wayCount % 100 === 0 && onProgress) {
			const percent = 50 + Math.round((wayCount / totalWays) * 50); // Second 50%
			onProgress({
				step: 'osm-parse',
				percent,
				message: `Geometrien werden aufgebaut: ${wayCount}/${totalWays}`
			});
		}
	}

	onProgress?.({
		step: 'osm-parse',
		percent: 100,
		message: `Abgeschlossen: ${geometryObjects.length} Objekte`
	});

	return geometryObjects;
}


