// API endpoint to get total download count
import { json } from '@sveltejs/kit';
import { getTotalDownloads } from '$lib/server/counter';
import type { RequestHandler } from './$types';

export const GET: RequestHandler = async () => {
	try {
		const total = getTotalDownloads();
		return json({ total });
	} catch (error) {
		console.error('Failed to get download count:', error);
		return json({ total: 0 }, { status: 500 });
	}
};

