import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';

export const GET: RequestHandler = async () => {
    const healthCheck = {
        uptime: process.uptime(),
        message: 'OK',
        timestamp: new Date().toISOString(),
        service: 'city-plan-generator',
        version: '1.0.0'
    };

    try {
        // You could add additional health checks here:
        // - Database connectivity
        // - External API availability
        // - Memory usage
        // - Disk space
        
        // Test external APIs
        const externalServices = await Promise.allSettled([
            // Test Overpass API
            fetch('https://overpass.private.coffee/api/status', { 
                method: 'GET',
                signal: AbortSignal.timeout(5000) 
            }),
            // Test fallback Overpass API
            fetch('https://overpass-api.de/api/status', { 
                method: 'GET',
                signal: AbortSignal.timeout(5000) 
            })
        ]);

        const overpassPrimary = externalServices[0].status === 'fulfilled' && 
                               externalServices[0].value.ok;
        const overpassFallback = externalServices[1].status === 'fulfilled' && 
                                externalServices[1].value.ok;

        const checks = {
            overpass_primary: overpassPrimary ? 'healthy' : 'unhealthy',
            overpass_fallback: overpassFallback ? 'healthy' : 'unhealthy',
            memory: {
                used: Math.round(process.memoryUsage().rss / 1024 / 1024),
                heap_used: Math.round(process.memoryUsage().heapUsed / 1024 / 1024),
                heap_total: Math.round(process.memoryUsage().heapTotal / 1024 / 1024)
            }
        };

        // Determine overall health
        const isHealthy = overpassPrimary || overpassFallback;
        
        return json({
            ...healthCheck,
            status: isHealthy ? 'healthy' : 'degraded',
            checks
        }, { 
            status: isHealthy ? 200 : 503,
            headers: {
                'Cache-Control': 'no-cache, no-store, must-revalidate'
            }
        });

    } catch (error) {
        console.error('Health check failed:', error);
        
        return json({
            ...healthCheck,
            status: 'unhealthy',
            message: 'Health check failed',
            error: error instanceof Error ? error.message : 'Unknown error'
        }, { 
            status: 503,
            headers: {
                'Cache-Control': 'no-cache, no-store, must-revalidate'
            }
        });
    }
};