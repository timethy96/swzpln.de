// Tests for layer classification and configuration

import { describe, it, expect } from 'vitest';
import { classifyTags, isLayerFillable, isUnderground, LAYER_CONFIG } from './layers';

describe('layers', () => {
	describe('LAYER_CONFIG', () => {
		it('should have config for all standard layers', () => {
			const expectedLayers = [
				'building',
				'highway',
				'railway',
				'water',
				'waterway',
				'green',
				'forest',
				'farmland',
				'contours'
			];

			expectedLayers.forEach((layer) => {
				expect(LAYER_CONFIG).toHaveProperty(layer);
				expect(LAYER_CONFIG[layer as keyof typeof LAYER_CONFIG]).toHaveProperty('color');
				expect(LAYER_CONFIG[layer as keyof typeof LAYER_CONFIG]).toHaveProperty('fillable');
				expect(LAYER_CONFIG[layer as keyof typeof LAYER_CONFIG]).toHaveProperty('overpassQuery');
			});
		});

		it('should have valid hex colors', () => {
			Object.values(LAYER_CONFIG).forEach((config) => {
				expect(config.color).toMatch(/^#[0-9A-F]{6}$/i);
			});
		});
	});

	describe('classifyTags', () => {
		it('should return null for undefined tags', () => {
			expect(classifyTags(undefined)).toBeNull();
		});

		it('should return null for empty tags', () => {
			expect(classifyTags({})).toBeNull();
		});

		it('should classify building tags', () => {
			expect(classifyTags({ building: 'yes' })).toBe('building');
			expect(classifyTags({ building: 'residential' })).toBe('building');
		});

		it('should classify highway tags', () => {
			expect(classifyTags({ highway: 'residential' })).toBe('highway');
			expect(classifyTags({ highway: 'primary' })).toBe('highway');
		});

		it('should classify railway tags', () => {
			expect(classifyTags({ railway: 'rail' })).toBe('railway');
			expect(classifyTags({ railway: 'tram' })).toBe('railway');
			expect(classifyTags({ railway: 'light_rail' })).toBe('railway');
		});

		it('should classify water tags', () => {
			expect(classifyTags({ natural: 'water' })).toBe('water');
		});

		it('should classify waterway tags', () => {
			expect(classifyTags({ waterway: 'river' })).toBe('waterway');
			expect(classifyTags({ waterway: 'stream' })).toBe('waterway');
		});

		it('should classify green space tags', () => {
			expect(classifyTags({ leisure: 'park' })).toBe('green');
			expect(classifyTags({ landuse: 'grass' })).toBe('green');
			expect(classifyTags({ landuse: 'meadow' })).toBe('green');
			expect(classifyTags({ landuse: 'cemetery' })).toBe('green');
		});

		it('should classify forest tags', () => {
			expect(classifyTags({ landuse: 'forest' })).toBe('forest');
			expect(classifyTags({ natural: 'wood' })).toBe('forest');
		});

		it('should classify farmland tags', () => {
			expect(classifyTags({ landuse: 'farmland' })).toBe('farmland');
		});

		it('should prioritize building over other tags', () => {
			expect(classifyTags({ building: 'yes', highway: 'residential' })).toBe('building');
		});

		it('should return null for unrecognized tags', () => {
			expect(classifyTags({ foo: 'bar' })).toBeNull();
			expect(classifyTags({ amenity: 'restaurant' })).toBeNull();
		});
	});

	describe('isUnderground', () => {
		it('should detect location=underground', () => {
			expect(isUnderground({ location: 'underground' })).toBe(true);
		});

		it('should detect tunnel=yes', () => {
			expect(isUnderground({ tunnel: 'yes' })).toBe(true);
		});

		it('should detect tunnel=building_passage', () => {
			expect(isUnderground({ tunnel: 'building_passage' })).toBe(true);
		});

		it('should detect parking=underground', () => {
			expect(isUnderground({ parking: 'underground' })).toBe(true);
		});

		it('should detect negative layer values', () => {
			expect(isUnderground({ layer: '-1' })).toBe(true);
			expect(isUnderground({ layer: '-2' })).toBe(true);
		});

		it('should not flag positive layer values', () => {
			expect(isUnderground({ layer: '1' })).toBe(false);
			expect(isUnderground({ layer: '2' })).toBe(false);
		});

		it('should not flag surface-level elements', () => {
			expect(isUnderground({ building: 'yes' })).toBe(false);
			expect(isUnderground({})).toBe(false);
			expect(isUnderground({ layer: '0' })).toBe(false);
		});
	});

	describe('classifyTags underground filtering', () => {
		it('should filter underground buildings', () => {
			expect(classifyTags({ building: 'yes', location: 'underground' })).toBeNull();
			expect(classifyTags({ building: 'yes', tunnel: 'yes' })).toBeNull();
			expect(classifyTags({ building: 'yes', layer: '-1' })).toBeNull();
		});

		it('should filter underground highways', () => {
			expect(classifyTags({ highway: 'service', tunnel: 'yes' })).toBeNull();
			expect(classifyTags({ highway: 'footway', layer: '-1' })).toBeNull();
		});

		it('should filter underground railways', () => {
			expect(classifyTags({ railway: 'subway', tunnel: 'yes' })).toBeNull();
		});

		it('should keep above-ground buildings', () => {
			expect(classifyTags({ building: 'yes' })).toBe('building');
			expect(classifyTags({ building: 'yes', layer: '1' })).toBe('building');
		});
	});

	describe('isLayerFillable', () => {
	it('should return true for fillable layers', () => {
		expect(isLayerFillable('building')).toBe(true);
		expect(isLayerFillable('water')).toBe(true);
		expect(isLayerFillable('green')).toBe(true);
		expect(isLayerFillable('forest')).toBe(true);
		expect(isLayerFillable('farmland')).toBe(true);
		expect(isLayerFillable('highway')).toBe(true); // Highways are rendered as polygons
	});

	it('should return false for non-fillable layers', () => {
		// Note: highway is now fillable (rendered as polygons with width)
		expect(isLayerFillable('railway')).toBe(false);
		expect(isLayerFillable('waterway')).toBe(false);
		expect(isLayerFillable('contours')).toBe(false);
	});
	});
});


