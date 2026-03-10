// IFC 4.3 (IFC4X3_ADD2) exporter
// Generates valid STEP format with IfcTriangulatedFaceSet for buildings
// and IfcTriangulatedIrregularNetwork for terrain

import type {
	Bounds,
	GeometryObject,
	ProgressCallback,
	BuildingMetadata,
	BuildingMesh,
	TerrainMesh
} from '../types';
import { extrudeBuildings } from '../geometry/buildings';
import { generateTerrainMesh } from '../elevation/terrain';
import { getMaxXY } from '../geometry/coordinates';
import * as m from '$lib/paraglide/messages';

// ============================================================================
// IFC GUID Generator (22-char base64-encoded, charset: 0-9A-Za-z_$)
// ============================================================================

const IFC_BASE64 = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz_$';

export function generateIfcGuid(): string {
	// Generate 128 random bits, encode to 22 IFC base64 characters
	const bytes = new Uint8Array(16);
	if (typeof crypto !== 'undefined' && crypto.getRandomValues) {
		crypto.getRandomValues(bytes);
	} else {
		for (let i = 0; i < 16; i++) bytes[i] = Math.floor(Math.random() * 256);
	}
	// IFC spec: first base64 char must be 0-3 (top 4 bits of 128-bit value must be 0)
	bytes[0] &= 0x0f;

	let result = '';
	// Process 6 bits at a time (128 bits = 22 base64 chars, last char uses 2 bits)
	let bitBuffer = 0;
	let bitsInBuffer = 0;

	for (let i = 0; i < 16; i++) {
		bitBuffer = (bitBuffer << 8) | bytes[i];
		bitsInBuffer += 8;

		while (bitsInBuffer >= 6) {
			bitsInBuffer -= 6;
			const index = (bitBuffer >> bitsInBuffer) & 0x3f;
			result += IFC_BASE64[index];
		}
	}

	// Handle remaining bits (128 = 21*6 + 2, so 2 bits left)
	if (bitsInBuffer > 0) {
		const index = (bitBuffer << (6 - bitsInBuffer)) & 0x3f;
		result += IFC_BASE64[index];
	}

	return result.substring(0, 22);
}

// ============================================================================
// IFC Writer — manages entity IDs and STEP lines
// ============================================================================

export class IfcWriter {
	private id = 0;
	private lines: string[] = [];

	nextId(): number {
		return ++this.id;
	}

	write(entityType: string, args: string): number {
		const id = this.nextId();
		this.lines.push(`#${id}=${entityType}(${args});`);
		return id;
	}

	writeLine(line: string): void {
		this.lines.push(line);
	}

	toString(): string {
		return this.lines.join('\n');
	}
}

// ============================================================================
// Shared entity IDs (written once, referenced everywhere)
// ============================================================================

interface SharedIds {
	ownerHistory: number;
	origin: number;
	zAxis: number;
	xAxis: number;
	worldPlacement: number;
	context: number;
	subContext: number;
	sitePlacement: number;
	site: number;
	project: number;
}

// ============================================================================
// STEP File Header
// ============================================================================

function writeHeader(): string {
	const now = new Date().toISOString().split('.')[0];
	return `ISO-10303-21;
HEADER;
FILE_DESCRIPTION(('ViewDefinition [ReferenceView]'),'2;1');
FILE_NAME('swzpln_export.ifc','${now}',(''),('swzpln.de'),'swzpln IFC Exporter 1.0','swzpln.de - swzpln - 1.0','');
FILE_SCHEMA(('IFC4X3_ADD2'));
ENDSEC;
DATA;`;
}

// ============================================================================
// Global Entities
// ============================================================================

/** Convert WGS84 lat/lon to EPSG:3857 (Web Mercator) meters */
function toEpsg3857(lat: number, lon: number): { easting: number; northing: number } {
	const easting = (lon * 20037508.34) / 180;
	const northing = (Math.log(Math.tan(((90 + lat) * Math.PI) / 360)) / Math.PI) * 20037508.34;
	return { easting, northing };
}

