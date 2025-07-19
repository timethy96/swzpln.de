import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { readFile, writeFile, mkdir } from 'fs/promises';
import { existsSync } from 'fs';
import path from 'path';

// Simple file-based counter for maximum anonymity and simplicity
const COUNTER_FILE = path.join(process.cwd(), 'data', 'counter.json');
const LOCK_FILE = path.join(process.cwd(), 'data', 'counter.lock');

interface CounterData {
    total: number;
    lastUpdated: string;
}

// Ensure data directory exists
async function ensureDataDir() {
    const dataDir = path.dirname(COUNTER_FILE);
    if (!existsSync(dataDir)) {
        await mkdir(dataDir, { recursive: true });
    }
}

// Simple file-based locking for concurrent access
async function withLock<T>(operation: () => Promise<T>): Promise<T> {
    const maxAttempts = 50;
    const lockDelay = 20; // ms
    
    for (let attempt = 0; attempt < maxAttempts; attempt++) {
        try {
            // Try to create lock file (atomic operation)
            await writeFile(LOCK_FILE, process.pid.toString(), { flag: 'wx' });
            
            try {
                // Perform the operation
                return await operation();
            } finally {
                // Always release the lock
                try {
                    await import('fs/promises').then(fs => fs.unlink(LOCK_FILE));
                } catch {
                    // Ignore errors when releasing lock
                }
            }
        } catch (error: any) {
            if (error.code === 'EEXIST') {
                // Lock file exists, wait and retry
                await new Promise(resolve => setTimeout(resolve, lockDelay));
                continue;
            }
            throw error;
        }
    }
    
    throw new Error('Could not acquire lock after maximum attempts');
}

async function readCounter(): Promise<CounterData> {
    try {
        const data = await readFile(COUNTER_FILE, 'utf-8');
        return JSON.parse(data);
    } catch {
        // File doesn't exist or is invalid, return default
        return {
            total: 0,
            lastUpdated: new Date().toISOString()
        };
    }
}

async function writeCounter(data: CounterData): Promise<void> {
    await writeFile(COUNTER_FILE, JSON.stringify(data, null, 2), 'utf-8');
}

export const POST: RequestHandler = async ({ request }) => {
    try {
        await ensureDataDir();
        
        // Parse request body to get format info (optional)
        let format: string | undefined;
        try {
            const contentType = request.headers.get('content-type');
            if (contentType?.includes('application/json')) {
                const body = await request.json();
                format = body.format; // dxf, svg, pdf
            }
        } catch {
            // Ignore JSON parsing errors - we don't require format info
        }
        
        // Increment counter with file locking for concurrent safety
        const result = await withLock(async () => {
            const counter = await readCounter();
            
            const newCounter: CounterData = {
                total: counter.total + 1,
                lastUpdated: new Date().toISOString()
            };
            
            await writeCounter(newCounter);
            return newCounter;
        });
        
        // Log minimal information (no personal data)
        console.log(`Plan generated: #${result.total}${format ? ` (${format})` : ''} at ${result.lastUpdated}`);
        
        return json({
            success: true,
            count: result.total,
            timestamp: result.lastUpdated
        });
        
    } catch (error) {
        console.error('Analytics error:', error);
        
        // Never fail the request due to analytics issues
        return json({
            success: false,
            error: 'Analytics temporarily unavailable'
        }, { status: 200 }); // Return 200 to not break the download flow
    }
};

export const GET: RequestHandler = async () => {
    try {
        await ensureDataDir();
        
        const counter = await readCounter();
        
        return json({
            total: counter.total,
            lastUpdated: counter.lastUpdated
        });
        
    } catch (error) {
        console.error('Analytics read error:', error);
        
        return json({
            total: 0,
            lastUpdated: new Date().toISOString(),
            error: 'Could not read analytics data'
        });
    }
};