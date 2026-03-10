<script lang="ts">
	import { page } from '$app/stores';
	import { Button } from '$lib/components/ui/button';
	import { getLocale } from '$lib/paraglide/runtime';
	import SEO from '$lib/components/SEO.svelte';

	const locale = $derived(getLocale());
	const status = $derived($page.status);
	const message = $derived($page.error?.message);

	const title = $derived(
		status === 404
			? locale === 'en'
				? 'Page not found'
				: 'Seite nicht gefunden'
			: locale === 'en'
				? 'Something went wrong'
				: 'Etwas ist schiefgelaufen'
	);

	const description = $derived(
		status === 404
			? locale === 'en'
				? 'The page you are looking for does not exist.'
				: 'Die gesuchte Seite existiert nicht.'
			: locale === 'en'
				? 'An unexpected error occurred. Please try again.'
				: 'Ein unerwarteter Fehler ist aufgetreten. Bitte versuche es erneut.'
	);

	const backLabel = $derived(locale === 'en' ? 'Back to map' : 'Zurück zur Karte');
	const reportLabel = $derived(locale === 'en' ? 'Report issue' : 'Fehler melden');
</script>

<SEO title="{status} - {title}" noindex={true} />

<div class="flex h-full w-full items-center justify-center p-8">
	<div class="flex max-w-md flex-col items-center gap-6 text-center">
		<span class="text-8xl font-bold text-muted-foreground/30">{status}</span>
		<h1 class="text-2xl font-semibold">{title}</h1>
		<p class="text-muted-foreground">{description}</p>
		{#if message && status !== 404}
			<pre
				class="w-full overflow-auto rounded-md bg-muted p-3 text-left text-xs text-muted-foreground">{message}</pre>
		{/if}
		<div class="flex gap-3">
			<Button href="/">{backLabel}</Button>
			<Button
				variant="outline"
				href="https://github.com/timethy96/swzpln.de/issues"
				target="_blank"
			>
				{reportLabel}
			</Button>
		</div>
	</div>
</div>
