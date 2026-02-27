<script lang="ts">
	import { Button } from '$lib/components/ui/button';
	import { Progress } from '$lib/components/ui/progress';
	import { Skeleton } from '$lib/components/ui/skeleton';
	import { Dialog, DialogContent, DialogHeader, DialogTitle } from '$lib/components/ui/dialog';
	import { Download } from 'lucide-svelte';
	import { appState } from '$lib/state.svelte';
	import { downloadOSMData } from '$lib/schwarzplan/osm/overpass';
	import { fetchElevationData } from '$lib/schwarzplan/elevation/client';
	import { SchwarzplanWorker } from '$lib/schwarzplan/worker/client';
	import { getSuitableScales } from '$lib/schwarzplan/geometry/bounds';
	import { downloadFile, getMimeType, getFilename } from '$lib/schwarzplan/exporters/base';
	import type { ExportFormat, ProgressInfo } from '$lib/schwarzplan/types';
	import { onMount } from 'svelte';
	import * as m from '$lib/paraglide/messages';

	let dlOpen = $state(false);
	let worker: SchwarzplanWorker | null = null;
	let scaleDialogOpen = $state(false);
	let selectedFormat = $state<ExportFormat>('dxf');
	let availableScales = $state<any[]>([]);
	let cumulativeProgress = $state(0);
	let isLoading = $state(true);
	let isCancelled = $state(false);

	// Check if download should be disabled (zoom too low)
	let isZoomTooLow = $derived(appState.location.zoom < 11);

	// Close download menu if zoom becomes too low
	$effect(() => {
		if (isZoomTooLow && dlOpen) {
			dlOpen = false;
		}
	});

	onMount(() => {
		isLoading = false;
	});

	// Calculate cumulative progress across all steps
	function calculateCumulativeProgress(info: ProgressInfo): number {
		const stepWeights = {
			init: { start: 0, weight: 5 },
			'osm-download': { start: 5, weight: 25 },
			'osm-parse': { start: 30, weight: 15 },
			'elevation-download': { start: 45, weight: 10 },
			contours: { start: 55, weight: 10 },
			export: { start: 65, weight: 30 },
			complete: { start: 100, weight: 0 },
			error: { start: 0, weight: 0 }
		};

		const step = stepWeights[info.step];
		if (!step) return 0;

		if (info.step === 'complete') return 100;
		if (info.step === 'error') return 0;

		const stepProgress = info.percent ?? 0;
		return Math.min(100, Math.round(step.start + (stepProgress * step.weight) / 100));
	}

	// Wrapper for progress callback
	function progressWrapper(info: ProgressInfo) {
		if (isCancelled) return;

		cumulativeProgress = calculateCumulativeProgress(info);
		appState.progress = { ...info, percent: cumulativeProgress };
	}

	async function handleFormatClick(format: ExportFormat) {
		if (appState.location.zoom < 11) {
			alert(m.error_zoom_too_low());
			return;
		}

		if (!appState.bounds) {
			alert(m.error_bounds_not_determined());
			return;
		}

		selectedFormat = format;
		dlOpen = false;

		// For SVG/PDF, show scale selector first
		if (format === 'svg' || format === 'pdf') {
			availableScales = getSuitableScales(appState.bounds);
			scaleDialogOpen = true;
		} else {
			await startGeneration(format, undefined);
		}
	}

	async function startGeneration(format: ExportFormat, scale?: number) {
		isCancelled = false;

		const bounds = appState.bounds;
		if (!bounds) return;

		const zoom = appState.location.zoom;
		let layers = [...appState.layers];

		if (appState.is3DMode) {
			if (appState.selected3DLayers.building && !layers.includes('building')) {
				layers.push('building');
			}
			// Explicitly fetch building parts for 3D generation if building layer is active
			if (appState.selected3DLayers.building || layers.includes('building')) {
				if (!layers.includes('building_parts')) {
					layers.push('building_parts');
				}
			}
		}

		try {
			progressWrapper({ step: 'init', percent: 0, message: m.progress_init() });
			if (isCancelled) return;

			// Deep clone to remove Svelte proxies
			const cleanBounds = JSON.parse(JSON.stringify(bounds));
			const cleanLayers = JSON.parse(JSON.stringify(layers));

			const osmData = await downloadOSMData(cleanBounds, cleanLayers, progressWrapper);
			if (isCancelled) return;

			let elevationMatrix: number[][] | null = null;
			const shouldFetchElevation =
				layers.includes('contours') || (appState.is3DMode && appState.selected3DLayers.height);

			if (shouldFetchElevation) {
				elevationMatrix = await fetchElevationData(cleanBounds, progressWrapper);
			}
			if (isCancelled) return;

			worker = new SchwarzplanWorker();

			const result = await worker.generate(
				format,
				osmData,
				elevationMatrix,
				cleanBounds,
				cleanLayers,
				zoom,
				scale,
				progressWrapper,
				appState.contourInterval,
				appState.buildingStyle
			);

			if (isCancelled) return;

			const mimeType = getMimeType(format);
			const filename = getFilename(format);
			downloadFile(filename, result, mimeType);

			fetch('/api/counter/record', { method: 'POST' }).catch((err) =>
				console.warn('Failed to record download:', err)
			);

			progressWrapper({ step: 'complete', percent: 100, message: m.progress_download_complete() });

			setTimeout(() => {
				appState.progress = null;
				cumulativeProgress = 0;
			}, 2000);
		} catch (error) {
			if (!isCancelled) {
				console.error('Generation error:', error);
				appState.progress = {
					step: 'error',
					percent: 0,
					message: error instanceof Error ? error.message : m.error_general()
				};
			}
		}
	}

	function handleScaleSelection(scale: number) {
		scaleDialogOpen = false;
		startGeneration(selectedFormat, scale);
	}

	function handleCancel() {
		isCancelled = true;
		if (worker) {
			worker.cancel();
			worker = null;
		}
		appState.progress = null;
		cumulativeProgress = 0;
	}