function writeGlobalEntities(w: IfcWriter, bounds: Bounds): SharedIds {
	const timestamp = Math.floor(Date.now() / 1000);

	// Person & Organization
	const person = w.write('IFCPERSON', "$,$,'swzpln',$,$,$,$,$");
	const org = w.write('IFCORGANIZATION', "$,'swzpln.de',$,$,$");
	const personOrg = w.write('IFCPERSONANDORGANIZATION', `#${person},#${org},$`);
	const app = w.write('IFCAPPLICATION', `#${org},'1.0','swzpln','swzpln'`);
	const ownerHistory = w.write(
		'IFCOWNERHISTORY',
		`#${personOrg},#${app},$,.ADDED.,${timestamp},#${personOrg},#${app},${timestamp}`
	);

	// Units
	const unitLength = w.write('IFCSIUNIT', '*,.LENGTHUNIT.,$,.METRE.');
	const unitArea = w.write('IFCSIUNIT', '*,.AREAUNIT.,$,.SQUARE_METRE.');
	const unitVolume = w.write('IFCSIUNIT', '*,.VOLUMEUNIT.,$,.CUBIC_METRE.');
	const unitAngle = w.write('IFCSIUNIT', '*,.PLANEANGLEUNIT.,$,.RADIAN.');
	const units = w.write(
		'IFCUNITASSIGNMENT',
		`(#${unitLength},#${unitArea},#${unitVolume},#${unitAngle})`
	);

	// Shared geometry primitives
	const origin = w.write('IFCCARTESIANPOINT', '(0.,0.,0.)');
	const zAxis = w.write('IFCDIRECTION', '(0.,0.,1.)');
	const xAxis = w.write('IFCDIRECTION', '(1.,0.,0.)');
	const worldPlacement = w.write('IFCAXIS2PLACEMENT3D', `#${origin},#${zAxis},#${xAxis}`);

	// Representation context
	const context = w.write(
		'IFCGEOMETRICREPRESENTATIONCONTEXT',
		`$,'Model',3,0.00001,#${worldPlacement},$`
	);
	const subContext = w.write(
		'IFCGEOMETRICREPRESENTATIONSUBCONTEXT',
		`'Body','Model',*,*,*,*,#${context},$,.MODEL_VIEW.,$`
	);

	// Coordinate reference system — places model at real-world position
	const origin3857 = toEpsg3857(bounds.south, bounds.west);
	const crs = w.write('IFCPROJECTEDCRS', `'EPSG:3857',$,'WGS 84',$,$,$,#${unitLength}`);
	w.write(
		'IFCMAPCONVERSION',
		`#${context},#${crs},${fmtR(origin3857.easting)},${fmtR(origin3857.northing)},0.,$,$,$`
	);

	// Site placement & entity
	const sitePlacement = w.write('IFCLOCALPLACEMENT', `$,#${worldPlacement}`);
	const site = w.write(
		'IFCSITE',
		`'${generateIfcGuid()}',#${ownerHistory},'Site',$,$,#${sitePlacement},$,$,.ELEMENT.,$,$,$,$,$`
	);

	// Project (references context + units)
	const project = w.write(
		'IFCPROJECT',
		`'${generateIfcGuid()}',#${ownerHistory},'swzpln Export',$,$,$,$,(#${context}),#${units}`
	);

	// Project → Site aggregation
	w.write('IFCRELAGGREGATES', `'${generateIfcGuid()}',#${ownerHistory},$,$,#${project},(#${site})`);

	return {
		ownerHistory,
		origin,
		zAxis,
		xAxis,
		worldPlacement,
		context,
		subContext,
		sitePlacement,
		site,
		project
	};
}

// ============================================================================
// Building Geometry (IfcTriangulatedFaceSet)
// ============================================================================

function writeMeshFaceSet(w: IfcWriter, mesh: BuildingMesh): number {
	const coordList = mesh.vertices.map((v) => `(${fmtR(v.x)},${fmtR(v.y)},${fmtR(v.z)})`).join(',');
	const pointListId = w.write('IFCCARTESIANPOINTLIST3D', `(${coordList}),$`);
	const coordIndex = mesh.faces.map((f) => `(${f[0] + 1},${f[1] + 1},${f[2] + 1})`).join(',');
	return w.write('IFCTRIANGULATEDFACESET', `#${pointListId},$,.F.,(${coordIndex}),$`);
}

