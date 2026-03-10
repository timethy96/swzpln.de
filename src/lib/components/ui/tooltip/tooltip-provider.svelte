<script lang="ts">
	import { Tooltip } from 'bits-ui';

	import type { Snippet } from 'svelte';

	let { delayDuration = 200, children }: { delayDuration?: number; children: Snippet } = $props();
</script>

<Tooltip.Provider {delayDuration}>
	{@render children()}
</Tooltip.Provider>
