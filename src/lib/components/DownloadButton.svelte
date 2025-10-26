<script lang="ts">
    import { Button } from '$lib/components/ui/button';
    import { Download } from 'lucide-svelte';
    import { is3DMode } from '$lib/stores/mapStore';

    let dlOpen = $state(false);
</script>

<div class="absolute bottom-4 right-4 flex flex-col items-center gap-2">
    <!-- Download format buttons -->
    <div class:closed={!dlOpen} class="transition-all duration-300">
        {#if $is3DMode}
            <!-- 3D formats -->
            <Button 
                class="h-14 w-14 rounded-lg text-xs font-bold absolute right-3 bottom-60 cursor-pointer hover:scale-105 active:scale-95 shadow-lg"
                onclick={() => {
                    console.log("download IFC");
                }}
            >
                IFC
            </Button>
            <Button 
                class="h-14 w-14 rounded-lg text-xs font-bold absolute right-3 bottom-42 cursor-pointer hover:scale-105 active:scale-95 shadow-lg"
                onclick={() => {
                    console.log("download 3DM");
                }}
            >
                3DM
            </Button>
            <Button 
                class="h-14 w-14 rounded-lg text-xs font-bold absolute right-3 bottom-24 cursor-pointer hover:scale-105 active:scale-95 shadow-lg"
                onclick={() => {
                    console.log("download 3D-DXF");
                }}
            >
                3D-DXF
            </Button>
        {:else}
            <!-- 2D formats -->
            <Button 
                class="h-14 w-14 rounded-lg text-xs font-bold absolute right-3 bottom-60 cursor-pointer hover:scale-105 active:scale-95 shadow-lg"
                onclick={() => {
                    console.log("download PDF");
                }}
            >
                PDF
            </Button>
            <Button 
                class="h-14 w-14 rounded-lg text-xs font-bold absolute right-3 bottom-42 cursor-pointer hover:scale-105 active:scale-95 shadow-lg"
                onclick={() => {
                    console.log("download SVG");
                }}
            >
                SVG
            </Button>
            <Button 
                class="h-14 w-14 rounded-lg text-xs font-bold absolute right-3 bottom-24 cursor-pointer hover:scale-105 active:scale-95 shadow-lg"
                onclick={() => {
                    console.log("download DXF");
                }}
            >
                DXF
            </Button>
        {/if}
    </div>
    
    <!-- Main download toggle button -->
    <Button 
        class="h-20 w-20 z-10 rounded-2xl cursor-pointer hover:scale-105 active:scale-95 shadow-lg"
        onclick={() => {
            dlOpen = !dlOpen;
        }}
    >
        <Download class="text-background size-6" />
    </Button>
</div>

<style>
    :global(.closed > button) {
        pointer-events: none;
        opacity: 0;
        bottom: 0.75rem;

    }
</style>