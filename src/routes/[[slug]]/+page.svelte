<script lang="ts">
	import Layers from '$lib/components/Layers.svelte';
	import MapArea from '$lib/components/MapArea.svelte';
	import PrivacyConsent from '$lib/components/PrivacyConsent.svelte';
	import SEO from '$lib/components/SEO.svelte';
	import { searchLocation } from '$lib/utils/search';
	import { appState } from '$lib/state.svelte';
	import { page } from '$app/stores';
	import { browser } from '$app/environment';
	import type { PageData } from './$types';

	let { data }: { data: PageData } = $props();

	// Get the slug from the URL using $derived
	const slug = $derived($page.params.slug);

	// Reactively run search whenever slug changes using $effect
	$effect(() => {
		if (slug && browser) {
			handleSearch(slug);
		}
	});

	async function handleSearch(query: string) {
		const features = await searchLocation(query);
		if (features.length > 0) {
			const feature = features[0];
			const coordinates = feature.geometry.coordinates;
			const extent = feature.properties.extent;

			if (extent && Array.isArray(extent) && extent.length === 4) {
				appState.fitBounds(extent[0], extent[1], extent[2], extent[3]);
			} else {
				appState.setLocation(coordinates, 15);
			}
		}
	}
</script>

<!-- SEO for city/location pages -->
{#if data.seo?.title}
	<SEO title={data.seo.title} description={data.seo.description} keywords={data.seo.keywords} />
{/if}

<Layers />
<MapArea />

<!-- Privacy consent dialog -->
<PrivacyConsent />

<style>
	:global(body) {
		height: 100vh;
		width: 100vw;
	}
</style>
