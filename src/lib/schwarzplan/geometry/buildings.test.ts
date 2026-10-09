import { describe, it, expect } from 'vitest';
import { extrudeSingleBuilding } from './buildings';
import type { BuildingMetadata, Coordinate, Coordinate3D } from '../types';

// Rechteck w × d um den Ursprung, um angleDeg gedreht; Längsseiten in n Stücke zerlegt
function rect(w: number, d: number, angleDeg = 0, n = 1): Coordinate[] {
	const pts: Coordinate[] = [];
	for (let i = 0; i < n; i++) pts.push({ x: -w / 2 + (w * i) / n, y: -d / 2 });
	for (let i = 0; i < n; i++) pts.push({ x: w / 2 - (w * i) / n, y: d / 2 });
	pts.splice(n, 0, { x: w / 2, y: -d / 2 });
	pts.push({ x: -w / 2, y: d / 2 });
	const a = (angleDeg * Math.PI) / 180;
	return pts.map((p) => ({
		x: p.x * Math.cos(a) - p.y * Math.sin(a),
		y: p.x * Math.sin(a) + p.y * Math.cos(a)
	}));
}

// Firstrichtung in Grad (0..180) aus den höchsten Punkten des Dachs
function ridge(vertices: Coordinate3D[]) {
	const zMax = Math.max(...vertices.map((v) => v.z));
	const top = vertices.filter((v) => v.z > zMax - 1e-6);
	let best = { d: 0, a: top[0], b: top[0] };
	for (const a of top)
		for (const b of top) {
			const d = Math.hypot(a.x - b.x, a.y - b.y);
			if (d > best.d) best = { d, a, b };
		}
	const deg = (Math.atan2(best.b.y - best.a.y, best.b.x - best.a.x) * 180) / Math.PI;
	return { zMax, deg: (deg + 360) % 180, length: best.d };
}

function inside(p: Coordinate, poly: Coordinate[]): boolean {
	for (let i = 0; i < poly.length; i++) {
		const a = poly[i];
		const b = poly[(i + 1) % poly.length];
		const len = Math.hypot(b.x - a.x, b.y - a.y);
		const t = ((p.x - a.x) * (b.x - a.x) + (p.y - a.y) * (b.y - a.y)) / (len * len);
		if (
			t >= 0 &&
			t <= 1 &&
			Math.abs((p.x - a.x) * (b.y - a.y) - (p.y - a.y) * (b.x - a.x)) / len < 1e-6
		)
			return true; // auf dem Rand
	}
	let c = false;
	for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) {
		const a = poly[i];
		const b = poly[j];
		if (a.y > p.y !== b.y > p.y && p.x < ((b.x - a.x) * (p.y - a.y)) / (b.y - a.y) + a.x) c = !c;
	}
	return c;
}

const round = (extra: Partial<BuildingMetadata> = {}): BuildingMetadata => ({
	height: 12,
	roofShape: 'round',
	...extra
});

describe('Tonnendach (roof:shape=round)', () => {
	it('legt den First beim gedrehten Rechteck entlang der Längsseite', () => {
		const fp = rect(40, 10, 30);
		const mesh = extrudeSingleBuilding(fp, round());
		const r = ridge(mesh.vertices);
		expect(r.deg).toBeCloseTo(30, 3);
		expect(r.length).toBeCloseTo(40, 3);
		expect(r.zMax).toBeCloseTo(12, 6);
		for (const v of mesh.vertices) expect(inside(v, fp)).toBe(true);
	});

	it('Bahnhofshalle mit zerlegten Längsseiten: First längs, Dach nicht zu hoch', () => {
		// 120 × 14 m, Längsseiten in 12 Stücke à 10 m, die Stirnseite (14 m) ist die längste Kante
		const fp = rect(120, 14, -15, 12);
		const mesh = extrudeSingleBuilding(fp, round({ height: 20, roofHeight: 15 }));
		const r = ridge(mesh.vertices);
		expect(r.deg).toBeCloseTo(165, 3);
		// Tonne höchstens ein Halbkreis: Traufe bei 20 - 7 = 13 m
		const eaves = Math.min(...mesh.vertices.filter((v) => v.z > 0).map((v) => v.z));
		expect(r.zMax).toBeCloseTo(20, 6);
		expect(eaves).toBeCloseTo(13, 6);
		for (const v of mesh.vertices) expect(inside(v, fp)).toBe(true);
	});

	it('folgt dem L-förmigen Grundriss statt eines umschließenden Rechtecks', () => {
		const fp = [
			{ x: 0, y: 0 },
			{ x: 40, y: 0 },
			{ x: 40, y: 10 },
			{ x: 10, y: 10 },
			{ x: 10, y: 35 },
			{ x: 0, y: 35 }
		];
		const mesh = extrudeSingleBuilding(fp, round({ height: 10, roofHeight: 3 }));
		const r = ridge(mesh.vertices);
		expect(r.zMax).toBeCloseTo(10, 6);
		// Umschließendes Rechteck 40 × 35: First in x-Richtung
		expect(r.deg).toBeCloseTo(0, 3);
		for (const v of mesh.vertices) expect(inside(v, fp)).toBe(true);
	});

	it('beachtet roof:direction und roof:orientation=across', () => {
		const fp = rect(40, 10);
		// Gefälle nach Norden → First Ost-West
		expect(ridge(extrudeSingleBuilding(fp, round({ roofDirection: 0 })).vertices).deg).toBeCloseTo(
			0,
			3
		);
		// Gefälle nach Osten → First Nord-Süd, obwohl das Gebäude Ost-West liegt
		expect(ridge(extrudeSingleBuilding(fp, round({ roofDirection: 90 })).vertices).deg).toBeCloseTo(
			90,
			3
		);
		expect(
			ridge(extrudeSingleBuilding(fp, round({ roofOrientation: 'across' })).vertices).deg
		).toBeCloseTo(90, 3);
	});
});

describe('Satteldach (roof:shape=gabled)', () => {
	it('hat einen First über die ganze Länge statt einer Pyramidenspitze', () => {
		const fp = rect(20, 10, 60);
		const mesh = extrudeSingleBuilding(fp, { height: 9, roofShape: 'gabled', roofHeight: 3 });
		const r = ridge(mesh.vertices);
		expect(r.deg).toBeCloseTo(60, 3);
		expect(r.length).toBeCloseTo(20, 3);
		expect(r.zMax).toBeCloseTo(9, 6);
	});
});

describe('Dachhöhe', () => {
	it('ragt nie über die Gebäudehöhe hinaus', () => {
		const mesh = extrudeSingleBuilding(rect(10, 10), {
			height: 5,
			roofShape: 'pyramidal',
			roofHeight: 8
		});
		expect(Math.max(...mesh.vertices.map((v) => v.z))).toBeCloseTo(5, 6);
	});
});
