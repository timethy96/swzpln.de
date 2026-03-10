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

	it('should contain SOLID hatches for fillable areas', () => {
		const result = exportToDXF([makeBuilding()], null, testBounds, 14);
		expect(result).toContain('HATCH');
		expect(result).toContain('SOLID');
	});

	it('should contain SOLID hatches for all fillable layer types', () => {
		const objects: GeometryObject[] = [
			makeBuilding(),
			{
				type: 'water',
				path: [
					{ x: 30, y: 30 },
					{ x: 40, y: 30 },
					{ x: 40, y: 40 },
					{ x: 30, y: 40 }
				]
			},
			{
				type: 'green',
				path: [
					{ x: 50, y: 50 },
					{ x: 60, y: 50 },
					{ x: 60, y: 60 },
					{ x: 50, y: 60 }
				]
			}
		];
		const result = exportToDXF(objects, null, testBounds, 14);
		const hatchCount = (result.match(/\nHATCH\n/g) || []).length;
		expect(hatchCount).toBeGreaterThanOrEqual(3);
	});

	it('should not add hatches for non-fillable layers', () => {
		const railway: GeometryObject = {
			type: 'railway',
			path: [
				{ x: 0, y: 0 },
				{ x: 50, y: 50 }
			]
		};
		const result = exportToDXF([railway], null, testBounds, 14);
		expect(result).not.toContain('HATCH');
	});

	it('should not add hatches for highways', () => {
		const result = exportToDXF([makeHighway()], null, testBounds, 14);
		expect(result).toContain('LWPOLYLINE');
		expect(result).not.toContain('HATCH');
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

	it('should render buildings after other layers (on top)', () => {
		const objects: GeometryObject[] = [
			makeBuilding(),
			{
				type: 'green',
				path: [
					{ x: 50, y: 50 },
					{ x: 60, y: 50 },
					{ x: 60, y: 60 },
					{ x: 50, y: 60 }
				]
			},
			{
				type: 'water',
				path: [
					{ x: 30, y: 30 },
					{ x: 40, y: 30 },
					{ x: 40, y: 40 },
					{ x: 30, y: 40 }
				]
			}
		];
		const result = exportToDXF(objects, null, testBounds, 14);
		// Find layer assignments in ENTITIES section
		// Buildings should appear after green/water in the DXF output
		const waterIdx = result.indexOf('\nwater\n');
		const greenIdx = result.indexOf('\ngreen\n');
		const buildingIdx = result.lastIndexOf('\nbuilding\n');
		expect(buildingIdx).toBeGreaterThan(waterIdx);
		expect(buildingIdx).toBeGreaterThan(greenIdx);
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