function writeBuildingGeometry(w: IfcWriter, meshes: BuildingMesh[], shared: SharedIds): number {
	const faceSetIds = meshes.map((mesh) => writeMeshFaceSet(w, mesh));
	const itemRefs = faceSetIds.map((id) => `#${id}`).join(',');
	const shapeRep = w.write(
		'IFCSHAPEREPRESENTATION',
		`#${shared.subContext},'Body','Tessellation',(${itemRefs})`
	);
	return w.write('IFCPRODUCTDEFINITIONSHAPE', `$,$,(#${shapeRep})`);
}

// ============================================================================
// Building Entity
// ============================================================================

function writeBuilding(
	w: IfcWriter,
	meshes: BuildingMesh[],
	metadata: BuildingMetadata | undefined,
	tags: Record<string, string> | undefined,
	shared: SharedIds,
	index: number
): number {
	// Geometry (supports multiple meshes for grouped building parts)
	const shapeId = writeBuildingGeometry(w, meshes, shared);

	// Placement (relative to site, at origin since geometry is in world coords)
	const placement = w.write(
		'IFCAXIS2PLACEMENT3D',
		`#${shared.origin},#${shared.zAxis},#${shared.xAxis}`
	);
	const localPlacement = w.write('IFCLOCALPLACEMENT', `#${shared.sitePlacement},#${placement}`);

	// Building name from OSM or fallback
	const name = escapeIfcString(tags?.name || `Building_${index + 1}`);
	const objectType =
		tags?.building && tags.building !== 'yes' ? `'${escapeIfcString(tags.building)}'` : '$';

	// IfcBuilding entity (BuildingAddress=$, deprecated in IFC4X3 — address goes in Pset_Address)
	const buildingId = w.write(
		'IFCBUILDING',
		`'${generateIfcGuid()}',#${shared.ownerHistory},'${name}',$,${objectType},#${localPlacement},#${shapeId},$,.ELEMENT.,$,$,$`
	);

	// Custom property sets
	writePsets(w, buildingId, metadata, tags, shared);

	return buildingId;
}

// ============================================================================
// Custom Property Sets
// ============================================================================

