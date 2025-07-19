<script lang="ts">
	import { onMount, onDestroy } from 'svelte';
	import { browser } from '$app/environment';
	import * as m from '../paraglide/messages.js';
	import { languageTag } from '../paraglide/runtime.js';
	import { 
		Menu, 
		Search, 
		X, 
		Sun, 
		Moon, 
		Languages, 
		Coffee, 
		Github, 
		ShoppingBag, 
		Layers,
		MapPin
	} from 'lucide-svelte';
	import { saveMapPosition, loadMapPosition, searchLocation, isZoomSufficient } from '../lib/utils/mapUtils';
	import { PlanGenerator, downloadFile, countUp, type LayerSettings } from '../lib/utils/planGenerator';
	import { MapLayersManager } from '../lib/utils/mapLayers';

	// Props from layout
	let { darkMode, currentLang, toggleDarkMode, switchLanguage }: {
		darkMode: boolean;
		currentLang: string;
		toggleDarkMode: () => void;
		switchLanguage: () => void;
	} = $props();

	// Component state
	let menuOpen = false;
	let searchActive = false;
	let searchValue = '';
	let privacyAccepted = false;
	let map: any = null;
	let mapContainer: HTMLElement;
	let searchResults: any[] = [];
	let showSearchResults = false;
	let planGenerator: PlanGenerator | null = null;
	let mapLayersManager: MapLayersManager | null = null;

	// Layer states
	let layers: LayerSettings = {
		buildings: true,
		green: false,
		water: false,
		forest: false,
		land: false,
		roads: false,
		rails: false,
		contours: false
	};

	// Dialog states
	let showProgressDialog = false;
	let showErrorDialog = false;
	let showScaleDialog = false;
	let showLegalDialog = false;
	let progressText = '';
	let progressPercent = 0;
	let errorMessage = '';

	// Get site title based on language/domain
	$: siteTitle = languageTag() === 'en' ? 'OPENCITYPLANS' : 'SWZPLN';

	onMount(async () => {
		// Check privacy acceptance
		privacyAccepted = localStorage.getItem('privacy_accepted') === 'true';
		
		// Load layers from localStorage
		const savedLayers = localStorage.getItem('layers');
		if (savedLayers) {
			layers = { ...layers, ...JSON.parse(savedLayers) };
		}

		// Initialize search from URL if present
		const urlParams = new URLSearchParams(window.location.search);
		const urlSearch = urlParams.get('url');
		if (urlSearch) {
			searchValue = urlSearch;
		}

		// Initialize plan generator
		planGenerator = new PlanGenerator();

		// Initialize map if privacy is accepted
		if (privacyAccepted) {
			await initMap();
		}
	});

	onDestroy(() => {
		// Clean up plan generator
		if (planGenerator) {
			planGenerator.destroy();
		}
		
		// Clean up map layers manager
		if (mapLayersManager) {
			mapLayersManager.destroy();
		}
	});

	async function initMap() {
		if (!browser) return;
		
		// Dynamic import of Leaflet to avoid SSR issues
		const L = (await import('leaflet')).default;
		
		// Initialize map
		map = L.map(mapContainer, {
			center: [51.505, -0.09],
			zoom: 13,
			zoomControl: true
		});

		// Add tile layer
		L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
			attribution: '© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
		}).addTo(map);

		// Initialize map layers manager
		mapLayersManager = new MapLayersManager(map);
		
		// Apply initial layer settings
		await mapLayersManager.updateLayers(layers);

		// Load last position if available
		const lastPos = loadMapPosition();
		if (lastPos) {
			const [lat, lng, zoom] = lastPos;
			map.setView([lat, lng], zoom);
		}

		// Save position on move
		map.on('moveend', () => {
			saveMapPosition(map);
		});

		// Update zoom level info for download buttons
		map.on('zoomend', () => {
			// Could add zoom level indicator here
		});

		// Perform search if we have a search value
		if (searchValue) {
			await performSearch(searchValue);
		}
	}

	function acceptPrivacy() {
		privacyAccepted = true;
		localStorage.setItem('privacy_accepted', 'true');
		initMap();
	}

	function toggleMenu() {
		menuOpen = !menuOpen;
	}

	function toggleSearch() {
		if (searchActive) {
			performSearch(searchValue);
		} else {
			searchActive = true;
		}
	}

	function closeSearch() {
		searchActive = false;
		searchValue = '';
		showSearchResults = false;
	}

	async function performSearch(query: string) {
		if (!query.trim()) return;

		try {
			const results = await searchLocation(query);
			
			if (results.length > 0) {
				const result = results[0];
				const lat = parseFloat(result.lat);
				const lon = parseFloat(result.lon);
				
				if (map) {
					map.setView([lat, lon], 14);
					
					// Add marker
					const L = (await import('leaflet')).default;
					L.marker([lat, lon]).addTo(map)
						.bindPopup(result.display_name)
						.openPopup();
				}
				
				// Update URL
				const url = new URL(window.location.href);
				url.searchParams.set('url', query);
				window.history.replaceState({}, '', url.toString());
			}
			
			searchResults = results;
			showSearchResults = results.length > 0;
		} catch (error) {
			console.error('Search failed:', error);
		}
	}

	async function updateLayers() {
		localStorage.setItem('layers', JSON.stringify(layers));
		
		// Update map layers if manager is available
		if (mapLayersManager) {
			await mapLayersManager.updateLayers(layers);
		}
	}

	async function generatePlan(format: 'dxf' | 'svg' | 'pdf') {
		if (!map || !planGenerator) return;
		
		const zoom = map.getZoom();
		
		if (!isZoomSufficient(zoom)) {
			errorMessage = 'Please zoom in more to generate a plan (minimum zoom level: 11)';
			showErrorDialog = true;
			return;
		}
		
		// Show progress dialog
		showProgressDialog = true;
		
		// Generate the plan
		await planGenerator.generatePlan(
			map,
			format,
			layers,
			(text: string, percent: number) => {
				progressText = text;
				progressPercent = percent;
			},
			(blob: Blob, filename: string) => {
				showProgressDialog = false;
				downloadFile(blob, filename);
				// Track download with format for minimal analytics
				countUp(format);
			},
			(error: string) => {
				showProgressDialog = false;
				errorMessage = error;
				showErrorDialog = true;
			}
		);
	}

	function handleKeydown(event: KeyboardEvent) {
		if (event.key === 'Enter' && searchActive) {
			performSearch(searchValue);
		}
		if (event.key === 'Escape') {
			closeSearch();
		}
	}
