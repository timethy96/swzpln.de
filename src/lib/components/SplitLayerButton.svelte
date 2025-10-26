<script lang="ts">
    import { Button } from '$lib/components/ui/button';
    import * as Popover from '$lib/components/ui/popover';
    import { ChevronDown } from 'lucide-svelte';
    
    // Props interface
    let { 
        icon, 
        color, 
        id, 
        children, 
        initialSelected = false, 
        onToggle = undefined,
        dropdownItems = [] // Array of {icon, label, id, color?} objects
    } = $props();

    let selected = $state(initialSelected);
    let open = $state(false);
   
    // Main button click handler
    function handleMainClick() {
        selected = !selected;
        if (onToggle) {
            onToggle(selected);
        }
    }
    
    // Dropdown item click handler
    function handleDropdownItemClick(item: any) {
        open = false;
        // You can extend this to handle item-specific logic
        console.log('Dropdown item clicked:', item);
    }
</script>

<div class="flex hover:scale-105 transition-all duration-300 ease-out transform">
    <!-- Main button -->
    <Button 
        variant="outline" 
        class="h-10 px-3 gap-2 border-gray-300 font-medium transition-all duration-300 ease-out transform rounded-l-3xl rounded-r-none border-r-0 active:scale-95 {selected ? 'text-white shadow-lg' : 'text-[var(--foreground)] hover:bg-[var(--background)]/80'}"
        style={selected ? `background-color: ${color}; border-color: ${color}; box-shadow: 0 4px 12px ${color}40;` : 'background-color: var(--background);'}
        onclick={handleMainClick} 
        {id}
    >
        {#if icon}
            {@const IconComponent = icon}
            <IconComponent class="h-4 w-4 transition-colors duration-300 {selected ? 'text-white' : ''}" />
        {/if}
        <span class="text-base transition-colors duration-300 {selected ? 'text-white' : ''}">
            {@render children?.()}
        </span>
    </Button>

    <!-- Dropdown trigger -->
    <Popover.Root bind:open>
        <Popover.Trigger 
            class="h-10 px-2 border rounded-r-3xl rounded-l-none transition-all duration-300 ease-out transform active:scale-95 {selected ? 'text-white shadow-lg' : 'text-[var(--foreground)] hover:bg-[var(--background)]/80'} inline-flex items-center justify-center whitespace-nowrap font-medium ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50"
            style={selected ? `background-color: ${color}; border-color: ${color}; border-left-color: #AAA; box-shadow: 0 4px 12px ${color}40;` : 'background-color: var(--background);'}
        >
            <ChevronDown class="h-3 w-3 transition-colors duration-300 {selected ? 'text-white' : ''}" />
        </Popover.Trigger>
        
        <Popover.Content class="w-56 p-2" align="start">
            <div class="space-y-1">
                {#each dropdownItems as item}
                    <button
                        class="flex items-center gap-2 w-full px-3 py-2 text-sm rounded-lg hover:bg-gray-100 transition-colors duration-200"
                        onclick={() => handleDropdownItemClick(item)}
                    >
                        {#if item.icon}
                            {@const ItemIcon = item.icon}
                            <ItemIcon class="h-4 w-4" style={item.color ? `color: ${item.color}` : ''} />
                        {/if}
                        <span>{item.label}</span>
                    </button>
                {/each}
            </div>
        </Popover.Content>
    </Popover.Root>
</div>
