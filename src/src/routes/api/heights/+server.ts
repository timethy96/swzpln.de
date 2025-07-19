import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';

interface HeightRequest {
    north: number;
    west: number;
    south: number;
    east: number;
    resolution?: number;
}

// Mock height data generator
function generateMockHeightData(bounds: HeightRequest): number[][] {
    const { north, west, south, east, resolution = 50 } = bounds;
    
    // Calculate grid dimensions
    const latStep = (north - south) / resolution;
    const lonStep = (east - west) / resolution;
    
    const heightMatrix: number[][] = [];
    
    for (let i = 0; i <= resolution; i++) {
        const row: number[] = [];
        const lat = south + (i * latStep);
        
        for (let j = 0; j <= resolution; j++) {
            const lon = west + (j * lonStep);
            
            // Generate realistic-looking height data using sine waves
            // This creates hills and valleys
            const baseHeight = 100; // Base elevation in meters
            const noise1 = Math.sin(lat * 0.1) * 50;
            const noise2 = Math.cos(lon * 0.1) * 30;
            const noise3 = Math.sin((lat + lon) * 0.05) * 20;
            
            const height = Math.max(0, baseHeight + noise1 + noise2 + noise3);
            row.push(Math.round(height));
        }
        heightMatrix.push(row);
    }
    
    return heightMatrix;
}

// In a real implementation, this would fetch from elevation APIs like:
// - Open Topo Data (free): https://api.opentopodata.org/
// - Mapbox Elevation API
// - Google Elevation API
// - USGS Elevation Point Query Service
async function fetchRealHeightData(bounds: HeightRequest): Promise<number[][]> {
    // Example using Open Topo Data API
    const { north, west, south, east, resolution = 50 } = bounds;
    
    try {
        // For demonstration, we'll just return mock data
        // In production, you would make requests to elevation services
        
        /*
        Example real implementation:
        
        const points: Array<{lat: number, lon: number}> = [];
        const latStep = (north - south) / resolution;
        const lonStep = (east - west) / resolution;
        
        for (let i = 0; i <= resolution; i++) {
            for (let j = 0; j <= resolution; j++) {
                points.push({
                    lat: south + (i * latStep),
                    lon: west + (j * lonStep)
                });
            }
        }
        
        // Batch requests to avoid rate limits
        const batchSize = 100;
        const results: number[] = [];
        
        for (let i = 0; i < points.length; i += batchSize) {
            const batch = points.slice(i, i + batchSize);
            const locations = batch.map(p => `${p.lat},${p.lon}`).join('|');
            
            const response = await fetch(
                `https://api.opentopodata.org/v1/mapzen?locations=${locations}`
            );
            const data = await response.json();
            
            data.results.forEach((result: any) => {
                results.push(result.elevation || 0);
            });
            
            // Rate limiting
            await new Promise(resolve => setTimeout(resolve, 1000));
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
        
        return matrix;
        */
        
        return generateMockHeightData(bounds);
        
    } catch (error) {
        console.error('Failed to fetch real height data:', error);
        return generateMockHeightData(bounds);
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
                error: 'Invalid bounds: north must be > south, east must be > west'
            }, { status: 400 });
        }
        
        // Check if area is reasonable (not too large)
        const latDiff = north - south;
        const lonDiff = east - west;
        const area = latDiff * lonDiff;
        
        if (area > 1) { // Limit to ~1 degree x 1 degree
            return json({
                error: 'Requested area too large. Maximum area is 1 square degree.'
            }, { status: 400 });
        }
        
        // Limit resolution
        const maxResolution = 100;
        const actualResolution = Math.min(resolution, maxResolution);
        
        const bounds: HeightRequest = {
            north,
            west,
            south,
            east,
            resolution: actualResolution
        };
        
        // Fetch height data
        const heightMatrix = await fetchRealHeightData(bounds);
        
        return json({
            success: true,
            data: {
                bounds,
                heightMatrix,
                metadata: {
                    rows: heightMatrix.length,
                    cols: heightMatrix[0]?.length || 0,
                    resolution: actualResolution,
                    source: 'mock_data', // In production: 'opentopodata' or other service
                    timestamp: new Date().toISOString()
                }
            }
        });
        
    } catch (error) {
        console.error('Height data API error:', error);
        
        return json({
            success: false,
            error: 'Failed to fetch height data'
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
                error: 'Missing required bounds: north, west, south, east'
            }, { status: 400 });
        }
        
        // Same validation and processing as GET
        if (bounds.north <= bounds.south || bounds.east <= bounds.west) {
            return json({
                error: 'Invalid bounds: north must be > south, east must be > west'
            }, { status: 400 });
        }
        
        const heightMatrix = await fetchRealHeightData(bounds);
        
        return json({
            success: true,
            data: {
                bounds,
                heightMatrix,
                metadata: {
                    rows: heightMatrix.length,
                    cols: heightMatrix[0]?.length || 0,
                    resolution: bounds.resolution || 50,
                    source: 'mock_data',
                    timestamp: new Date().toISOString()
                }
            }
        });
        
    } catch (error) {
        console.error('Height data API error:', error);
        
        return json({
            success: false,
            error: 'Failed to process height data request'
        }, { status: 500 });
    }
};