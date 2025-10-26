<script lang="ts">
	import { Button } from '$lib/components/ui/button';
	import { Badge } from '$lib/components/ui/badge';
	import { Menu, X } from 'lucide-svelte';
	import { goto } from '$app/navigation';

	// Props for controlling the drawer
	let { 
		isOpen = $bindable(false),
		navigationItems = []
	}: {
		isOpen?: boolean;
		navigationItems?: Array<{
			icon: any;
			label: string;
			href?: string;
			onClick?: () => void;
			active?: boolean;
		}>;
	} = $props();

	// Close drawer when clicking backdrop
	function closeDrawer() {
		isOpen = false;
	}

	function handleItemClick(item: any) {
		if (item.onClick) {
			item.onClick();
		}
		if (item.href) {
			if (item.href.startsWith('/')) {
				goto(item.href);
			} else {
				window.open(item.href, '_blank');
			}
		}
		if (window.innerWidth < 1024) {
			isOpen = false;
		}
	}
</script>

{#if isOpen}
	<div 
		class="absolute inset-0 backdrop-blur-xs z-40 bg-black/10 md:hidden"
		role="button"
		tabindex="0"
		onclick={closeDrawer}
		onkeydown={(e) => e.key === 'Enter' && closeDrawer()}
	></div>
{/if}

<!-- Navigation Rail -->
<nav 
	class="left-0 top-0 h-full z-50 rounded-r-3xl bg-[var(--background)] transition-all duration-300 ease-in-out w-[64px] relative shrink-0"
	class:w-[320px]={isOpen}
	class:absolute={isOpen}
	class:md:relative={isOpen}
>
	
	<!-- Navigation Items -->
	<div class="pt-4 pl-2 space-y-2 flex flex-col place-items-start gap-4 w-full">
		<Button variant="ghost" class="self-start h-12 w-12 p-0" onclick={() => isOpen = !isOpen}>
			{#if isOpen}
				<X class="h-6 w-6" />
			{:else}
				<Menu class="h-6 w-6" />
			{/if}
		</Button>
		{#each navigationItems as item}
			<Button 
				variant="ghost" 
				class={isOpen ? 'h-12 w-[calc(100%-8px)] justify-start overflow-hidden m-0' : 'h-12 w-12 px-0 justify-start overflow-hidden m-0'}
				onclick={() => handleItemClick(item)}
			>
				{@const IconComponent = item.icon}
				<IconComponent class="h-6 w-6 mx-1" />
				{#if isOpen}<span class="text-base">{item.label}</span>{/if}
			</Button>
		{/each}
	</div>

	<div class="absolute bottom-4 left-0 right-0 h-40 flex flex-col items-center justify-end overflow-hidden">
		{#if isOpen}
			<div class="px-3 py-5 w-[312px] text-sm text-muted-foreground leading-tight select-none">
				<span>© {new Date().getFullYear()} SWZPLN<br>
				erstellt von <a href="https://timo.bilhoefer.de" target="_blank" class="text-primary">Timo Bilhöfer</a><br>
				unterstützt durch <a href="https://holderbilhoefer.com" target="_blank" class="text-primary">Holder Bilhöfer Architekten</a>.<br><br>
				Diese Webseite ist Quelloffen<br>
				und unter der <a href="https://github.com/timethy96/swzpln.de/blob/main/LICENSE" target="_blank" class="text-primary">AGPL-3</a> Lizenz veröffentlicht.</span>
			</div>
		{/if}
		<Badge 
			variant="outline" 
			class="font-mono tabular-nums cursor-pointer {isOpen ? 'text-sm px-3 py-1' : 'text-[10px] px-2 py-1 min-w-12'}"
			onclick={() => isOpen = !isOpen}
		>
			164573+{isOpen ? ' Pläne erstellt' : ''}
		</Badge> 
	</div>
</nav>

