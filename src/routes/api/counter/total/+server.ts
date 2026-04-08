// API endpoint to get total download count
import { json, error } from '@sveltejs/kit';
import { getTotalDownloads } from '$lib/server/counter';
import { checkRateLimit } from '$lib/server/ratelimit';
import type { RequestHandler } from './$types';

export const GET: RequestHandler = async ({ getClientAddress }) => {
	// Rate limiting: 30 requests per IP per minute
	const clientIP = getClientAddress();
	if (!checkRateLimit(clientIP, 30, 60 * 1000)) {
		throw error(429, 'Too many requests');
	}

	try {
		const total = getTotalDownloads();
		return json({ total });
	} catch (err) {
		console.error('Failed to get download count:', err);
		return json({ total: 0 }, { status: 500 });
	}
};
