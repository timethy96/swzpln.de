<script lang="ts">
	import { Dialog, DialogContent, DialogHeader, DialogTitle } from '$lib/components/ui/dialog';
	import { Button } from '$lib/components/ui/button';
	import {
		exportDialogOpen,
		selectedFormat,
		selectedScale,
		selectedLayers,
		progress,
		isGenerating
	} from '$lib/stores/schwarzplanStore';
	import { mapLocation, currentMapBounds } from '$lib/stores/mapStore';
	import { downloadOSMData } from '$lib/schwarzplan/osm/overpass';
	import { fetchElevationData } from '$lib/schwarzplan/elevation/client';
	import { SchwarzplanWorker } from '$lib/schwarzplan/worker/client';
	import { getSuitableScales, estimateOsmFilesize } from '$lib/schwarzplan/geometry/bounds';
	import { downloadFile, getMimeType, getFilename } from '$lib/schwarzplan/exporters/base';
	import type { ExportFormat, ScaleOption, Bounds } from '$lib/schwarzplan/types';

	// Worker instance
	let worker: SchwarzplanWorker | null = null;

	// Scale selection state
	let showScaleSelection = $state(false);
	let availableScales = $state<ScaleOption[]>([]);

	// Get current map bounds
	function getCurrentBounds(): Bounds | null {
		return $currentMapBounds;
	}

	function getCurrentZoom(): number {
		return $mapLocation.zoom;
	}

	// Handle format selection
	function selectFormat(format: ExportFormat) {
		$selectedFormat = format;

		const bounds = getCurrentBounds();
		if (!bounds) {
			$progress = {
				step: 'error',
				message: 'Kartengrenzen konnten nicht ermittelt werden'
			};
			return;
		}

		if (format === 'dxf') {
			// DXF doesn't need scale, start immediately
			startGeneration(format);
		} else {
			// SVG and PDF need scale selection
			availableScales = getSuitableScales(bounds);
			showScaleSelection = true;
		}
	}

	// Handle scale selection
	function selectScale(scale: number) {
		$selectedScale = scale;
		showScaleSelection = false;
		startGeneration($selectedFormat, scale);
	}

	// Start generation process
	async function startGeneration(format: ExportFormat, scale?: number) {
		const bounds = getCurrentBounds();
		if (!bounds) {
			$progress = {
				step: 'error',
				message: 'Kartengrenzen konnten nicht ermittelt werden'
			};
			return;
		}

		const zoom = getCurrentZoom();
		const layers = $selectedLayers;

		// Validate zoom level
		if (zoom < 11) {
			$progress = {
				step: 'error',
				message: 'Bitte vergrößern Sie die Karte (Zoom >= 11)'
			};
			return;
		}

		try {
			// Initialize progress
			const estimatedSize = estimateOsmFilesize(zoom);
			$progress = {
				step: 'init',
				percent: 0,
				message: 'Initialisierung...'
			};

			// Download OSM data
			const osmData = await downloadOSMData(bounds, layers, (info) => {
				$progress = info;
			});

			// Download elevation data if contours are selected
			let elevationMatrix: number[][] | null = null;
			if (layers.includes('contours')) {
				elevationMatrix = await fetchElevationData(bounds, (info) => {
					$progress = info;
				});
			}

			// Create worker and generate
			worker = new SchwarzplanWorker();

			const result = await worker.generate(
				format,
				osmData,
				elevationMatrix,
				bounds,
				layers,
				zoom,
				scale,
				(info) => {
					$progress = info;
				}
			);

			// Download result
			const mimeType = getMimeType(format);
			const filename = getFilename(format);
			downloadFile(filename, result, mimeType);

			// Complete
			$progress = {
				step: 'complete',
				percent: 100,
				message: 'Download abgeschlossen'
			};
		} catch (error) {
			console.error('Generation error:', error);
			$progress = {
				step: 'error',
				message: error instanceof Error ? error.message : 'Ein Fehler ist aufgetreten'
			};
		}
	}

	// Cancel generation
	function cancelGeneration() {
		if (worker) {
			worker.cancel();
			worker = null;
		}
		$progress = null;
		$exportDialogOpen = false;
		showScaleSelection = false;
	}

	// Close dialog
	function closeDialog() {
		if ($isGenerating) {
			cancelGeneration();
		} else {
			$exportDialogOpen = false;
			showScaleSelection = false;
			$progress = null;
		}
	}

	// Progress message display
	function getProgressMessage(): string {
		if (!$progress) return '';

		switch ($progress.step) {
			case 'init':
				return 'Initialisierung...';
			case 'osm-download':
				return 'OSM Daten herunterladen...';
			case 'osm-parse':
				return 'OSM Daten verarbeiten...';
			case 'elevation-download':
				return 'Höhendaten herunterladen...';
			case 'contours':
				return 'Höhenlinien generieren...';
			case 'export':
				return `${$selectedFormat.toUpperCase()} generieren...`;
			case 'complete':
				return 'Fertig!';
			case 'error':
				return 'Fehler';
			default:
				return '';
		}
	}