function writePsets(
	w: IfcWriter,
	buildingId: number,
	metadata: BuildingMetadata | undefined,
	tags: Record<string, string> | undefined,
	shared: SharedIds
): void {
	const props: number[] = [];

	// --- Geometry metadata ---
	if (metadata) {
		if (metadata.height !== undefined)
			props.push(
				w.write(
					'IFCPROPERTYSINGLEVALUE',
					`'Height',$,IFCLENGTHMEASURE(${fmtStepReal(metadata.height)}),$`
				)
			);
		if (metadata.minHeight !== undefined)
			props.push(
				w.write(
					'IFCPROPERTYSINGLEVALUE',
					`'MinHeight',$,IFCLENGTHMEASURE(${fmtStepReal(metadata.minHeight)}),$`
				)
			);
		if (metadata.levels !== undefined)
			props.push(
				w.write('IFCPROPERTYSINGLEVALUE', `'Levels',$,IFCINTEGER(${Math.round(metadata.levels)}),$`)
			);
		if (metadata.roofShape)
			props.push(
				w.write(
					'IFCPROPERTYSINGLEVALUE',
					`'RoofShape',$,IFCLABEL('${escapeIfcString(metadata.roofShape)}'),$`
				)
			);
		if (metadata.roofHeight !== undefined)
			props.push(
				w.write(
					'IFCPROPERTYSINGLEVALUE',
					`'RoofHeight',$,IFCLENGTHMEASURE(${fmtStepReal(metadata.roofHeight)}),$`
				)
			);
		if (metadata.shape)
			props.push(
				w.write(
					'IFCPROPERTYSINGLEVALUE',
					`'BuildingShape',$,IFCLABEL('${escapeIfcString(metadata.shape)}'),$`
				)
			);
	}

	// --- OSM tags ---
	const tagMap: [string, string, 'label' | 'text'][] = [
		['building', 'BuildingType', 'label'],
		['building:material', 'Material', 'label'],
		['building:colour', 'Colour', 'label'],
		['building:color', 'Colour', 'label'],
		['start_date', 'StartDate', 'label'],
		['architect', 'Architect', 'label'],
		['amenity', 'Amenity', 'label'],
		['heritage', 'Heritage', 'label'],
		['description', 'Description', 'text']
	];

	if (tags) {
		for (const [osmKey, ifcName, type] of tagMap) {
			const val = tags[osmKey];
			if (val && !(osmKey === 'building' && val === 'yes')) {
				const ifcType = type === 'text' ? 'IFCTEXT' : 'IFCLABEL';
				props.push(
					w.write(
						'IFCPROPERTYSINGLEVALUE',
						`'${ifcName}',$,${ifcType}('${escapeIfcString(val)}'),$`
					)
				);
			}
		}
	}

	// --- Address (replaces deprecated IfcPostalAddress in IFC4X3) ---
	if (tags) {
		if (tags['addr:street'])
			props.push(
				w.write(
					'IFCPROPERTYSINGLEVALUE',
					`'Street',$,IFCLABEL('${escapeIfcString(tags['addr:street'])}'),$`
				)
			);
		if (tags['addr:housenumber'])
			props.push(
				w.write(
					'IFCPROPERTYSINGLEVALUE',
					`'HouseNumber',$,IFCLABEL('${escapeIfcString(tags['addr:housenumber'])}'),$`
				)
			);
		if (tags['addr:postcode'])
			props.push(
				w.write(
					'IFCPROPERTYSINGLEVALUE',
					`'PostalCode',$,IFCLABEL('${escapeIfcString(tags['addr:postcode'])}'),$`
				)
			);
		if (tags['addr:city'])
			props.push(
				w.write(
					'IFCPROPERTYSINGLEVALUE',
					`'City',$,IFCLABEL('${escapeIfcString(tags['addr:city'])}'),$`
				)
			);
		if (tags['addr:country'])
			props.push(
				w.write(
					'IFCPROPERTYSINGLEVALUE',
					`'Country',$,IFCLABEL('${escapeIfcString(tags['addr:country'])}'),$`
				)
			);
	}

	// --- Attribution (always present) ---
	props.push(w.write('IFCPROPERTYSINGLEVALUE', "'Source',$,IFCLABEL('OpenStreetMap'),$"));
	props.push(
		w.write(
			'IFCPROPERTYSINGLEVALUE',
			`'Copyright',$,IFCTEXT('${escapeIfcString('© OpenStreetMap contributors, ODbL')}'),$`
		)
	);

	const propRefs = props.map((p) => `#${p}`).join(',');
	const psetId = w.write(
		'IFCPROPERTYSET',
		`'${generateIfcGuid()}',#${shared.ownerHistory},'swzpln',$,(${propRefs})`
	);
	w.write(
		'IFCRELDEFINESBYPROPERTIES',
		`'${generateIfcGuid()}',#${shared.ownerHistory},$,$,(#${buildingId}),#${psetId}`
	);
}

function writeTerrainPset(w: IfcWriter, terrainId: number, shared: SharedIds): void {
	const props: number[] = [];
	props.push(
		w.write(
			'IFCPROPERTYSINGLEVALUE',
			"'Source',$,IFCLABEL('OpenTopoData / Mapzen Terrain Tiles'),$"
		)
	);
	props.push(
		w.write(
			'IFCPROPERTYSINGLEVALUE',
			`'Copyright',$,IFCTEXT('${escapeIfcString('© OpenStreetMap contributors, © Mapzen')}'),$`
		)
	);

	const propRefs = props.map((p) => `#${p}`).join(',');
	const psetId = w.write(
		'IFCPROPERTYSET',
		`'${generateIfcGuid()}',#${shared.ownerHistory},'swzpln',$,(${propRefs})`
	);
	w.write(
		'IFCRELDEFINESBYPROPERTIES',
		`'${generateIfcGuid()}',#${shared.ownerHistory},$,$,(#${terrainId}),#${psetId}`
	);
}

// ============================================================================
// Terrain (IfcTriangulatedIrregularNetwork — IFC 4.3)
// ============================================================================

