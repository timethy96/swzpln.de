<script lang="ts">
	import { Tooltip } from "bits-ui";

	let { children, side = "right", sideOffset = 8, class: className = "", ...rest }: {
		children: any;
		side?: "top" | "right" | "bottom" | "left";
		sideOffset?: number;
		class?: string;
		[key: string]: any;
	} = $props();
</script>

<Tooltip.Content
	{side}
	{sideOffset}
	class="z-50 rounded-md bg-primary px-3 py-1.5 text-sm text-primary-foreground shadow-md animate-in fade-in-0 zoom-in-95 {className}"
	{...rest}
>
	{@render children()}
</Tooltip.Content>
