<script lang="ts">
	import * as Command from '$lib/components/ui/command';
	import { appState } from '$lib/state.svelte';
	import { searchLocation as searchLocationUtil, type PhotonFeature } from '$lib/utils/search';
	import * as m from '$lib/paraglide/messages';
	import LoaderCircle from '@lucide/svelte/icons/loader-circle';

	let { open = $bindable(false) } = $props();

	interface SearchResult {
		name: string;
		city?: string;
		country?: string;
		coordinates: [number, number];
		properties: PhotonFeature['properties'];
	}

	let searchValue = $state('');
	let searchResults = $state<SearchResult[]>([]);
	let isLoading = $state(false);
	let searchTimeout: ReturnType<typeof setTimeout>;

	// Debounced search function
	async function performSearch(query: string) {
		if (!query.trim() || query.length < 2) {
			searchResults = [];
			isLoading = false;
			return;
		}

		isLoading = true;

		try {
			const features = await searchLocationUtil(query, 5);

			// Transform results to our format
			searchResults = features.map((feature) => ({
				name: String(feature.properties.name || m.search_unknown_location()),
				city: feature.properties.city != null ? String(feature.properties.city) : undefined,
				country: feature.properties.country != null ? String(feature.properties.country) : undefined,
				coordinates: feature.geometry.coordinates,
				properties: feature.properties
			}));
		} catch (error) {
			console.error('Search error:', error);
			searchResults = [];
		} finally {
			isLoading = false;
		}
	}

	// Debounce search input
	function handleSearchInput(value: string) {
		searchValue = value;
		clearTimeout(searchTimeout);
		if (value.length >= 2) {
			isLoading = true;
		} else {
			isLoading = false;
		}
		searchTimeout = setTimeout(() => performSearch(value), 1000);
	}

	// Handle location selection
	function selectLocation(result: (typeof searchResults)[0]) {
		// Use extent if available, otherwise fall back to point location
		const extent = result.properties.extent;
		if (extent && Array.isArray(extent) && extent.length === 4) {
			appState.fitBounds(extent[0], extent[1], extent[2], extent[3]);
		} else {
			// Fallback to point location with default zoom
			appState.flyTo(result.coordinates, 15);
		}

		// Close dialog and reset state
		open = false;
		searchValue = '';
		searchResults = [];
	}
</script>

<Command.Dialog bind:open shouldFilter={false}>
	<Command.Input
		placeholder={m.search_placeholder()}
		bind:value={searchValue}
		oninput={(e) => handleSearchInput(e.currentTarget.value)}
	/>
	<Command.List>
		{#if isLoading}
			<div class="flex items-center justify-center py-6">
				<LoaderCircle class="size-6 animate-spin text-muted-foreground" />
			</div>
		{:else if searchValue.length >= 2 && searchResults.length === 0 && !isLoading}
			<Command.Empty>{m.search_no_results()}</Command.Empty>
		{:else if searchValue.length < 2}
			<Command.Empty>{m.search_min_chars()}</Command.Empty>
		{/if}

		{#if searchResults.length > 0}
			<Command.Group heading={m.search_locations_group()}>
				{#each searchResults as result (result.coordinates.join(','))}
					<Command.Item value={result.name} onSelect={() => selectLocation(result)}>
						<div class="flex flex-col">
							<span class="font-medium">{result.name}</span>
							{#if result.city || result.country}
								<span class="text-sm text-muted-foreground">
									{#if result.city}{result.city}{/if}
									{#if result.city && result.country},
									{/if}
									{#if result.country}{result.country}{/if}
								</span>
							{/if}
						</div>
					</Command.Item>
				{/each}
			</Command.Group>
		{/if}
	</Command.List>
</Command.Dialog>