function writeTerrain(w: IfcWriter, terrainMesh: TerrainMesh, shared: SharedIds): number {
	// IfcCartesianPointList3D — all terrain vertices (CoordList, TagList)
	const coordList = terrainMesh.vertices
		.map((v) => `(${fmtR(v.x)},${fmtR(v.y)},${fmtR(v.z)})`)
		.join(',');
	const pointListId = w.write('IFCCARTESIANPOINTLIST3D', `(${coordList}),$`);

	// IfcTriangulatedIrregularNetwork — triangle indices (1-based) + flags
	const numTriangles = terrainMesh.triangles.length / 3;
	const indexTuples: string[] = [];
	for (let i = 0; i < terrainMesh.triangles.length; i += 3) {
		indexTuples.push(
			`(${terrainMesh.triangles[i] + 1},${terrainMesh.triangles[i + 1] + 1},${terrainMesh.triangles[i + 2] + 1})`
		);
	}
	const flags = new Array(numTriangles).fill('0').join(',');

	const tinId = w.write(
		'IFCTRIANGULATEDIRREGULARNETWORK',
		`#${pointListId},$,.F.,(${indexTuples.join(',')}),$,(${flags})`
	);

	// Shape representation
	const shapeRep = w.write(
		'IFCSHAPEREPRESENTATION',
		`#${shared.subContext},'Body','Tessellation',(#${tinId})`
	);
	const prodShape = w.write('IFCPRODUCTDEFINITIONSHAPE', `$,$,(#${shapeRep})`);

	// Placement
	const placement = w.write(
		'IFCAXIS2PLACEMENT3D',
		`#${shared.origin},#${shared.zAxis},#${shared.xAxis}`
	);
	const localPlacement = w.write('IFCLOCALPLACEMENT', `#${shared.sitePlacement},#${placement}`);

	// IfcGeographicElement with TERRAIN type
	const terrainId = w.write(
		'IFCGEOGRAPHICELEMENT',
		`'${generateIfcGuid()}',#${shared.ownerHistory},'Terrain',$,$,#${localPlacement},#${prodShape},$,.TERRAIN.`
	);

	return terrainId;
}

// ============================================================================
// String Escaping
// ============================================================================

function escapeIfcString(s: string): string {
	let result = '';
	for (const char of s) {
		const code = char.codePointAt(0)!;
		if (code === 0x27)
			result += "''"; // single quote
		else if (code === 0x5c)
			result += '\\\\'; // backslash
		else if (code > 0x7e || code < 0x20) {
			// Non-ASCII / control chars → STEP \X2\ encoding
			result += `\\X2\\${code.toString(16).toUpperCase().padStart(4, '0')}\\X0\\`;
		} else result += char;
	}
	return result;
}

/** Format a real number for STEP coordinates, guarding against NaN/Infinity */
function fmtR(n: number): string {
	if (!isFinite(n)) return '0.';
	return n.toFixed(4);
}

/** Format a real number for STEP property values (ensures decimal point) */
function fmtStepReal(n: number): string {
	if (!isFinite(n)) return '0.';
	const s = String(n);
	return s.includes('.') ? s : s + '.';
}

// ============================================================================
// Main Export
// ============================================================================

/**
 * Export geometry objects and terrain to IFC 4.3 (IFC4X3_ADD2) format
 */
