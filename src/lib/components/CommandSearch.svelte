<script lang="ts">
    import * as Command from '$lib/components/ui/command';
    import { setMapLocation, setMapExtent } from '$lib/stores/mapStore';

    let { open = $bindable(false) } = $props();
    
    let searchValue = $state('');
    let searchResults = $state<Array<{
        name: string;
        city?: string;
        country?: string;
        coordinates: [number, number];
        properties: Record<string, any>;
    }>>([]);
    let isLoading = $state(false);
    let searchTimeout: number;

    // Debounced search function
    async function performSearch(query: string) {
        if (!query.trim() || query.length < 2) {
            searchResults = [];
            return;
        }

        isLoading = true;
        
        try {
            // Use Photon API with German language preference
            const response = await fetch(
                `https://photon.komoot.io/api/?q=${encodeURIComponent(query)}&lang=de&limit=5`
            );
            
            if (!response.ok) {
                throw new Error('Search failed');
            }
            
            const data = await response.json();
            
            // Transform results to our format
            searchResults = data.features?.map((feature: any) => ({
                name: feature.properties.name || 'Unbekannter Ort',
                city: feature.properties.city,
                country: feature.properties.country,
                coordinates: feature.geometry.coordinates,
                properties: feature.properties
            })) || [];
            
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
        searchTimeout = setTimeout(() => performSearch(value), 1000);
    }

    // Handle location selection
    function selectLocation(result: typeof searchResults[0]) {
        
        // Use extent if available, otherwise fall back to point location
        const extent = result.properties.extent;
        if (extent && Array.isArray(extent) && extent.length === 4) {
            setMapExtent(extent as [number, number, number, number]);
        } else {
            // Fallback to point location with default zoom
            setMapLocation(result.coordinates, 15);
        }
        
        // Close dialog and reset state
        open = false;
        searchValue = '';
        searchResults = [];
    }
</script>

<Command.Dialog bind:open shouldFilter={false}>
    <Command.Input 
        placeholder="Suche nach Orten..." 
        bind:value={searchValue}
        oninput={(e) => handleSearchInput(e.currentTarget.value)}
    />
    <Command.List>
        {#if isLoading}
            <Command.Empty>Suche läuft...</Command.Empty>
        {:else if searchValue.length >= 2 && searchResults.length === 0 && !isLoading}
            <Command.Empty>Keine Orte gefunden.</Command.Empty>
        {:else if searchValue.length < 2}
            <Command.Empty>Geben Sie mindestens 2 Zeichen ein, um zu suchen.</Command.Empty>
        {/if}
        
        {#if searchResults.length > 0}
            <Command.Group heading="Orte">
                {#each searchResults as result}
                    <Command.Item value={result.name} onSelect={() => selectLocation(result)}>
                        <div class="flex flex-col">
                            <span class="font-medium">{result.name}</span>
                            {#if result.city || result.country}
                                <span class="text-sm text-muted-foreground">
                                    {#if result.city}{result.city}{/if}
                                    {#if result.city && result.country}, {/if}
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
