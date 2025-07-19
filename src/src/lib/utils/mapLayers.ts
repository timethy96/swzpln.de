import type { Map, LayerGroup, GeoJSON } from 'leaflet';
import type { LayerSettings } from './planGenerator';

export class MapLayersManager {
    private map: Map;
    private layers: { [key: string]: LayerGroup } = {};
    private currentBounds: any = null;
    private currentZoom: number = 0;
    private isLoading: boolean = false;

    constructor(map: Map) {
        this.map = map;
        this.initializeLayers();
        this.setupEventListeners();
    }

    private async initializeLayers() {
        // Dynamically import Leaflet to avoid SSR issues
        const L = (await import('leaflet')).default;
        
        // Create layer groups for each data type
        this.layers = {
            buildings: L.layerGroup(),
            green: L.layerGroup(),
            water: L.layerGroup(),
            forest: L.layerGroup(),
            land: L.layerGroup(),
            roads: L.layerGroup(),
            rails: L.layerGroup(),
            contours: L.layerGroup()
        };
    }

    private setupEventListeners() {
        // Update layers when map moves or zooms
        this.map.on('moveend zoomend', () => {
            this.updateLayersIfNeeded();
        });
    }

    private async updateLayersIfNeeded() {
        const zoom = this.map.getZoom();
        const bounds = this.map.getBounds();
        
        // Only update if zoom is sufficient and bounds have changed significantly
        if (zoom < 13 || this.isLoading) return;
        
        if (!this.currentBounds || 
            !bounds.intersects(this.currentBounds) || 
            Math.abs(zoom - this.currentZoom) > 1) {
            
            this.currentBounds = bounds;
            this.currentZoom = zoom;
            await this.loadLayersData();
        }
    }

    async updateLayers(layerSettings: LayerSettings) {
        // Clear all layers first
        Object.values(this.layers).forEach(layer => {
            this.map.removeLayer(layer);
        });

        // Add enabled layers back to map
        Object.entries(layerSettings).forEach(([key, enabled]) => {
            if (enabled && this.layers[key]) {
                this.map.addLayer(this.layers[key]);
            }
        });

        // Load data if needed
        if (this.map.getZoom() >= 13) {
            await this.loadLayersData();
        }
    }

    private async loadLayersData() {
        if (this.isLoading) return;
        this.isLoading = true;

        try {
            const bounds = this.map.getBounds();
            const boundsArray: [number, number, number, number] = [
                bounds.getNorth(),
                bounds.getWest(),
                bounds.getSouth(),
                bounds.getEast()
            ];

            // Download OSM data for visible layers
            const enabledLayers = Object.keys(this.layers).filter(key => 
                this.map.hasLayer(this.layers[key])
            );

            if (enabledLayers.length === 0) return;

            const osmData = await this.downloadOSMData(boundsArray, enabledLayers);
            this.renderOSMData(osmData, enabledLayers);

        } catch (error) {
            console.error('Failed to load layer data:', error);
        } finally {
            this.isLoading = false;
        }
    }

    private async downloadOSMData(bounds: [number, number, number, number], layers: string[]) {
        // Construct Overpass API query
        const bbox = [bounds[2], bounds[1], bounds[0], bounds[3]].toString();
        let query = `[out:json][bbox:${bbox}];(`;
        
        layers.forEach((layer) => {
            switch (layer) {
                case "buildings":
                    query += 'way["building"];rel["building"];';
                    break;
                case "green":
                    query += 'way["leisure"="park"];';
                    query += 'way["landuse"="grass"];';
                    query += 'way["landuse"="meadow"];';
                    query += 'way["landuse"="allotments"];';
                    query += 'way["landuse"="cemetery"];';
                    query += 'way["landuse"="recreation_ground"];';
                    break;
                case "water":
                    query += 'way["natural"="water"];';
                    query += 'way["waterway"];';
                    break;
                case "forest":
                    query += 'way["landuse"="forest"];';
                    query += 'way["natural"="wood"];';
                    break;
                case "land":
                    query += 'way["landuse"="farmland"];';
                    break;
                case "roads":
                    query += 'way["highway"];';
                    break;
                case "rails":
                    query += 'way["railway"];';
                    break;
            }
        });
        
        query += ');out geom;';
        
        const overpassUrl = 'https://overpass.private.coffee/api/interpreter';
        
        try {
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
            
            return await response.json();
            
        } catch (error) {
            console.warn('Failed to load OSM data for layers:', error);
            return { elements: [] };
        }
    }

