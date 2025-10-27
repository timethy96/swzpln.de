// Coordinate conversion utilities using Haversine formula

import type { Bounds, Coordinate, LatLng } from '../types';

const EARTH_RADIUS_METERS = 6371000;

/**
 * Convert degrees to radians
 */
function toRadians(degrees: number): number {
	return (degrees * Math.PI) / 180;
}

/**
 * Calculate distance between two points using Haversine formula
 */
function haversineDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
	const dLat = toRadians(lat2 - lat1);
	const dLon = toRadians(lon2 - lon1);

	const a =
		Math.sin(dLat / 2) * Math.sin(dLat / 2) +
		Math.cos(toRadians(lat1)) *
			Math.cos(toRadians(lat2)) *
			Math.sin(dLon / 2) *
			Math.sin(dLon / 2);

	const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
	return EARTH_RADIUS_METERS * c;
}

/**
 * Convert lat/lng to XY coordinates in meters relative to bounds
 * Returns [x, y] where origin is at southwest corner
 */
export function latLngToXY(bounds: Bounds, lat: number, lng: number): Coordinate {
	// Calculate X (east-west distance)
	const x = haversineDistance(bounds.south, bounds.west, bounds.south, lng);

	// Calculate Y (north-south distance)
	const y = haversineDistance(bounds.south, bounds.west, lat, bounds.west);

	// Adjust signs based on direction
	const xSigned = lng < bounds.west ? -x : x;
	const ySigned = lat < bounds.south ? -y : y;

	return { x: xSigned, y: ySigned };
}

/**
 * Get the maximum XY coordinates for a bounds (northeast corner)
 */
export function getMaxXY(bounds: Bounds): Coordinate {
	return latLngToXY(bounds, bounds.north, bounds.east);
}

/**
 * Normalize longitude to -180 to 180 range
 */
export function normalizeLongitude(lng: number): number {
	while (Math.abs(lng) > 180) {
		lng = (Math.abs(lng) - 360) * (Math.abs(lng) / lng);
	}
	return lng;
}

/**
 * Convert bounds object to array format [north, west, south, east]
 */
export function boundsToArray(bounds: Bounds): [number, number, number, number] {
	return [bounds.north, bounds.west, bounds.south, bounds.east];
}

/**
 * Convert array format to bounds object
 */
export function arrayToBounds(arr: [number, number, number, number]): Bounds {
	return {
		north: arr[0],
		west: arr[1],
		south: arr[2],
		east: arr[3]
	};
}

/**
 * Calculate contour line interval based on zoom level
 */
export function getContourInterval(zoom: number): number {
	if (zoom >= 18) return 1;
	if (zoom >= 17) return 2;
	if (zoom >= 16) return 5;
	if (zoom >= 15) return 10;
	if (zoom >= 14) return 20;
	if (zoom >= 13) return 50;
	if (zoom >= 12) return 100;
	return 200;
}


