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
				? 'An unexpected error occurred. Please reload the page and try again.'
				: 'Ein unerwarteter Fehler ist aufgetreten. Bitte lade die Seite neu und versuche es erneut.'
	);

	const backLabel = $derived(locale === 'en' ? 'Back to map' : 'Zurück zur Karte');
	const reportLabel = $derived(locale === 'en' ? 'Report error' : 'Fehler melden');
	const persistHint = $derived(
		locale === 'en'
			? 'If the error persists, you can report it via email.'
			: 'Wenn der Fehler weiterhin besteht, kannst du ihn per E-Mail melden.'
	);

	// Obfuscate email: assembled from parts so bots can't scrape it from HTML source
	const mailtoUrl = $derived.by(() => {
		const user = 'error1';
		const domain = 'swzpln';
		const tld = 'de';
		const addr = `${user}@${domain}.${tld}`;
		const subject = encodeURIComponent('Schwarzplan Error Report');
		const body = encodeURIComponent(
			[
				`Error: ${status}`,
				`Message: ${message || 'N/A'}`,
				`URL: ${$page.url.href}`,
				`Time: ${new Date().toISOString()}`,
				`User-Agent: ${typeof navigator !== 'undefined' ? navigator.userAgent : 'N/A'}`,
				'',
				'--- Please describe what you were doing when this error occurred: ---',
				''
			].join('\n')
		);
		return `mailto:${addr}?subject=${subject}&body=${body}`;
	});
</script>

<SEO title="{status} - {title}" noindex={true} />

<div class="flex h-full w-full items-center justify-center p-8">
	<div class="flex max-w-md flex-col items-center gap-6 text-center">
		<span class="text-8xl font-bold text-muted-foreground/30">{status}</span>
		<h1 class="text-2xl font-semibold">{title}</h1>
		<p class="text-muted-foreground">{description}</p>
		{#if status !== 404}
			<p class="text-sm text-muted-foreground">{persistHint}</p>
		{/if}
		<div class="flex gap-3">
			<Button href="/">{backLabel}</Button>
			{#if status !== 404}
				<Button variant="outline" href={mailtoUrl}>
					{reportLabel}
				</Button>
			{/if}
		</div>
	</div>
</div>
