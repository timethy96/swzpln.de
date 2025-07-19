import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';

interface HeightRequest {
    north: number;
    west: number;
    south: number;
    east: number;
    resolution?: number;
}

// Enhanced mock height data generator with realistic terrain features
function generateMockHeightData(bounds: HeightRequest): number[][] {
    const { north, west, south, east, resolution = 50 } = bounds;
    
    // Calculate grid dimensions
    const latStep = (north - south) / resolution;
    const lonStep = (east - west) / resolution;
    
    const heightMatrix: number[][] = [];
    
    // Create realistic terrain based on geographic patterns
    const centerLat = (north + south) / 2;
    const centerLon = (east + west) / 2;
    
    for (let i = 0; i <= resolution; i++) {
        const row: number[] = [];
        const lat = south + (i * latStep);
        
        for (let j = 0; j <= resolution; j++) {
            const lon = west + (j * lonStep);
            
            // Distance from center (normalized)
            const distFromCenter = Math.sqrt(
                Math.pow((lat - centerLat) / (north - south), 2) + 
                Math.pow((lon - centerLon) / (east - west), 2)
            );
            
            // Base elevation - varies with latitude (higher in mountainous regions)
            let baseHeight = 50;
            
            // Add regional variation based on coordinates
            if (Math.abs(centerLat) > 45) {
                // Mountainous regions (Alps, Rockies, etc.)
                baseHeight = 200 + Math.abs(centerLat) * 10;
            } else if (Math.abs(centerLat) < 30) {
                // Coastal and flat regions
                baseHeight = 10 + Math.abs(centerLat) * 2;
            }
            
            // Add terrain features using multiple noise functions
            const largeScale = Math.sin(lat * 0.01) * Math.cos(lon * 0.01) * 150;
            const mediumScale = Math.sin(lat * 0.05) * Math.cos(lon * 0.05) * 80;
            const smallScale = Math.sin(lat * 0.2) * Math.cos(lon * 0.2) * 20;
            
            // Add hills and valleys
            const hillPattern = Math.sin(distFromCenter * Math.PI * 4) * 40;
            
            // Random variation for realistic terrain
            const randomNoise = (Math.random() - 0.5) * 15;
            
            // Combine all elevation factors
            const height = Math.max(0, 
                baseHeight + 
                largeScale + 
                mediumScale + 
                smallScale + 
                hillPattern + 
                randomNoise
            );
            
            row.push(Math.round(height * 10) / 10); // Round to 0.1m precision
        }
        heightMatrix.push(row);
    }
    
    return heightMatrix;
}

// Fetch real elevation data from Open Topo Data API
async function fetchRealHeightData(bounds: HeightRequest): Promise<number[][]> {
    const { north, west, south, east, resolution = 50 } = bounds;
    
    try {
        // Generate grid of coordinates
        const latStep = (north - south) / resolution;
        const lonStep = (east - west) / resolution;
        
        const coordinates: string[] = [];
        
        for (let i = 0; i <= resolution; i++) {
            for (let j = 0; j <= resolution; j++) {
                const lat = south + (i * latStep);
                const lon = west + (j * lonStep);
                coordinates.push(`${lat.toFixed(6)},${lon.toFixed(6)}`);
            }
        }
        
        // Open Topo Data API has rate limits, so we batch requests
        const batchSize = 100; // Maximum points per request
        const results: number[] = [];
        
        for (let i = 0; i < coordinates.length; i += batchSize) {
            const batch = coordinates.slice(i, i + batchSize);
            const locations = batch.join('|');
            
            try {
                // Use the free tier of Open Topo Data
                const response = await fetch(
                    `https://api.opentopodata.org/v1/mapzen?locations=${locations}`,
                    {
                        method: 'GET',
                        headers: {
                            'User-Agent': 'CityPlanGenerator/1.0'
                        },
                        signal: AbortSignal.timeout(10000) // 10 second timeout
                    }
                );
                
                if (!response.ok) {
                    throw new Error(`HTTP ${response.status}: ${response.statusText}`);
                }
                
                const data = await response.json();
                
                if (data.status !== 'OK') {
                    throw new Error(`API Error: ${data.error || 'Unknown error'}`);
                }
                
                // Extract elevations
                data.results.forEach((result: any) => {
                    results.push(result.elevation || 0);
                });
                
                // Rate limiting - wait between requests
                if (i + batchSize < coordinates.length) {
                    await new Promise(resolve => setTimeout(resolve, 1000));
                }
                
            } catch (error) {
                console.warn(`Batch ${Math.floor(i/batchSize) + 1} failed:`, error);
                // Fill with zeros for failed batch
                for (let j = 0; j < batch.length; j++) {
                    results.push(0);
                }
            }
        }
        
        // Convert flat array back to 2D matrix
        const matrix: number[][] = [];
        for (let i = 0; i <= resolution; i++) {
            const row: number[] = [];
            for (let j = 0; j <= resolution; j++) {
                const index = i * (resolution + 1) + j;
                row.push(results[index] || 0);
            }
            matrix.push(row);
        }
        
        console.log(`Successfully fetched elevation data for ${coordinates.length} points`);
        return matrix;
        
    } catch (error) {
        console.error('Failed to fetch real elevation data:', error);
        throw error;
    }
}