</script>

<svelte:window on:keydown={handleKeydown} />

<svelte:head>
	<title>{siteTitle} | {m.title()}</title>
	<meta name="description" content="{m.m_subtitle1()}{searchValue ? m.fromCity() + searchValue : ''}{m.m_subtitle2()}" />
	<meta name="keywords" content="{m.m_tags()}" />
</svelte:head>

<div class="h-screen flex">
	<!-- Sidebar Menu -->
	<div class="fixed inset-y-0 left-0 z-50 w-80 bg-white dark:bg-gray-800 shadow-lg transform transition-transform duration-300 {menuOpen ? 'translate-x-0' : '-translate-x-full'}">
		<div class="flex flex-col h-full overflow-y-auto custom-scrollbar">
			<!-- Menu Header -->
			<div class="p-6 border-b border-gray-200 dark:border-gray-700">
				<h2 class="text-2xl font-bold font-open-sans">{m.m_title()}</h2>
				<h3 class="text-sm text-gray-600 dark:text-gray-400 mt-2">
					{m.m_subtitle1()}{searchValue ? m.fromCity() + searchValue : ''}{m.m_subtitle2()}
				</h3>
			</div>
			
			<!-- Menu Items -->
			<div class="flex-1 p-6 space-y-4">
				<!-- Language Switch -->
				<button 
					on:click={switchLanguage}
					class="flex items-center w-full p-3 text-left rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
				>
					<Languages class="w-5 h-5 mr-3" />
					{m.m_lang()}
					<span class="ml-auto">→</span>
				</button>
				
				<!-- Dark Mode Toggle -->
				<button 
					on:click={toggleDarkMode}
					class="flex items-center w-full p-3 text-left rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
				>
					{#if darkMode}
						<Sun class="w-5 h-5 mr-3" />
					{:else}
						<Moon class="w-5 h-5 mr-3" />
					{/if}
					{m.m_darkmode()}
					<span class="ml-auto">→</span>
				</button>
				
				<!-- External Links -->
				<a 
					href="https://ko-fi.com/swzpln"
					target="_blank"
					rel="noopener noreferrer"
					class="flex items-center w-full p-3 text-left rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
				>
					<Coffee class="w-5 h-5 mr-3" />
					{m.m_donate()}
					<span class="ml-auto">→</span>
				</a>
				
				<a 
					href="https://shop.swzpln.de"
					target="_blank"
					rel="noopener noreferrer"
					class="flex items-center w-full p-3 text-left rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
				>
					<ShoppingBag class="w-5 h-5 mr-3" />
					{m.m_shop()}
					<span class="ml-auto">→</span>
				</a>
				
				<a 
					href="https://github.com/TheMoMStudio/swzpln.de"
					target="_blank"
					rel="noopener noreferrer"
					class="flex items-center w-full p-3 text-left rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
				>
					<Github class="w-5 h-5 mr-3" />
					{m.m_source()}
					<span class="ml-auto">→</span>
				</a>
				
				<!-- Layer Controls -->
				<div class="mt-8">
					<h4 class="font-semibold mb-4 flex items-center">
						<Layers class="w-5 h-5 mr-2" />
						Layers
					</h4>
					<div class="space-y-3">
						{#each Object.entries(layers) as [key, value]}
							<label class="flex items-center">
								<input 
									type="checkbox" 
									bind:checked={layers[key]}
									on:change={updateLayers}
									class="mr-3 rounded border-gray-300 dark:border-gray-600"
								/>
								<span class="text-sm">{@html m[key]()}</span>
							</label>
						{/each}
					</div>
					
					<div class="mt-4 p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
						<p class="text-xs text-gray-600 dark:text-gray-400">
							💡 Zoom in to level 13+ to see layer data on the map
						</p>
					</div>
				</div>
			</div>
			
			<!-- Footer -->
			<div class="p-6 border-t border-gray-200 dark:border-gray-700">
				<div class="text-xs text-gray-500 dark:text-gray-400">
					{@html m.m_footer()}
				</div>
			</div>
		</div>
	</div>
	
	<!-- Main Content -->
	<div class="flex-1 flex flex-col relative">
		<!-- Header -->
		<header class="bg-white dark:bg-gray-800 shadow-sm border-b border-gray-200 dark:border-gray-700 relative z-40">
			<div class="flex items-center h-16 px-4">
				<!-- Menu Button -->
				<button 
					on:click={toggleMenu}
					class="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
				>
					{#if menuOpen}
						<X class="w-6 h-6" />
					{:else}
						<Menu class="w-6 h-6" />
					{/if}
				</button>
				
				<!-- Logo -->
				<div class="flex-1 flex justify-center">
					<h1 class="text-xl font-bold font-open-sans">{siteTitle}</h1>
				</div>
				
				<!-- Search -->
				<div class="relative">
					{#if searchActive}
						<div class="flex items-center">
							<input 
								bind:value={searchValue}
								placeholder={m.search()}
								class="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 w-64"
								autofocus
							/>
							<button 
								on:click={closeSearch}
								class="p-2 ml-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
							>
								<X class="w-5 h-5" />
							</button>
						</div>
					{:else}
						<button 
							on:click={toggleSearch}
							class="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
						>
							<Search class="w-6 h-6" />
						</button>
					{/if}
				</div>
			</div>
		</header>
		
		<!-- Map Container -->
		<div class="flex-1 relative">
			{#if !privacyAccepted}
				<!-- Privacy Notice -->
				<div class="absolute inset-0 bg-white dark:bg-gray-900 z-30 flex items-center justify-center">
					<div class="max-w-2xl mx-auto p-8 text-center">
						<div class="mb-8">
							<img src="/world.svg" alt="World" class="w-24 h-24 mx-auto mb-6 opacity-60" />
						</div>
						
						<div class="space-y-4 text-gray-700 dark:text-gray-300">
							<p>
								{m.priv_1()} 
								<button 
									on:click={() => showLegalDialog = true}
									class="text-blue-600 dark:text-blue-400 underline hover:no-underline"
								>
									{m.privacy_agreement()}
								</button>
								{m.priv_2()}
							</p>
							
							<details class="text-left">
								<summary class="cursor-pointer text-blue-600 dark:text-blue-400 mb-2">
									{m.more_infos()}
								</summary>
								<div class="space-y-2 text-sm pl-4">
									<p>{m.priv_3()}</p>
									<p>{@html m.priv_4()}</p>
									<p>{@html m.priv_5()}</p>
									<p>{@html m.priv_7()}</p>
								</div>
							</details>
						</div>
						
						<button 
							on:click={acceptPrivacy}
							class="mt-8 px-8 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-semibold"
						>
							{m.priv_6()}
						</button>
					</div>
				</div>
			{/if}
			
			<!-- Map -->
			<div bind:this={mapContainer} class="w-full h-full"></div>
			
			<!-- Download FAB -->
			{#if privacyAccepted}
				<div class="absolute bottom-6 right-6 z-20">
					<div class="flex flex-col space-y-2">
						<button 
							on:click={() => generatePlan('dxf')}
							class="flex items-center justify-center w-12 h-12 bg-blue-600 text-white rounded-full shadow-lg hover:bg-blue-700 transition-colors"
							title="Download DXF"
						>
							<span class="text-xs font-semibold">DXF</span>
						</button>
						<button 
							on:click={() => generatePlan('svg')}
							class="flex items-center justify-center w-12 h-12 bg-green-600 text-white rounded-full shadow-lg hover:bg-green-700 transition-colors"
							title="Download SVG"
						>
							<span class="text-xs font-semibold">SVG</span>
						</button>
						<button 
							on:click={() => generatePlan('pdf')}
							class="flex items-center justify-center w-12 h-12 bg-red-600 text-white rounded-full shadow-lg hover:bg-red-700 transition-colors"
							title="Download PDF"
						>
							<span class="text-xs font-semibold">PDF</span>
						</button>
					</div>
				</div>
			{/if}
		</div>
	</div>
	
	<!-- Menu Overlay -->
	{#if menuOpen}
		<div 
			class="fixed inset-0 bg-black bg-opacity-50 z-40"
			on:click={toggleMenu}
		></div>
	{/if}
</div>

<!-- Progress Dialog -->
{#if showProgressDialog}
	<div class="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
		<div class="bg-white dark:bg-gray-800 rounded-lg p-8 max-w-md w-full">
			<div class="text-center">
				<img src="/world.svg" alt="World" class="w-16 h-16 mx-auto mb-4 animate-pulse-slow" />
				<h2 class="text-xl font-semibold mb-4">{m.dl_gen()}</h2>
				<p class="text-gray-600 dark:text-gray-400 mb-4">{progressText}</p>
				
				<!-- Progress Bar -->
				<div class="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2 mb-4">
					<div 
						class="bg-blue-600 h-2 rounded-full transition-all duration-500 progress-bar"
						style="width: {progressPercent}%"
					></div>
				</div>
				
				<div class="text-sm font-semibold">{progressPercent}%</div>
				
				<div class="mt-6 p-4 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg">
					<p class="text-sm text-yellow-800 dark:text-yellow-200">
						{@html m.dl_donate()}
					</p>
				</div>
				
				<div class="flex justify-center mt-6">
					<button 
						on:click={() => { showProgressDialog = false; planGenerator?.cancel(); }}
						class="px-6 py-2 text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 transition-colors"
					>
						{m.dl_cancel()}
					</button>
				</div>
			</div>
		</div>
	</div>
{/if}

<!-- Error Dialog -->
{#if showErrorDialog}
	<div class="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
		<div class="bg-white dark:bg-gray-800 rounded-lg p-8 max-w-md w-full">
			<div class="text-center">
				<img src="/error.svg" alt="Error" class="w-16 h-16 mx-auto mb-4 text-red-500" />
				<h2 class="text-xl font-semibold mb-4 text-red-600 dark:text-red-400">{m.dl_err()}</h2>
				<p class="text-gray-600 dark:text-gray-400 mb-6">{errorMessage}</p>
				
				<div class="flex justify-center">
					<button 
						on:click={() => showErrorDialog = false}
						class="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
					>
						{m.dl_close()}
					</button>
				</div>
			</div>
		</div>
	</div>
{/if}

<style>
	:global(.osm-popup) {
		font-size: 12px;
		line-height: 1.4;
	}
	
	:global(.osm-popup strong) {
		color: #333;
		text-transform: capitalize;
	}
	
	:global(.dark .osm-popup strong) {
		color: #fff;
	}
</style>
