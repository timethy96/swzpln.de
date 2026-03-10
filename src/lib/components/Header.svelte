<script lang="ts">
	import { Button } from '$lib/components/ui/button';
	import CommandSearch from '$lib/components/CommandSearch.svelte';
	import Search from '@lucide/svelte/icons/search';
	import * as m from '$lib/paraglide/messages';

	let open = $state(false);
</script>

<header class="flex items-center justify-between p-4 pl-0">
	<span class=""></span>
	<h1 class="text-3xl font-black transition-all duration-300 hover:scale-110">{m.app_title()}</h1>
	<Button variant="ghost" size="icon" class="h-12 w-12" onclick={() => (open = true)}>
		<Search class="h-6 w-6" />
	</Button>
</header>

<CommandSearch bind:open />
