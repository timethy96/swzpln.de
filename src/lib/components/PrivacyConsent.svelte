<script lang="ts">
	import {
		Dialog,
		DialogContent,
		DialogHeader,
		DialogTitle,
		DialogFooter
	} from '$lib/components/ui/dialog';
	import { Button } from '$lib/components/ui/button';
	import { appState } from '$lib/state.svelte';
	import * as m from '$lib/paraglide/messages';

	// Reactive open state
	let open = $derived(!appState.privacyAccepted);

	function handleAccept() {
		appState.acceptPrivacy();
	}
</script>

<Dialog {open} onOpenChange={() => {}}>
	<DialogContent class="max-w-2xl" showCloseButton={false}>
		<DialogHeader>
			<DialogTitle>{m.privacy_title()}</DialogTitle>
		</DialogHeader>

		<div class="space-y-4 text-sm">
			<p>
				{m.privacy_intro()}
			</p>

			<div class="space-y-2">
				<p class="font-semibold">{m.privacy_external_data_title()}</p>

				<ul class="list-disc space-y-1 pl-5">
					<li>
						{m.privacy_external_data_description_1()}
						<a
							href="https://carto.com/privacy"
							target="_blank"
							rel="noopener noreferrer"
							class="text-blue-600 hover:underline"
						>
							{m.privacy_carto_link()}
						</a>
						,
						<a
							href="https://www.openstreetmap.org/copyright"
							target="_blank"
							rel="noopener noreferrer"
							class="text-blue-600 hover:underline"
						>
							{m.privacy_osm_copyright()}
						</a>
					</li>

					<li>
						{m.privacy_external_data_description_2()}
						<a
							href="https://overpass.private.coffee/"
							target="_blank"
							rel="noopener noreferrer"
							class="text-blue-600 hover:underline"
						>
							{m.privacy_overpass_link()}
						</a>
					</li>

					<li>
						{m.privacy_external_data_description_3()}
						<a
							href="https://www.opentopodata.org/#privacy"
							target="_blank"
							rel="noopener noreferrer"
							class="text-blue-600 hover:underline"
						>
							{m.privacy_topodata_link()}
						</a>
					</li>
				</ul>
			</div>
		</div>

		<DialogFooter>
			<Button onclick={handleAccept} class="w-full">
				{m.privacy_accept()}
			</Button>
		</DialogFooter>
	</DialogContent>
</Dialog>
