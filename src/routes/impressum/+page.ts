import type { PageLoad } from './$types';

export const load: PageLoad = () => {
	return {
		seo: {
			title: 'Impressum & Datenschutz',
			description: 'Legal information and privacy policy for SWZPLN',
			noindex: true // Don't index legal pages
		}
	};
};
