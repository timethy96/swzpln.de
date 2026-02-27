// Terrain mesh generation from elevation data

import type { TerrainMesh, Coordinate3D, Bounds } from '../types';
import { getMaxXY } from '../geometry/coordinates';

/**
 * Generate a triangulated terrain mesh from elevation matrix
 * Uses simple grid triangulation (2 triangles per quad)
 */
export function generateTerrainMesh(
	elevationMatrix: number[][],
	bounds: Bounds
): TerrainMesh {
	const vertices: Coordinate3D[] = [];
	const triangles: number[] = [];

	// Get map dimensions in meters
	const maxXY = getMaxXY(bounds);
	const rows = elevationMatrix.length;
	const cols = elevationMatrix[0]?.length || 0;

	if (rows === 0 || cols === 0) {
		return { vertices: [], triangles: [] };
	}

	// Create vertices grid with elevation data
	for (let row = 0; row < rows; row++) {
		for (let col = 0; col < cols; col++) {
			const x = (col / (cols - 1)) * maxXY.x;
			const y = (row / (rows - 1)) * maxXY.y; // Map row index directly to Y (Row 0 = South = y0)
			const z = elevationMatrix[row][col] || 0;

			vertices.push({ x, y, z });
		}
	}

	// Create triangles (2 per quad)
	// Triangle winding order: counter-clockwise for correct normals
	for (let row = 0; row < rows - 1; row++) {
		for (let col = 0; col < cols - 1; col++) {
			const topLeft = row * cols + col;
			const topRight = row * cols + col + 1;
			const bottomLeft = (row + 1) * cols + col;
			const bottomRight = (row + 1) * cols + col + 1;

			// First triangle (top-left, bottom-left, top-right)
			triangles.push(topLeft, bottomLeft, topRight);

			// Second triangle (top-right, bottom-left, bottom-right)
			triangles.push(topRight, bottomLeft, bottomRight);
		}
	}


	return { vertices, triangles };
}

/**
 * Interpolate terrain elevation at a specific XY coordinate
 */
export function interpolateTerrainElevation(
	point: { x: number; y: number },
	terrainMesh: { vertices: Coordinate3D[] },
	gridSize: { rows: number; cols: number },
	maxXY: { x: number; y: number }
): number {
	const gx = (point.x / maxXY.x) * (gridSize.cols - 1);
	const gy = (point.y / maxXY.y) * (gridSize.rows - 1);

	const x0 = Math.floor(gx);
	const y0 = Math.floor(gy);
	const x1 = Math.min(x0 + 1, gridSize.cols - 1);
	const y1 = Math.min(y0 + 1, gridSize.rows - 1);

	const v00 = terrainMesh.vertices[y0 * gridSize.cols + x0];
	const v10 = terrainMesh.vertices[y0 * gridSize.cols + x1];
	const v01 = terrainMesh.vertices[y1 * gridSize.cols + x0];
	const v11 = terrainMesh.vertices[y1 * gridSize.cols + x1];

	if (!v00 || !v10 || !v01 || !v11) return 0;

	const fx = gx - x0;
	const fy = gy - y0;

	const z0 = v00.z * (1 - fx) + v10.z * fx;
	const z1 = v01.z * (1 - fx) + v11.z * fx;

	return z0 * (1 - fy) + z1 * fy;
}



