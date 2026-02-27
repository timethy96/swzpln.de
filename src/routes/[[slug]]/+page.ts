import type { PageLoad } from './$types';
import { getLocale } from '$lib/paraglide/runtime';

export const load: PageLoad = async ({ params }) => {
	const slug = params.slug;
	const locale = getLocale();

	if (!slug) {
		return { slug, seo: null };
	}

	// Format city name for display (capitalize, replace hyphens with spaces)
	const cityName = slug.charAt(0).toUpperCase() + slug.slice(1).replace(/-/g, ' ');

	// Generate SEO content based on locale (German is primary)
	const seo = locale === 'en'
		? {
			title: `${cityName} - Site Plan Generator`,
			description: `Generate professional site plans for ${cityName}. Free DXF, SVG, and PDF export. Perfect for architects and urban planners. Based on OpenStreetMap data.`,
			keywords: [slug, cityName, 'site plan', 'schwarzplan', 'city plan', 'urban planning', 'architecture', 'DXF export', 'free CAD tools']
		}
		: {
			title: `${cityName} - Schwarzplan Generator`,
			description: `Erstelle Schwarzpläne für ${cityName}. Kostenloser Export als DXF, SVG und PDF. Basierend auf OpenStreetMap-Daten.`,
			keywords: [slug, cityName, 'schwarzplan', 'lageplan', 'stadtplan', 'stadtplanung', 'architektur', 'DXF export', 'kostenlose CAD tools']
		};

	return {
		slug,
		seo
	};
};