    private async renderOSMData(osmData: any, enabledLayers: string[]) {
        const L = (await import('leaflet')).default;
        
        // Clear existing layer data
        enabledLayers.forEach(layerName => {
            this.layers[layerName].clearLayers();
        });

        // Style definitions for different layer types
        const layerStyles: { [key: string]: any } = {
            buildings: {
                fillColor: '#333333',
                color: '#000000',
                weight: 1,
                opacity: 0.8,
                fillOpacity: 0.7
            },
            green: {
                fillColor: '#9DBD7E',
                color: '#8BA876',
                weight: 1,
                opacity: 0.8,
                fillOpacity: 0.6
            },
            water: {
                fillColor: '#AAD4FF',
                color: '#7CB4F0',
                weight: 1,
                opacity: 0.8,
                fillOpacity: 0.7
            },
            forest: {
                fillColor: '#608156',
                color: '#4F6B47',
                weight: 1,
                opacity: 0.8,
                fillOpacity: 0.7
            },
            land: {
                fillColor: '#FFEAAA',
                color: '#E6D194',
                weight: 1,
                opacity: 0.8,
                fillOpacity: 0.5
            },
            roads: {
                color: '#828282',
                weight: 2,
                opacity: 0.8
            },
            rails: {
                color: '#BEBEBE',
                weight: 2,
                opacity: 0.8,
                dashArray: '5, 5'
            }
        };

        // Process OSM elements
        osmData.elements?.forEach((element: any) => {
            if (element.type === 'way' && element.geometry) {
                const layerType = this.getElementLayerType(element.tags);
                
                if (layerType && enabledLayers.includes(layerType) && this.layers[layerType]) {
                    const coordinates = element.geometry.map((coord: any) => [coord.lat, coord.lon]);
                    
                    if (coordinates.length < 2) return;
                    
                    let feature;
                    const style = layerStyles[layerType];
                    
                    if (layerType === 'roads' || layerType === 'rails') {
                        // Render as polyline
                        feature = L.polyline(coordinates, style);
                    } else {
                        // Check if it's a closed polygon
                        const isPolygon = coordinates.length > 2 && 
                                        coordinates[0][0] === coordinates[coordinates.length - 1][0] &&
                                        coordinates[0][1] === coordinates[coordinates.length - 1][1];
                        
                        if (isPolygon) {
                            feature = L.polygon(coordinates, style);
                        } else {
                            feature = L.polyline(coordinates, style);
                        }
                    }
                    
                    // Add popup with element information
                    if (element.tags) {
                        const popupContent = this.createPopupContent(element.tags, layerType);
                        feature.bindPopup(popupContent);
                    }
                    
                    this.layers[layerType].addLayer(feature);
                }
            }
        });
    }

    private getElementLayerType(tags: any): string | null {
        if (!tags) return null;
        
        if (tags.building) return 'buildings';
        if (tags.landuse === 'forest' || tags.natural === 'wood') return 'forest';
        if (tags.natural === 'water' || tags.waterway) return 'water';
        if (tags.leisure === 'park' || 
            tags.landuse === 'grass' || 
            tags.landuse === 'meadow' ||
            tags.landuse === 'allotments' ||
            tags.landuse === 'cemetery' ||
            tags.landuse === 'recreation_ground') return 'green';
        if (tags.landuse === 'farmland') return 'land';
        if (tags.highway) return 'roads';
        if (tags.railway) return 'rails';
        
        return null;
    }

    private createPopupContent(tags: any, layerType: string): string {
        let content = `<div class="osm-popup"><strong>${layerType}</strong><br>`;
        
        // Add relevant tag information
        const relevantTags = ['name', 'building', 'landuse', 'natural', 'highway', 'railway', 'waterway', 'leisure'];
        relevantTags.forEach(tag => {
            if (tags[tag]) {
                content += `${tag}: ${tags[tag]}<br>`;
            }
        });
        
        content += '</div>';
        return content;
    }

    /**
     * Clean up resources
     */
    destroy() {
        // Remove all layers from map
        Object.values(this.layers).forEach(layer => {
            this.map.removeLayer(layer);
        });
        
        // Remove event listeners
        this.map.off('moveend zoomend');
    }
}