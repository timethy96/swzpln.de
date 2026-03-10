<script lang="ts">
	import { Button } from '$lib/components/ui/button';
	import * as Popover from '$lib/components/ui/popover';
	import ChevronDown from '@lucide/svelte/icons/chevron-down';
	import type { Component } from 'svelte';

	interface DropdownItem {
		icon?: Component;
		label: string;
		id: string;
		color?: string;
		value?: string | number;
		onSelect?: (item: DropdownItem) => void;
	}

	// Props interface
	let {
		icon,
		color,
		id,
		children,
		initialSelected = false,
		onToggle = undefined,
		dropdownItems = [],
		onDropdownItemClick = undefined,
		selectedValue = undefined
	}: {
		icon?: Component;
		color?: string;
		id?: string;
		children?: import('svelte').Snippet;
		initialSelected?: boolean;
		onToggle?: (selected: boolean) => void;
		dropdownItems?: DropdownItem[];
		onDropdownItemClick?: (item: DropdownItem) => void;
		selectedValue?: string | number;
	} = $props();

	let selected = $state(initialSelected);
	let open = $state(false);

	// Main button click handler
	function handleMainClick() {
		selected = !selected;
		if (onToggle) {
			onToggle(selected);
		}
	}

	// Dropdown item click handler
	function handleDropdownItemClick(item: DropdownItem) {
		open = false;
		// Call the callback if provided
		if (onDropdownItemClick) {
			onDropdownItemClick(item);
		}
		// Also call item's own onSelect if it has one
		if (item.onSelect) {
			item.onSelect(item);
		}
	}
</script>

<div class="flex transform transition-all duration-300 ease-out hover:scale-105">
	<!-- Main button -->
	<Button
		variant="outline"
		class="h-10 transform gap-2 border-gray-300 px-3 font-medium transition-all duration-300 ease-out {selected
			? 'rounded-l-md rounded-r-none border-r-0'
			: 'rounded-l-3xl rounded-r-none border-r-0'} active:scale-95 {selected
			? 'text-white shadow-lg'
			: 'text-[var(--foreground)] hover:bg-[var(--background)]/80'}"
		style={selected
			? `background-color: ${color}; border-color: ${color}; box-shadow: 0 4px 12px ${color}40;`
			: 'background-color: var(--background);'}
		onclick={handleMainClick}
		{id}
	>
		{#if icon}
			{@const IconComponent = icon}
			<IconComponent
				class="h-4 w-4 transition-colors duration-300 {selected ? 'text-white' : ''}"
			/>
		{/if}
		<span class="text-base transition-colors duration-300 {selected ? 'text-white' : ''}">
			{@render children?.()}
		</span>
	</Button>

	<!-- Dropdown trigger -->
	<Popover.Root bind:open>
		<Popover.Trigger
			class="h-10 transform border px-2 transition-all duration-300 ease-out active:scale-95 {selected
				? 'rounded-l-none rounded-r-md'
				: 'rounded-l-none rounded-r-3xl'} {selected
				? 'text-white shadow-lg'
				: 'text-[var(--foreground)] hover:bg-[var(--background)]/80'} inline-flex items-center justify-center font-medium whitespace-nowrap ring-offset-background focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:outline-none disabled:pointer-events-none disabled:opacity-50"
			style={selected
				? `background-color: ${color}; border-color: ${color}; border-left-color: #AAA; box-shadow: 0 4px 12px ${color}40;`
				: 'background-color: var(--background);'}
		>
			<ChevronDown class="h-3 w-3 transition-colors duration-300 {selected ? 'text-white' : ''}" />
		</Popover.Trigger>

		<Popover.Content class="w-56 p-2" align="start">
			<div class="space-y-1">
				{#each dropdownItems as item (item.id)}
					{@const isSelected = item.value !== undefined && item.value === selectedValue}
					<button
						class="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm transition-colors duration-200 hover:bg-gray-100 dark:hover:bg-gray-800 {isSelected
							? 'bg-gray-100 font-semibold dark:bg-gray-800'
							: ''}"
						onclick={() => handleDropdownItemClick(item)}
					>
						{#if item.icon}
							{@const ItemIcon = item.icon}
							<ItemIcon class="h-4 w-4" style={item.color ? `color: ${item.color}` : ''} />
						{/if}
						<span class="flex-1 text-left">{item.label}</span>
						{#if isSelected}
							<svg
								class="h-4 w-4 text-gray-600 dark:text-gray-300"
								fill="none"
								viewBox="0 0 24 24"
								stroke="currentColor"
							>
								<path
									stroke-linecap="round"
									stroke-linejoin="round"
									stroke-width="2"
									d="M5 13l4 4L19 7"
								/>
							</svg>
						{/if}
					</button>
				{/each}
			</div>
		</Popover.Content>
	</Popover.Root>
</div>
