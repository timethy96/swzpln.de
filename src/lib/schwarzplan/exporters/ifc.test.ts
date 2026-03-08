import { describe, it, expect } from 'vitest';
import { exportToIFC, generateIfcGuid, IfcWriter } from './ifc';
import type { GeometryObject, Bounds } from '../types';

const testBounds: Bounds = {
	north: 48.8,
	south: 48.7,
	east: 9.2,
	west: 9.1
};

// A simple square building footprint (CCW winding)
function makeBuilding(opts?: {
	height?: number;
	levels?: number;
	roofShape?: string;
	tags?: Record<string, string>;
}): GeometryObject {
	return {
		type: 'building',
		path: [
			{ x: 10, y: 10 },
			{ x: 20, y: 10 },
			{ x: 20, y: 20 },
			{ x: 10, y: 20 }
		],
		buildingMetadata: {
			height: opts?.height ?? 10,
			levels: opts?.levels ?? 3
		},
		tags: opts?.tags
	};
}

// Simple 2x2 elevation matrix for terrain tests
function makeElevation(): number[][] {
	return [
		[100, 101],
		[100, 102]
	];
}

function decodeIfc(result: Uint8Array): string {
	return new TextDecoder().decode(result);
}

// ============================================================================
// GUID Generation
// ============================================================================

describe('generateIfcGuid', () => {
	it('should return a 22-character string', () => {
		const guid = generateIfcGuid();
		expect(guid).toHaveLength(22);
	});

	it('should only contain valid IFC base64 characters', () => {
		const guid = generateIfcGuid();
		expect(guid).toMatch(/^[0-9A-Za-z_$]+$/);
	});

	it('should start with 0, 1, 2, or 3', () => {
		for (let i = 0; i < 20; i++) {
			const guid = generateIfcGuid();
			expect('0123').toContain(guid[0]);
		}
	});

	it('should produce unique values', () => {
		const a = generateIfcGuid();
		const b = generateIfcGuid();
		expect(a).not.toBe(b);
	});
});

// ============================================================================
// IfcWriter
// ============================================================================

describe('IfcWriter', () => {
	it('should increment entity IDs', () => {
		const w = new IfcWriter();
		const id1 = w.write('IFCTEST', "'hello'");
		const id2 = w.write('IFCTEST', "'world'");
		expect(id1).toBe(1);
		expect(id2).toBe(2);
	});

	it('should format STEP lines correctly', () => {
		const w = new IfcWriter();
		w.write('IFCWALL', "'guid',#1,'Wall'");
		const output = w.toString();
		expect(output).toContain("#1=IFCWALL('guid',#1,'Wall');");
	});
});

// ============================================================================
// IFC File Structure
// ============================================================================

