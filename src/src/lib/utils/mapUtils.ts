import type { Map, LatLngBounds } from 'leaflet';

/**
 * Save the current map position to localStorage
 */
export function saveMapPosition(map: Map): void {
    const center = map.getCenter();
    const zoom = map.getZoom();
    localStorage.setItem('lastCenter', JSON.stringify([center.lat, center.lng, zoom]));
}

/**
 * Load the last map position from localStorage
 */
export function loadMapPosition(): [number, number, number] | null {
    const lastPos = localStorage.getItem('lastCenter');
    if (lastPos) {
        try {
            return JSON.parse(lastPos);
        } catch (e) {
            console.error('Failed to parse last position:', e);
        }
    }
    return null;
}

/**
 * Convert Leaflet bounds to array format
 */
export function bounds2array(bounds: LatLngBounds): [number, number, number, number] {
    let north = bounds.getNorth();
    let east = bounds.getEast();
    let south = bounds.getSouth();
    let west = bounds.getWest();
    
    // Normalize longitude to [-180, 180]
    while (Math.abs(east) > 180) {
        east = (Math.abs(east) - 360) * (Math.abs(east) / east);
    }
    while (Math.abs(west) > 180) {
        west = (Math.abs(west) - 360) * (Math.abs(west) / west);
    }
    
    return [north, west, south, east];
}

/**
 * Calculate contour lines interval based on zoom level
 */
export function getContourInterval(zoomLevel: number): number {
    if (zoomLevel >= 18) return 1;
    if (zoomLevel >= 17) return 2;
    if (zoomLevel >= 16) return 5;
    if (zoomLevel >= 15) return 10;
    if (zoomLevel >= 14) return 20;
    if (zoomLevel >= 13) return 50;
    if (zoomLevel >= 12) return 100;
    return 200;
}

/**
 * Estimate OSM file size based on zoom level
 */
export function estimateOsmFilesize(zoom: number): number {
    const zoomFactor = 19 - zoom;
    return 1.1 * 100000 * Math.pow(3, zoomFactor);
}

/**
 * Search for a location using Nominatim API
 */
export async function searchLocation(query: string): Promise<any[]> {
    try {
        const response = await fetch(
            `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&limit=5&addressdetails=1`
        );
        return await response.json();
    } catch (error) {
        console.error('Search failed:', error);
        return [];
    }
}

/**
 * Check if zoom level is sufficient for plan generation
 */
export function isZoomSufficient(zoom: number): boolean {
    return zoom >= 11;
}

/**
 * Get appropriate scales for PDF/SVG export based on map bounds and zoom
 */
export function getExportScales(map: Map): string[] {
    const zoom = map.getZoom();
    const bounds = map.getBounds();
    
    // Calculate approximate scale based on zoom level
    // This is a simplified calculation
    const baseScale = Math.pow(2, 18 - zoom) * 1000;
    
    return [
        `1:${Math.round(baseScale)}`,
        `1:${Math.round(baseScale * 2)}`,
        `1:${Math.round(baseScale * 5)}`
    ];
}