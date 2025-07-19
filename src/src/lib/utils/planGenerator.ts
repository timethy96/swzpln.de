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

// OSM data download functionality
async function downloadOSMData(bounds: [number, number, number, number], layers: LayerSettings, progressCallback: ProgressCallback): Promise<any> {
    const enabledLayers = Object.entries(layers)
        .filter(([key, enabled]) => enabled)
        .map(([key]) => {
            // Map our layer names to OSM layer names
            switch (key) {
                case 'buildings': return 'building';
                case 'green': return 'green';
                case 'water': return 'water';
                case 'forest': return 'forest';
                case 'land': return 'farmland';
                case 'roads': return 'highway';
                case 'rails': return 'railway';
                case 'contours': return 'contours';
                default: return key;
            }
        });

    // Construct Overpass API query
    const bbox = [bounds[2], bounds[1], bounds[0], bounds[3]].toString();
    let query = `[out:json][bbox:${bbox}];(`;
    
    enabledLayers.forEach((layer) => {
        switch (layer) {
            case "building":
                query += 'nwr["building"];';
                break;
            case "green":
                query += 'nwr["leisure"="park"];';
                query += 'nwr["landuse"="allotments"];';
                query += 'nwr["landuse"="meadow"];';
                query += 'nwr["landuse"="orchard"];';
                query += 'nwr["landuse"="vineyard"];';
                query += 'nwr["landuse"="cemetery"];';
                query += 'nwr["landuse"="grass"];';
                query += 'nwr["landuse"="plant_nursery"];';
                query += 'nwr["landuse"="recreation_ground"];';
                query += 'nwr["landuse"="village_green"];';
                break;
            case "water":
                query += 'nwr["natural"="water"];';
                query += 'nwr["waterway"];';
                break;
            case "forest":
                query += 'nwr["landuse"="forest"];';
                query += 'nwr["natural"="wood"];';
                break;
            case "farmland":
                query += 'nwr["landuse"="farmland"];';
                break;
            case "highway":
                query += 'nwr["highway"];';
                break;
            case "railway":
                query += 'nwr["railway"];';
                break;
        }
    });
    
    query += ');out geom;';
    
    const overpassUrl = 'https://overpass.private.coffee/api/interpreter';
    const fallbackUrl = 'https://overpass-api.de/api/interpreter';
    
    progressCallback('Downloading map data...', 20);
    
    try {
        // Try primary API first
        const response = await fetch(overpassUrl, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
            },
            body: `data=${encodeURIComponent(query)}`
        });
        
        if (!response.ok) {
            throw new Error(`HTTP ${response.status}`);
        }
        
        const reader = response.body!.getReader();
        const contentLength = response.headers.get('Content-Length');
        let receivedLength = 0;
        const chunks: Uint8Array[] = [];
        
        while (true) {
            const { done, value } = await reader.read();
            if (done) break;
            
            chunks.push(value);
            receivedLength += value.length;
            
            if (contentLength) {
                const progress = Math.round((receivedLength / parseInt(contentLength)) * 30) + 20;
                progressCallback('Downloading map data...', progress);
            }
        }
        
        // Combine chunks
        const allChunks = new Uint8Array(receivedLength);
        let position = 0;
        for (const chunk of chunks) {
            allChunks.set(chunk, position);
            position += chunk.length;
        }
        
        const result = new TextDecoder('utf-8').decode(allChunks);
        progressCallback('Map data downloaded', 50);
        
        return JSON.parse(result);
        
    } catch (error) {
        console.warn('Primary Overpass API failed, trying fallback...', error);
        
        // Try fallback API
        try {
            const response = await fetch(fallbackUrl, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded',
                },
                body: `data=${encodeURIComponent(query)}`
            });
            
            if (!response.ok) {
                throw new Error(`HTTP ${response.status}`);
            }
            
            const data = await response.json();
            progressCallback('Map data downloaded', 50);
            return data;
            
        } catch (fallbackError) {
            throw new Error(`Failed to download OSM data: ${fallbackError.message}`);
        }
    }
}

// Height data download using local API
async function downloadHeightData(bounds: [number, number, number, number], progressCallback: ProgressCallback): Promise<any> {
    progressCallback('Downloading height data...', 55);
    
    try {
        const response = await fetch('/api/heights', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                north: bounds[0],
                west: bounds[1],
                south: bounds[2],
                east: bounds[3],
                resolution: 50
            })
        });
        
        if (!response.ok) {
            throw new Error(`Height API error: ${response.status}`);
        }
        
        const result = await response.json();
        
        if (!result.success) {
            throw new Error(result.error || 'Failed to fetch height data');
        }
        
        progressCallback('Height data downloaded', 58);
        return result.data.heightMatrix;
        
    } catch (error) {
        console.warn('Failed to download height data:', error);
        // Return null to indicate no height data available
        return null;
    }
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
                const { type, task, status, data, format, result, filename, message } = event.data;
                
                switch (type) {
                    case 'progress':
                        if (this.onProgress) {
                            const progressText = this.getProgressText(task, status);
                            const progressPercent = this.getProgressPercent(task, data);
                            this.onProgress(progressText, progressPercent);
                        }
                        break;
                    case 'complete':
                        if (this.onComplete) {
                            const mimeType = this.getMimeType(format);
                            const blob = new Blob([result], { type: mimeType });
                            this.onComplete(blob, filename);
                        }
                        break;
                    case 'error':
                        if (this.onError) {
                            this.onError(message);
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

    private getProgressText(task: string, status: string): string {
        switch (task) {
            case 'init':
                return 'Initializing...';
            case 'processing':
                return 'Processing map data...';
            case 'contours':
                return 'Generating contour lines...';
            case 'converting':
                return status;
            case 'complete':
                return 'Download starting...';
            default:
                return status || 'Processing...';
        }
    }

    private getProgressPercent(task: string, data?: any): number {
        switch (task) {
            case 'init':
                return 60;
            case 'processing':
                return data ? 60 + Math.round((data.current / data.total) * 20) : 70;
            case 'contours':
                return 80;
            case 'converting':
                return data ? 80 + Math.round((data.current / data.total) * 15) : 90;
            case 'complete':
                return 100;
            default:
                return 70;
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

            // Download OSM data
            const osmData = await downloadOSMData(boundsArray, layers, this.onProgress || (() => {}));
            
            // Download height data if contours are enabled
            let heightData = null;
            if (layers.contours) {
                heightData = await downloadHeightData(boundsArray, this.onProgress || (() => {}));
            }

            // Convert layer settings to array format for worker
            const enabledLayers = Object.entries(layers)
                .filter(([key, enabled]) => enabled)
                .map(([key]) => {
                    switch (key) {
                        case 'buildings': return 'building';
                        case 'green': return 'green';
                        case 'water': return 'water';
                        case 'forest': return 'forest';
                        case 'land': return 'farmland';
                        case 'roads': return 'highway';
                        case 'rails': return 'railway';
                        case 'contours': return 'contours';
                        default: return key;
                    }
                });

            // Send data to worker for processing
            if (this.worker) {
                this.worker.postMessage({
                    format,
                    osm_json: osmData,
                    hm_matrix: heightData,
                    bounds: boundsArray,
                    layers: enabledLayers,
                    zoom,
                    scale: 1 // Default scale, could be configurable
                });
            }

        } catch (error) {
            if (this.onError) {
                this.onError(`Generation failed: ${error.message}`);
            }
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
    // Send analytics request
    fetch('/api/analytics/count', { method: 'POST' }).catch(() => {
        // Ignore analytics errors
        console.log('Plan generated');
    });
}