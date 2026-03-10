<script lang="ts">
	import LayerButton from './LayerButton.svelte';
	import SplitLayerButton from './SplitLayerButton.svelte';
	import { Skeleton } from '$lib/components/ui/skeleton';
	import Building from '@lucide/svelte/icons/building';
	import Sprout from '@lucide/svelte/icons/sprout';
	import TreePine from '@lucide/svelte/icons/tree-pine';
	import Waves from '@lucide/svelte/icons/waves';
	import Wheat from '@lucide/svelte/icons/wheat';
	import Car from '@lucide/svelte/icons/car';
	import TramFront from '@lucide/svelte/icons/tram-front';
	import Mountain from '@lucide/svelte/icons/mountain';
	import Box from '@lucide/svelte/icons/box';
	import TrendingUp from '@lucide/svelte/icons/trending-up';
	import Activity from '@lucide/svelte/icons/activity';
	import ChartColumn from '@lucide/svelte/icons/chart-column';
	import Minus from '@lucide/svelte/icons/minus';
	import Plus from '@lucide/svelte/icons/plus';
	import { appState } from '$lib/state.svelte';
	import { onMount } from 'svelte';
	import * as m from '$lib/paraglide/messages';

	let isLoading = $state(true);

	onMount(() => {
		isLoading = false;
	});

	// Helpers wrapping appState actions (or use directly in markup)

	// Elevation lines dropdown options with callbacks
	const elevationOptions = [
		{
			icon: Minus,
			label: m.layer_elevation_interval_1m(),
			id: 'elevation-1m',
			color: '#1F2A4A',
			value: 1,
			onSelect: () => (appState.contourInterval = 1)
		},
		{
			icon: Activity,
			label: m.layer_elevation_interval_5m(),
			id: 'elevation-5m',
			color: '#2A3A5A',
			value: 5,
			onSelect: () => (appState.contourInterval = 5)
		},
		{
			icon: TrendingUp,
			label: m.layer_elevation_interval_10m(),
			id: 'elevation-10m',
			color: '#2F3A5A',
			value: 10,
			onSelect: () => (appState.contourInterval = 10)
		},
		{
			icon: ChartColumn,
			label: m.layer_elevation_interval_20m(),
			id: 'elevation-20m',
			color: '#3F4A6A',
			value: 20,
			onSelect: () => (appState.contourInterval = 20)
		},
		{
			icon: Plus,
			label: m.layer_elevation_interval_50m(),
			id: 'elevation-50m',
			color: '#4F5A7A',
			value: 50,
			onSelect: () => (appState.contourInterval = 50)
		}
	];
</script>

<div class="absolute top-18 z-10 m-4 flex max-w-[calc(90%-96px)] flex-row flex-wrap gap-2">
	{#if isLoading}
		<!-- Skeleton loading state -->
		{#each Array.from({ length: 9 }, (_, i) => i) as i (i)}
			<Skeleton class="h-10 w-32 rounded-3xl" />
		{/each}
	{:else if !appState.is3DMode}
		<LayerButton
			icon={Building}
			id="building"
			color="#222222"
			initialSelected={appState.layers.includes('building')}
			onToggle={() => appState.toggleLayer('building')}
		>
			{m.layer_building()}
		</LayerButton>
		<LayerButton
			icon={Sprout}
			id="green"
			color="#4A5A3A"
			initialSelected={appState.layers.includes('green')}
			onToggle={() => appState.toggleLayer('green')}
		>
			{m.layer_green()}
		</LayerButton>
		<LayerButton
			icon={TreePine}
			id="forest"
			color="#2F4A2F"
			initialSelected={appState.layers.includes('forest')}
			onToggle={() => appState.toggleLayer('forest')}
		>
			{m.layer_forest()}
		</LayerButton>
		<LayerButton
			icon={Waves}
			id="water"
			color="#2F4A5A"
			initialSelected={appState.layers.includes('water')}
			onToggle={() => appState.toggleLayer('water')}
		>
			{m.layer_water()}
		</LayerButton>
		<LayerButton
			icon={Wheat}
			id="farmland"
			color="#5A5A2F"
			initialSelected={appState.layers.includes('farmland')}
			onToggle={() => appState.toggleLayer('farmland')}
		>
			{m.layer_farmland()}
		</LayerButton>
		<LayerButton
			icon={Car}
			id="highway"
			color="#5A2F2F"
			initialSelected={appState.layers.includes('highway')}
			onToggle={() => appState.toggleLayer('highway')}
		>
			{m.layer_highway()}
		</LayerButton>
		<LayerButton
			icon={TramFront}
			id="railway"
			color="#4A2F5A"
			initialSelected={appState.layers.includes('railway')}
			onToggle={() => appState.toggleLayer('railway')}
		>
			{m.layer_railway()}
		</LayerButton>
		<SplitLayerButton
			icon={Mountain}
			id="contours"
			color="#2F3A5A"
			initialSelected={appState.layers.includes('contours')}
			onToggle={() => appState.toggleLayer('contours')}
			dropdownItems={elevationOptions}
			selectedValue={appState.contourInterval}
		>
			{m.layer_contours()}
		</SplitLayerButton>
		<div class="mx-2 h-8 self-center border-l border-gray-500"></div>
		<LayerButton
			icon={Box}
			id="3d"
			color="#5A2F4A"
			onToggle={(v: boolean) => (appState.is3DMode = v)}>{m.layer_3d()}</LayerButton
		>
	{:else}
		<!-- 3D mode buttons -->
		<LayerButton
			icon={Box}
			id="3d"
			color="#5A2F4A"
			onToggle={(v: boolean) => (appState.is3DMode = v)}
			initialSelected={appState.is3DMode}>{m.layer_3d()}</LayerButton
		>

		<div class="mx-2 h-8 self-center border-l border-gray-500"></div>
		<LayerButton
			icon={Building}
			id="3d-building"
			color="#222222"
			initialSelected={appState.selected3DLayers.building}
			onToggle={(v: boolean) => appState.toggle3DLayer('building', v)}
		>
			{m.layer_building()}
		</LayerButton>
		<LayerButton
			icon={Mountain}
			id="3d-height"
			color="#2F3A5A"
			initialSelected={appState.selected3DLayers.height}
			onToggle={(v: boolean) => appState.toggle3DLayer('height', v)}
		>
			{m.layer_terrain()}
		</LayerButton>
	{/if}
</div>
