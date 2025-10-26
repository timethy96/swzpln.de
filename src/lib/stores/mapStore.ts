import { writable } from 'svelte/store';

export interface MapLocation {
    center: [number, number]; // [longitude, latitude]
    zoom: number;
}

export interface MapExtent {
    bounds: [[number, number], [number, number]]; // [[minLon, minLat], [maxLon, maxLat]]
}

// Initial map location (centered on London)
const initialLocation: MapLocation = {
    center: [-0.09, 51.505],
    zoom: 13
};

export const mapLocation = writable<MapLocation>(initialLocation);
export const mapExtent = writable<MapExtent | null>(null);
export const is3DMode = writable<boolean>(false);

// Helper function to update map location
export function setMapLocation(coordinates: [number, number], zoom: number = 14) {
    mapLocation.set({
        center: coordinates,
        zoom
    });
    mapExtent.set(null); // Clear extent when setting point location
}

// Helper function to set map to fit extent
export function setMapExtent(extent: [number, number, number, number]) {
    const [minLon, minLat, maxLon, maxLat] = extent;
    mapExtent.set({
        bounds: [[minLon, minLat], [maxLon, maxLat]]
    });
}