// Try multiple elevation data sources
async function fetchHeightDataWithFallback(bounds: HeightRequest): Promise<{
    heightMatrix: number[][];
    source: string;
    success: boolean;
}> {
    // First try real elevation data
    try {
        const heightMatrix = await fetchRealHeightData(bounds);
        return {
            heightMatrix,
            source: 'opentopodata',
            success: true
        };
    } catch (error) {
        console.warn('Real elevation data failed, using enhanced mock data:', error);
        
        // Fallback to enhanced mock data
        const heightMatrix = generateMockHeightData(bounds);
        return {
            heightMatrix,
            source: 'mock_enhanced',
            success: false
        };
    }
}

export const GET: RequestHandler = async ({ url }) => {
    try {
        // Parse query parameters
        const north = parseFloat(url.searchParams.get('north') || '0');
        const west = parseFloat(url.searchParams.get('west') || '0');
        const south = parseFloat(url.searchParams.get('south') || '0');
        const east = parseFloat(url.searchParams.get('east') || '0');
        const resolution = parseInt(url.searchParams.get('resolution') || '50');
        
        // Validate bounds
        if (north <= south || east <= west) {
            return json({
                success: false,
                error: 'Invalid bounds: north must be > south, east must be > west'
            }, { status: 400 });
        }
        
        // Check if area is reasonable (not too large)
        const latDiff = north - south;
        const lonDiff = east - west;
        const area = latDiff * lonDiff;
        
        if (area > 4) { // Limit to ~2 degree x 2 degree (about 200km x 200km)
            return json({
                success: false,
                error: 'Requested area too large. Maximum area is 4 square degrees.'
            }, { status: 400 });
        }
        
        // Limit resolution for performance
        const maxResolution = 100;
        const actualResolution = Math.min(Math.max(resolution, 10), maxResolution);
        
        const bounds: HeightRequest = {
            north,
            west,
            south,
            east,
            resolution: actualResolution
        };
        
        // Fetch height data with fallback
        const result = await fetchHeightDataWithFallback(bounds);
        
        return json({
            success: true,
            data: {
                bounds,
                heightMatrix: result.heightMatrix,
                metadata: {
                    rows: result.heightMatrix.length,
                    cols: result.heightMatrix[0]?.length || 0,
                    resolution: actualResolution,
                    source: result.source,
                    realData: result.success,
                    timestamp: new Date().toISOString(),
                    areaKm2: Math.round(area * 12100), // Rough conversion to km²
                    minHeight: Math.min(...result.heightMatrix.flat()),
                    maxHeight: Math.max(...result.heightMatrix.flat())
                }
            }
        });
        
    } catch (error) {
        console.error('Height data API error:', error);
        
        return json({
            success: false,
            error: 'Failed to fetch height data',
            details: error instanceof Error ? error.message : 'Unknown error'
        }, { status: 500 });
    }
};

export const POST: RequestHandler = async ({ request }) => {
    try {
        const bounds: HeightRequest = await request.json();
        
        // Validate required fields
        if (typeof bounds.north !== 'number' || 
            typeof bounds.west !== 'number' || 
            typeof bounds.south !== 'number' || 
            typeof bounds.east !== 'number') {
            return json({
                success: false,
                error: 'Missing required bounds: north, west, south, east'
            }, { status: 400 });
        }
        
        // Same validation as GET
        if (bounds.north <= bounds.south || bounds.east <= bounds.west) {
            return json({
                success: false,
                error: 'Invalid bounds: north must be > south, east must be > west'
            }, { status: 400 });
        }
        
        const latDiff = bounds.north - bounds.south;
        const lonDiff = bounds.east - bounds.west;
        const area = latDiff * lonDiff;
        
        if (area > 4) {
            return json({
                success: false,
                error: 'Requested area too large. Maximum area is 4 square degrees.'
            }, { status: 400 });
        }
        
        // Limit resolution
        const maxResolution = 100;
        bounds.resolution = Math.min(Math.max(bounds.resolution || 50, 10), maxResolution);
        
        // Fetch height data with fallback
        const result = await fetchHeightDataWithFallback(bounds);
        
        return json({
            success: true,
            data: {
                bounds,
                heightMatrix: result.heightMatrix,
                metadata: {
                    rows: result.heightMatrix.length,
                    cols: result.heightMatrix[0]?.length || 0,
                    resolution: bounds.resolution,
                    source: result.source,
                    realData: result.success,
                    timestamp: new Date().toISOString(),
                    areaKm2: Math.round(area * 12100),
                    minHeight: Math.min(...result.heightMatrix.flat()),
                    maxHeight: Math.max(...result.heightMatrix.flat())
                }
            }
        });
        
    } catch (error) {
        console.error('Height data API error:', error);
        
        return json({
            success: false,
            error: 'Failed to process height data request',
            details: error instanceof Error ? error.message : 'Unknown error'
        }, { status: 500 });
    }
};