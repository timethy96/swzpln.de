<script lang="ts">
	import { Button } from '$lib/components/ui/button';
	let { icon, color, id, children, initialSelected = false, onToggle = undefined } = $props();

	let selected = $derived.by(() => initialSelected);

	function handleClick() {
		selected = !selected;
		if (onToggle) {
			onToggle(selected);
		}
	}
</script>

<Button
	variant="outline"
	class="h-10 transform gap-2 border-gray-300 px-3 font-medium transition-all duration-300 ease-out hover:scale-105 active:scale-95 {selected
		? 'text-white shadow-lg'
		: 'rounded-3xl text-foreground hover:bg-(--background)/80'}"
	style={selected
		? `background-color: ${color}; border-color: ${color}; box-shadow: 0 4px 12px ${color}40;`
		: 'background-color: var(--background);'}
	onclick={handleClick}
	{id}
>
	{@const IconComponent = icon}
	<IconComponent class="h-4 w-4 transition-colors duration-300 {selected ? 'text-white' : ''}" />
	<span class="text-base transition-colors duration-300 {selected ? 'text-white' : ''}">
		{@render children?.()}
	</span>
</Button>
