<script lang="ts">
	import { Tooltip } from "bits-ui";

	let { delayDuration = 200, children }: { delayDuration?: number; children: any } = $props();
</script>

<Tooltip.Provider {delayDuration}>
	{@render children()}
</Tooltip.Provider>