export async function exportToIFC(
	objects: GeometryObject[],
	elevationMatrix: number[][] | null,
	bounds: Bounds,
	onProgress?: ProgressCallback
): Promise<Uint8Array> {
	notify(onProgress, 0, m.progress_dxf_init());

	const w = new IfcWriter();

	// --- Terrain mesh ---
	let terrainMesh: TerrainMesh | null = null;
	let gridSize: { rows: number; cols: number } | null = null;
	const maxXY = getMaxXY(bounds);

	if (elevationMatrix) {
		notify(onProgress, 5, 'Generating terrain mesh...');
		terrainMesh = generateTerrainMesh(elevationMatrix, bounds);
		gridSize = { rows: elevationMatrix.length, cols: elevationMatrix[0]?.length || 0 };
	}

	// --- Extrude buildings ---
	notify(onProgress, 10, 'Extruding buildings...');
	const buildingObjects = objects.filter((obj) => obj.type === 'building' && obj.buildingMetadata);

	const buildingInputs = buildingObjects.map((b, i) => ({
		footprint: b.path,
		metadata: b.buildingMetadata!,
		id: i, // Track original index for tag/metadata lookup after reordering
		relationId: b.relationId,
		isOutline: b.isOutline,
		holes: b.holes
	}));

	const meshes = extrudeBuildings(
		buildingInputs,
		terrainMesh || undefined,
		gridSize || undefined,
		maxXY
	);

	// --- Write IFC ---
	notify(onProgress, 20, 'Writing IFC entities...');

	// Header (written directly, not through IfcWriter)
	const header = writeHeader();

	// Global entities
	const shared = writeGlobalEntities(w, bounds);

	// Group meshes: relation parts → one IfcBuilding, singles → one each
	const relationGroups = new Map<number, BuildingMesh[]>();
	const singleMeshes: { mesh: BuildingMesh; srcIdx: number }[] = [];

	for (const mesh of meshes) {
		if (mesh.vertices.length === 0 || mesh.faces.length === 0) continue;
		const srcIdx = mesh.buildingId;
		const srcObj = srcIdx !== undefined ? buildingObjects[srcIdx] : undefined;

		if (srcObj?.relationId) {
			if (!relationGroups.has(srcObj.relationId)) relationGroups.set(srcObj.relationId, []);
			relationGroups.get(srcObj.relationId)!.push(mesh);
		} else {
			singleMeshes.push({ mesh, srcIdx: srcIdx ?? 0 });
		}
	}

	// Write buildings
	const buildingIds: number[] = [];
	let buildingCounter = 0;
	const totalBuildings = singleMeshes.length + relationGroups.size;

	// Single buildings (no relation)
	for (const { mesh, srcIdx } of singleMeshes) {
		const metadata = buildingObjects[srcIdx].buildingMetadata;
		const tags = buildingObjects[srcIdx].tags;
		const id = writeBuilding(w, [mesh], metadata, tags, shared, buildingCounter);
		buildingIds.push(id);
		buildingCounter++;

		if (buildingCounter % 50 === 0) {
			notify(
				onProgress,
				20 + Math.round((buildingCounter / totalBuildings) * 60),
				`Processing buildings: ${buildingCounter}/${totalBuildings}`
			);
		}
	}

	// Grouped buildings (relation parts merged into one IfcBuilding)
	for (const [relationId, groupMeshes] of relationGroups) {
		// Find outline object for relation-level tags (name, address, building type)
		const outline = buildingObjects.find((b) => b.relationId === relationId && b.isOutline);
		// Fall back to first part's data
		const firstPartIdx = groupMeshes[0].buildingId ?? 0;
		const tags = outline?.tags ?? buildingObjects[firstPartIdx]?.tags;
		const metadata = outline?.buildingMetadata ?? buildingObjects[firstPartIdx]?.buildingMetadata;

		const id = writeBuilding(w, groupMeshes, metadata, tags, shared, buildingCounter);
		buildingIds.push(id);
		buildingCounter++;

		if (buildingCounter % 50 === 0) {
			notify(
				onProgress,
				20 + Math.round((buildingCounter / totalBuildings) * 60),
				`Processing buildings: ${buildingCounter}/${totalBuildings}`
			);
		}
	}

	// Terrain
	let terrainElementId: number | null = null;
	if (terrainMesh && terrainMesh.vertices.length > 0 && terrainMesh.triangles.length > 0) {
		notify(onProgress, 85, 'Writing terrain...');
		terrainElementId = writeTerrain(w, terrainMesh, shared);
		writeTerrainPset(w, terrainElementId, shared);
	}

	// Spatial relationships
	notify(onProgress, 90, 'Writing relationships...');

	// Site → Buildings (IfcRelAggregates)
	if (buildingIds.length > 0) {
		const buildingRefs = buildingIds.map((id) => `#${id}`).join(',');
		w.write(
			'IFCRELAGGREGATES',
			`'${generateIfcGuid()}',#${shared.ownerHistory},$,$,#${shared.site},(${buildingRefs})`
		);
	}

	// Site → Terrain (IfcRelContainedInSpatialStructure)
	if (terrainElementId !== null) {
		w.write(
			'IFCRELCONTAINEDINSPATIALSTRUCTURE',
			`'${generateIfcGuid()}',#${shared.ownerHistory},$,$,(#${terrainElementId}),#${shared.site}`
		);
	}

	// Assemble final output
	notify(onProgress, 95, 'Finalizing...');
	const footer = 'ENDSEC;\nEND-ISO-10303-21;';
	const ifcContent = header + '\n' + w.toString() + '\n' + footer + '\n';

	notify(onProgress, 100, 'IFC export complete');
	return new TextEncoder().encode(ifcContent);
}

function notify(cb: ProgressCallback | undefined, percent: number, message: string) {
	if (cb) cb({ step: 'export', percent, message });
}
