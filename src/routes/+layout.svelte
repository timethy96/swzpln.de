<script lang="ts">
	import '../app.css';
	import favicon from '$lib/assets/favicon.svg';
	import Header from '$lib/components/Header.svelte';
	import NavRail from '$lib/components/NavRail.svelte';
	import HelpOverlay from '$lib/components/HelpOverlay.svelte';
	import SEO from '$lib/components/SEO.svelte';
	import StructuredData from '$lib/components/StructuredData.svelte';
	import Globe from '@lucide/svelte/icons/globe';
	import Map from '@lucide/svelte/icons/map';
	import Moon from '@lucide/svelte/icons/moon';
	import Heart from '@lucide/svelte/icons/heart';
	import CodeXml from '@lucide/svelte/icons/code-xml';
	import FileText from '@lucide/svelte/icons/file-text';
	import CircleHelp from '@lucide/svelte/icons/circle-help';
	import { appState } from '$lib/state.svelte';
	import { onMount } from 'svelte';
	import * as m from '$lib/paraglide/messages';
	import { setLocale } from '$lib/paraglide/runtime';
	import { browser } from '$app/environment';

	let { children } = $props();

	let isOpen = $state(false);

	// Cookie utilities (browser-only)
	function setCookie(name: string, value: string, days: number): void {
		if (typeof document === 'undefined') return;
		// eslint-disable-next-line svelte/prefer-svelte-reactivity
		const expires = new Date();
		expires.setTime(expires.getTime() + days * 24 * 60 * 60 * 1000);
		document.cookie = `${name}=${value};expires=${expires.toUTCString()};path=/;SameSite=Lax;Secure`;
	}

	function getCookie(name: string): string | null {
		if (typeof document === 'undefined') return null;
		const nameEQ = name + '=';
		const ca = document.cookie.split(';');
		for (let i = 0; i < ca.length; i++) {
			let c = ca[i];
			while (c.charAt(0) === ' ') c = c.substring(1, c.length);
			if (c.indexOf(nameEQ) === 0) return c.substring(nameEQ.length, c.length);
		}
		return null;
	}

	// Load dark mode from cookie or determine based on time
	function loadDarkMode(): boolean {
		// Check if user has explicitly set a preference
		const saved = getCookie('dark_mode');
		if (saved !== null) {
			// User has set a preference, respect it
			return saved === 'true';
		}

		// No cookie set, determine based on time
		// 6pm (18:00) to 6am (06:00) = dark mode
		const now = new Date();
		const hour = now.getHours();
		return hour >= 18 || hour < 6;
	}

	// Toggle dark mode and save to cookie
	function toggleDarkMode(): void {
		const isDark = document.documentElement.classList.toggle('dark');
		// Always save the preference (both true and false)
		setCookie('dark_mode', isDark.toString(), 30);
	}

	// Initialize dark mode and language on mount
	onMount(() => {
		if (loadDarkMode()) {
			document.documentElement.classList.add('dark');
		}

		// Set language based on domain
		if (browser) {
			const hostname = window.location.hostname;
			if (hostname === 'opencityplans.com' || hostname === 'www.opencityplans.com') {
				setLocale('en', { reload: false });
			} else {
				setLocale('de', { reload: false });
			}
		}
	});

	const navigationItems = [
		{ icon: Map, label: m.nav_home(), href: '/' },
		{ icon: CircleHelp, label: m.nav_help(), onClick: () => appState.toggleHelpOverlay() },
		{ icon: Globe, label: m.nav_english(), href: 'https://opencityplans.com' },
		{ icon: Heart, label: m.nav_donate(), href: 'https://ko-fi.com/swzpln' },
		{ icon: Moon, label: m.nav_dark_mode(), onClick: toggleDarkMode },
		{ icon: CodeXml, label: m.nav_source(), href: 'https://github.com/timethy96/swzpln.de' },
		{ icon: FileText, label: m.nav_legal(), href: '/impressum' }
	];
</script>

<svelte:head>
	<link rel="icon" href={favicon} />
</svelte:head>

<!-- SEO and Structured Data -->
<SEO />
<StructuredData />

<div class="flex h-full w-full flex-row">
	<NavRail bind:isOpen {navigationItems} />
	<div class="flex h-full w-full flex-col overflow-auto">
		<Header />
		{@render children?.()}
	</div>
</div>

<!-- Help overlay tutorial -->
<HelpOverlay />
