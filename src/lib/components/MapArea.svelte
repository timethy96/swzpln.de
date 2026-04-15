<script lang="ts">
	import { MapLibre } from 'svelte-maplibre';
	import { NavigationControl } from 'svelte-maplibre';
	import { AttributionControl } from 'svelte-maplibre';
	import type { Map as MaplibreMap } from 'svelte-maplibre/types.js';
	import DownloadButton from './DownloadButton.svelte';
	import { Skeleton } from '$lib/components/ui/skeleton';
	import { appState } from '$lib/state.svelte';
	import { onMount } from 'svelte';

	let mapInstance = $state<MaplibreMap | undefined>(undefined);
	let isLoading = $state(true);

	onMount(() => {
		isLoading = false;
	});

	// Handle extent changes
	$effect(() => {
		if (appState.requestExtent && mapInstance) {
			mapInstance.fitBounds(appState.requestExtent, {
				padding: 50,
				maxZoom: 18,
				duration: 3000,
				essential: true
			});
			// Clear request (handled in store previously, now part of setLocation logic but safe here too)
		}
	});

	// Handle flyTo requests
	$effect(() => {
		if (appState.requestFlyTo && mapInstance) {
			mapInstance.flyTo({
				center: appState.requestFlyTo.center,
				zoom: appState.requestFlyTo.zoom,
				essential: true,
				duration: 3000
			});
		}
	});

	// Sync map movements to state
	$effect(() => {
		const map = mapInstance;
		if (!map) return;

		const updateState = () => {
			const bounds = map.getBounds();
			const center = map.getCenter();
			const zoom = map.getZoom();

			appState.setBounds({
				north: bounds.getNorth(),
				south: bounds.getSouth(),
				east: bounds.getEast(),
				west: bounds.getWest()
			});

			appState.setLocation([center.lng, center.lat], zoom);
		};

		map.on('moveend', updateState);
		updateState();

		// Force disable interactions that might persist or default to enabled
		map.dragRotate.disable();
		map.touchPitch.disable();
		map.touchZoomRotate.disableRotation();

		return () => {
			map.off('moveend', updateState);
		};
	});

	const style = 'https://basemaps.cartocdn.com/gl/positron-gl-style/style.json';
</script>

<div
	class="map-container relative m-4 mt-0 ml-0 h-full w-auto rounded-xl border border-gray-300 bg-gray-200"
>
	{#if isLoading || !appState.privacyAccepted}
		<div class="flex h-full w-full items-center justify-center p-0">
			<Skeleton class="h-full w-full rounded-xl" />
		</div>
	{:else}
		<MapLibre
			center={appState.location.center}
			zoom={appState.location.zoom}
			{style}
			class="map"
			attributionControl={false}
			bind:map={mapInstance}
			dragRotate={false}
		>
			<NavigationControl position="top-right" showCompass={false} />
			<AttributionControl position="bottom-left" />
		</MapLibre>
		<DownloadButton />
	{/if}
</div>

<style>
	.map-container {
		overflow: hidden;
	}

	:global(.map) {
		height: 100% !important;
		width: 100% !important;
		border-radius: 0.75rem;
	}

	:global(.maplibregl-ctrl-attrib a) {
		color: var(--foreground) !important;
	}

	:global(.maplibregl-canvas) {
		filter: grayscale(100%);
	}

	:global(.dark .maplibregl-canvas) {
		filter: grayscale(100%) invert(100%) brightness(150%);
	}
</style>
