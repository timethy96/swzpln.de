// Core type definitions for the Schwarzplan generation system

// ============================================================================
// Layer Types
// ============================================================================

export type Layer =
	| 'building'
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
}

// ============================================================================
// Export Types
// ============================================================================

export type ExportFormat = 'dxf' | 'svg' | 'pdf';

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
	osmData: OSMData;
	elevationMatrix: number[][] | null;
	bounds: Bounds;
	layers: Layer[];
	zoom: number;
	scale?: number;
	contourInterval?: number;
}

export interface WorkerProgressMessage {
	type: 'progress';
	data: ProgressInfo;
}

export interface WorkerCompleteMessage {
	type: 'complete';
	data: string | Blob;
	filename: string;
}

export interface WorkerErrorMessage {
	type: 'error';
	error: string;
}

export type WorkerMessage = WorkerProgressMessage | WorkerCompleteMessage | WorkerErrorMessage;

