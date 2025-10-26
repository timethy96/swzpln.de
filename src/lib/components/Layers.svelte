<script lang="ts">
	import LayerButton from './LayerButton.svelte';
	import SplitLayerButton from './SplitLayerButton.svelte';
	import { Building, Sprout, TreePine, Waves, Wheat, Car, TramFront, Mountain, Box, TrendingUp, Activity, ChartColumn } from 'lucide-svelte';
	import { is3DMode } from '$lib/stores/mapStore';
	
	function toggle3D(selected: boolean) {
		is3DMode.set(selected);
	}
	
	// Elevation lines dropdown options
	const elevationOptions = [
		{ icon: TrendingUp, label: '10m Intervall', id: 'elevation-10m', color: '#2F3A5A' },
		{ icon: ChartColumn, label: '20m Intervall', id: 'elevation-20m', color: '#3F4A6A' },
		{ icon: Activity, label: '50m Intervall', id: 'elevation-50m', color: '#4F5A7A' }
	];
</script>

<div class="flex flex-row gap-2 flex-wrap m-4 absolute top-18 z-10 max-w-[calc(90%-96px)]">
	{#if !$is3DMode}
		<LayerButton icon={Building} id="building" color="#000000" initialSelected={true}>Gebäude</LayerButton>
		<LayerButton icon={Sprout} id="green" color="#4A5A3A">Grünflächen</LayerButton>
		<LayerButton icon={TreePine} id="forest" color="#2F4A2F">Waldflächen</LayerButton>
		<LayerButton icon={Waves} id="water" color="#2F4A5A">Gewässer</LayerButton>
		<LayerButton icon={Wheat} id="agriculture-outline" color="#5A5A2F">Landwirtschaft</LayerButton>
		<LayerButton icon={Car} id="road" color="#5A2F2F">Straßen</LayerButton>
		<LayerButton icon={TramFront} id="train" color="#4A2F5A">Schienen</LayerButton>
		<SplitLayerButton icon={Mountain} id="height" color="#2F3A5A" dropdownItems={elevationOptions}>Höhenlinien</SplitLayerButton>
		<div class="border-l border-gray-500 h-8 mx-2 self-center"></div>
	{/if}
	<LayerButton icon={Box} id="3d" color="#5A2F4A" onToggle={toggle3D}>3D</LayerButton>
	{#if $is3DMode}
		<div class="border-l border-gray-500 h-8 mx-2 self-center"></div>
		<LayerButton icon={Building} id="3d-building" color="#000000" initialSelected={true}>Gebäude</LayerButton>
		<LayerButton icon={Mountain} id="3d-height" color="#2F3A5A">Gelände</LayerButton>
	{/if}
</div>
