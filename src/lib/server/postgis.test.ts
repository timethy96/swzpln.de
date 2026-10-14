import { describe, it, expect } from 'vitest';
import { toElements } from './postgis';
import { osmDataToGeometry } from '$lib/schwarzplan/osm/converter';

const sq = (x: number, y: number, d: number) => [
	[x, y],
	[x + d, y],
	[x + d, y + d],
	[x, y + d],
	[x, y]
];

describe('toElements', () => {
	it('echte OSM-IDs: Way bleibt Way, area_id negativ wird Relation', () => {
		const m = { next: 0 };
		const [way] = toElements(
			{ type: 'Polygon', coordinates: [sq(13.4, 52.5, 0.001)] },
			{ building: 'yes' },
			4711,
			m
		);
		expect(way).toMatchObject({ type: 'way', id: 4711, tags: { building: 'yes' } });
		const [rel] = toElements(
			{ type: 'Polygon', coordinates: [sq(13.4, 52.5, 0.01), sq(13.402, 52.502, 0.001)] },
			{ natural: 'water' },
			-815,
			m
		);
		expect(rel).toMatchObject({
			type: 'relation',
			id: 815,
			tags: { type: 'multipolygon', natural: 'water' },
			members: [
				{ role: 'outer', ref: -1 },
				{ role: 'inner', ref: -2 }
			]
		});
	});

	it('swzpln-Konverter liest das Ergebnis: Gebäude und See mit Insel', () => {
		const m = { next: 0 };
		const elements = [
			...toElements(
				{ type: 'Polygon', coordinates: [sq(13.401, 52.501, 0.001)] },
				{ building: 'yes' },
				1,
				m
			),
			...toElements(
				{ type: 'MultiPolygon', coordinates: [[sq(13.4, 52.5, 0.008), sq(13.402, 52.502, 0.001)]] },
				{ natural: 'water' },
				-2,
				m
			)
		];
		const objs = osmDataToGeometry(
			{ version: 0.6, generator: 't', elements: elements as never },
			{ north: 52.51, south: 52.5, east: 13.41, west: 13.4 }
		);
		expect(objs.filter((o) => o.type === 'building')).toHaveLength(1);
		const water = objs.filter((o) => o.type === 'water');
		expect(water).toHaveLength(1);
		expect(water[0].holes).toHaveLength(1);
	});
});
