// Tests for coordinate conversion utilities

import { describe, it, expect } from 'vitest';
import {
	latLngToXY,
	getMaxXY,
	normalizeLongitude,
	boundsToArray,
	arrayToBounds,
	getContourInterval
} from './coordinates';
import type { Bounds } from '../types';

describe('coordinates', () => {
	const testBounds: Bounds = {
		north: 48.8,
		south: 48.7,
		east: 9.2,
		west: 9.1
	};

	describe('latLngToXY', () => {
		it('should convert lat/lng to XY coordinates', () => {
			const result = latLngToXY(testBounds, 48.75, 9.15);
			expect(result.x).toBeGreaterThan(0);
			expect(result.y).toBeGreaterThan(0);
		});

		it('should return origin for southwest corner', () => {
			const result = latLngToXY(testBounds, testBounds.south, testBounds.west);
			expect(result.x).toBeCloseTo(0, 1);
			expect(result.y).toBeCloseTo(0, 1);
		});

		it('should handle negative coordinates for points outside bounds', () => {
			const result = latLngToXY(testBounds, 48.6, 9.0);
			expect(result.x).toBeLessThan(0);
			expect(result.y).toBeLessThan(0);
		});
	});

	describe('getMaxXY', () => {
		it('should return correct maximum coordinates', () => {
			const result = getMaxXY(testBounds);
			expect(result.x).toBeGreaterThan(0);
			expect(result.y).toBeGreaterThan(0);
		});
	});

	describe('normalizeLongitude', () => {
		it('should keep valid longitudes unchanged', () => {
			expect(normalizeLongitude(0)).toBe(0);
			expect(normalizeLongitude(180)).toBe(180);
			expect(normalizeLongitude(-180)).toBe(-180);
		});

		it('should normalize longitude > 180', () => {
			const result = normalizeLongitude(190);
			expect(result).toBeGreaterThan(-180);
			expect(result).toBeLessThanOrEqual(180);
		});

		it('should normalize longitude < -180', () => {
			const result = normalizeLongitude(-190);
			expect(result).toBeGreaterThan(-180);
			expect(result).toBeLessThanOrEqual(180);
		});
	});

	describe('boundsToArray and arrayToBounds', () => {
		it('should convert bounds to array correctly', () => {
			const arr = boundsToArray(testBounds);
			expect(arr).toEqual([48.8, 9.1, 48.7, 9.2]);
		});

		it('should convert array to bounds correctly', () => {
			const arr: [number, number, number, number] = [48.8, 9.1, 48.7, 9.2];
			const bounds = arrayToBounds(arr);
			expect(bounds).toEqual(testBounds);
		});

		it('should be reversible', () => {
			const arr = boundsToArray(testBounds);
			const bounds = arrayToBounds(arr);
			expect(bounds).toEqual(testBounds);
		});
	});

	describe('getContourInterval', () => {
		it('should return 1m for zoom >= 18', () => {
			expect(getContourInterval(18)).toBe(1);
			expect(getContourInterval(19)).toBe(1);
		});

		it('should return 2m for zoom >= 17', () => {
			expect(getContourInterval(17)).toBe(2);
		});

		it('should return 200m for zoom < 12', () => {
			expect(getContourInterval(11)).toBe(200);
			expect(getContourInterval(10)).toBe(200);
		});

		it('should return increasing intervals as zoom decreases', () => {
			const intervals = [18, 17, 16, 15, 14].map(getContourInterval);
			for (let i = 1; i < intervals.length; i++) {
				expect(intervals[i]).toBeGreaterThan(intervals[i - 1]);
			}
		});
	});
});


