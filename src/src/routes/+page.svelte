<script>
	import { onMount } from 'svelte';
	
	let darkMode = false;
	let privacyAccepted = false;
	
	onMount(() => {
		// Check privacy acceptance
		privacyAccepted = localStorage.getItem('privacy_accepted') === 'true';
		
		// Check for dark mode preference
		const savedDarkMode = localStorage.getItem('darkMode');
		if (savedDarkMode) {
			darkMode = savedDarkMode === 'true';
		} else {
			// Auto dark mode based on time (7 PM - 7 AM)
			const hour = new Date().getHours();
			darkMode = hour >= 19 || hour < 7;
		}
		
		// Apply dark mode
		if (darkMode) {
			document.documentElement.classList.add('dark');
		}
	});
	
	function toggleDarkMode() {
		darkMode = !darkMode;
		localStorage.setItem('darkMode', darkMode.toString());
		
		if (darkMode) {
			document.documentElement.classList.add('dark');
		} else {
			document.documentElement.classList.remove('dark');
		}
	}
	
	function acceptPrivacy() {
		privacyAccepted = true;
		localStorage.setItem('privacy_accepted', 'true');
	}
	
	function generatePlan(format) {
		alert(`${format.toUpperCase()} plan generation would start here!\n\nFeatures implemented:\n✅ Privacy consent\n✅ Dark mode\n✅ Basic UI\n\n🔄 Coming next:\n- Interactive map\n- Real OSM data\n- Actual plan generation`);
	}
</script>

<svelte:head>
	<title>City Plan Generator - Development Server Running</title>
	<meta name="description" content="Generate architectural city plans from OpenStreetMap data" />
	<style>
		body {
			margin: 0;
			padding: 0;
			font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
		}
		.dark {
			color-scheme: dark;
		}
	</style>
</svelte:head>

