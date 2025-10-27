<script lang="ts">
    import { Button } from '$lib/components/ui/button';
    import { Progress } from '$lib/components/ui/progress';
    import { Skeleton } from '$lib/components/ui/skeleton';
    import { Dialog, DialogContent, DialogHeader, DialogTitle } from '$lib/components/ui/dialog';
    import { Download } from 'lucide-svelte';
    import { is3DMode, mapLocation, currentMapBounds } from '$lib/stores/mapStore';
    import { selectedLayers, progress, contourInterval } from '$lib/stores/schwarzplanStore';
    import { downloadOSMData } from '$lib/schwarzplan/osm/overpass';
    import { fetchElevationData } from '$lib/schwarzplan/elevation/client';
    import { SchwarzplanWorker } from '$lib/schwarzplan/worker/client';
    import { getSuitableScales, estimateOsmFilesize } from '$lib/schwarzplan/geometry/bounds';
    import { downloadFile, getMimeType, getFilename } from '$lib/schwarzplan/exporters/base';
    import type { ExportFormat, ProgressInfo } from '$lib/schwarzplan/types';
    import { onMount } from 'svelte';

    let dlOpen = $state(false);
    let worker: SchwarzplanWorker | null = null;
    let scaleDialogOpen = $state(false);
    let selectedFormat = $state<ExportFormat>('dxf');
    let availableScales = $state<any[]>([]);
    let cumulativeProgress = $state(0);
    let isLoading = $state(true);
    let isCancelled = $state(false);

    onMount(() => {
        isLoading = false;
    });

    // Calculate cumulative progress across all steps
    function calculateCumulativeProgress(info: ProgressInfo): number {
        const stepWeights = {
            'init': { start: 0, weight: 5 },
            'osm-download': { start: 5, weight: 25 },
            'osm-parse': { start: 30, weight: 15 },
            'elevation-download': { start: 45, weight: 10 },
            'contours': { start: 55, weight: 10 },
            'export': { start: 65, weight: 30 },
            'complete': { start: 100, weight: 0 },
            'error': { start: 0, weight: 0 }
        };

        const step = stepWeights[info.step];
        if (!step) return 0;

        if (info.step === 'complete') return 100;
        if (info.step === 'error') return 0;

        const stepProgress = info.percent ?? 0;
        return Math.min(100, Math.round(step.start + (stepProgress * step.weight / 100)));
    }

    // Wrapper for progress callback that calculates cumulative progress
    function progressWrapper(info: ProgressInfo) {
        // Don't update progress if cancelled
        if (isCancelled) return;
        
        cumulativeProgress = calculateCumulativeProgress(info);
        $progress = { ...info, percent: cumulativeProgress };
    }

    async function handleFormatClick(format: ExportFormat) {
        // Check zoom level
        if ($mapLocation.zoom < 11) {
            alert('Bitte vergrößern Sie die Karte (Zoom ≥ 11)');
            return;
        }

        // Check bounds
        if (!$currentMapBounds) {
            alert('Kartengrenzen konnten nicht ermittelt werden');
            return;
        }

        selectedFormat = format;
        dlOpen = false; // Close the button menu

        // For SVG/PDF, show scale selector first
        if (format === 'svg' || format === 'pdf') {
            availableScales = getSuitableScales($currentMapBounds);
            scaleDialogOpen = true;
        } else {
            // DXF doesn't need scale, start immediately
            await startGeneration(format, undefined);
        }
    }

    async function startGeneration(format: ExportFormat, scale?: number) {
        // Reset cancellation flag
        isCancelled = false;
        
        const bounds = $currentMapBounds;
        if (!bounds) return;

        const zoom = $mapLocation.zoom;
        const layers = $selectedLayers;

        try {
            // Initialize progress
            progressWrapper({
                step: 'init',
                percent: 0,
                message: 'Initialisierung...'
            });

            // Check if cancelled
            if (isCancelled) return;

            // Download OSM data
            const osmData = await downloadOSMData(bounds, layers, progressWrapper);

            // Check if cancelled
            if (isCancelled) return;

            // Download elevation data if contours are selected
            let elevationMatrix: number[][] | null = null;
            if (layers.includes('contours')) {
                elevationMatrix = await fetchElevationData(bounds, progressWrapper);
            }

            // Check if cancelled
            if (isCancelled) return;

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
                progressWrapper,
                $contourInterval
            );

            // Check if cancelled before downloading
            if (isCancelled) return;

            // Download result
            const mimeType = getMimeType(format);
            const filename = getFilename(format);
            downloadFile(filename, result, mimeType);

            // Complete
            progressWrapper({
                step: 'complete',
                percent: 100,
                message: 'Download abgeschlossen'
            });

            // Clear progress after 2 seconds
            setTimeout(() => {
                $progress = null;
                cumulativeProgress = 0;
            }, 2000);
        } catch (error) {
            // Only show error if not cancelled
            if (!isCancelled) {
                console.error('Generation error:', error);
                $progress = {
                    step: 'error',
                    percent: 0,
                    message: error instanceof Error ? error.message : 'Ein Fehler ist aufgetreten'
                };
            }
        }
    }

    function handleScaleSelection(scale: number) {
        scaleDialogOpen = false;
        startGeneration(selectedFormat, scale);
    }

    function handleCancel() {
        // Set cancellation flag
        isCancelled = true;
        
        // Cancel worker if it exists
        if (worker) {
            worker.cancel();
            worker = null;
        }
        
        // Immediately close progress dialog
        $progress = null;
        cumulativeProgress = 0;
    }
