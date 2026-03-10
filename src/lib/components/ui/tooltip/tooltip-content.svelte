<script lang="ts">
	import { Tooltip } from 'bits-ui';

	import type { Snippet } from 'svelte';

	let {
		children,
		side = 'right',
		sideOffset = 8,
		class: className = '',
		...rest
	}: {
		children: Snippet;
		side?: 'top' | 'right' | 'bottom' | 'left';
		sideOffset?: number;
		class?: string;
		[key: string]: unknown;
	} = $props();
</script>

<Tooltip.Content
	{side}
	{sideOffset}
	class="z-50 animate-in rounded-md bg-primary px-3 py-1.5 text-sm text-primary-foreground shadow-md fade-in-0 zoom-in-95 {className}"
	{...rest}
>
	{@render children()}
</Tooltip.Content>
