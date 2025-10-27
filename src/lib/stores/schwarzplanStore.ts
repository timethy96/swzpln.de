// Schwarzplan generation state management

import { writable, derived } from 'svelte/store';
import type { Layer, ProgressInfo, ExportFormat } from '$lib/schwarzplan/types';

// Cookie utilities (browser-only)
function setCookie(name: string, value: string, days: number): void {
	if (typeof document === 'undefined') return;
	const expires = new Date();
	expires.setTime(expires.getTime() + days * 24 * 60 * 60 * 1000);
	document.cookie = `${name}=${value};expires=${expires.toUTCString()};path=/`;
}

function getCookie(name: string): string | null {
	if (typeof document === 'undefined') return null;
	const nameEQ = name + '=';
	const ca = document.cookie.split(';');
	for (let i = 0; i < ca.length; i++) {
		let c = ca[i];
		while (c.charAt(0) === ' ') c = c.substring(1, c.length);
		if (c.indexOf(nameEQ) === 0) return c.substring(nameEQ.length, c.length);
	}
	return null;
}

// Default layers
const DEFAULT_LAYERS: Layer[] = ['building', 'highway', 'water', 'green'];

// Load saved layers from cookie
function loadLayersFromCookie(): Layer[] {
	const saved = getCookie('layers');
	if (saved) {
		try {
			const boolLayers = JSON.parse(saved) as boolean[];
			const allLayers: Layer[] = [
				'building',
				'highway',
				'railway',
				'water',
				'green',
				'forest',
				'farmland',
				'contours'
			];
			return allLayers.filter((_, index) => boolLayers[index]);
		} catch {
			return DEFAULT_LAYERS;
		}
	}
	return DEFAULT_LAYERS;
}

// Save layers to cookie
function saveLayersToCookie(layers: Layer[]): void {
	const allLayers: Layer[] = [
		'building',
		'highway',
		'railway',
		'water',
		'green',
		'forest',
		'farmland',
		'contours'
	];
	const boolLayers = allLayers.map((layer) => layers.includes(layer));
	setCookie('layers', JSON.stringify(boolLayers), 30);
}

// Selected layers
export const selectedLayers = writable<Layer[]>(loadLayersFromCookie());

// Subscribe to changes and save to cookie (browser only)
if (typeof document !== 'undefined') {
	selectedLayers.subscribe((layers) => {
		saveLayersToCookie(layers);
	});
}

// Progress state
export const progress = writable<ProgressInfo | null>(null);

// Export dialog state
export const exportDialogOpen = writable(false);
export const selectedFormat = writable<ExportFormat>('dxf');
export const selectedScale = writable<number | undefined>(undefined);

// Privacy consent
function loadPrivacyConsent(): boolean {
	const consent = getCookie('privacy_accepted');
	return consent === 'true';
}

export const privacyAccepted = writable(loadPrivacyConsent());

export function acceptPrivacy(): void {
	setCookie('privacy_accepted', 'true', 365);
	privacyAccepted.set(true);
}

// Helper to check if generation is in progress
export const isGenerating = derived(progress, ($progress) => {
	return $progress !== null && $progress.step !== 'complete' && $progress.step !== 'error';
});

// Helper to toggle a layer
export function toggleLayer(layer: Layer): void {
	selectedLayers.update((layers) => {
		if (layers.includes(layer)) {
			return layers.filter((l) => l !== layer);
		} else {
			return [...layers, layer];
		}
	});
}

// Selected contour interval (in meters)
export const contourInterval = writable<number>(10); // Default 10m

// Helper to set contour interval
export function setContourInterval(interval: number): void {
	contourInterval.set(interval);
}

