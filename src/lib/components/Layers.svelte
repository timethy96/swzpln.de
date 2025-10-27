<script lang="ts">
	import LayerButton from './LayerButton.svelte';
	import SplitLayerButton from './SplitLayerButton.svelte';
	import { Skeleton } from '$lib/components/ui/skeleton';
	import { Building, Sprout, TreePine, Waves, Wheat, Car, TramFront, Mountain, Box, TrendingUp, Activity, ChartColumn, Minus, Plus } from 'lucide-svelte';
	import { is3DMode } from '$lib/stores/mapStore';
	import { selectedLayers, toggleLayer, setContourInterval, contourInterval } from '$lib/stores/schwarzplanStore';
	import type { Layer } from '$lib/schwarzplan/types';
	import { onMount } from 'svelte';
	
	let isLoading = $state(true);

	onMount(() => {
		isLoading = false;
	});

	function toggle3D(selected: boolean) {
		is3DMode.set(selected);
	}

	// Check if a schwarzplan layer is selected
	function isLayerSelected(layer: Layer): boolean {
		return $selectedLayers.includes(layer);
	}

	// Handle layer toggle for schwarzplan layers
	function handleLayerToggle(layer: Layer) {
		return (selected: boolean) => {
			toggleLayer(layer);
		};
	}
	
	// Elevation lines dropdown options with callbacks
	const elevationOptions = [
		{ 
			icon: Minus, 
			label: '1m Intervall', 
			id: 'elevation-1m', 
			color: '#1F2A4A',
			value: 1,
			onSelect: () => setContourInterval(1)
		},
		{ 
			icon: Activity, 
			label: '5m Intervall', 
			id: 'elevation-5m', 
			color: '#2A3A5A',
			value: 5,
			onSelect: () => setContourInterval(5)
		},
		{ 
			icon: TrendingUp, 
			label: '10m Intervall', 
			id: 'elevation-10m', 
			color: '#2F3A5A',
			value: 10,
			onSelect: () => setContourInterval(10)
		},
		{ 
			icon: ChartColumn, 
			label: '20m Intervall', 
			id: 'elevation-20m', 
			color: '#3F4A6A',
			value: 20,
			onSelect: () => setContourInterval(20)
		},
		{ 
			icon: Plus, 
			label: '50m Intervall', 
			id: 'elevation-50m', 
			color: '#4F5A7A',
			value: 50,
			onSelect: () => setContourInterval(50)
		}
	];
</script>

<div class="flex flex-row gap-2 flex-wrap m-4 absolute top-18 z-10 max-w-[calc(90%-96px)]">
	{#if isLoading}
		<!-- Skeleton loading state -->
		{#each Array(9) as _, i}
			<Skeleton class="h-10 w-32 rounded-3xl" />
		{/each}
	{:else if !$is3DMode}
		<LayerButton 
			icon={Building} 
			id="building" 
			color="#000000" 
			initialSelected={isLayerSelected('building')}
			onToggle={handleLayerToggle('building')}
		>
			Gebäude
		</LayerButton>
		<LayerButton 
			icon={Sprout} 
			id="green" 
			color="#4A5A3A" 
			initialSelected={isLayerSelected('green')}
			onToggle={handleLayerToggle('green')}
		>
			Grünflächen
		</LayerButton>
		<LayerButton 
			icon={TreePine} 
			id="forest" 
			color="#2F4A2F" 
			initialSelected={isLayerSelected('forest')}
			onToggle={handleLayerToggle('forest')}
		>
			Waldflächen
		</LayerButton>
		<LayerButton 
			icon={Waves} 
			id="water" 
			color="#2F4A5A" 
			initialSelected={isLayerSelected('water')}
			onToggle={handleLayerToggle('water')}
		>
			Gewässer
		</LayerButton>
		<LayerButton 
			icon={Wheat} 
			id="farmland" 
			color="#5A5A2F" 
			initialSelected={isLayerSelected('farmland')}
			onToggle={handleLayerToggle('farmland')}
		>
			Landwirtschaft
		</LayerButton>
		<LayerButton 
			icon={Car} 
			id="highway" 
			color="#5A2F2F" 
			initialSelected={isLayerSelected('highway')}
			onToggle={handleLayerToggle('highway')}
		>
			Straßen
		</LayerButton>
		<LayerButton 
			icon={TramFront} 
			id="railway" 
			color="#4A2F5A" 
			initialSelected={isLayerSelected('railway')}
			onToggle={handleLayerToggle('railway')}
		>
			Schienen
		</LayerButton>
		<SplitLayerButton 
			icon={Mountain} 
			id="contours" 
			color="#2F3A5A" 
			initialSelected={isLayerSelected('contours')}
			onToggle={handleLayerToggle('contours')}
			dropdownItems={elevationOptions}
			selectedValue={$contourInterval}
		>
			Höhenlinien
		</SplitLayerButton>
		<div class="border-l border-gray-500 h-8 mx-2 self-center"></div>
		<LayerButton icon={Box} id="3d" color="#5A2F4A" onToggle={toggle3D}>3D</LayerButton>
	{:else}
		<!-- 3D mode buttons -->
		<LayerButton icon={Box} id="3d" color="#5A2F4A" onToggle={toggle3D} initialSelected={$is3DMode}>3D</LayerButton>

			<div class="border-l border-gray-500 h-8 mx-2 self-center"></div>
			<LayerButton icon={Building} id="3d-building" color="#000000" initialSelected={true}>Gebäude</LayerButton>
			<LayerButton icon={Mountain} id="3d-height" color="#2F3A5A">Gelände</LayerButton>

	{/if}
</div>
