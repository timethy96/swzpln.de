// API endpoint to record a download
import { json, error } from '@sveltejs/kit';
import { recordDownload } from '$lib/server/counter';
import { checkRateLimit } from '$lib/server/ratelimit';
import type { RequestHandler } from './$types';

export const POST: RequestHandler = async ({ request, getClientAddress }) => {
	// Rate limiting: 5 downloads per IP per minute
	const clientIP = getClientAddress();
	if (!checkRateLimit(clientIP, 5, 60 * 1000)) {
		throw error(429, 'Too many requests');
	}

	// Origin check: only accept from same origin
	const origin = request.headers.get('origin');
	const host = request.headers.get('host');
	if (!origin || !host) {
		throw error(403, 'Forbidden');
	}
	try {
		const originHost = new URL(origin).host;
		if (originHost !== host) {
			throw error(403, 'Forbidden');
		}
	} catch {
		throw error(403, 'Forbidden');
	}

	try {
		recordDownload();
		return json({ success: true });
	} catch (err) {
		console.error('Failed to record download:', err);
		return json({ success: false, error: 'Failed to record download' }, { status: 500 });
	}
};
