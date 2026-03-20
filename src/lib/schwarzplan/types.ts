// Core type definitions for the Schwarzplan generation system

// ============================================================================
// Layer Types
// ============================================================================

export type Layer =
	| 'building'
	| 'building_parts'
	| 'highway'
	| 'railway'
	| 'water'
	| 'waterway'
	| 'green'
	| 'forest'
	| 'farmland'
	| 'contours';

export interface LayerConfig {
	color: string;
	fillable: boolean;
	overpassQuery: string;
	lineType?: 'CONTINUOUS' | 'DASHED';
	dxfColor?: number;
	matchTags?: Record<string, string | string[]>;
}

// ============================================================================
// Geographic Types
// ============================================================================

export interface Bounds {
	north: number;
	south: number;
	east: number;
	west: number;
}

export interface Coordinate {
	x: number;
	y: number;
}

export interface LatLng {
	lat: number;
	lng: number;
}

// ============================================================================
// OSM Types
// ============================================================================

export interface OSMNode {
	type: 'node';
	id: number;
	lat: number;
	lon: number;
	tags?: Record<string, string>;
}

export interface OSMWay {
	type: 'way';
	id: number;
	nodes: number[];
	tags?: Record<string, string>;
}

export interface OSMRelationMember {
	type: 'node' | 'way' | 'relation';
	ref: number;
	role: string;
}

export interface OSMRelation {
	type: 'relation';
	id: number;
	members: OSMRelationMember[];
	tags?: Record<string, string>;
}

export type OSMElement = OSMNode | OSMWay | OSMRelation;

export interface OSMData {
	version: number;
	generator: string;
	elements: OSMElement[];
}

// ============================================================================
// Geometry Types
// ============================================================================

export interface GeometryObject {
	type: Layer;
	path: Coordinate[];
	role?: string;
	// For highways: the specific highway type (motorway, primary, etc.)
	highwayType?: string;
	// For buildings: 3D metadata
	buildingMetadata?: BuildingMetadata;
	// For multi-part buildings: the relation ID to group them
	relationId?: number;
	// For multi-part buildings: true if this is just the 2D outline covering the whole building
	isOutline?: boolean;
	// For multipolygons: inner rings (holes)
	holes?: Coordinate[][];
	// Raw OSM tags (for IFC export)
	tags?: Record<string, string>;
}

// Building 3D metadata from OSM tags
export interface BuildingMetadata {
	shape?: string; // Building shape (from building:shape)
	height?: number; // Height in meters (from height tag or calculated from levels)
	minHeight?: number; // Minimum height in meters (from min_height)
	levels?: number; // Number of floors (from building:levels)
	minLevel?: number; // Starting floor level (from building:min_level)
	roofShape?: string; // Roof shape (from roof:shape)
	roofHeight?: number; // Additional roof height (from roof:height)
	roofLevels?: number; // Roof levels (from roof:levels)
	isPart?: boolean; // True if it comes from building:part
}

// ============================================================================
// Export Types
// ============================================================================

export type ExportFormat = 'dxf' | 'svg' | 'pdf' | 'ifc' | 'obj' | 'dxf3d';

export interface ExportOptions {
	format: ExportFormat;
	bounds: Bounds;
	layers: Layer[];
	zoom: number;
	scale?: number;
}

export interface ScaleOption {
	name: string;
	scale: number;
}

// ============================================================================
// Progress Types
// ============================================================================

export type ProgressStep =
	| 'init'
	| 'osm-download'
	| 'osm-parse'
	| 'elevation-download'
	| 'contours'
	| 'export'
	| 'complete'
	| 'error';

export interface ProgressInfo {
	step: ProgressStep;
	percent?: number;
	message?: string;
	stack?: string;
}

export type ProgressCallback = (info: ProgressInfo) => void;

// ============================================================================
// Contour Types
// ============================================================================

export interface ContourData {
	contours: ContourLine[];
	sizeX: number;
	sizeY: number;
}

export type ContourLine = Coordinate[];

export interface ElevationMatrix {
	data: number[][];
	rows: number;
	columns: number;
}

// ============================================================================
// Worker Message Types
// ============================================================================

export interface WorkerRequest {
	type: 'generate';
	format: ExportFormat;
	osmData: OSMData | null;
	geodata: GeoDataResponse | null;
	elevationMatrix: number[][] | null;
	bounds: Bounds;
	layers: Layer[];
	zoom: number;
	scale?: number;
	contourInterval?: number;
	buildingStyle?: 'filled' | 'outline';
}

// ============================================================================
// PostGIS Geodata Types
// ============================================================================

export interface GeoDataFeature {
	geojson: GeoJSON.Geometry;
	properties: Record<string, string | number | null>;
}

export interface GeoDataResponse {
	source: 'postgis' | 'unavailable';
	layers: Record<string, GeoDataFeature[]>;
}

export interface WorkerProgressMessage {
	type: 'progress';
	data: ProgressInfo;
}

export interface WorkerCompleteMessage {
	type: 'complete';
	data: string | Uint8Array | Blob;
	filename: string;
}

export interface WorkerErrorMessage {
	type: 'error';
	error: string;
}

export type WorkerMessage = WorkerProgressMessage | WorkerCompleteMessage | WorkerErrorMessage;

// ============================================================================
// 3D Geometry Types
// ============================================================================

// 3D coordinate with elevation
export interface Coordinate3D {
	x: number;
	y: number;
	z: number;
}

// Terrain mesh data structure (Triangulated Irregular Network)
export interface TerrainMesh {
	vertices: Coordinate3D[]; // All vertices with x,y,z coordinates
	triangles: number[]; // Triangle indices (groups of 3, referencing vertices array)
}

// Extruded building 3D mesh
export interface BuildingMesh {
	vertices: Coordinate3D[]; // All vertices including base and top
	faces: number[][]; // Face indices (each face is an array of vertex indices)
	buildingId?: number; // OSM way/relation ID
}