</script>

<div class="absolute bottom-4 right-4 flex flex-col items-center gap-2">
    {#if isLoading}
        <!-- Skeleton loading state -->
        <Skeleton class="h-20 w-20 rounded-2xl" />
    {:else}
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
                onclick={() => handleFormatClick('pdf')}
            >
                PDF
            </Button>
            <Button 
                class="h-14 w-14 rounded-lg text-xs font-bold absolute right-3 bottom-42 cursor-pointer hover:scale-105 active:scale-95 shadow-lg"
                onclick={() => handleFormatClick('svg')}
            >
                SVG
            </Button>
            <Button 
                class="h-14 w-14 rounded-lg text-xs font-bold absolute right-3 bottom-24 cursor-pointer hover:scale-105 active:scale-95 shadow-lg"
                onclick={() => handleFormatClick('dxf')}
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
    {/if}
</div>

<!-- Scale selection dialog for SVG/PDF -->
<Dialog open={scaleDialogOpen} onOpenChange={(open) => scaleDialogOpen = open}>
    <DialogContent class="max-w-sm">
        <DialogHeader>
            <DialogTitle>Maßstab wählen</DialogTitle>
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
        <Button variant="ghost" class="w-full mt-2" onclick={() => scaleDialogOpen = false}>
            Abbrechen
        </Button>
    </DialogContent>
</Dialog>

<!-- Progress indicator -->
<Dialog open={$progress !== null && $progress.step !== 'complete'} onOpenChange={() => {}}>
    <DialogContent class="max-w-md" showCloseButton={false}>
        <DialogHeader>
            <DialogTitle>
                {#if $progress?.step === 'error'}
                    Fehler
                {:else}
                    Generiere Schwarzplan...
                {/if}
            </DialogTitle>
        </DialogHeader>
        
        {#if $progress}
            <div class="space-y-3">
                <div class="flex justify-between text-sm">
                    <span>{$progress.message || ''}</span>
                    {#if $progress.percent !== undefined}
                        <span class="font-medium">{$progress.percent}%</span>
                    {/if}
                </div>
                
                {#if $progress.percent !== undefined && $progress.step !== 'error'}
                    <Progress value={$progress.percent} max={100} class="w-full" />
                {/if}

                {#if $progress.step === 'error'}
                    <Button variant="destructive" class="w-full mt-4" onclick={() => $progress = null}>
                        Schließen
                    </Button>
                {:else}
                    <p class="text-sm text-muted-foreground mt-2">
                        Bitte warten, während der Schwarzplan generiert wird...
                    </p>
                    <Button variant="outline" class="w-full mt-4" onclick={handleCancel}>
                        Abbrechen
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