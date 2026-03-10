import { describe, it, expect } from 'vitest';
import { exportToDXF3D } from './dxf3d';
import type { GeometryObject, Bounds } from '../types';

const testBounds: Bounds = {
	north: 48.8,
	south: 48.7,
	east: 9.2,
	west: 9.1
};

function makeBuilding(): GeometryObject {
	return {
		type: 'building',
		path: [
			{ x: 10, y: 10 },
			{ x: 20, y: 10 },
			{ x: 20, y: 20 },
			{ x: 10, y: 20 }
		],
		buildingMetadata: { height: 10, levels: 3 }
	};
}

describe('DXF3D exporter', () => {
	it('should return a valid DXF string', () => {
		const result = exportToDXF3D([], null, testBounds, 14);
		expect(typeof result).toBe('string');
		expect(result.length).toBeGreaterThan(0);
	});

	it('should contain DXF structure', () => {
		const result = exportToDXF3D([], null, testBounds, 14);
		expect(result).toContain('HEADER');
		expect(result).toContain('ENTITIES');
		expect(result).toContain('EOF');
	});

	it('should contain 3D layer definitions', () => {
		const result = exportToDXF3D([makeBuilding()], null, testBounds, 14);
		expect(result).toContain('BUILDINGS-3D');
		expect(result).toContain('TERRAIN-3D');
		expect(result).toContain('OTHER');
	});

	it('should contain 3DFACE entities for buildings', () => {
		const result = exportToDXF3D([makeBuilding()], null, testBounds, 14);
		expect(result).toContain('3DFACE');
	});

	it('should include attribution text', () => {
		const result = exportToDXF3D([], null, testBounds, 14);
		expect(result).toContain('OpenStreetMap');
	});

	it('should handle empty objects array', () => {
		const result = exportToDXF3D([], null, testBounds, 14);
		expect(result).toContain('EOF');
	});

	it('should handle multiple buildings', () => {
		const buildings = [makeBuilding(), makeBuilding()];
		const result = exportToDXF3D(buildings, null, testBounds, 14);
		// Should have multiple 3DFACE entities
		const faceCount = (result.match(/3DFACE/g) || []).length;
		expect(faceCount).toBeGreaterThan(1);
	});

	it('should call progress callback', () => {
		const progress: { percent: number; message: string }[] = [];
		exportToDXF3D([], null, testBounds, 14, (info) => {
			progress.push({ percent: info.percent!, message: info.message! });
		});
		expect(progress.length).toBeGreaterThan(0);
		expect(progress[progress.length - 1].percent).toBe(100);
	});
});
