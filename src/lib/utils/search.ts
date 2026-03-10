import { getLocale } from '$lib/paraglide/runtime';

/**
 * Searches for a location using Photon API
 * @param query - The search query string
 * @param limit - Maximum number of results to return (default: 1)
 * @returns The search results, or empty array if search fails
 */
export interface PhotonFeature {
	type: string;
	geometry: { type: string; coordinates: [number, number] };
	properties: Record<string, string | number | number[] | undefined>;
}

export async function searchLocation(query: string, limit: number = 1): Promise<PhotonFeature[]> {
	try {
		const lang = getLocale();

		const response = await fetch(
			`https://photon.komoot.io/api/?q=${encodeURIComponent(query)}&lang=${lang}&limit=${limit}`
		);

		if (!response.ok) {
			return [];
		}

		const data = await response.json();

		// Check if we have results
		if (data.features && data.features.length > 0) {
			return data.features;
		}

		return [];
	} catch (error) {
		console.error('Search error:', error);
		return [];
	}
}

/**
 * Performs a search without centering the map, useful for displaying results
 * @param query - The search query string
 * @param limit - Maximum number of results to return (default: 5)
 * @returns The search results, or empty array if search fails
 */
export async function performSearch(query: string, limit: number = 5): Promise<PhotonFeature[]> {
	try {
		const lang = getLocale();

		const response = await fetch(
			`https://photon.komoot.io/api/?q=${encodeURIComponent(query)}&lang=${lang}&limit=${limit}`
		);

		if (!response.ok) {
			return [];
		}

		const data = await response.json();
		return data.features || [];
	} catch (error) {
		console.error('Search error:', error);
		return [];
	}
}
