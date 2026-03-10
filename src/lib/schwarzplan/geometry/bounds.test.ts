// Tests for bounds utilities

import { describe, it, expect } from 'vitest';
import { validateBounds, getBoundsArea, getSuitableScales, estimateOsmFilesize } from './bounds';
import type { Bounds } from '../types';

describe('bounds', () => {
	const validBounds: Bounds = {
		north: 48.8,
		south: 48.7,
		east: 9.2,
		west: 9.1
	};

	describe('validateBounds', () => {
		it('should validate correct bounds', () => {
			expect(validateBounds(validBounds)).toBe(true);
		});

		it('should reject bounds where north <= south', () => {
			const invalid = { ...validBounds, north: 48.7, south: 48.8 };
			expect(validateBounds(invalid)).toBe(false);
		});

		it('should reject bounds where east == west', () => {
			const invalid = { ...validBounds, east: 9.1, west: 9.1 };
			expect(validateBounds(invalid)).toBe(false);
		});

		it('should reject bounds with NaN values', () => {
			const invalid = { ...validBounds, north: NaN };
			expect(validateBounds(invalid)).toBe(false);
		});

		it('should reject bounds outside valid lat/lng range', () => {
			const invalidNorth = { ...validBounds, north: 91 };
			const invalidSouth = { ...validBounds, south: -91 };
			const invalidEast = { ...validBounds, east: 181 };
			const invalidWest = { ...validBounds, west: -181 };

			expect(validateBounds(invalidNorth)).toBe(false);
			expect(validateBounds(invalidSouth)).toBe(false);
			expect(validateBounds(invalidEast)).toBe(false);
			expect(validateBounds(invalidWest)).toBe(false);
		});
	});

	describe('getBoundsArea', () => {
		it('should return positive area for valid bounds', () => {
			const area = getBoundsArea(validBounds);
			expect(area).toBeGreaterThan(0);
		});

		it('should return larger area for larger bounds', () => {
			const smallBounds: Bounds = {
				north: 48.71,
				south: 48.7,
				east: 9.11,
				west: 9.1
			};
			const largeBounds: Bounds = {
				north: 49.0,
				south: 48.0,
				east: 10.0,
				west: 9.0
			};

			const smallArea = getBoundsArea(smallBounds);
			const largeArea = getBoundsArea(largeBounds);

			expect(largeArea).toBeGreaterThan(smallArea);
		});
	});

	describe('getSuitableScales', () => {
		it('should return array of scale options', () => {
			const scales = getSuitableScales(validBounds);
			expect(Array.isArray(scales)).toBe(true);
			expect(scales.length).toBeGreaterThan(0);
			expect(scales.length).toBeLessThanOrEqual(3);
		});

		it('should return scales with name and scale properties', () => {
			const scales = getSuitableScales(validBounds);
			scales.forEach((scale) => {
				expect(scale).toHaveProperty('name');
				expect(scale).toHaveProperty('scale');
				expect(typeof scale.name).toBe('string');
				expect(typeof scale.scale).toBe('number');
			});
		});

		it('should return smaller scales for larger bounds', () => {
			const smallBounds: Bounds = {
				north: 48.705,
				south: 48.7,
				east: 9.105,
				west: 9.1
			};
			const largeBounds: Bounds = {
				north: 49.0,
				south: 48.0,
				east: 10.0,
				west: 9.0
			};

			const smallScales = getSuitableScales(smallBounds);
			const largeScales = getSuitableScales(largeBounds);

			// Larger bounds should have smaller scale values
			if (largeScales.length > 0 && smallScales.length > 0) {
				expect(largeScales[0].scale).toBeLessThan(smallScales[0].scale);
			}
		});
	});

	describe('estimateOsmFilesize', () => {
		it('should return positive number', () => {
			const size = estimateOsmFilesize(15);
			expect(size).toBeGreaterThan(0);
		});

		it('should increase for lower zoom levels (zoom out = more data)', () => {
			const size18 = estimateOsmFilesize(18);
			const size15 = estimateOsmFilesize(15);
			const size12 = estimateOsmFilesize(12);

			// Lower zoom (zoomed out) = more area = more data
			expect(size12).toBeGreaterThan(size15);
			expect(size15).toBeGreaterThan(size18);
		});

		it('should handle edge cases', () => {
			expect(estimateOsmFilesize(11)).toBeGreaterThan(0);
			expect(estimateOsmFilesize(19)).toBeGreaterThan(0);
		});
	});
});
