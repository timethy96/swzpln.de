import type { Handle } from '@sveltejs/kit';

const handleParaglide: Handle = ({ event, resolve }) => {
	// Simple language detection based on Accept-Language header
	const acceptLanguage = event.request.headers.get('accept-language') || '';
	const preferredLanguage = acceptLanguage.includes('de') ? 'de' : 'en';
	
	return resolve(event, {
		transformPageChunk: ({ html }) => html.replace('%paraglide.lang%', preferredLanguage)
	});
};

export const handle: Handle = handleParaglide;
