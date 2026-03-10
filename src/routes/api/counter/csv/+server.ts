// CSV export endpoint for download statistics
import { getAllDownloads, getDownloadsByInterval } from '$lib/server/counter';
import { checkRateLimit } from '$lib/server/ratelimit';
import { error } from '@sveltejs/kit';
import type { RequestHandler } from './$types';

export const GET: RequestHandler = async ({ url, getClientAddress }) => {
	// Rate limiting: 10 requests per IP per minute
	const clientIP = getClientAddress();
	if (!checkRateLimit(clientIP, 10, 60 * 1000)) {
		throw error(429, 'Too many requests');
	}

	const intervalParam = url.searchParams.get('intval');

	let csv = 'TS;VALUE;\n';

	try {
		if (intervalParam) {
			const intervalMs = parseInt(intervalParam, 10);
			if (isNaN(intervalMs) || intervalMs <= 0) {
				throw error(400, 'Invalid interval parameter');
			}
			const data = getDownloadsByInterval(intervalMs);
			for (const row of data) {
				csv += `${row.timestamp};${row.count};\n`;
			}
		} else {
			const data = getAllDownloads();
			for (const row of data) {
				csv += `${row.timestamp};${row.id};\n`;
			}
		}

		return new Response(csv, {
			headers: {
				'Content-Type': 'text/csv',
				'Content-Disposition': 'inline; filename=swzpln.csv'
			}
		});
	} catch (err) {
		if (err && typeof err === 'object' && 'status' in err) throw err;
		console.error('Failed to generate CSV:', err);
		return new Response('Error generating CSV', { status: 500 });
	}
};
