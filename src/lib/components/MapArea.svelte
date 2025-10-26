<script lang="ts">
    import { MapLibre } from 'svelte-maplibre';
    import { NavigationControl } from 'svelte-maplibre';
    import { AttributionControl } from 'svelte-maplibre';
    import DownloadButton from './DownloadButton.svelte';
    import { mapLocation, mapExtent } from '$lib/stores/mapStore';
    
    // Use derived values directly from stores
    let center = $derived($mapLocation.center);
    let zoom = $derived($mapLocation.zoom);
    let mapInstance = $state<any>(null);

    // Handle extent changes only
    $effect(() => {
        if ($mapExtent && mapInstance) {
            mapInstance.fitBounds($mapExtent.bounds, {
                padding: 50,
                maxZoom: 18
            });
            // Clear extent after applying to prevent re-triggering
            mapExtent.set(null);
        }
    });

    // Using a grayscale style similar to your previous filter
    const style = "https://basemaps.cartocdn.com/gl/positron-gl-style/style.json";
</script>

<div class="map-container relative m-4 ml-0 mt-0 rounded-xl h-full w-auto bg-gray-200 border border-gray-300">
    <MapLibre
        {center}
        {zoom}
        {style}
        class="map"
        attributionControl={false}
        bind:map={mapInstance}
    >
        {#snippet children({ map })}
            <!-- Only zoom controls (NavigationControl shows zoom buttons) -->
            <NavigationControl position="top-right" showCompass={false} />
            
            <!-- Attribution control positioned on the left -->
            <AttributionControl position="bottom-left" />
        {/snippet}
    </MapLibre>
    <DownloadButton />
</div>

<style>
    .map-container {
        overflow: hidden;
    }
    
    :global(.map) {
        height: 100% !important;
        width: 100% !important;
        border-radius: 0.75rem; /* rounded-xl equivalent */
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