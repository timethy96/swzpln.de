// Layer configuration and utilities

import type { Layer, LayerConfig } from './types';

// Central Configuration
// Adds matchTags to define how OSM tags map to our layers.
// Strings mean "must equal", Arrays mean "must be one of".
export const LAYER_CONFIG: Record<Layer, LayerConfig> = {
	building: {
		color: '#000000',
		fillable: true,
		overpassQuery: 'nwr["building"];',
		lineType: 'CONTINUOUS',
		dxfColor: 0,
		matchTags: { building: [] }
	},
	building_parts: {
		color: '#000000',
		fillable: true,
		overpassQuery: 'nwr["building:part"];',
		lineType: 'CONTINUOUS',
		dxfColor: 0,
		matchTags: { 'building:part': 'yes' }
	},
	highway: {
		color: '#828282',
		fillable: true,
		overpassQuery: 'nwr["highway"];',
		lineType: 'CONTINUOUS',
		dxfColor: 253,
		matchTags: { highway: [] } // Any highway tag
	},
	railway: {
		color: '#BEBEBE',
		fillable: false,
		overpassQuery:
			'nwr["railway"~"^(tram|subway|rail|preserved|narrow_gauge|monorail|miniature|light_rail|funicular)$"];',
		lineType: 'DASHED',
		dxfColor: 254,
		matchTags: {
			railway: [
				'tram', 'subway', 'rail', 'preserved', 'narrow_gauge',
				'monorail', 'miniature', 'light_rail', 'funicular'
			]
		}
	},
	water: {
		color: '#AAD4FF',
		fillable: true,
		overpassQuery: 'nwr["natural"="water"];nwr["waterway"];',
		lineType: 'CONTINUOUS',
		dxfColor: 151,
		matchTags: { natural: 'water', waterway: [] } // waterway as fallback if checking values
	},
	waterway: {
		color: '#AAD4FF',
		fillable: false,
		overpassQuery: 'nwr["waterway"];',
		lineType: 'CONTINUOUS',
		dxfColor: 151,
		matchTags: { waterway: [] }
	},
	green: {
		color: '#9DBD7E',
		fillable: true,
		overpassQuery:
			'nwr["leisure"~"^(park)$"];nwr["landuse"~"^(allotments|meadow|orchard|vineyard|cemetery|grass|plant_nursery|recreation_ground|village_green)$"];',
		lineType: 'CONTINUOUS',
		dxfColor: 73,
		matchTags: {
			leisure: ['park'],
			landuse: [
				'allotments', 'meadow', 'orchard', 'vineyard', 'cemetery',
				'grass', 'plant_nursery', 'recreation_ground', 'village_green'
			]
		}
	},
	forest: {
		color: '#608156',
		fillable: true,
		overpassQuery: 'nwr["landuse"="forest"];nwr["natural"="wood"];',
		lineType: 'CONTINUOUS',
		dxfColor: 85,
		matchTags: { landuse: 'forest', natural: 'wood' }
	},
	farmland: {
		color: '#FFEAAA',
		fillable: true,
		overpassQuery: 'nwr["landuse"="farmland"];',
		lineType: 'CONTINUOUS',
		dxfColor: 41,
		matchTags: { landuse: 'farmland' }
	},
	contours: {
		color: '#CCCCCC',
		fillable: false,
		overpassQuery: '',
		lineType: 'CONTINUOUS',
		dxfColor: 6,
		matchTags: {}
	}
};

// Generic Tag Classifier
// Iterates through LAYER_CONFIG to find a match.
export function classifyTags(tags?: Record<string, string>): Layer | null {
	if (!tags) return null;

	// Priority Check (Building & Highway usually override others)
	if (matchLayer(tags, 'building')) return 'building';
	if (matchLayer(tags, 'highway')) return 'highway';

	// General Check
	for (const key in LAYER_CONFIG) {
		const layer = key as Layer;
		if (layer === 'building' || layer === 'highway' || layer === 'contours') continue;
		if (matchLayer(tags, layer)) return layer;
	}

	return null;
}

// Check if tags match a specific layer configuration
function matchLayer(tags: Record<string, string>, layer: Layer): boolean {
	const config = LAYER_CONFIG[layer];
	if (!config.matchTags) return false;

	for (const [key, requirement] of Object.entries(config.matchTags)) {
		if (tags[key]) {
			// If constraint is empty array/string, any existence is a match
			if (Array.isArray(requirement) && requirement.length === 0) return true;
			if (typeof requirement === 'string' && requirement === '') return true;

			// Check specific values
			if (Array.isArray(requirement)) {
				if (requirement.includes(tags[key])) return true;
			} else {
				if (tags[key] === requirement) return true;
			}
		}
	}
	return false;
}

// Rendering Order (Bottom to Top)
export const LAYER_RENDER_ORDER: Layer[] = [
	'water',
	'waterway',
	'green',
	'farmland',
	'forest',
	'railway',
	'highway',
	'contours',
	'building'
];

export function sortObjectsByLayer<T extends { type: Layer }>(objects: T[]): T[] {
	const orderMap = new Map(LAYER_RENDER_ORDER.map((l, i) => [l, i]));
	return [...objects].sort((a, b) => (orderMap.get(a.type) ?? 0) - (orderMap.get(b.type) ?? 0));
}

export function isLayerFillable(layer: Layer): boolean {
	return LAYER_CONFIG[layer].fillable;
}
