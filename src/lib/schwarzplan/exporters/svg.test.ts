import { describe, it, expect } from 'vitest';
import { exportToSVG } from './svg';
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

function makeWater(): GeometryObject {
	return {
		type: 'water',
		path: [
			{ x: 30, y: 30 },
			{ x: 40, y: 30 },
			{ x: 40, y: 40 },
			{ x: 30, y: 40 }
		]
	};
}

describe('SVG exporter', () => {
	it('should return a valid SVG string', () => {
		const result = exportToSVG([], null, testBounds, 14, 0.001);
		expect(result).toContain('<svg');
		expect(result).toContain('</svg>');
	});

	it('should set xmlns attribute', () => {
		const result = exportToSVG([], null, testBounds, 14, 0.001);
		expect(result).toContain("xmlns='http://www.w3.org/2000/svg'");
	});

	it('should include width and height in mm', () => {
		const result = exportToSVG([], null, testBounds, 14, 0.001);
		expect(result).toMatch(/width='[\d.]+mm'/);
		expect(result).toMatch(/height='[\d.]+mm'/);
	});

	it('should include attribution text', () => {
		const result = exportToSVG([], null, testBounds, 14, 0.001);
		expect(result).toContain('OpenStreetMap');
		expect(result).toContain('<text');
	});

	it('should render building paths', () => {
		const result = exportToSVG([makeBuilding()], null, testBounds, 14, 0.001);
		expect(result).toContain('<path');
		expect(result).toContain('#000000'); // Building color
	});

	it('should render filled buildings by default', () => {
		const result = exportToSVG([makeBuilding()], null, testBounds, 14, 0.001);
		expect(result).toContain('fill:#000000');
	});

	it('should render outline buildings when style is outline', () => {
		const result = exportToSVG([makeBuilding()], null, testBounds, 14, 0.001, undefined, 'outline');
		expect(result).toContain('fill:none');
		expect(result).toContain('stroke:#000000');
	});

	it('should render water with correct color', () => {
		const result = exportToSVG([makeWater()], null, testBounds, 14, 0.001);
		expect(result).toContain('#AAD4FF'); // Water color
	});

	it('should handle multiple objects', () => {
		const result = exportToSVG([makeBuilding(), makeWater()], null, testBounds, 14, 0.001);
		const pathCount = (result.match(/<path/g) || []).length;
		expect(pathCount).toBe(2);
	});

	it('should handle buildings with holes using evenodd fill-rule', () => {
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
		const result = exportToSVG([building], null, testBounds, 14, 0.001);
		expect(result).toContain('fill-rule:evenodd');
	});

	it('should call progress callback', () => {
		const progress: number[] = [];
		exportToSVG([], null, testBounds, 14, 0.001, (info) => {
			progress.push(info.percent!);
		});
		expect(progress.length).toBeGreaterThan(0);
		expect(progress[progress.length - 1]).toBe(100);
	});
});
