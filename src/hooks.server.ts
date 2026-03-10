import type { Handle } from '@sveltejs/kit';
import { sequence } from '@sveltejs/kit/hooks';
import { paraglideMiddleware } from '$lib/paraglide/server';

const handleParaglide: Handle = ({ event, resolve }) =>
	paraglideMiddleware(event.request, ({ request, locale }) => {
		event.request = request;

		return resolve(event, {
			transformPageChunk: ({ html }) => html.replace('%paraglide.lang%', locale)
		});
	});

const handleSecurityHeaders: Handle = async ({ event, resolve }) => {
	const response = await resolve(event);

	// Transport security (HSTS) should be set by the reverse proxy (nginx/Caddy/Traefik)
	response.headers.set('X-Frame-Options', 'SAMEORIGIN');
	response.headers.set('X-Content-Type-Options', 'nosniff');
	response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
	response.headers.set('Permissions-Policy', 'camera=(), microphone=(), geolocation=(self)');
	response.headers.set(
		'Content-Security-Policy',
		[
			"default-src 'self'",
			// Scripts: self + inline needed for Svelte/SvelteKit hydration & structured data
			"script-src 'self' 'unsafe-inline'",
			// Styles: self + inline needed for Svelte component styles & MapLibre GL
			"style-src 'self' 'unsafe-inline'",
			// Images: self + tile servers + data URIs (MapLibre markers/icons)
			"img-src 'self' data: blob: https://*.basemaps.cartocdn.com https://tile.openstreetmap.org",
			// Fonts: self
			"font-src 'self'",
			// Connect: APIs used by the app
			"connect-src 'self' https://*.basemaps.cartocdn.com https://tile.openstreetmap.org https://overpass.private.coffee https://overpass-api.de https://api.opentopodata.org https://photon.komoot.io blob:",
			// Workers: self + blob (Web Workers for export processing)
			"worker-src 'self' blob:",
			// Child/frame: none (no iframes needed)
			"frame-src 'none'",
			// Object: none
			"object-src 'none'",
			// Base URI: self
			"base-uri 'self'",
			// Form action: self
			"form-action 'self'"
		].join('; ')
	);

	return response;
};

export const handle: Handle = sequence(handleParaglide, handleSecurityHeaders);