</script>

<div class="absolute right-4 bottom-4 flex flex-col items-center gap-2">
	{#if isLoading}
		<Skeleton class="h-20 w-20 rounded-2xl" />
	{:else}
		<div class:closed={!dlOpen} class="transition-all duration-300">
			{#if appState.is3DMode}
				<Button
					class="absolute right-3 bottom-60 h-14 w-14 cursor-pointer rounded-lg text-xs font-bold shadow-lg hover:scale-105 active:scale-95"
					onclick={() => handleFormatClick('ifc')}
				>
					IFC
				</Button>
				<Button
					class="absolute right-3 bottom-42 h-14 w-14 cursor-pointer rounded-lg text-xs font-bold shadow-lg hover:scale-105 active:scale-95"
					onclick={() => handleFormatClick('3dm')}
				>
					OBJ
				</Button>
				<Button
					class="absolute right-3 bottom-24 h-14 w-14 cursor-pointer rounded-lg text-xs font-bold shadow-lg hover:scale-105 active:scale-95"
					onclick={() => handleFormatClick('dxf3d')}
				>
					3D-DXF
				</Button>
			{:else}
				<Button
					class="absolute right-3 bottom-60 h-14 w-14 cursor-pointer rounded-lg text-xs font-bold shadow-lg hover:scale-105 active:scale-95"
					onclick={() => handleFormatClick('pdf')}
				>
					PDF
				</Button>
				<Button
					class="absolute right-3 bottom-42 h-14 w-14 cursor-pointer rounded-lg text-xs font-bold shadow-lg hover:scale-105 active:scale-95"
					onclick={() => handleFormatClick('svg')}
				>
					SVG
				</Button>
				<Button
					class="absolute right-3 bottom-24 h-14 w-14 cursor-pointer rounded-lg text-xs font-bold shadow-lg hover:scale-105 active:scale-95"
					onclick={() => handleFormatClick('dxf')}
				>
					DXF
				</Button>
			{/if}
		</div>

		<Button
			class="z-10 h-20 w-20 rounded-2xl {isZoomTooLow
				? 'cursor-not-allowed opacity-50'
				: 'cursor-pointer hover:scale-105 active:scale-95'} shadow-lg"
			disabled={isZoomTooLow}
			onclick={() => {
				if (!isZoomTooLow) {
					dlOpen = !dlOpen;
				}
			}}
		>
			<Download class="size-6 text-background" />
		</Button>
	{/if}
</div>

<!-- Scale selection dialog for SVG/PDF -->
<Dialog open={scaleDialogOpen} onOpenChange={(open) => (scaleDialogOpen = open)}>
	<DialogContent class="max-w-sm">
		<DialogHeader>
			<DialogTitle>{m.export_scale_selection_title()}</DialogTitle>
		</DialogHeader>
		<div class="space-y-2">
			{#each availableScales as scaleOption}
				<Button
					variant="outline"
					class="w-full"
					onclick={() => handleScaleSelection(scaleOption.scale)}
				>
					{scaleOption.name}
				</Button>
			{/each}
		</div>
		<Button variant="ghost" class="mt-2 w-full" onclick={() => (scaleDialogOpen = false)}>
			{m.export_scale_selection_cancel()}
		</Button>
	</DialogContent>
</Dialog>

<!-- Progress indicator -->
<Dialog
	open={appState.progress !== null && appState.progress.step !== 'complete'}
	onOpenChange={() => {}}
>
	<DialogContent class="max-w-md" showCloseButton={false}>
		<DialogHeader>
			<DialogTitle>
				{#if appState.progress?.step === 'error'}
					{m.export_error_title()}
				{:else}
					{m.export_progress_title()}
				{/if}
			</DialogTitle>
		</DialogHeader>

		{#if appState.progress}
			<div class="space-y-3">
				<div class="flex justify-between text-sm">
					<span>{appState.progress.message || ''}</span>
					{#if appState.progress.percent !== undefined}
						<span class="font-medium">{appState.progress.percent}%</span>
					{/if}
				</div>

				{#if appState.progress.percent !== undefined && appState.progress.step !== 'error'}
					<Progress value={appState.progress.percent} max={100} class="w-full" />
				{/if}

				{#if appState.progress.step === 'error'}
					<Button
						variant="destructive"
						class="mt-4 w-full"
						onclick={() => (appState.progress = null)}
					>
						{m.export_error_close()}
					</Button>
				{:else}
					<p class="mt-2 text-sm text-muted-foreground">
						{m.progress_waiting()}
					</p>
					<Button variant="outline" class="mt-4 w-full" onclick={handleCancel}>
						{m.export_cancel()}
					</Button>
				{/if}
			</div>
		{/if}
	</DialogContent>
</Dialog>

<style>
	:global(.closed > button) {
		pointer-events: none;
		opacity: 0;
		bottom: 0.75rem;
	}
</style>
