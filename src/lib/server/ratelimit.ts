// Simple in-memory rate limiter for counter endpoint
// Thread-safe via single-threaded Node.js event loop

interface RateLimitEntry {
	count: number;
	resetAt: number;
}

const limits = new Map<string, RateLimitEntry>();

// Cleanup old entries every 5 minutes
setInterval(
	() => {
		const now = Date.now();
		for (const [key, entry] of limits.entries()) {
			if (entry.resetAt < now) {
				limits.delete(key);
			}
		}
	},
	5 * 60 * 1000
);

/**
 * Check if request is rate limited
 * @param key - Identifier (e.g., IP address)
 * @param maxRequests - Maximum requests allowed
 * @param windowMs - Time window in milliseconds
 * @returns true if allowed, false if rate limited
 */
export function checkRateLimit(key: string, maxRequests: number, windowMs: number): boolean {
	const now = Date.now();
	const entry = limits.get(key);

	if (!entry || entry.resetAt < now) {
		// New window
		limits.set(key, { count: 1, resetAt: now + windowMs });
		return true;
	}

	if (entry.count >= maxRequests) {
		return false;
	}

	entry.count++;
	return true;
}
