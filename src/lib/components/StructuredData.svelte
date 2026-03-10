<script lang="ts">
	import { page } from '$app/stores';
	import { getLocale } from '$lib/paraglide/runtime';
	import * as m from '$lib/paraglide/messages';

	const locale = $derived(getLocale());
	const appTitle = $derived(m.app_title());
	const origin = $derived($page.url.origin);

	// WebSite Schema
	const websiteSchema = $derived({
		'@context': 'https://schema.org',
		'@type': 'WebSite',
		name: appTitle,
		alternateName: locale === 'en' ? 'OpenCityPlans' : 'SWZPLN',
		url: origin,
		description:
			locale === 'en'
				? 'Free professional site plan and 3D city model generator for architects and designers. Export as DXF, SVG, PDF, IFC (BIM), or 3D DXF.'
				: 'Kostenloser professioneller Schwarzplan und 3D-Stadtmodell Generator für Architekten und Designer. Export als DXF, SVG, PDF, IFC (BIM) oder 3D-DXF.',
		inLanguage: locale === 'en' ? 'en-US' : 'de-DE',
		potentialAction: {
			'@type': 'SearchAction',
			target: {
				'@type': 'EntryPoint',
				urlTemplate: `${origin}/{search_term_string}`
			},
			'query-input': 'required name=search_term_string'
		}
	});

	// Organization Schema (German site is primary)
	const organizationSchema = $derived({
		'@context': 'https://schema.org',
		'@type': 'Organization',
		name: 'SWZPLN',
		url: 'https://swzpln.de',
		alternateName: 'OpenCityPlans',
		logo: `${origin}/logo.png`,
		sameAs: ['https://github.com/timethy96/swzpln.de', 'https://ko-fi.com/swzpln'],
		founder: {
			'@type': 'Person',
			name: 'Timo Bilhöfer',
			url: 'https://timo.bilhoefer.de'
		},
		contactPoint: {
			'@type': 'ContactPoint',
			url: 'https://swzpln.de/impressum',
			contactType: 'Customer Service'
		}
	});

	// WebApplication Schema
	const webAppSchema = $derived({
		'@context': 'https://schema.org',
		'@type': 'WebApplication',
		name: appTitle,
		url: origin,
		applicationCategory: 'DesignApplication',
		applicationSubCategory: 'CAD',
		operatingSystem: 'Any',
		offers: {
			'@type': 'Offer',
			price: '0',
			priceCurrency: 'EUR'
		},
		featureList: [
			'Generate site plans from OpenStreetMap data',
			'Export to DXF, SVG, and PDF formats',
			'3D city models with extruded buildings',
			'IFC (BIM) export for architecture workflows',
			'3D DXF export for CAD software',
			'3D terrain visualization with elevation data',
			'Contour line generation',
			'Building footprints with height data',
			'Road networks',
			'Green spaces and water bodies'
		],
		screenshot: `${origin}/screenshot.png`,
		softwareVersion: '2.0',
		author: {
			'@type': 'Person',
			name: 'Timo Bilhöfer'
		},
		inLanguage: [locale === 'en' ? 'en-US' : 'de-DE']
	});

	// FAQ Schema
	const faqSchema = $derived({
		'@context': 'https://schema.org',
		'@type': 'FAQPage',
		mainEntity:
			locale === 'en'
				? [
						{
							'@type': 'Question',
							name: 'What is a site plan (schwarzplan)?',
							acceptedAnswer: {
								'@type': 'Answer',
								text: "A site plan (or schwarzplan in German) is a figure-ground diagram that shows buildings in solid black and open spaces in white. It's commonly used in architecture and urban planning to analyze urban form and spatial relationships."
							}
						},
						{
							'@type': 'Question',
							name: 'What file formats can I export?',
							acceptedAnswer: {
								'@type': 'Answer',
								text: 'You can export 2D site plans in DXF, SVG, and PDF formats. For 3D models, SWZPLN supports IFC (BIM format for Revit, ArchiCAD, etc.) and 3D DXF (for AutoCAD and other CAD software). All exports include layers for buildings, roads, green spaces, water bodies, and contour lines.'
							}
						},
						{
							'@type': 'Question',
							name: 'Can I create 3D city models and BIM data?',
							acceptedAnswer: {
								'@type': 'Answer',
								text: 'Yes, SWZPLN can generate 3D city models with extruded buildings based on OpenStreetMap height data. You can export these as IFC files for BIM workflows (compatible with Revit, ArchiCAD, and other BIM software) or as 3D DXF files for CAD applications. The models include building heights, terrain elevation, and roof shapes.'
							}
						},
						{
							'@type': 'Question',
							name: 'Is SWZPLN really free?',
							acceptedAnswer: {
								'@type': 'Answer',
								text: 'Yes, SWZPLN is completely free and open source. The project is published under the AGPL-3 license and relies on OpenStreetMap data. You can support the project through donations on Ko-fi.'
							}
						},
						{
							'@type': 'Question',
							name: 'What data sources does SWZPLN use?',
							acceptedAnswer: {
								'@type': 'Answer',
								text: 'SWZPLN uses OpenStreetMap for building and geographic data, Open Topo Data with Mapzen for elevation data, and CARTO for the preview map tiles.'
							}
						}
					]
				: [
						{
							'@type': 'Question',
							name: 'Was ist ein Schwarzplan?',
							acceptedAnswer: {
								'@type': 'Answer',
								text: 'Ein Schwarzplan ist eine Figur-Grund-Darstellung, die Gebäude in solidem Schwarz und offene Flächen in Weiß zeigt. Er wird häufig in der Architektur und Stadtplanung verwendet, um städtische Strukturen und räumliche Beziehungen zu analysieren.'
							}
						},
						{
							'@type': 'Question',
							name: 'In welche Dateiformate kann ich exportieren?',
							acceptedAnswer: {
								'@type': 'Answer',
								text: '2D-Schwarzpläne können als DXF, SVG und PDF exportiert werden. Für 3D-Modelle unterstützt SWZPLN IFC (BIM-Format für Revit, ArchiCAD etc.) und 3D-DXF (für AutoCAD und andere CAD-Software). Alle Exporte enthalten Ebenen für Gebäude, Straßen, Grünflächen, Gewässer und Höhenlinien.'
							}
						},
						{
							'@type': 'Question',
							name: 'Kann ich 3D-Stadtmodelle und BIM-Daten erstellen?',
							acceptedAnswer: {
								'@type': 'Answer',
								text: 'Ja, SWZPLN kann 3D-Stadtmodelle mit extrudierten Gebäuden basierend auf OpenStreetMap-Höhendaten generieren. Diese lassen sich als IFC-Dateien für BIM-Workflows (kompatibel mit Revit, ArchiCAD und anderer BIM-Software) oder als 3D-DXF-Dateien für CAD-Anwendungen exportieren. Die Modelle enthalten Gebäudehöhen, Geländeerhebungen und Dachformen.'
							}
						},
						{
							'@type': 'Question',
							name: 'Ist SWZPLN wirklich kostenlos?',
							acceptedAnswer: {
								'@type': 'Answer',
								text: 'Ja, SWZPLN ist vollständig kostenlos und Open Source. Das Projekt ist unter der AGPL-3-Lizenz veröffentlicht und basiert auf OpenStreetMap-Daten. Sie können das Projekt durch Spenden auf Ko-fi unterstützen.'
							}
						},
						{
							'@type': 'Question',
							name: 'Welche Datenquellen verwendet SWZPLN?',
							acceptedAnswer: {
								'@type': 'Answer',
								text: 'SWZPLN verwendet OpenStreetMap für Gebäude- und geografische Daten, Open Topo Data mit Mapzen für Höhendaten und CARTO für die Vorschaukarten-Kacheln.'
							}
						}
					]
	});

	// BreadcrumbList Schema for navigation
	const breadcrumbSchema = $derived({
		'@context': 'https://schema.org',
		'@type': 'BreadcrumbList',
		itemListElement: [
			{
				'@type': 'ListItem',
				position: 1,
				name: 'Home',
				item: origin
			}
		]
	});
</script>

<!-- eslint-disable svelte/no-at-html-tags -- structured data requires @html for JSON-LD script injection -->
<svelte:head>
	<!-- WebSite Schema -->
	{@html `<${'script'} type="application/ld+json">${JSON.stringify(websiteSchema)}</${'script'}>`}

	<!-- Organization Schema -->
	{@html `<${'script'} type="application/ld+json">${JSON.stringify(organizationSchema)}</${'script'}>`}

	<!-- WebApplication Schema -->
	{@html `<${'script'} type="application/ld+json">${JSON.stringify(webAppSchema)}</${'script'}>`}

	<!-- FAQ Schema -->
	{@html `<${'script'} type="application/ld+json">${JSON.stringify(faqSchema)}</${'script'}>`}

	<!-- Breadcrumb Schema -->
	{@html `<${'script'} type="application/ld+json">${JSON.stringify(breadcrumbSchema)}</${'script'}>`}
</svelte:head>
