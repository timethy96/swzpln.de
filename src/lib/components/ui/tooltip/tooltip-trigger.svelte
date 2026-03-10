<script lang="ts">
	import { Tooltip } from 'bits-ui';
	import type { Snippet } from 'svelte';

	let {
		child,
		children,
		...rest
	}: {
		child?: Snippet<[{ props: Record<string, unknown> }]>;
		children?: Snippet;
		[key: string]: unknown;
	} = $props();
</script>

<Tooltip.Trigger {child} {...rest}>
	{#if children}
		{@render children()}
	{/if}
</Tooltip.Trigger>
