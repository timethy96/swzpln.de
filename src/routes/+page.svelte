<script lang="ts">
	import Header from '$lib/components/Header.svelte';
	import Layers from '$lib/components/Layers.svelte';
	import MapArea from '$lib/components/MapArea.svelte';
	import NavRail from '$lib/components/NavRail.svelte';
	import { Globe, Map, Moon, Heart, CodeXml, FileText, CircleQuestionMark, ShoppingCart } from 'lucide-svelte';

	let isOpen = $state(false);

	const navigationItems = [
		{ icon: Map, label: 'Karte', href: '/' },
		{ icon: CircleQuestionMark, label: 'Hilfe', href: '/' },
		{ icon: Globe, label: 'Englisch', href: 'https://opencityplans.com' },
		{ icon: Heart, label: 'Spenden (ko-fi.com)', href: 'https://ko-fi.com/swzpln' },
		{ icon: Moon, label: 'Dark Mode', onClick: () => {
			document.documentElement.classList.toggle('dark');
		} },
		{ icon: ShoppingCart, label: 'Fanshop', href: 'https://shop.swzpln.de' },
		{ icon: CodeXml, label: 'Quellcode (github.com)', href: 'https://github.com/timethy96/swzpln.de' },
		{ icon: FileText, label: 'Impressum & Datenschutz', href: '/impressum' },

	];
</script>

<div class="flex h-full w-full flex-row">
	<NavRail bind:isOpen {navigationItems} />
	<div class="flex h-full w-full flex-col">
		<Header />
		<Layers />
		<MapArea />
	</div>
</div>

<style>
	:global(body) {
		height: 100vh;
		width: 100vw;
	}
</style>
