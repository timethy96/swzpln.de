<script lang="ts">
	import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '$lib/components/ui/dialog';
	import { Button } from '$lib/components/ui/button';
	import { privacyAccepted, acceptPrivacy } from '$lib/stores/schwarzplanStore';

	// Reactive open state
	let open = $derived(!$privacyAccepted);

	function handleAccept() {
		acceptPrivacy();
	}
</script>

<Dialog {open} onOpenChange={() => {}}>
	<DialogContent class="max-w-2xl" showCloseButton={false}>
			<DialogHeader>
				<DialogTitle>Datenschutzbestimmungen</DialogTitle>
			</DialogHeader>

			<div class="space-y-4 text-sm">
				<p>
					Um SWZPLN nutzen zu können, musst du unsere Datenschutzbestimmungen akzeptieren. Wir
					sammeln keine persönlichen Daten und setzen nur essenzielle Cookies.
				</p>

				<div class="space-y-2">
					<p class="font-semibold">Bei der Nutzung von SWZPLN werden Daten von externen Servern übertragen:</p>

					<ul class="list-disc pl-5 space-y-1">
						<li>
							Die Vorschaukarte wird von <strong>CARTO</strong> bereitgestellt. Die Kartendaten stammen von 
							<strong>OpenStreetMap</strong> Mitwirkenden. Die Suchfunktion nutzt die Nominatim API.
							<a
								href="https://carto.com/privacy"
								target="_blank"
								rel="noopener noreferrer"
								class="text-blue-600 hover:underline"
							>
								CARTO Datenschutzbestimmungen
							</a>
							,
							<a
								href="https://www.openstreetmap.org/copyright"
								target="_blank"
								rel="noopener noreferrer"
								class="text-blue-600 hover:underline"
							>
								OpenStreetMap Copyright
							</a>
						</li>

						<li>
							Die verarbeiteten Kartendaten werden von der Overpass-API via <strong>Private.coffee</strong> geladen.
							<a
								href="https://overpass.private.coffee/"
								target="_blank"
								rel="noopener noreferrer"
								class="text-blue-600 hover:underline"
							>
								Datenschutzbestimmungen
							</a>
						</li>

						<li>
							Die Höhendaten werden von der <strong>Open Topo Data API</strong> mit Mapzen Daten geladen.
							<a
								href="https://www.opentopodata.org/#privacy"
								target="_blank"
								rel="noopener noreferrer"
								class="text-blue-600 hover:underline"
							>
								Datenschutzbestimmungen
							</a>
						</li>
					</ul>
				</div>
			</div>

			<DialogFooter>
				<Button onclick={handleAccept} class="w-full">
					Akzeptieren und Karte laden
				</Button>
			</DialogFooter>
		</DialogContent>
	</Dialog>

