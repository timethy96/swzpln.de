import type { Map } from 'leaflet';
import { bounds2array, estimateOsmFilesize } from './mapUtils';

export interface LayerSettings {
    buildings: boolean;
    green: boolean;
    water: boolean;
    forest: boolean;
    land: boolean;
    roads: boolean;
    rails: boolean;
    contours: boolean;
}

export interface ProgressCallback {
    (text: string, percent: number): void;
}

/**
 * Generate a city plan in the specified format
 */
export class PlanGenerator {
    private worker: Worker | null = null;
    private onProgress: ProgressCallback | null = null;
    private onComplete: ((blob: Blob, filename: string) => void) | null = null;
    private onError: ((error: string) => void) | null = null;

    constructor() {
        // Initialize the web worker for plan generation
        this.initWorker();
    }

    private initWorker() {
        try {
            this.worker = new Worker('/js/osm/gen_swzpln_worker.js');
            
            this.worker.onmessage = (event) => {
                const { type, data } = event.data;
                
                switch (type) {
                    case 'progress':
                        if (this.onProgress) {
                            this.onProgress(data.text, data.percent);
                        }
                        break;
                    case 'complete':
                        if (this.onComplete) {
                            const blob = new Blob([data.content], { type: data.mimeType });
                            this.onComplete(blob, data.filename);
                        }
                        break;
                    case 'error':
                        if (this.onError) {
                            this.onError(data.message);
                        }
                        break;
                }
            };

            this.worker.onerror = (error) => {
                if (this.onError) {
                    this.onError(`Worker error: ${error.message}`);
                }
            };
        } catch (error) {
            console.error('Failed to initialize worker:', error);
        }
    }

    /**
     * Generate a plan from the current map view
     */
    async generatePlan(
        map: Map,
        format: 'dxf' | 'svg' | 'pdf',
        layers: LayerSettings,
        onProgress?: ProgressCallback,
        onComplete?: (blob: Blob, filename: string) => void,
        onError?: (error: string) => void
    ): Promise<void> {
        this.onProgress = onProgress || null;
        this.onComplete = onComplete || null;
        this.onError = onError || null;

        const bounds = map.getBounds();
        const zoom = map.getZoom();
        const boundsArray = bounds2array(bounds);

        // Check if zoom is sufficient
        if (zoom < 11) {
            if (this.onError) {
                this.onError('Please zoom in more to generate a plan (minimum zoom level: 11)');
            }
            return;
        }

        // Estimate file size and warn if too large
        const estimatedSize = estimateOsmFilesize(zoom);
        if (estimatedSize > 50000000) { // 50MB
            const confirmLarge = confirm(
                `Warning: The estimated file size is ${Math.round(estimatedSize / 1000000)}MB. This may take a long time to process. Continue?`
            );
            if (!confirmLarge) {
                return;
            }
        }

        try {
            // Start the generation process
            if (this.onProgress) {
                this.onProgress('Initializing...', 0);
            }

            // For now, we'll use the existing generation logic
            // In a real implementation, you would send data to the worker
            await this.simulateGeneration(format, boundsArray, layers);

        } catch (error) {
            if (this.onError) {
                this.onError(`Generation failed: ${error.message}`);
            }
        }
    }

    /**
     * Simulate plan generation for demo purposes
     * In a real implementation, this would interface with the actual OSM data processing
     */
    private async simulateGeneration(
        format: string,
        bounds: [number, number, number, number],
        layers: LayerSettings
    ): Promise<void> {
        const steps = [
            { text: '1 / 4 - Initializing...', percent: 10 },
            { text: '2 / 4 - Downloading map data...', percent: 40 },
            { text: '3 / 4 - Processing map data...', percent: 70 },
            { text: `4 / 4 - Converting to ${format.toUpperCase()}...`, percent: 90 },
            { text: 'Download starting...', percent: 100 }
        ];

        for (let i = 0; i < steps.length; i++) {
            await new Promise(resolve => setTimeout(resolve, 1500));
            if (this.onProgress) {
                this.onProgress(steps[i].text, steps[i].percent);
            }
        }

        // Simulate file generation
        const mockContent = this.generateMockFile(format);
        const mimeType = this.getMimeType(format);
        const filename = `schwarzplan_${Date.now()}.${format}`;

        if (this.onComplete) {
            const blob = new Blob([mockContent], { type: mimeType });
            this.onComplete(blob, filename);
        }
    }

    /**
     * Generate mock file content for demonstration
     */
    private generateMockFile(format: string): string {
        switch (format) {
            case 'svg':
                return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="1000" height="1000" viewBox="0 0 1000 1000">
    <rect width="1000" height="1000" fill="white"/>
    <rect x="100" y="100" width="200" height="150" fill="black"/>
    <rect x="400" y="200" width="300" height="200" fill="black"/>
    <rect x="150" y="500" width="250" height="180" fill="black"/>
    <text x="500" y="50" text-anchor="middle" font-family="Arial" font-size="24">Schwarzplan Demo</text>
</svg>`;
            case 'dxf':
                return `0
SECTION
2
HEADER
9
$ACADVER
1
AC1009
0
ENDSEC
0
SECTION
2
ENTITIES
0
LINE
8
0
10
100.0
20
100.0
11
300.0
21
100.0
0
ENDSEC
0
EOF`;
            default:
                return 'Mock plan data';
        }
    }

    /**
     * Get MIME type for the specified format
     */
    private getMimeType(format: string): string {
        switch (format) {
            case 'svg':
                return 'image/svg+xml';
            case 'pdf':
                return 'application/pdf';
            case 'dxf':
                return 'application/dxf';
            default:
                return 'text/plain';
        }
    }

    /**
     * Cancel the current generation process
     */
    cancel(): void {
        if (this.worker) {
            this.worker.terminate();
            this.initWorker();
        }
    }

    /**
     * Clean up resources
     */
    destroy(): void {
        if (this.worker) {
            this.worker.terminate();
            this.worker = null;
        }
    }
}

/**
 * Download a file blob
 */
export function downloadFile(blob: Blob, filename: string): void {
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.style.display = 'none';
    
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    
    // Clean up the URL object
    setTimeout(() => URL.revokeObjectURL(url), 100);
}

/**
 * Count up usage statistics (if analytics is enabled)
 */
export function countUp(): void {
    // In the original implementation, this would send a request to track usage
    // For now, we'll just log it
    console.log('Plan generated');
    
    // You could implement analytics here, e.g.:
    // fetch('/api/count', { method: 'POST' });
}