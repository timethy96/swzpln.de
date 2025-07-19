<script lang="ts">
	import '../app.css';
	import { onMount } from 'svelte';
	import { browser } from '$app/environment';
	import * as m from '../paraglide/messages.js';
	import { setLanguageTag, languageTag } from '../paraglide/runtime.js';

	// Dark mode state management
	let darkMode = false;

	// Language management
	let currentLang: string = 'de';

	onMount(() => {
		// Initialize language based on domain or browser preference
		const hostname = window.location.hostname;
		if (hostname.includes('opencityplans.com')) {
			currentLang = 'en';
		} else if (hostname.includes('swzpln.de')) {
			currentLang = 'de';
		} else {
			// Fallback to browser language
			const browserLang = navigator.language.substring(0, 2);
			currentLang = ['de', 'en'].includes(browserLang) ? browserLang : 'de';
		}
		
		setLanguageTag(currentLang as 'de' | 'en');

		// Initialize dark mode based on cookie or time
		const savedDarkMode = localStorage.getItem('darkmode');
		if (savedDarkMode !== null) {
			darkMode = savedDarkMode === 'true';
		} else {
			// Auto dark mode based on time (7 PM to 7 AM)
			const hour = new Date().getHours();
			darkMode = hour >= 19 || hour < 7;
		}

		// Apply dark mode class
		updateDarkMode();
	});

	function updateDarkMode() {
		if (browser) {
			if (darkMode) {
				document.documentElement.classList.add('dark');
			} else {
				document.documentElement.classList.remove('dark');
			}
			localStorage.setItem('darkmode', darkMode.toString());
		}
	}

	// Export functions for child components
	export function toggleDarkMode() {
		darkMode = !darkMode;
		updateDarkMode();
	}

	export function switchLanguage() {
		const newLang = currentLang === 'de' ? 'en' : 'de';
		const newDomain = newLang === 'en' ? 'https://opencityplans.com' : 'https://swzpln.de';
		window.location.href = newDomain;
	}
</script>

<svelte:head>
	<meta charset="UTF-8" />
	<meta name="viewport" content="width=device-width, initial-scale=1.0" />
	<meta http-equiv="X-UA-Compatible" content="ie=edge" />
	
	<!-- Favicon and meta icons -->
	<link rel="apple-touch-icon" sizes="180x180" href="/apple-touch-icon.png" />
	<link rel="icon" type="image/png" sizes="32x32" href="/favicon-32x32.png" />
	<link rel="icon" type="image/png" sizes="16x16" href="/favicon-16x16.png" />
	<link rel="manifest" href="/site.webmanifest" />
	<link rel="mask-icon" href="/safari-pinned-tab.svg" color="#000000" />
	<link rel="shortcut icon" href="/favicon.ico" />
	
	<!-- Theme and app metadata -->
	<meta name="apple-mobile-web-app-title" content={languageTag() === 'en' ? 'OpenCityPlans' : 'SWZPLN'} />
	<meta name="application-name" content={languageTag() === 'en' ? 'OpenCityPlans' : 'SWZPLN'} />
	<meta name="msapplication-TileColor" content="#000000" />
	<meta name="theme-color" content="#ffffff" />
	
	<!-- SEO metadata -->
	<meta name="robots" content="INDEX,FOLLOW" />
	<meta name="language" content={languageTag()} />
	
	<!-- Leaflet CSS -->
	<link
		rel="stylesheet"
		href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css"
		integrity="sha256-p4NxAoJBhIIN+hmNHrzRCf9tD/miZyoHS5obTRR9BMY="
		crossorigin=""
	/>
</svelte:head>

<main class="min-h-screen bg-white dark:bg-gray-900 text-gray-900 dark:text-white transition-colors duration-300">
	<slot {darkMode} {currentLang} {toggleDarkMode} {switchLanguage} />
</main>
