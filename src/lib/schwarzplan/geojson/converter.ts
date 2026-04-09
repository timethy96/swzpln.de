// GeoJSON-to-GeometryObject converter for server-side geodata (Overpass API)
// Converts GeoJSON responses into the same GeometryObject[] format
// that the OSM converter produces, so exporters work unchanged.

import type {
	Bounds,
	Coordinate,
	GeometryObject,
	GeoDataResponse,
	ProgressCallback
} from '../types';
import { latLngToXY } from '../geometry/coordinates';
import { resolveBuildingOutlines, buildMetadataFromColumns } from '../geometry/outlines';
import { convertAndMergeRoads } from '../roads';

/**
 * Convert server-side GeoJSON response to GeometryObject array.
 * Produces the same output format as osmDataToGeometry().
 */
export function geojsonToGeometry(
	geodata: GeoDataResponse,
	bounds: Bounds,
	onProgress?: ProgressCallback
): GeometryObject[] {
	onProgress?.({ step: 'osm-parse', percent: 0, message: 'Processing geodata...' });

	const objects: GeometryObject[] = [];

	// Process each layer
	for (const [layerName, features] of Object.entries(geodata.layers)) {
		for (const feature of features) {
			const geo = feature.geojson;
			const props = feature.properties;

			switch (layerName) {
				case 'building':
					addPolygonFeatures(objects, geo, bounds, 'building', (obj) => {
						obj.buildingMetadata = buildMetadataFromColumns({
							height: props.height as number | null,
							min_height: props.min_height as number | null,
							levels: props.levels as number | null,
							min_level: props.min_level as number | null,
							building_shape: props.building_shape as string | null,
							roof_shape: props.roof_shape as string | null,
							roof_height: props.roof_height as number | null,
							roof_levels: props.roof_levels as number | null,
							isPart: false
						});
						// Reconstruct tags for IFC export
						obj.tags = reconstructBuildingTags(props);
					});
					break;

				case 'building_parts':
					addPolygonFeatures(objects, geo, bounds, 'building', (obj) => {
						obj.buildingMetadata = buildMetadataFromColumns({
							height: props.height as number | null,
							min_height: props.min_height as number | null,
							levels: props.levels as number | null,
							min_level: props.min_level as number | null,
							building_shape: props.building_shape as string | null,
							roof_shape: props.roof_shape as string | null,
							roof_height: props.roof_height as number | null,
							roof_levels: props.roof_levels as number | null,
							isPart: true
						});
					});
					break;

				case 'highway':
					addLinestringFeatures(objects, geo, bounds, 'highway', (obj) => {
						obj.highwayType = (props.highway as string) || 'residential';
					});
					break;

				case 'railway':
					addLinestringFeatures(objects, geo, bounds, 'railway');
					break;

				case 'water':
					addPolygonFeatures(objects, geo, bounds, 'water');
					break;

				case 'waterway':
					addLinestringFeatures(objects, geo, bounds, 'waterway');
					break;

				case 'green':
					addPolygonFeatures(objects, geo, bounds, 'green');
					break;

				case 'forest':
					addPolygonFeatures(objects, geo, bounds, 'forest');
					break;

				case 'farmland':
					addPolygonFeatures(objects, geo, bounds, 'farmland');
					break;
			}
		}
	}

	onProgress?.({ step: 'osm-parse', percent: 50, message: 'Merging roads...' });

	// Buffer and merge roads (same as OSM converter)
	const merged = convertAndMergeRoads(objects, (msg) =>
		onProgress?.({ step: 'osm-parse', percent: 50, message: msg })
	);

	onProgress?.({ step: 'osm-parse', percent: 80, message: 'Resolving building parts...' });

	// Resolve building outlines vs parts
	resolveBuildingOutlines(merged);

	onProgress?.({ step: 'osm-parse', percent: 100, message: `Done: ${merged.length} objects` });
	return merged;
}

// ============================================================================
// Geometry Conversion Helpers
// ============================================================================

function convertCoords(coords: number[][], bounds: Bounds): Coordinate[] {
	return coords.map(([lng, lat]) => latLngToXY(bounds, lat, lng));
}

/**
 * Add polygon features (Polygon or MultiPolygon) to the objects array.
 */
function addPolygonFeatures(
	objects: GeometryObject[],
	geo: GeoJSON.Geometry,
	bounds: Bounds,
	type: GeometryObject['type'],
	enrich?: (obj: GeometryObject) => void
): void {
	if (geo.type === 'Polygon') {
		const rings = geo.coordinates as number[][][];
		const path = convertCoords(rings[0], bounds);
		const holes = rings.slice(1).map((ring) => convertCoords(ring, bounds));
		const obj: GeometryObject = { type, path, holes: holes.length > 0 ? holes : undefined };
		enrich?.(obj);
		objects.push(obj);
	} else if (geo.type === 'MultiPolygon') {
		const polygons = geo.coordinates as number[][][][];
		for (const poly of polygons) {
			const path = convertCoords(poly[0], bounds);
			const holes = poly.slice(1).map((ring) => convertCoords(ring, bounds));
			const obj: GeometryObject = { type, path, holes: holes.length > 0 ? holes : undefined };
			enrich?.(obj);
			objects.push(obj);
		}
	}
}

/**
 * Add linestring features (LineString or MultiLineString) to the objects array.
 */
function addLinestringFeatures(
	objects: GeometryObject[],
	geo: GeoJSON.Geometry,
	bounds: Bounds,
	type: GeometryObject['type'],
	enrich?: (obj: GeometryObject) => void
): void {
	if (geo.type === 'LineString') {
		const path = convertCoords(geo.coordinates as number[][], bounds);
		const obj: GeometryObject = { type, path };
		enrich?.(obj);
		objects.push(obj);
	} else if (geo.type === 'MultiLineString') {
		const lines = geo.coordinates as number[][][];
		for (const line of lines) {
			const path = convertCoords(line, bounds);
			const obj: GeometryObject = { type, path };
			enrich?.(obj);
			objects.push(obj);
		}
	}
}

// ============================================================================
// Tag Reconstruction (for IFC export compatibility)
// ============================================================================

function reconstructBuildingTags(
	props: Record<string, string | number | null>
): Record<string, string> {
	const tags: Record<string, string> = {};

	const mappings: [string, string][] = [
		['building', 'building'],
		['name', 'name'],
		['amenity', 'amenity'],
		['architect', 'architect'],
		['start_date', 'start_date'],
		['heritage', 'heritage'],
		['description', 'description'],
		['height', 'height'],
		['min_height', 'min_height'],
		['levels', 'building:levels'],
		['min_level', 'building:min_level'],
		['building_shape', 'building:shape'],
		['roof_shape', 'roof:shape'],
		['roof_height', 'roof:height'],
		['roof_levels', 'roof:levels'],
		['building_material', 'building:material'],
		['building_colour', 'building:colour'],
		['addr_street', 'addr:street'],
		['addr_housenumber', 'addr:housenumber'],
		['addr_postcode', 'addr:postcode'],
		['addr_city', 'addr:city'],
		['addr_country', 'addr:country']
	];

	for (const [column, tag] of mappings) {
		const val = props[column];
		if (val != null && val !== '') {
			tags[tag] = String(val);
		}
	}

	return tags;
}