</script>

<Dialog open={$exportDialogOpen} onOpenChange={closeDialog}>
	<DialogContent class="max-w-md">
		<DialogHeader>
			<DialogTitle>Schwarzplan exportieren</DialogTitle>
		</DialogHeader>

		{#if !$progress && !showScaleSelection}
			<!-- Format selection -->
			<div class="space-y-4">
				<p class="text-sm text-muted-foreground">Wählen Sie ein Exportformat:</p>

				<div class="grid grid-cols-3 gap-3">
					<Button variant="outline" onclick={() => selectFormat('dxf')} class="h-20">
						<div class="flex flex-col items-center gap-2">
							<span class="text-2xl">📐</span>
							<span>DXF</span>
						</div>
					</Button>

					<Button variant="outline" onclick={() => selectFormat('svg')} class="h-20">
						<div class="flex flex-col items-center gap-2">
							<span class="text-2xl">🖼️</span>
							<span>SVG</span>
						</div>
					</Button>

					<Button variant="outline" onclick={() => selectFormat('pdf')} class="h-20">
						<div class="flex flex-col items-center gap-2">
							<span class="text-2xl">📄</span>
							<span>PDF</span>
						</div>
					</Button>
				</div>
			</div>
		{:else if showScaleSelection}
			<!-- Scale selection -->
			<div class="space-y-4">
				<p class="text-sm text-muted-foreground">Wählen Sie einen Maßstab:</p>

				<div class="flex flex-col gap-2">
					{#each availableScales as scaleOption}
						<Button variant="outline" onclick={() => selectScale(scaleOption.scale)}>
							{scaleOption.name}
						</Button>
					{/each}
				</div>

				<Button variant="ghost" onclick={() => (showScaleSelection = false)}>Zurück</Button>
			</div>
		{:else if $progress}
			<!-- Progress display -->
			<div class="space-y-4">
				<div class="space-y-2">
					<div class="flex justify-between text-sm">
						<span>{getProgressMessage()}</span>
						{#if $progress.percent !== undefined}
							<span>{$progress.percent}%</span>
						{/if}
					</div>

					{#if $progress.percent !== undefined && $progress.step !== 'error'}
						<div class="h-2 bg-secondary rounded-full overflow-hidden">
							<div
								class="h-full bg-primary transition-all duration-300"
								style="width: {$progress.percent}%"
							></div>
						</div>
					{/if}

					{#if $progress.message}
						<p class="text-xs text-muted-foreground">{$progress.message}</p>
					{/if}
				</div>

				{#if $progress.step === 'error'}
					<Button variant="destructive" onclick={closeDialog} class="w-full">Schließen</Button>
				{:else if $progress.step === 'complete'}
					<Button onclick={closeDialog} class="w-full">Fertig</Button>
				{:else}
					<Button variant="outline" onclick={cancelGeneration} class="w-full">Abbrechen</Button>
				{/if}
			</div>
		{/if}
	</DialogContent>
</Dialog>

