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

		it('should apply relation tags to ways via multipolygon', () => {
			const osmData: OSMData = {
				version: 0.6,
				generator: 'test',
				elements: [
					{ type: 'node', id: 1, lat: 48.75, lon: 9.15 },
					{ type: 'node', id: 2, lat: 48.76, lon: 9.16 },
					{ type: 'node', id: 3, lat: 48.75, lon: 9.17 },
					{
						type: 'way',
						id: 100,
						nodes: [1, 2, 3, 1],
						tags: { highway: 'residential' }
					},
					{
						type: 'relation',
						id: 200,
						members: [{ type: 'way', ref: 100, role: 'outer' }],
						tags: { building: 'yes', type: 'multipolygon' }
					}
				]
			};

			const result = osmDataToGeometry(osmData, testBounds);

			// The multipolygon relation creates a building from the way,
			// suppressing its original highway classification
			const buildings = result.filter((r) => r.type === 'building');
			expect(buildings).toHaveLength(1);
		});

		it('should filter underground buildings', () => {
			const osmData: OSMData = {
				version: 0.6,
				generator: 'test',
				elements: [
					{ type: 'node', id: 1, lat: 48.75, lon: 9.15 },
					{ type: 'node', id: 2, lat: 48.76, lon: 9.16 },
					{
						type: 'way',
						id: 100,
						nodes: [1, 2],
						tags: { building: 'yes', location: 'underground' }
					}
				]
			};

			const result = osmDataToGeometry(osmData, testBounds);
			const buildings = result.filter((r) => r.type === 'building');
			expect(buildings).toHaveLength(0);
		});

		it('should filter buildings with negative layer', () => {
			const osmData: OSMData = {
				version: 0.6,
				generator: 'test',
				elements: [
					{ type: 'node', id: 1, lat: 48.75, lon: 9.15 },
					{ type: 'node', id: 2, lat: 48.76, lon: 9.16 },
					{
						type: 'way',
						id: 100,
						nodes: [1, 2],
						tags: { building: 'yes', layer: '-1' }
					}
				]
			};

			const result = osmDataToGeometry(osmData, testBounds);
			const buildings = result.filter((r) => r.type === 'building');
			expect(buildings).toHaveLength(0);
		});

		it('should keep above-ground buildings', () => {
			const osmData: OSMData = {
				version: 0.6,
				generator: 'test',
				elements: [
					{ type: 'node', id: 1, lat: 48.75, lon: 9.15 },
					{ type: 'node', id: 2, lat: 48.76, lon: 9.16 },
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
						tags: { building: 'yes', layer: '1' }
					}
				]
			};

			const result = osmDataToGeometry(osmData, testBounds);
			const buildings = result.filter((r) => r.type === 'building');
			expect(buildings).toHaveLength(2);
		});

		it('should filter underground building relations', () => {
			const osmData: OSMData = {
				version: 0.6,
				generator: 'test',
				elements: [
					{ type: 'node', id: 1, lat: 48.75, lon: 9.15 },
					{ type: 'node', id: 2, lat: 48.76, lon: 9.16 },
					{ type: 'node', id: 3, lat: 48.75, lon: 9.17 },
					{
						type: 'way',
						id: 100,
						nodes: [1, 2, 3, 1],
						tags: {}
					},
					{
						type: 'relation',
						id: 200,
						members: [{ type: 'way', ref: 100, role: 'outer' }],
						tags: { building: 'yes', type: 'multipolygon', location: 'underground' }
					}
				]
			};

			const result = osmDataToGeometry(osmData, testBounds);
			const buildings = result.filter((r) => r.type === 'building');
			expect(buildings).toHaveLength(0);
		});

		it('should not suppress building that is inner member of non-building multipolygon', () => {
			// Real-world case: church (building) is inner member of pedestrian plaza (highway multipolygon)
			const osmData: OSMData = {
				version: 0.6,
				generator: 'test',
				elements: [
					// Square polygon nodes
					{ type: 'node', id: 1, lat: 48.75, lon: 9.15 },
					{ type: 'node', id: 2, lat: 48.76, lon: 9.15 },
					{ type: 'node', id: 3, lat: 48.76, lon: 9.16 },
					{ type: 'node', id: 4, lat: 48.75, lon: 9.16 },
					// Church polygon nodes (inside the square)
					{ type: 'node', id: 5, lat: 48.752, lon: 9.152 },
					{ type: 'node', id: 6, lat: 48.758, lon: 9.152 },
					{ type: 'node', id: 7, lat: 48.758, lon: 9.158 },
					{ type: 'node', id: 8, lat: 48.752, lon: 9.158 },
					// Plaza outer way
					{
						type: 'way',
						id: 100,
						nodes: [1, 2, 3, 4, 1],
						tags: { highway: 'pedestrian' }
					},
					// Church way
					{
						type: 'way',
						id: 101,
						nodes: [5, 6, 7, 8, 5],
						tags: { building: 'church' }
					},
					// Plaza relation with church as inner
					{
						type: 'relation',
						id: 200,
						members: [
							{ type: 'way', ref: 100, role: 'outer' },
							{ type: 'way', ref: 101, role: 'inner' }
						],
						tags: { highway: 'pedestrian', type: 'multipolygon' }
					}
				]
			};

			const result = osmDataToGeometry(osmData, testBounds);
			const buildings = result.filter((r) => r.type === 'building');
			expect(buildings).toHaveLength(1);
			expect(buildings[0].path.length).toBeGreaterThan(0);
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
