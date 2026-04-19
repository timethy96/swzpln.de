<script lang="ts">
	import { Button } from '$lib/components/ui/button';
	import { Progress } from '$lib/components/ui/progress';
	import { Skeleton } from '$lib/components/ui/skeleton';
	import { Dialog, DialogContent, DialogHeader, DialogTitle } from '$lib/components/ui/dialog';
	import Download from '@lucide/svelte/icons/download';
	import LoaderCircle from '@lucide/svelte/icons/loader-circle';
	import ShoppingCart from '@lucide/svelte/icons/shopping-cart';
	import Heart from '@lucide/svelte/icons/heart';
	import ExternalLink from '@lucide/svelte/icons/external-link';
	import { appState } from '$lib/state.svelte';
	import { downloadOSMData } from '$lib/schwarzplan/osm/overpass';
	import { fetchElevationData } from '$lib/schwarzplan/elevation/client';
	import { SchwarzplanWorker } from '$lib/schwarzplan/worker/client';
	import { getSuitableScales } from '$lib/schwarzplan/geometry/bounds';
	import { downloadFile, getMimeType, getFilename } from '$lib/schwarzplan/exporters/base';
	import type { ExportFormat, Layer, ProgressInfo, ScaleOption } from '$lib/schwarzplan/types';
	import { onMount } from 'svelte';
	import * as m from '$lib/paraglide/messages';
	import { env } from '$env/dynamic/public';

	const showShop = env.PUBLIC_SHOW_SHOP !== 'false';

	let dlOpen = $state(false);
	let worker: SchwarzplanWorker | null = null;
	let scaleDialogOpen = $state(false);
	let selectedFormat = $state<ExportFormat>('dxf');
	let availableScales = $state<ScaleOption[]>([]);
	let cumulativeProgress = $state(0);
	let isLoading = $state(true);
	let isCancelled = $state(false);
	let completionDialogOpen = $state(false);
	let lastGeneratedResult = $state<string | Uint8Array | Blob | null>(null);
	let lastGeneratedMimeType = $state('');
	let lastGeneratedFilename = $state('');

	// Rotating shop CTA text with fade-in/fade-out
	let shopCtaIndex = $state(0);
	let _shopCtaVisible = $state(true);
	const shopCtas = $derived([
		m.shop_cta_tshirt(),
		m.shop_cta_canvas(),
		m.shop_cta_mug(),
		m.shop_cta_print()
	]);

	// Rotating promo text for loading dialog with fade-in/fade-out
	let promoIndex = $state(0);
	let promoVisible = $state(true);
	const promoTexts = $derived([m.shop_promo_1(), m.shop_promo_2(), m.shop_promo_3()]);

	$effect(() => {
		if (!showShop) return;
		const interval = setInterval(() => {
			_shopCtaVisible = false;
			setTimeout(() => {
				shopCtaIndex = (shopCtaIndex + 1) % shopCtas.length;
				_shopCtaVisible = true;
			}, 1000);
		}, 8000);
		return () => clearInterval(interval);
	});

	$effect(() => {
		if (!showShop) return;
		const interval = setInterval(() => {
			promoVisible = false;
			setTimeout(() => {
				promoIndex = (promoIndex + 1) % promoTexts.length;
				promoVisible = true;
			}, 1000);
		}, 10000);
		return () => clearInterval(interval);
	});

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
			availableScales = getSuitableScales(appState.bounds, appState.location.zoom);
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
		let layers: Layer[];

		if (appState.is3DMode) {
			layers = [];
			if (appState.selected3DLayers.building) {
				layers.push('building', 'building_parts');
			}
		} else {
			layers = [...appState.layers];
			// Always fetch building:part data when buildings are enabled
			// (complex buildings like churches consist of building:part elements)
			if (layers.includes('building') && !layers.includes('building_parts')) {
				layers.push('building_parts');
			}
		}

		try {
			progressWrapper({ step: 'init', percent: 0, message: m.progress_init() });
			if (isCancelled) return;

			// Deep clone to remove Svelte proxies
			const cleanBounds = JSON.parse(JSON.stringify(bounds));
			const cleanLayers = JSON.parse(JSON.stringify(layers));

			// Try server-side Overpass proxy first, fall back to client-side Overpass
			let osmData = null;

			progressWrapper({
				step: 'osm-download',
				percent: 0,
				message: m.progress_geodata_download()
			});
			const params = new URLSearchParams({
				north: String(cleanBounds.north),
				south: String(cleanBounds.south),
				east: String(cleanBounds.east),
				west: String(cleanBounds.west),
				layers: cleanLayers.join(',')
			});
			try {
				const response = await fetch(`/api/geodata?${params}`);
				if (!response.ok) {
					throw new Error(`${response.status}`);
				}
				const data = await response.json();
				if (data.source === 'unavailable') {
					// Server signaled Overpass unavailable — fall back to client-side
					osmData = await downloadOSMData(cleanBounds, cleanLayers, progressWrapper);
				} else {
					// Raw Overpass JSON streamed through proxy
					osmData = data;
					progressWrapper({
						step: 'osm-download',
						percent: 100,
						message: m.progress_geodata_downloaded()
					});
				}
			} catch {
				// Server proxy failed — fall back to client-side Overpass
				osmData = await downloadOSMData(cleanBounds, cleanLayers, progressWrapper);
			}
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
				null,
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

			// Store for re-download
			lastGeneratedResult = result;
			lastGeneratedMimeType = mimeType;
			lastGeneratedFilename = filename;

			fetch('/api/counter/record', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ is3d: appState.is3DMode })
			}).catch((err) => console.warn('Failed to record download:', err));

			// Clear progress and show completion dialog
			appState.progress = null;
			cumulativeProgress = 0;
			completionDialogOpen = true;
		} catch (error) {
			if (!isCancelled) {
				console.error('Generation error:', error);
				appState.progress = {
					step: 'error',
					percent: 0,
					message: error instanceof Error ? error.message : m.error_general(),
					stack: error instanceof Error ? error.stack : String(error)
				};
			}
		}
	}

	function handleScaleSelection(scale: number) {
		scaleDialogOpen = false;
		startGeneration(selectedFormat, scale);
	}

	function handleReDownload() {
		if (lastGeneratedResult) {
			downloadFile(lastGeneratedFilename, lastGeneratedResult, lastGeneratedMimeType);
		}
	}

	function handleCompletionClose() {
		completionDialogOpen = false;
		lastGeneratedResult = null;
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

{#if showShop}
	<!-- Shop promotion button -->
	<a
		href="https://shop.swzpln.de"
		target="_blank"
		rel="noopener noreferrer"
		class="animate-shimmer absolute right-28 bottom-4 z-10 hidden h-20 w-20 items-center justify-center rounded-2xl
		bg-linear-to-br from-[oklch(0.55_0.25_300)] via-[oklch(0.60_0.20_320)] to-[oklch(0.50_0.22_280)]
		text-white
		shadow-lg transition-all duration-300 hover:scale-105
		active:scale-95 sm:flex"
	>
		<ShoppingCart class="size-6" />
	</a>
{/if}

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
					onclick={() => handleFormatClick('obj')}
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
			{#each availableScales as scaleOption (scaleOption.scale)}
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
	<DialogContent
		class="max-w-md"
		showCloseButton={false}
		onInteractOutside={(e) => e.preventDefault()}
		onEscapeKeydown={(e) => e.preventDefault()}
	>
		<DialogHeader>
			<div class="flex items-center justify-between">
				<DialogTitle>
					{#if appState.progress?.step === 'error'}
						{m.export_error_title()}
					{:else}
						{m.export_progress_title()}
					{/if}
				</DialogTitle>
				{#if appState.progress?.step === 'osm-download' || appState.progress?.step === 'elevation-download'}
					<LoaderCircle class="size-5 animate-spin text-muted-foreground" />
				{/if}
			</div>
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
					<p class="text-sm text-muted-foreground">{m.export_error_hint()}</p>
					<div class="mt-4 flex gap-2">
						<Button variant="destructive" class="flex-1" onclick={() => (appState.progress = null)}>
							{m.export_error_close()}
						</Button>
						<Button
							variant="outline"
							class="flex-1"
							onclick={() => {
								const user = 'error1';
								const domain = 'swzpln';
								const tld = 'de';
								const addr = `${user}@${domain}.${tld}`;
								const subject = encodeURIComponent('Export Error Report');
								const body = encodeURIComponent(
									[
										`Error: ${appState.progress?.message || 'N/A'}`,
										`URL: ${window.location.href}`,
										`Time: ${new Date().toISOString()}`,
										`User-Agent: ${navigator.userAgent}`,
										'',
										'--- Stack Trace ---',
										appState.progress?.stack || 'N/A',
										'',
										'--- Please describe what you were doing when this error occurred: ---',
										''
									].join('\n')
								);
								window.location.href = `mailto:${addr}?subject=${subject}&body=${body}`;
							}}
						>
							{m.export_error_report()}
						</Button>
					</div>
				{:else}
					<p class="mt-2 text-sm text-muted-foreground">
						{m.progress_waiting()}
					</p>
					{#if showShop}
						<a
							href="https://shop.swzpln.de"
							target="_blank"
							rel="noopener noreferrer"
							class="mt-3 flex items-center justify-center gap-1 text-center text-xs text-muted-foreground/70 italic transition-all duration-1000 hover:text-muted-foreground"
						>
							<span class="transition-opacity duration-1000" class:opacity-0={!promoVisible}>
								{promoTexts[promoIndex]}
							</span>
							<ExternalLink class="size-3 shrink-0" />
						</a>
					{/if}
					<Button variant="outline" class="mt-4 w-full" onclick={handleCancel}>
						{m.export_cancel()}
					</Button>
				{/if}
			</div>
		{/if}
	</DialogContent>
</Dialog>

<!-- Completion dialog with shop CTA -->
<Dialog
	open={completionDialogOpen}
	onOpenChange={(open) => {
		if (!open) handleCompletionClose();
	}}
>
	<DialogContent class="max-w-sm">
		<DialogHeader>
			<DialogTitle>{m.shop_complete_title()}</DialogTitle>
		</DialogHeader>
		<div class="flex flex-col gap-3 pt-2">
			<Button variant="outline" class="w-full" onclick={handleReDownload}>
				<Download class="size-4" />
				{m.shop_complete_download()}
			</Button>
			<div class="flex flex-col gap-2">
				{#if showShop}
					<p class="text-center text-xs text-muted-foreground">{m.shop_complete_subtitle()}</p>
					<a
						href="https://shop.swzpln.de"
						target="_blank"
						rel="noopener noreferrer"
						class="animate-shimmer inline-flex h-10 w-full items-center justify-center gap-2 rounded-md bg-linear-to-r from-[oklch(0.55_0.25_300)] via-[oklch(0.60_0.20_320)] to-[oklch(0.50_0.22_280)]
						px-4 text-sm font-medium text-white
						shadow-xs transition-opacity hover:opacity-90"
					>
						<ShoppingCart class="size-4" />
						{m.shop_complete_buy()}
						<ExternalLink class="size-3" />
					</a>
				{/if}
				<a
					href="https://ko-fi.com/swzpln"
					target="_blank"
					rel="noopener noreferrer"
					class="group inline-flex h-10 w-full items-center justify-center gap-2 rounded-md border border-input bg-background px-4 text-sm font-medium shadow-xs transition-colors hover:bg-accent hover:text-accent-foreground"
				>
					<Heart class="size-4 transition-colors group-hover:fill-red-500" />
					{m.shop_complete_donate()}
					<ExternalLink class="size-3" />
				</a>
			</div>
			<Button variant="ghost" class="w-full" onclick={handleCompletionClose}>
				{m.shop_complete_close()}
			</Button>
		</div>
	</DialogContent>
</Dialog>

<style>
	:global(.closed > button) {
		pointer-events: none;
		opacity: 0;
		bottom: 0.75rem;
	}

	@keyframes shimmer {
		0%,
		100% {
			background-position: 0% 50%;
		}
		50% {
			background-position: 100% 50%;
		}
	}

	:global(.animate-shimmer) {
		background-size: 200% 200%;
		animation: shimmer 12s ease-in-out infinite;
	}
</style>
