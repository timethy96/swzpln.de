<script lang="ts">
	import { page } from '$app/stores';
	import { getLocale } from '$lib/paraglide/runtime';
	import * as m from '$lib/paraglide/messages';

	interface Props {
		title?: string;
		description?: string;
		keywords?: string[];
		image?: string;
		noindex?: boolean;
		canonical?: string;
		type?: 'website' | 'article';
	}

	let {
		title,
		description,
		keywords = [],
		image = '/og-image.png',
		noindex = false,
		canonical,
		type = 'website'
	}: Props = $props();

	const locale = $derived(getLocale());
	const appTitle = $derived(m.app_title());
	
	// Default values from messages
	const defaultTitle = $derived(m.seo_default_title());
	const defaultDescription = $derived(m.seo_default_description());
	const defaultKeywords = $derived(m.seo_keywords().split(', '));

	const finalTitle = $derived(title ? `${title} - ${appTitle}` : defaultTitle);
	const finalDescription = $derived(description || defaultDescription);
	const finalKeywords = $derived([...defaultKeywords, ...keywords].join(', '));
	const finalCanonical = $derived(canonical || $page.url.href);
	const finalImage = $derived(new URL(image, $page.url.origin).href);
</script>

<svelte:head>
	<!-- Primary Meta Tags -->
	<title>{finalTitle}</title>
	<meta name="title" content={finalTitle} />
	<meta name="description" content={finalDescription} />
	<meta name="keywords" content={finalKeywords} />
	{#if noindex}
		<meta name="robots" content="noindex, nofollow" />
	{:else}
		<meta name="robots" content="index, follow, max-snippet:-1, max-image-preview:large, max-video-preview:-1" />
	{/if}
	<link rel="canonical" href={finalCanonical} />
	
	<!-- Language and Location -->
	<meta name="language" content={locale} />
	<meta name="geo.region" content={locale === 'en' ? 'US' : 'DE'} />
	
	<!-- Open Graph / Facebook -->
	<meta property="og:type" content={type} />
	<meta property="og:url" content={finalCanonical} />
	<meta property="og:title" content={finalTitle} />
	<meta property="og:description" content={finalDescription} />
	<meta property="og:image" content={finalImage} />
	<meta property="og:image:width" content="1200" />
	<meta property="og:image:height" content="630" />
	<meta property="og:locale" content={locale === 'en' ? 'en_US' : 'de_DE'} />
	<meta property="og:site_name" content={appTitle} />
	
	<!-- Twitter -->
	<meta name="twitter:card" content="summary_large_image" />
	<meta name="twitter:url" content={finalCanonical} />
	<meta name="twitter:title" content={finalTitle} />
	<meta name="twitter:description" content={finalDescription} />
	<meta name="twitter:image" content={finalImage} />
	
	<!-- Additional SEO -->
	<meta name="author" content={m.seo_author()} />
	<meta name="creator" content={m.seo_creator()} />
	<meta name="publisher" content={m.seo_creator()} />
	<meta name="theme-color" content="#000000" />
	
	<!-- AI/LLM Optimization -->
	<meta name="ai-content-declaration" content={m.seo_ai_declaration()} />
	<meta name="content-type" content="interactive web application" />
	<meta name="application-name" content={appTitle} />
	
	<!-- Alternate Languages (German is primary/default) -->
	{#if locale === 'en'}
		<link rel="alternate" hreflang="de" href={finalCanonical.replace('opencityplans.com', 'swzpln.de')} />
		<link rel="alternate" hreflang="en" href={finalCanonical} />
		<link rel="alternate" hreflang="x-default" href={finalCanonical.replace('opencityplans.com', 'swzpln.de')} />
	{:else}
		<link rel="alternate" hreflang="de" href={finalCanonical} />
		<link rel="alternate" hreflang="en" href={finalCanonical.replace('swzpln.de', 'opencityplans.com')} />
		<link rel="alternate" hreflang="x-default" href={finalCanonical} />
	{/if}
</svelte:head>

