import { describe, it, expect } from 'vitest';
import { exportToDXF } from './dxf';
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

function makeHighway(): GeometryObject {
	return {
		type: 'highway',
		path: [
			{ x: 0, y: 0 },
			{ x: 50, y: 0 },
			{ x: 50, y: 5 },
			{ x: 0, y: 5 }
		],
		highwayType: 'residential'
	};
}

describe('DXF exporter', () => {
	it('should return a valid DXF string', () => {
		const result = exportToDXF([], null, testBounds, 14);
		expect(typeof result).toBe('string');
		expect(result.length).toBeGreaterThan(0);
	});

	it('should contain DXF header sections', () => {
		const result = exportToDXF([], null, testBounds, 14);
		expect(result).toContain('HEADER');
		expect(result).toContain('ENTITIES');
		expect(result).toContain('EOF');
	});

	it('should contain layer definitions', () => {
		const result = exportToDXF([makeBuilding()], null, testBounds, 14);
		expect(result).toContain('building');
		expect(result).toContain('highway');
	});

	it('should include attribution text', () => {
		const result = exportToDXF([], null, testBounds, 14);
		expect(result).toContain('OpenStreetMap');
	});

	it('should contain LWPOLYLINE entities for buildings', () => {
		const result = exportToDXF([makeBuilding()], null, testBounds, 14);
		expect(result).toContain('LWPOLYLINE');
	});

	it('should handle multiple object types', () => {
		const result = exportToDXF([makeBuilding(), makeHighway()], null, testBounds, 14);
		expect(result).toContain('LWPOLYLINE');
	});

	it('should handle empty objects array', () => {
		const result = exportToDXF([], null, testBounds, 14);
		expect(result).toContain('EOF');
	});

	it('should handle buildings with holes', () => {
		const building: GeometryObject = {
			...makeBuilding(),
			holes: [
				[
					{ x: 12, y: 12 },
					{ x: 14, y: 12 },
					{ x: 14, y: 14 },
					{ x: 12, y: 14 }
				]
			]
		};
		const result = exportToDXF([building], null, testBounds, 14);
		// Building + hole = at least 2 LWPOLYLINE entities
		const polylineCount = (result.match(/LWPOLYLINE/g) || []).length;
		expect(polylineCount).toBeGreaterThanOrEqual(2);
	});

	it('should call progress callback', () => {
		const progress: { percent: number; message: string }[] = [];
		exportToDXF([], null, testBounds, 14, (info) => {
			progress.push({ percent: info.percent!, message: info.message! });
		});
		expect(progress.length).toBeGreaterThan(0);
		expect(progress[progress.length - 1].percent).toBe(100);
	});
});
