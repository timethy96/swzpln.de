// Layer configuration and utilities

import type { Layer, LayerConfig } from './types';

// Layer configuration with colors and Overpass queries
export const LAYER_CONFIG: Record<Layer, LayerConfig> = {
	building: {
		color: '#000000',
		fillable: true,
		overpassQuery: 'nwr["building"];',
		lineType: 'CONTINUOUS',
		dxfColor: 0
	},
	highway: {
		color: '#828282',
		fillable: false,
		overpassQuery: 'nwr["highway"];',
		lineType: 'CONTINUOUS',
		dxfColor: 253
	},
	railway: {
		color: '#BEBEBE',
		fillable: false,
		overpassQuery:
			'nwr["railway"="tram"];nwr["railway"="subway"];nwr["railway"="rail"];nwr["railway"="preserved"];nwr["railway"="narrow_gauge"];nwr["railway"="monorail"];nwr["railway"="miniature"];nwr["railway"="light_rail"];nwr["railway"="funicular"];',
		lineType: 'DASHED',
		dxfColor: 254
	},
	water: {
		color: '#AAD4FF',
		fillable: true,
		overpassQuery: 'nwr["natural"="water"];nwr["waterway"];',
		lineType: 'CONTINUOUS',
		dxfColor: 151
	},
	waterway: {
		color: '#AAD4FF',
		fillable: false,
		overpassQuery: 'nwr["waterway"];',
		lineType: 'CONTINUOUS',
		dxfColor: 151
	},
	green: {
		color: '#9DBD7E',
		fillable: true,
		overpassQuery:
			'nwr["leisure"="park"];nwr["landuse"="allotments"];nwr["landuse"="meadow"];nwr["landuse"="orchard"];nwr["landuse"="vineyard"];nwr["landuse"="cemetery"];nwr["landuse"="grass"];nwr["landuse"="plant_nursery"];nwr["landuse"="recreation_ground"];nwr["landuse"="village_green"];',
		lineType: 'CONTINUOUS',
		dxfColor: 73
	},
	forest: {
		color: '#608156',
		fillable: true,
		overpassQuery: 'nwr["landuse"="forest"];nwr["natural"="wood"];',
		lineType: 'CONTINUOUS',
		dxfColor: 85
	},
	farmland: {
		color: '#FFEAAA',
		fillable: true,
		overpassQuery: 'nwr["landuse"="farmland"];',
		lineType: 'CONTINUOUS',
		dxfColor: 41
	},
	contours: {
		color: '#CCCCCC',
		fillable: false,
		overpassQuery: '',
		lineType: 'CONTINUOUS',
		dxfColor: 6
	}
};

// Tags used for filtering
const GREEN_TAGS = [
	'park',
	'grass',
	'allotments',
	'meadow',
	'orchard',
	'vineyard',
	'cemetery',
	'plant_nursery',
	'recreation_ground',
	'village_green'
];

const FOREST_TAGS = ['forest', 'wood'];

const RAILWAY_TAGS = [
	'rail',
	'tram',
	'subway',
	'narrow_gauge',
	'monorail',
	'light_rail',
	'funicular'
];

// Helper function to check if any values match
function haveCommon(values: string[], tags: string[]): boolean {
	return values.some((v) => tags.includes(v));
}

// Classify OSM tags into layer type
export function classifyTags(tags?: Record<string, string>): Layer | null {
	if (!tags) return null;

	const keys = Object.keys(tags);
	const values = Object.values(tags);

	if (keys.includes('building')) {
		return 'building';
	} else if (keys.includes('highway')) {
		return 'highway';
	} else if (haveCommon(values, GREEN_TAGS)) {
		return 'green';
	} else if (haveCommon(values, FOREST_TAGS)) {
		return 'forest';
	} else if (haveCommon(values, RAILWAY_TAGS)) {
		return 'railway';
	} else if (values.includes('water')) {
		return 'water';
	} else if (keys.includes('waterway')) {
		return 'waterway';
	} else if (values.includes('farmland')) {
		return 'farmland';
	}

	return null;
}

// Get layers that should be closed (filled polygons)
export function isLayerFillable(layer: Layer): boolean {
	return LAYER_CONFIG[layer].fillable;
}

