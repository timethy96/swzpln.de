import { browser } from '$app/environment';
import type { Layer, ProgressInfo } from '$lib/schwarzplan/types';

/**
 * Global Application State using Svelte 5 Runes
 * Replaces all legacy Svelte Stores
 */
class AppState {
	// --- Map State ---
	location = $state({
		center: [13.405, 52.52] as [number, number],
		zoom: 13
	});

	// Bounds are derived from the map instance usually, but we store current view here
	bounds = $state<{ north: number; south: number; east: number; west: number } | null>(null);

	// Requested extent to fit (ephemeral)
	requestExtent = $state<[[number, number], [number, number]] | null>(null);

	// Requested flyTo (ephemeral)
	requestFlyTo = $state<{ center: [number, number]; zoom: number } | null>(null);

	is3DMode = $state(false);

	// --- Schwarzplan State ---
	layers = $state<Layer[]>(['building', 'highway', 'water', 'green']);

	selected3DLayers = $state({
		building: true,
		height: false
	});

	contourInterval = $state(10);
	buildingStyle = $state<'filled' | 'outline'>('filled'); // New state

	// --- Process State ---
	privacyAccepted = $state(false);
	helpOverlayOpen = $state(false);

	// Progress for downloads/exports
	progress = $state<ProgressInfo | null>(null);

	// --- Constructor & Persistence ---
	constructor() {
		if (browser) {
			this.loadFromCookies();

			// Auto-save effects
			$effect.root(() => {
				$effect(() => this.saveToCookie('map_location', this.location));
				$effect(() => this.saveToCookie('is3DMode', this.is3DMode));
				$effect(() => this.saveToCookie('layers', this.layers));
				$effect(() => this.saveToCookie('3d_layers', this.selected3DLayers));
				$effect(() => this.saveToCookie('privacy_accepted', this.privacyAccepted));
				$effect(() => this.saveToCookie('building_style', this.buildingStyle));
			});
		}
	}

	// --- Actions ---

	toggleHelpOverlay() {
		this.helpOverlayOpen = !this.helpOverlayOpen;
	}

	setLocation(center: [number, number], zoom: number) {
		if (
			Math.abs(this.location.center[0] - center[0]) < 0.000001 &&
			Math.abs(this.location.center[1] - center[1]) < 0.000001 &&
			Math.abs(this.location.zoom - zoom) < 0.01
		) {
			return;
		}
		this.location = { center, zoom };
		this.requestExtent = null; // Clear any pending extent request
		this.requestFlyTo = null;
	}

	flyTo(center: [number, number], zoom: number) {
		this.requestFlyTo = { center, zoom };
		this.requestExtent = null;
	}

	fitBounds(minLon: number, minLat: number, maxLon: number, maxLat: number) {
		this.requestExtent = [
			[minLon, minLat],
			[maxLon, maxLat]
		];
		this.requestFlyTo = null;
	}

	setBounds(b: { north: number; south: number; east: number; west: number }) {
		if (
			this.bounds &&
			Math.abs(this.bounds.north - b.north) < 0.000001 &&
			Math.abs(this.bounds.south - b.south) < 0.000001 &&
			Math.abs(this.bounds.east - b.east) < 0.000001 &&
			Math.abs(this.bounds.west - b.west) < 0.000001
		) {
			return;
		}
		this.bounds = b;
	}

	toggleLayer(layer: Layer) {
		if (this.layers.includes(layer)) {
			this.layers = this.layers.filter((l) => l !== layer);
		} else {
			this.layers = [...this.layers, layer];
		}
	}

	toggle3DLayer(layer: 'building' | 'height', value: boolean) {
		this.selected3DLayers[layer] = value;
	}

	acceptPrivacy() {
		this.privacyAccepted = true;
	}

	// --- Persistence Helpers ---

	private loadFromCookies() {
		this.layers = this.loadCookie('layers', ['building', 'highway', 'water', 'green']);
		this.is3DMode = this.loadCookie('is3DMode', false);
		this.selected3DLayers = this.loadCookie('3d_layers', { building: true, height: false });
		this.privacyAccepted = this.loadCookie('privacy_accepted', false);
		this.buildingStyle = this.loadCookie('building_style', 'filled');

		const savedLoc = this.loadCookie('map_location', null);
		if (savedLoc) this.location = savedLoc;
	}

	private loadCookie<T>(name: string, fallback: T): T {
		if (!browser) return fallback;
		const match = document.cookie.match(new RegExp('(^| )' + name + '=([^;]+)'));
		if (match) {
			try {
				return JSON.parse(decodeURIComponent(match[2]));
			} catch {
				return fallback;
			}
		}
		return fallback;
	}

	private saveToCookie(name: string, value: unknown) {
		if (!browser) return;
		const str = JSON.stringify(value);
		// eslint-disable-next-line svelte/prefer-svelte-reactivity
		const expires = new Date();
		expires.setTime(expires.getTime() + 30 * 24 * 60 * 60 * 1000); // 30 days
		document.cookie = `${name}=${encodeURIComponent(str)};expires=${expires.toUTCString()};path=/;SameSite=Lax;Secure`;
	}
}

// Singleton Instance
export const appState = new AppState();