describe('exportToIFC', () => {
	describe('file structure', () => {
		it('should produce valid STEP header and footer', async () => {
			const result = await exportToIFC([], null, testBounds);
			const ifc = decodeIfc(result);

			expect(ifc).toContain('ISO-10303-21;');
			expect(ifc).toContain('END-ISO-10303-21;');
			expect(ifc).toContain('HEADER;');
			expect(ifc).toContain('ENDSEC;');
			expect(ifc).toContain('DATA;');
		});

		it('should use IFC4X3_ADD2 schema', async () => {
			const result = await exportToIFC([], null, testBounds);
			const ifc = decodeIfc(result);

			expect(ifc).toContain("FILE_SCHEMA(('IFC4X3_ADD2'))");
		});

		it('should contain IfcProject and IfcSite', async () => {
			const result = await exportToIFC([], null, testBounds);
			const ifc = decodeIfc(result);

			expect(ifc).toContain('IFCPROJECT(');
			expect(ifc).toContain('IFCSITE(');
		});

		it('should return a Uint8Array', async () => {
			const result = await exportToIFC([], null, testBounds);
			expect(result).toBeInstanceOf(Uint8Array);
			expect(result.length).toBeGreaterThan(0);
		});

		it('should produce valid IFC for empty input', async () => {
			const result = await exportToIFC([], null, testBounds);
			const ifc = decodeIfc(result);

			// Should have project structure but no buildings
			expect(ifc).toContain('IFCPROJECT(');
			expect(ifc).not.toContain('IFCBUILDING(');
		});
	});

	// ============================================================================
	// Building Geometry
	// ============================================================================

	describe('building geometry', () => {
		it('should generate IfcTriangulatedFaceSet for a building', async () => {
			const result = await exportToIFC([makeBuilding()], null, testBounds);
			const ifc = decodeIfc(result);

			expect(ifc).toContain('IFCTRIANGULATEDFACESET(');
			expect(ifc).toContain('IFCCARTESIANPOINTLIST3D(');
		});

		it('should generate IfcBuilding entity', async () => {
			const result = await exportToIFC([makeBuilding()], null, testBounds);
			const ifc = decodeIfc(result);

			expect(ifc).toContain('IFCBUILDING(');
		});

		it('should generate one IfcBuilding per input building', async () => {
			const buildings = [makeBuilding(), makeBuilding({ height: 15 })];
			const result = await exportToIFC(buildings, null, testBounds);
			const ifc = decodeIfc(result);

			const buildingMatches = ifc.match(/IFCBUILDING\(/g);
			expect(buildingMatches).toHaveLength(2);
		});

		it('should use building name from OSM tags when available', async () => {
			const result = await exportToIFC(
				[makeBuilding({ tags: { building: 'yes', name: 'City Hall' } })],
				null, testBounds
			);
			const ifc = decodeIfc(result);

			expect(ifc).toContain('City Hall');
		});

		it('should use fallback name when no OSM name', async () => {
			const result = await exportToIFC([makeBuilding()], null, testBounds);
			const ifc = decodeIfc(result);

			expect(ifc).toContain('Building_1');
		});

		it('should set ObjectType from building tag', async () => {
			const result = await exportToIFC(
				[makeBuilding({ tags: { building: 'church' } })],
				null, testBounds
			);
			const ifc = decodeIfc(result);

			expect(ifc).toContain("'church'");
		});
	});

	// ============================================================================
	// Terrain
	// ============================================================================

	describe('terrain', () => {
		it('should generate IfcTriangulatedIrregularNetwork with elevation matrix', async () => {
			const result = await exportToIFC([], makeElevation(), testBounds);
			const ifc = decodeIfc(result);

			expect(ifc).toContain('IFCTRIANGULATEDIRREGULARNETWORK(');
		});

		it('should generate IfcGeographicElement for terrain', async () => {
			const result = await exportToIFC([], makeElevation(), testBounds);
			const ifc = decodeIfc(result);

			expect(ifc).toContain('IFCGEOGRAPHICELEMENT(');
			expect(ifc).toContain('.TERRAIN.');
		});

		it('should not generate terrain entities without elevation matrix', async () => {
			const result = await exportToIFC([], null, testBounds);
			const ifc = decodeIfc(result);

			expect(ifc).not.toContain('IFCTRIANGULATEDIRREGULARNETWORK(');
			expect(ifc).not.toContain('IFCGEOGRAPHICELEMENT(');
		});

		it('should contain IfcRelContainedInSpatialStructure for terrain', async () => {
			const result = await exportToIFC([], makeElevation(), testBounds);
			const ifc = decodeIfc(result);

			expect(ifc).toContain('IFCRELCONTAINEDINSPATIALSTRUCTURE(');
		});
	});

	// ============================================================================
	// Custom Psets
	// ============================================================================

	describe('swzpln pset', () => {
		it('should use single swzpln pset name', async () => {
			const result = await exportToIFC([makeBuilding({ height: 15 })], null, testBounds);
			const ifc = decodeIfc(result);

			expect(ifc).toContain("'swzpln'");
			expect(ifc).not.toContain('swzpln_BuildingProperties');
			expect(ifc).not.toContain('swzpln_OSMData');
		});

		it('should include height as IFCLENGTHMEASURE', async () => {
			const result = await exportToIFC([makeBuilding({ height: 25 })], null, testBounds);
			const ifc = decodeIfc(result);

			expect(ifc).toContain('IFCLENGTHMEASURE(25.)');
		});

		it('should format fractional heights correctly', async () => {
			const result = await exportToIFC([makeBuilding({ height: 12.5 })], null, testBounds);
			const ifc = decodeIfc(result);

			expect(ifc).toContain('IFCLENGTHMEASURE(12.5)');
		});

		it('should include levels as IFCINTEGER', async () => {
			const result = await exportToIFC([makeBuilding({ levels: 5 })], null, testBounds);
			const ifc = decodeIfc(result);

			expect(ifc).toContain('IFCINTEGER(5)');
		});

		it('should round fractional levels to integer', async () => {
			const result = await exportToIFC([makeBuilding({ levels: 2.8 })], null, testBounds);
			const ifc = decodeIfc(result);

			expect(ifc).toContain('IFCINTEGER(3)');
			expect(ifc).not.toContain('IFCINTEGER(2.8)');
		});

		it('should include roof shape as IFCLABEL', async () => {
			const building = makeBuilding({ roofShape: 'dome' });
			building.buildingMetadata!.roofShape = 'dome';
			const result = await exportToIFC([building], null, testBounds);
			const ifc = decodeIfc(result);

			expect(ifc).toContain("IFCLABEL('dome')");
		});

		it('should always include Source and Copyright', async () => {
			const result = await exportToIFC([makeBuilding()], null, testBounds);
			const ifc = decodeIfc(result);

			expect(ifc).toContain("IFCLABEL('OpenStreetMap')");
			expect(ifc).toContain('OpenStreetMap contributors');
		});

		it('should include material from OSM tags', async () => {
			const result = await exportToIFC(
				[makeBuilding({ tags: { building: 'yes', 'building:material': 'brick' } })],
				null, testBounds
			);
			const ifc = decodeIfc(result);

			expect(ifc).toContain("IFCLABEL('brick')");
			expect(ifc).toContain("'Material'");
		});

		it('should include terrain attribution pset', async () => {
			const result = await exportToIFC([], makeElevation(), testBounds);
			const ifc = decodeIfc(result);

			expect(ifc).toContain('OpenTopoData');
			expect(ifc).toContain('Mapzen');
		});
	});

	// ============================================================================
	// Address
	// ============================================================================

	describe('address', () => {
		it('should include separate address fields in pset', async () => {
			const result = await exportToIFC(
				[makeBuilding({
					tags: {
						building: 'yes',
						'addr:street': 'Hauptstrasse',
						'addr:housenumber': '42',
						'addr:postcode': '70173',
						'addr:city': 'Stuttgart'
					}
				})],
				null, testBounds
			);
			const ifc = decodeIfc(result);

			expect(ifc).not.toContain('IFCPOSTALADDRESS(');
			expect(ifc).toContain("'Street'");
			expect(ifc).toContain('Hauptstrasse');
			expect(ifc).toContain("'HouseNumber'");
			expect(ifc).toContain("'42'");
			expect(ifc).toContain("'City'");
			expect(ifc).toContain('Stuttgart');
			expect(ifc).toContain("'PostalCode'");
			expect(ifc).toContain('70173');
		});

		it('should not include address properties without addr tags', async () => {
			const result = await exportToIFC(
				[makeBuilding({ tags: { building: 'yes' } })],
				null, testBounds
			);
			const ifc = decodeIfc(result);

			expect(ifc).not.toContain("'Street'");
			expect(ifc).not.toContain("'HouseNumber'");
			expect(ifc).not.toContain("'PostalCode'");
			expect(ifc).not.toContain("'City'");
		});
	});

	// ============================================================================
	// Combined output
	// ============================================================================

	describe('combined buildings + terrain', () => {
		it('should generate both buildings and terrain', async () => {
			const result = await exportToIFC([makeBuilding()], makeElevation(), testBounds);
			const ifc = decodeIfc(result);

			expect(ifc).toContain('IFCBUILDING(');
			expect(ifc).toContain('IFCTRIANGULATEDIRREGULARNETWORK(');
			expect(ifc).toContain('IFCRELAGGREGATES(');
		});
	});
});
