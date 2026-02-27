<script lang="ts">
	import { MapLibre } from 'svelte-maplibre';
	import { NavigationControl } from 'svelte-maplibre';
	import { AttributionControl } from 'svelte-maplibre';
	import DownloadButton from './DownloadButton.svelte';
	import { Skeleton } from '$lib/components/ui/skeleton';
	import { appState } from '$lib/state.svelte';
	import { onMount } from 'svelte';

	let mapInstance = $state<any>(null);
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
		if (mapInstance) {
			const updateState = () => {
				const bounds = mapInstance.getBounds();
				const center = mapInstance.getCenter();
				const zoom = mapInstance.getZoom();

				// Update state without triggering loops (basic equality check logic is in state setter if needed, but direct assignment is fine)
				appState.setBounds({
					north: bounds.getNorth(),
					south: bounds.getSouth(),
					east: bounds.getEast(),
					west: bounds.getWest()
				});

				// Update location (persisted to cookie by state effect)
				appState.setLocation([center.lng, center.lat], zoom);
			};

			mapInstance.on('moveend', updateState);
			updateState(); // Initial sync

			// Force disable interactions that might persist or default to enabled
			mapInstance.dragRotate.disable();
			mapInstance.touchPitch.disable();
			mapInstance.touchZoomRotate.disableRotation();

			return () => {
				mapInstance.off('moveend', updateState);
			};
		}
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
			{#snippet children({ map })}
				<NavigationControl position="top-right" showCompass={false} />
				<AttributionControl position="bottom-left" />
			{/snippet}
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
