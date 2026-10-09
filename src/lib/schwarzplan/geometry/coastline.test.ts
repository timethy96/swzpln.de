import { describe, it, expect } from 'vitest';
import { mergeCoastlines, oceanRings } from './coastline';

type Pt = [number, number];
const area = (r: Pt[]) =>
	Math.abs(
		r.reduce((s, p, i) => s + p[0] * r[(i + 1) % r.length][1] - r[(i + 1) % r.length][0] * p[1], 0)
	) / 2;

// Bild 100 × 100, y nach unten, Norden oben. Küste: Land links, Wasser rechts.
describe('oceanRings', () => {
	it('Küste nach Osten: Wasser im Süden', () => {
		const rings = oceanRings(
			[
				[
					[-10, 50],
					[110, 50]
				]
			],
			100,
			100
		);
		expect(rings).toHaveLength(1);
		expect(area(rings[0])).toBeCloseTo(5000);
		expect(rings[0].every(([, y]) => y >= 50)).toBe(true);
	});

	it('Küste nach Westen: Wasser im Norden', () => {
		const rings = oceanRings(
			[
				[
					[110, 50],
					[-10, 50]
				]
			],
			100,
			100
		);
		expect(area(rings[0])).toBeCloseTo(5000);
		expect(rings[0].every(([, y]) => y <= 50)).toBe(true);
	});

	it('Meerenge aus zwei Küsten wird ein Ring', () => {
		const rings = oceanRings(
			[
				[
					[-10, 30],
					[110, 30]
				], // Nordufer, Land oben
				[
					[110, 70],
					[-10, 70]
				] // Südufer, Land unten
			],
			100,
			100
		);
		expect(rings).toHaveLength(1);
		expect(area(rings[0])).toBeCloseTo(4000);
	});

	it('Landzunge oben rechts: Wasser rundherum über drei Ecken', () => {
		// nach Süden (Wasser westlich), dann nach Osten (Wasser südlich):
		// Land ist nur das Viertel oben rechts
		const rings = oceanRings(
			[
				[
					[50, -10],
					[50, 50],
					[110, 50]
				]
			],
			100,
			100
		);
		expect(rings).toHaveLength(1);
		expect(area(rings[0])).toBeCloseTo(7500);
	});

	it('Insel ohne andere Küste: ganzes Bild Wasser, Insel als Loch', () => {
		// Land links: gegen den Uhrzeigersinn im Bild
		const island: Pt[] = [
			[40, 40],
			[40, 60],
			[60, 60],
			[60, 40],
			[40, 40]
		];
		const rings = oceanRings([island], 100, 100);
		expect(rings).toHaveLength(2);
		expect(area(rings[0]) - area(rings[1])).toBeCloseTo(10000 - 400);
	});

	it('Linie, die mitten im Bild endet, wird verworfen', () => {
		expect(
			oceanRings(
				[
					[
						[-10, 50],
						[50, 50]
					]
				],
				100,
				100
			)
		).toHaveLength(0);
	});
});

describe('mergeCoastlines', () => {
	it('verkettet Ways in beliebiger Reihenfolge', () => {
		const chains = mergeCoastlines([
			[
				[2, 0],
				[3, 0]
			],
			[
				[0, 0],
				[1, 0]
			],
			[
				[1, 0],
				[2, 0]
			]
		]);
		expect(chains).toEqual([
			[
				[0, 0],
				[1, 0],
				[2, 0],
				[3, 0]
			]
		]);
	});
});
