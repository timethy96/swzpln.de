// CSV export endpoint for download statistics
import { getAllDownloads, getDownloadsByInterval } from '$lib/server/counter';
import type { RequestHandler } from './$types';

export const GET: RequestHandler = async ({ url }) => {
	const intervalParam = url.searchParams.get('intval');

	let csv = 'TS;VALUE;\n';

	try {
		if (intervalParam) {
			// Group by interval (interval in milliseconds)
			const intervalMs = parseInt(intervalParam, 10);
			const data = getDownloadsByInterval(intervalMs);
			for (const row of data) {
				csv += `${row.timestamp};${row.count};\n`;
			}
		} else {
			// Return all individual downloads
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
	} catch (error) {
		console.error('Failed to generate CSV:', error);
		return new Response('Error generating CSV', { status: 500 });
	}
};

