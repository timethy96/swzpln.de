import { paraglideVitePlugin } from '@inlang/paraglide-js';
import tailwindcss from '@tailwindcss/vite';
import { sveltekit } from '@sveltejs/kit/vite';
import { defineConfig } from 'vitest/config';
import { playwright } from '@vitest/browser-playwright';

export default defineConfig({
	plugins: [
		tailwindcss(),
		sveltekit(),
		paraglideVitePlugin({
			project: './project.inlang',
			outdir: './src/lib/paraglide',
			strategy: ['url', 'baseLocale'],
			urlPatterns: [
				{
					pattern: 'https://swzpln.de/:path(.*)?',
					localized: [
						['de', 'https://swzpln.de/:path(.*)?'],
						['en', 'https://opencityplans.com/:path(.*)?']
					]
				},
				{
					pattern: 'https://opencityplans.com/:path(.*)?',
					localized: [
						['de', 'https://swzpln.de/:path(.*)?'],
						['en', 'https://opencityplans.com/:path(.*)?']
					]
				},
				{
					pattern: ':protocol://:domain(.*)::port?/:path(.*)?',
					localized: [
						['en', ':protocol://:domain(.*)::port?/en/:path(.*)?'],
						['de', ':protocol://:domain(.*)::port?/:path(.*)?']
					]
				}
			]
		})
	],
	optimizeDeps: {
		exclude: ['svelte-maplibre']
	},
	worker: {
		format: 'es'
	},
	test: {
		expect: { requireAssertions: true },
		projects: [
			{
				extends: './vite.config.ts',
				test: {
					name: 'client',
					browser: {
						enabled: true,
						provider: playwright(),
						instances: [{ browser: 'chromium' }]
					},
					include: ['src/**/*.svelte.{test,spec}.{js,ts}'],
					exclude: ['src/lib/server/**'],
					setupFiles: ['./vitest-setup-client.ts']
				}
			},
			{
				extends: './vite.config.ts',
				test: {
					name: 'server',
					environment: 'node',
					include: ['src/**/*.{test,spec}.{js,ts}'],
					exclude: ['src/**/*.svelte.{test,spec}.{js,ts}']
				}
			}
		]
	}
});
