// Tests for OSM data conversion

import { describe, it, expect } from 'vitest';
import { osmDataToGeometry } from './converter';
import type { OSMData, Bounds } from '../types';

describe('OSM converter', () => {
	const testBounds: Bounds = {
		north: 48.8,
		south: 48.7,
		east: 9.2,
		west: 9.1
	};

	describe('osmDataToGeometry', () => {
		it('should convert simple OSM data to geometry', () => {
			const osmData: OSMData = {
				version: 0.6,
				generator: 'test',
				elements: [
					{
						type: 'node',
						id: 1,
						lat: 48.75,
						lon: 9.15
					},
					{
						type: 'node',
						id: 2,
						lat: 48.76,
						lon: 9.16
					},
					{
						type: 'way',
						id: 100,
						nodes: [1, 2],
						tags: { building: 'yes' }
					}
				]
			};

			const result = osmDataToGeometry(osmData, testBounds);

			expect(result).toHaveLength(1);
			expect(result[0].type).toBe('building');
			expect(result[0].path).toHaveLength(2);
			expect(result[0].path[0]).toHaveProperty('x');
			expect(result[0].path[0]).toHaveProperty('y');
		});

		it('should handle empty elements', () => {
			const osmData: OSMData = {
				version: 0.6,
				generator: 'test',
				elements: []
			};

			const result = osmDataToGeometry(osmData, testBounds);
			expect(result).toHaveLength(0);
		});

		it('should skip ways without tags', () => {
			const osmData: OSMData = {
				version: 0.6,
				generator: 'test',
				elements: [
					{
						type: 'node',
						id: 1,
						lat: 48.75,
						lon: 9.15
					},
					{
						type: 'way',
						id: 100,
						nodes: [1]
					}
				]
			};

			const result = osmDataToGeometry(osmData, testBounds);
			expect(result).toHaveLength(0);
		});

		it('should skip ways with unrecognized tags', () => {
			const osmData: OSMData = {
				version: 0.6,
				generator: 'test',
				elements: [
					{
						type: 'node',
						id: 1,
						lat: 48.75,
						lon: 9.15
					},
					{
						type: 'way',
						id: 100,
						nodes: [1],
						tags: { amenity: 'restaurant' }
					}
				]
			};

			const result = osmDataToGeometry(osmData, testBounds);
			expect(result).toHaveLength(0);
		});

		it('should handle multiple geometry types', () => {
			const osmData: OSMData = {
				version: 0.6,
				generator: 'test',
				elements: [
					{
						type: 'node',
						id: 1,
						lat: 48.75,
						lon: 9.15
					},
					{
						type: 'node',
						id: 2,
						lat: 48.76,
						lon: 9.16
					},
					{
						type: 'way',
						id: 100,
						nodes: [1, 2],
						tags: { building: 'yes' }
					},
					{
						type: 'way',
						id: 101,
						nodes: [1, 2],
						tags: { highway: 'residential' }
					}
				]
			};

			const result = osmDataToGeometry(osmData, testBounds);

			expect(result).toHaveLength(2);
			expect(result[0].type).toBe('building');
			expect(result[1].type).toBe('highway');
		});

		it('should apply relation tags to ways', () => {
			const osmData: OSMData = {
				version: 0.6,
				generator: 'test',
				elements: [
					{
						type: 'node',
						id: 1,
						lat: 48.75,
						lon: 9.15
					},
					{
						type: 'way',
						id: 100,
						nodes: [1],
						tags: { highway: 'residential' }
					},
					{
						type: 'relation',
						id: 200,
						members: [{ type: 'way', ref: 100, role: 'outer' }],
						tags: { building: 'yes' }
					}
				]
			};

			const result = osmDataToGeometry(osmData, testBounds);

			expect(result).toHaveLength(1);
			// Relation tags should override way tags
			expect(result[0].type).toBe('building');
		});

		it('should skip ways with missing nodes', () => {
			const osmData: OSMData = {
				version: 0.6,
				generator: 'test',
				elements: [
					{
						type: 'way',
						id: 100,
						nodes: [999], // Node doesn't exist
						tags: { building: 'yes' }
					}
				]
			};

			const result = osmDataToGeometry(osmData, testBounds);
			expect(result).toHaveLength(0);
		});
	});
});


