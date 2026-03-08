<script lang="ts">
	import { Tooltip } from "bits-ui";
	import type { Snippet } from "svelte";

	let { child, children, ...rest }: { child?: Snippet<[{ props: Record<string, any> }]>; children?: Snippet; [key: string]: any } = $props();
</script>

<Tooltip.Trigger {child} {...rest}>
	{#if children}
		{@render children()}
	{/if}
</Tooltip.Trigger>
