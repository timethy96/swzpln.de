import { describe, it, expect } from 'vitest';
import { exportToPDF } from './pdf';
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

describe('PDF exporter', () => {
	it('should return a blob URL string', () => {
		const result = exportToPDF([], null, testBounds, 14, 0.001);
		expect(typeof result).toBe('string');
		expect(result).toContain('blob:');
	});

	it('should handle building objects', () => {
		const result = exportToPDF([makeBuilding()], null, testBounds, 14, 0.001);
		expect(typeof result).toBe('string');
		expect(result.length).toBeGreaterThan(0);
	});

	it('should handle highway objects', () => {
		const result = exportToPDF([makeHighway()], null, testBounds, 14, 0.001);
		expect(typeof result).toBe('string');
		expect(result.length).toBeGreaterThan(0);
	});

	it('should handle multiple object types', () => {
		const result = exportToPDF([makeBuilding(), makeHighway()], null, testBounds, 14, 0.001);
		expect(typeof result).toBe('string');
	});

	it('should handle empty objects array', () => {
		const result = exportToPDF([], null, testBounds, 14, 0.001);
		expect(typeof result).toBe('string');
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
		const result = exportToPDF([building], null, testBounds, 14, 0.001);
		expect(typeof result).toBe('string');
	});

	it('should handle different zoom levels', () => {
		const result1 = exportToPDF([], null, testBounds, 12, 0.001);
		const result2 = exportToPDF([], null, testBounds, 16, 0.001);
		expect(typeof result1).toBe('string');
		expect(typeof result2).toBe('string');
	});

	it('should call progress callback', () => {
		const progress: { percent: number; message: string }[] = [];
		exportToPDF([], null, testBounds, 14, 0.001, (info) => {
			progress.push({ percent: info.percent!, message: info.message! });
		});
		expect(progress.length).toBeGreaterThan(0);
		expect(progress[progress.length - 1].percent).toBe(100);
	});
});