<div class="min-h-screen bg-white dark:bg-gray-900 text-gray-900 dark:text-white transition-colors">
	<!-- Header -->
	<header class="bg-white dark:bg-gray-800 shadow-sm border-b border-gray-200 dark:border-gray-700 p-4">
		<div class="flex items-center justify-between max-w-6xl mx-auto">
			<h1 class="text-2xl font-bold">🗺️ City Plan Generator</h1>
			
			<div class="flex items-center space-x-4">
				<button 
					on:click={toggleDarkMode}
					class="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
					title="Toggle dark mode"
				>
					{#if darkMode}
						☀️
					{:else}
						🌙
					{/if}
				</button>
				
				<div class="px-3 py-1 bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200 rounded-full text-sm font-medium">
					✅ Dev Server Running
				</div>
			</div>
		</div>
	</header>
	
	{#if !privacyAccepted}
		<!-- Privacy Notice -->
		<div class="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
			<div class="bg-white dark:bg-gray-800 rounded-lg shadow-xl p-8 max-w-lg w-full">
				<div class="text-center">
					<div class="text-4xl mb-4">🔒</div>
					<h2 class="text-xl font-bold mb-4">Privacy Notice</h2>
					<p class="text-gray-600 dark:text-gray-300 mb-6">
						This application generates city plans from OpenStreetMap data. 
						We respect your privacy and collect minimal anonymous usage statistics.
					</p>
					<button 
						on:click={acceptPrivacy}
						class="w-full px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-semibold"
					>
						Accept and Continue
					</button>
				</div>
			</div>
		</div>
	{:else}
		<!-- Main Content -->
		<main class="max-w-6xl mx-auto p-6">
			<!-- Success Message -->
			<div class="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-6 mb-8">
				<div class="flex items-center">
					<div class="text-2xl mr-3">🎉</div>
					<div>
						<h2 class="text-lg font-semibold text-green-800 dark:text-green-200 mb-1">
							Development Server Successfully Running!
						</h2>
						<p class="text-green-700 dark:text-green-300">
							The SvelteKit application is now working. All core functionality can be built from here.
						</p>
					</div>
				</div>
			</div>
			
			<!-- Features Status -->
			<div class="grid md:grid-cols-2 gap-6 mb-8">
				<div class="bg-gray-50 dark:bg-gray-800 rounded-lg p-6">
					<h3 class="text-lg font-semibold mb-4 flex items-center">
						✅ Implemented Features
					</h3>
					<ul class="space-y-2 text-gray-600 dark:text-gray-300">
						<li>• SvelteKit development server</li>
						<li>• Dark mode support</li>
						<li>• Privacy consent system</li>
						<li>• Basic responsive UI</li>
						<li>• LocalStorage preferences</li>
						<li>• TypeScript support</li>
					</ul>
				</div>
				
				<div class="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-6">
					<h3 class="text-lg font-semibold mb-4 flex items-center">
						🔄 Next Steps
					</h3>
					<ul class="space-y-2 text-gray-600 dark:text-gray-300">
						<li>• Integrate Leaflet map</li>
						<li>• Add real OSM data loading</li>
						<li>• Implement plan generation</li>
						<li>• Add layer controls</li>
						<li>• Enable location search</li>
						<li>• Complete i18n integration</li>
					</ul>
				</div>
			</div>
			
			<!-- Map Placeholder -->
			<div class="bg-gray-100 dark:bg-gray-800 rounded-lg border-2 border-dashed border-gray-300 dark:border-gray-600 p-12 text-center mb-8">
				<div class="text-4xl mb-4">🗺️</div>
				<h3 class="text-xl font-semibold mb-2">Interactive Map Will Be Here</h3>
				<p class="text-gray-600 dark:text-gray-400 mb-6">
					Leaflet map with OpenStreetMap tiles and real-time data layers
				</p>
				
				<!-- Plan Generation Buttons -->
				<div class="flex justify-center space-x-4">
					<button 
						on:click={() => generatePlan('dxf')}
						class="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-semibold"
					>
						Generate DXF
					</button>
					<button 
						on:click={() => generatePlan('svg')}
						class="px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-semibold"
					>
						Generate SVG
					</button>
					<button 
						on:click={() => generatePlan('pdf')}
						class="px-6 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors font-semibold"
					>
						Generate PDF
					</button>
				</div>
			</div>
			
			<!-- Technology Stack -->
			<div class="bg-gray-50 dark:bg-gray-800 rounded-lg p-6">
				<h3 class="text-lg font-semibold mb-4">🛠️ Technology Stack</h3>
				<div class="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
					<div class="text-center p-3 bg-white dark:bg-gray-700 rounded">
						<div class="font-semibold">Frontend</div>
						<div class="text-gray-600 dark:text-gray-300">Svelte 5 + SvelteKit</div>
					</div>
					<div class="text-center p-3 bg-white dark:bg-gray-700 rounded">
						<div class="font-semibold">Styling</div>
						<div class="text-gray-600 dark:text-gray-300">Tailwind CSS</div>
					</div>
					<div class="text-center p-3 bg-white dark:bg-gray-700 rounded">
						<div class="font-semibold">Maps</div>
						<div class="text-gray-600 dark:text-gray-300">Leaflet + OSM</div>
					</div>
					<div class="text-center p-3 bg-white dark:bg-gray-700 rounded">
						<div class="font-semibold">Processing</div>
						<div class="text-gray-600 dark:text-gray-300">Web Workers</div>
					</div>
				</div>
			</div>
		</main>
	{/if}
</div>

<style>
	/* Add minimal Tailwind-like utilities for this demo */
	.min-h-screen { min-height: 100vh; }
	.max-w-6xl { max-width: 72rem; }
	.max-w-lg { max-width: 32rem; }
	.mx-auto { margin-left: auto; margin-right: auto; }
	.p-4 { padding: 1rem; }
	.p-6 { padding: 1.5rem; }
	.p-8 { padding: 2rem; }
	.p-12 { padding: 3rem; }
	.px-3 { padding-left: 0.75rem; padding-right: 0.75rem; }
	.px-6 { padding-left: 1.5rem; padding-right: 1.5rem; }
	.py-1 { padding-top: 0.25rem; padding-bottom: 0.25rem; }
	.py-3 { padding-top: 0.75rem; padding-bottom: 0.75rem; }
	.mb-1 { margin-bottom: 0.25rem; }
	.mb-2 { margin-bottom: 0.5rem; }
	.mb-4 { margin-bottom: 1rem; }
	.mb-6 { margin-bottom: 1.5rem; }
	.mb-8 { margin-bottom: 2rem; }
	.mr-3 { margin-right: 0.75rem; }
	.text-sm { font-size: 0.875rem; }
	.text-lg { font-size: 1.125rem; }
	.text-xl { font-size: 1.25rem; }
	.text-2xl { font-size: 1.5rem; }
	.text-4xl { font-size: 2.25rem; }
	.font-bold { font-weight: 700; }
	.font-semibold { font-weight: 600; }
	.font-medium { font-weight: 500; }
	.rounded { border-radius: 0.25rem; }
	.rounded-lg { border-radius: 0.5rem; }
	.rounded-full { border-radius: 9999px; }
	.bg-white { background-color: white; }
	.bg-gray-50 { background-color: #f9fafb; }
	.bg-gray-100 { background-color: #f3f4f6; }
	.bg-gray-800 { background-color: #1f2937; }
	.bg-green-50 { background-color: #f0fdf4; }
	.bg-green-100 { background-color: #dcfce7; }
	.bg-blue-50 { background-color: #eff6ff; }
	.bg-blue-600 { background-color: #2563eb; }
	.bg-green-600 { background-color: #16a34a; }
	.bg-red-600 { background-color: #dc2626; }
	.text-white { color: white; }
	.text-gray-600 { color: #4b5563; }
	.text-gray-700 { color: #374151; }
	.text-gray-900 { color: #111827; }
	.text-green-700 { color: #15803d; }
	.text-green-800 { color: #166534; }
	.border { border-width: 1px; }
	.border-2 { border-width: 2px; }
	.border-dashed { border-style: dashed; }
	.border-gray-200 { border-color: #e5e7eb; }
	.border-gray-300 { border-color: #d1d5db; }
	.border-green-200 { border-color: #bbf7d0; }
	.shadow-sm { box-shadow: 0 1px 2px 0 rgb(0 0 0 / 0.05); }
	.shadow-xl { box-shadow: 0 20px 25px -5px rgb(0 0 0 / 0.1), 0 8px 10px -6px rgb(0 0 0 / 0.1); }
	.transition-colors { transition-property: color, background-color, border-color; transition-duration: 150ms; }
	.flex { display: flex; }
	.grid { display: grid; }
	.items-center { align-items: center; }
	.justify-center { justify-content: center; }
	.justify-between { justify-content: space-between; }
	.space-x-4 > * + * { margin-left: 1rem; }
	.space-y-2 > * + * { margin-top: 0.5rem; }
	.gap-4 { gap: 1rem; }
	.gap-6 { gap: 1.5rem; }
	.grid-cols-2 { grid-template-columns: repeat(2, minmax(0, 1fr)); }
	.text-center { text-align: center; }
	.w-full { width: 100%; }
	.fixed { position: fixed; }
	.inset-0 { top: 0; right: 0; bottom: 0; left: 0; }
	.z-50 { z-index: 50; }
	
	/* Dark mode */
	.dark .bg-gray-900 { background-color: #111827; }
	.dark .bg-gray-800 { background-color: #1f2937; }
	.dark .bg-gray-700 { background-color: #374151; }
	.dark .text-white { color: white; }
	.dark .text-gray-300 { color: #d1d5db; }
	.dark .text-gray-400 { color: #9ca3af; }
	.dark .border-gray-700 { border-color: #374151; }
	.dark .border-gray-600 { border-color: #4b5563; }
	.dark .border-green-800 { border-color: #166534; }
	.dark .bg-green-900\/20 { background-color: rgb(20 83 45 / 0.2); }
	.dark .bg-blue-900\/20 { background-color: rgb(30 58 138 / 0.2); }
	.dark .text-green-200 { color: #bbf7d0; }
	.dark .text-green-300 { color: #86efac; }
	
	/* Hover states */
	.hover\:bg-gray-100:hover { background-color: #f3f4f6; }
	.hover\:bg-blue-700:hover { background-color: #1d4ed8; }
	.hover\:bg-green-700:hover { background-color: #15803d; }
	.hover\:bg-red-700:hover { background-color: #b91c1c; }
	.dark .hover\:bg-gray-700:hover { background-color: #374151; }
	
	/* Responsive */
	@media (min-width: 768px) {
		.md\:grid-cols-2 { grid-template-columns: repeat(2, minmax(0, 1fr)); }
		.md\:grid-cols-4 { grid-template-columns: repeat(4, minmax(0, 1fr)); }
	}
</style>
