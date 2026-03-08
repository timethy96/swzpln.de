<script lang="ts">
	import { Tooltip } from "bits-ui";

	let { children, ...rest }: { children: any; [key: string]: any } = $props();
</script>

<Tooltip.Root {...rest}>
	{@render children()}
</Tooltip.Root>
