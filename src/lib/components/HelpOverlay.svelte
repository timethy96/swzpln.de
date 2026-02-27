<script lang="ts">
	import { appState } from '$lib/state.svelte';
	import { Button } from '$lib/components/ui/button';
	import { X } from 'lucide-svelte';
	import * as m from '$lib/paraglide/messages';

	function handleBackdropClick() {
		appState.toggleHelpOverlay();
	}

	function handleCloseClick(e: MouseEvent) {
		e.stopPropagation();
		appState.toggleHelpOverlay();
	}
</script>

{#if appState.helpOverlayOpen}
	<!-- Full screen overlay -->
	<div
		class="fixed inset-0 z-[100] flex items-center justify-center p-4"
		onclick={handleBackdropClick}
		role="button"
		tabindex="0"
		onkeydown={(e) => e.key === 'Escape' && appState.toggleHelpOverlay()}
	>
		<!-- Semi-transparent backdrop -->
		<div class="absolute inset-0 bg-black/70 backdrop-blur-sm"></div>

		<!-- Help content card -->
		<div
			class="relative z-10 w-full max-w-lg rounded-2xl bg-background p-8 shadow-2xl"
			onclick={(e) => e.stopPropagation()}
			onkeydown={(e) => {}}
			role="none"
		>
			<!-- Close button -->
			<Button
				variant="ghost"
				size="icon"
				class="absolute top-4 right-4"
				onclick={handleCloseClick}
				aria-label={m.help_close()}
			>
				<X class="h-4 w-4" />
			</Button>

			<!-- Title -->
			<h2 class="mb-6 text-2xl font-bold">{m.help_title()}</h2>

			<!-- Three steps -->
			<div class="space-y-6">
				<!-- Step 1 -->
				<div class="flex gap-4">
					<div
						class="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-primary text-lg font-bold text-primary-foreground"
					>
						1
					</div>
					<div class="flex-1">
						<h3 class="mb-1 text-lg font-semibold">{m.help_step_1_title()}</h3>
						<p class="text-sm text-muted-foreground">
							{m.help_step_1_description()}
						</p>
					</div>
				</div>

				<!-- Step 2 -->
				<div class="flex gap-4">
					<div
						class="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-primary text-lg font-bold text-primary-foreground"
					>
						2
					</div>
					<div class="flex-1">
						<h3 class="mb-1 text-lg font-semibold">{m.help_step_2_title()}</h3>
						<p class="text-sm text-muted-foreground">
							{m.help_step_2_description()}
						</p>
					</div>
				</div>

				<!-- Step 3 -->
				<div class="flex gap-4">
					<div
						class="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-primary text-lg font-bold text-primary-foreground"
					>
						3
					</div>
					<div class="flex-1">
						<h3 class="mb-1 text-lg font-semibold">{m.help_step_3_title()}</h3>
						<p class="text-sm text-muted-foreground">
							{m.help_step_3_description()}
						</p>
					</div>
				</div>
			</div>

			<!-- Close button at bottom -->
			<Button class="mt-8 w-full" onclick={handleCloseClick}>
				{m.help_understood()}
			</Button>
		</div>
	</div>
{/if}
