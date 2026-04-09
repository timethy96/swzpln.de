<script lang="ts">
	import { Button } from '$lib/components/ui/button';
	import { Badge } from '$lib/components/ui/badge';
	import {
		TooltipProvider,
		Tooltip,
		TooltipTrigger,
		TooltipContent
	} from '$lib/components/ui/tooltip';
	import Menu from '@lucide/svelte/icons/menu';
	import X from '@lucide/svelte/icons/x';
	import ExternalLink from '@lucide/svelte/icons/external-link';
	import Heart from '@lucide/svelte/icons/heart';
	import ShoppingCart from '@lucide/svelte/icons/shopping-cart';
	import { goto } from '$app/navigation';
	import { onMount, type Component } from 'svelte';
	import * as m from '$lib/paraglide/messages';

	interface NavItem {
		icon: Component;
		label: string;
		href?: string;
		onClick?: () => void;
		active?: boolean;
	}

	// Props for controlling the drawer
	let {
		isOpen = $bindable(false),
		navigationItems = []
	}: {
		isOpen?: boolean;
		navigationItems?: NavItem[];
	} = $props();

	// Download counter
	let downloadCount = $state(0);

	// Fetch download count
	async function fetchDownloadCount() {
		try {
			const response = await fetch('/api/counter/total');
			if (!response.ok) return;
			const data = await response.json();
			downloadCount = data.total ?? 0;
		} catch (error) {
			console.warn('Failed to fetch download count:', error);
		}
	}

	// Fetch on mount and poll every 5 seconds
	onMount(() => {
		fetchDownloadCount();
		const interval = setInterval(fetchDownloadCount, 5000);
		return () => clearInterval(interval);
	});

	// Close drawer when clicking backdrop
	function closeDrawer() {
		isOpen = false;
	}

	function handleItemClick(item: NavItem) {
		if (item.onClick) {
			item.onClick();
		}
		if (item.href) {
			if (item.href.startsWith('/')) {
				// eslint-disable-next-line svelte/no-navigation-without-resolve
				goto(item.href, { invalidateAll: false });
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
		class="absolute inset-0 z-40 bg-black/10 backdrop-blur-xs md:hidden"
		role="button"
		tabindex="0"
		onclick={closeDrawer}
		onkeydown={(e) => e.key === 'Enter' && closeDrawer()}
	></div>
{/if}

<!-- Navigation Rail -->
<nav
	aria-label="Main navigation"
	class="relative top-0 left-0 z-50 h-screen w-[64px] shrink-0 rounded-r-3xl bg-[var(--background)] transition-all duration-300 ease-in-out"
	class:w-[320px]={isOpen}
	class:absolute={isOpen}
	class:md:relative={isOpen}
>
	<!-- Navigation Items -->
	<div class="flex w-full flex-col place-items-start gap-4 space-y-2 pt-4 pl-2">
		<Button
			variant="ghost"
			class="h-12 w-12 self-start p-0"
			aria-label={isOpen ? 'Close menu' : 'Open menu'}
			onclick={() => (isOpen = !isOpen)}
		>
			{#if isOpen}
				<X class="h-6 w-6" />
			{:else}
				<Menu class="h-6 w-6" />
			{/if}
		</Button>
		<TooltipProvider delayDuration={300}>
			{#each navigationItems as item (item.label)}
				{#if isOpen}
					{@const isExternal = item.href && !item.href.startsWith('/')}
					{@const isDonate = item.icon === Heart}
					{@const isShop = item.icon === ShoppingCart}
					<Button
						variant="ghost"
						class="group m-0 h-12 w-[calc(100%-8px)] justify-start overflow-hidden"
						onclick={() => handleItemClick(item)}
					>
						{@const IconComponent = item.icon}
						{#if isDonate}
							<IconComponent class="mx-1 h-6 w-6 transition-colors group-hover:fill-red-500" />
						{:else if isShop}
							<IconComponent
								class="mx-1 h-6 w-6 transition-colors group-hover:text-[oklch(0.55_0.25_300)]"
							/>
						{:else}
							<IconComponent class="mx-1 h-6 w-6" />
						{/if}
						<span class="text-base">{item.label}</span>
						{#if isExternal}
							<ExternalLink class="ml-auto size-3 text-muted-foreground" />
						{/if}
					</Button>
				{:else}
					{@const isDonateCollapsed = item.icon === Heart}
					{@const isShopCollapsed = item.icon === ShoppingCart}
					<Tooltip>
						<TooltipTrigger>
							{#snippet child({ props })}
								<Button
									{...props}
									variant="ghost"
									class="group m-0 h-12 w-12 justify-start overflow-hidden px-0"
									aria-label={item.label}
									onclick={() => handleItemClick(item)}
								>
									{@const IconComponent = item.icon}
									{#if isDonateCollapsed}
										<IconComponent
											class="mx-1 h-6 w-6 transition-colors group-hover:fill-red-500"
										/>
									{:else if isShopCollapsed}
										<IconComponent
											class="mx-1 h-6 w-6 transition-colors group-hover:text-[oklch(0.55_0.25_300)]"
										/>
									{:else}
										<IconComponent class="mx-1 h-6 w-6" />
									{/if}
								</Button>
							{/snippet}
						</TooltipTrigger>
						<TooltipContent side="right">
							{item.label}
						</TooltipContent>
					</Tooltip>
				{/if}
			{/each}
		</TooltipProvider>
	</div>

	<div
		class="absolute right-0 bottom-4 left-0 flex h-52 flex-col items-center justify-end overflow-hidden"
	>
		{#if isOpen}
			<div class="w-[312px] px-3 py-5 text-sm leading-tight text-muted-foreground select-none">
				<span
					>{m.nav_footer_copyright({ year: new Date().getFullYear().toString() })}<br />
					{m.nav_footer_created_by()}
					<a href="https://timo.bilhoefer.de" target="_blank" class="text-primary">Timo Bilhöfer</a
					><br />
					{m.nav_footer_supported_by()}
					<a href="https://tabstudio.de" target="_blank" class="text-primary"
						>TAB Studio UG i.G. (haftungsbeschränkt)</a
					>.<br /><br />
					{m.nav_footer_open_source()}<br />
					{m.nav_footer_license()}</span
				>
			</div>
		{/if}
		<Badge
			variant="outline"
			class="cursor-pointer font-mono tabular-nums {isOpen
				? 'px-3 py-1 text-sm'
				: 'min-w-12 px-2 py-1 text-[10px]'}"
			onclick={() => (isOpen = !isOpen)}
		>
			{downloadCount.toLocaleString('de-DE')}+{isOpen ? ' ' + m.nav_footer_plans_created() : ''}
		</Badge>
	</div>
</nav>
