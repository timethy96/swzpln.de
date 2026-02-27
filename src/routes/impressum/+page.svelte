<script lang="ts">
	import SEO from '$lib/components/SEO.svelte';
	import type { PageData } from './$types';

	let { data }: { data: PageData } = $props();
</script>

<!-- SEO for legal page -->
<SEO 
	title={data.seo.title}
	description={data.seo.description}
	noindex={data.seo.noindex}
/>

<!-- Content -->
<div class="flex-1 overflow-y-auto p-8 max-h-[90vh] border border-gray-200 rounded-lg mr-4">
	<div class="prose prose-slate dark:prose-invert mx-auto max-w-4xl">
		<h1 id="imprint">Impressum</h1>
		<p>Angaben gemäß § 5 TMG</p>
		<p>
			Timo Bilhöfer<br />
			Wühlischstr. 20<br />
			10245 Berlin<br /><br />
			E-Mail: timo ø swzpln · de
		</p>

		<h3>Haftung für Inhalte</h3>
		<p>
			Die Inhalte unserer Seiten wurden mit größter Sorgfalt erstellt. Für die Richtigkeit,
			Vollständigkeit und Aktualität der Inhalte können wir jedoch keine Gewähr übernehmen. Als
			Diensteanbieter sind wir gemäß § 7 Abs.1 TMG für eigene Inhalte auf diesen Seiten nach den
			allgemeinen Gesetzen verantwortlich. Nach §§ 8 bis 10 TMG sind wir als Diensteanbieter jedoch
			nicht verpflichtet, übermittelte oder gespeicherte fremde Informationen zu überwachen oder
			nach Umständen zu forschen, die auf eine rechtswidrige Tätigkeit hinweisen. Verpflichtungen
			zur Entfernung oder Sperrung der Nutzung von Informationen nach den allgemeinen Gesetzen
			bleiben hiervon unberührt. Eine diesbezügliche Haftung ist jedoch erst ab dem Zeitpunkt der
			Kenntnis einer konkreten Rechtsverletzung möglich. Bei Bekanntwerden von entsprechenden
			Rechtsverletzungen werden wir diese Inhalte umgehend entfernen.
		</p>

		<h3>Haftung für Links</h3>
		<p>
			Unser Angebot enthält Links zu externen Webseiten Dritter, auf deren Inhalte wir keinen
			Einfluss haben. Deshalb können wir für diese fremden Inhalte auch keine Gewähr übernehmen. Für
			die Inhalte der verlinkten Seiten ist stets der jeweilige Anbieter oder Betreiber der Seiten
			verantwortlich. Die verlinkten Seiten wurden zum Zeitpunkt der Verlinkung auf mögliche
			Rechtsverstöße überprüft. Rechtswidrige Inhalte waren zum Zeitpunkt der Verlinkung nicht
			erkennbar. Eine permanente inhaltliche Kontrolle der verlinkten Seiten ist jedoch ohne
			konkrete Anhaltspunkte einer Rechtsverletzung nicht zumutbar. Bei Bekanntwerden von
			Rechtsverletzungen werden wir derartige Links umgehend entfernen.
		</p>

		<h3>Urheberrecht</h3>
		<p>
			Die Webseite und ihr Quellcode sind unter der freien
			<a
				href="https://github.com/timethy96/swzpln.de/blob/main/LICENSE"
				target="_blank"
				rel="noopener noreferrer"
			>
				GNU Affero General Public License v3.0
			</a>
			quelloffen lizenziert. Die Downloads (Schwarzpläne) werden soweit möglich lizenzlos bereitgestellt
			<a
				target="_blank"
				href="https://creativecommons.org/publicdomain/zero/1.0/"
				rel="noopener noreferrer">(CC0)</a
			>. Die Rechte an den Kartendaten liegen bei den
			<a target="_blank" href="https://osm.org/copyright" rel="noopener noreferrer">OpenStreetMap</a
			>-Mitwirkenden. Soweit die Inhalte auf dieser Seite nicht vom Betreiber erstellt wurden,
			werden die Urheberrechte Dritter beachtet. Insbesondere werden Inhalte Dritter als solche
			gekennzeichnet. Sollten Sie trotzdem auf eine Urheberrechtsverletzung aufmerksam werden,
			bitten wir um einen entsprechenden Hinweis. Bei Bekanntwerden von Rechtsverletzungen werden
			wir derartige Inhalte umgehend entfernen.
		</p>

		<h3>Datenschutz</h3>
		<p>
			Die Nutzung unserer Webseite ist ohne Angabe personenbezogener Daten möglich. Ohne wenn und
			aber!
		</p>
		<p>
			Wir weisen darauf hin, dass die Datenübertragung im Internet (z.B. bei der Kommunikation per
			E-Mail) Sicherheitslücken aufweisen kann. Ein lückenloser Schutz der Daten vor dem Zugriff
			durch Dritte ist nicht möglich. Weitere Informationen finden sich in der unten stehenden
			Datenschutzerklärung.
		</p>
		<p>
			Zur Bereitstellung der Kartendaten, werden Koordinaten des gewählten Ausschnitts an die
			Overpass API von
			<a target="_blank" href="https://overpass.private.coffee/" rel="noopener noreferrer"
				>Private.coffee</a
			>
			übermittelt. Bei Nutzung der Suchfunktion wird der Suchbegriff an die
			<a
				href="https://photon.komoot.io/"
				target="_blank"
				rel="noopener noreferrer">Photon API von Komoot</a
			>
			übermittelt. Die Vorschaukarte wird von
			<a href="https://openstreetmaps.org" target="_blank" rel="noopener noreferrer"
				>openstreetmaps.org</a
			>
			heruntergeladen.
		</p>
		<p>
			Der Nutzung von im Rahmen der Impressumspflicht veröffentlichten Kontaktdaten durch Dritte zur
			Übersendung von nicht ausdrücklich angeforderter Werbung und Informationsmaterialien wird
			hiermit ausdrücklich widersprochen. Die Betreiber der Seiten behalten sich ausdrücklich
			rechtliche Schritte im Falle der unverlangten Zusendung von Werbeinformationen, etwa durch
			Spam-Mails, vor.
		</p>

		<hr class="my-8" />

		<p>
			Website Impressum teilweise von
			<a href="https://www.impressum-generator.de" rel="noopener noreferrer"
				>impressum-generator.de</a
			>
		</p>

		<p>
			Kartendaten: © 2025
			<a target="_blank" href="https://osm.org/copyright" rel="noopener noreferrer">OpenStreetMap</a
			>
			contributors
		</p>
		<p>
			Overpass-API bereitgestellt von
			<a target="_blank" href="https://overpass.private.coffee/" rel="noopener noreferrer"
				>Private.coffee</a
			>
		</p>

		<p>
			Topographie-API bereitgestellt von
			<a target="_blank" href="https://www.opentopodata.org" rel="noopener noreferrer"
				>Open Topo Data</a
			>
			mit Daten von
			<a
				href="https://github.com/tilezen/joerd/blob/master/docs/attribution.md"
				target="_blank"
				rel="noopener noreferrer">Mapzen</a
			>. Die Höhendaten basieren auf SRTM, ASTER GDEM, GMTED2010, und NED Daten.
		</p>

		<h2 id="privacy">Datenschutzbestimmungen</h2>

		<p>
			Datenschutz hat für uns einen besonders hohen Stellenwert. Eine Nutzung der Internetseite
			swzpln.de ist generell ohne jede Angabe personenbezogener Daten möglich.
		</p>

		<p>
			Mittels dieser Datenschutzerklärung möchten wir über Art, Umfang und Zweck der von uns
			erhobenen, genutzten und verarbeiteten Daten informieren. Es gelten die Rechte und Pflichten
			gemäß DS-GVO.
		</p>

		<p>
			Wir haben als für die Verarbeitung Verantwortliche zahlreiche technische und organisatorische
			Maßnahmen umgesetzt, um einen möglichst lückenlosen Schutz der über diese Internetseite
			verarbeiteten Daten sicherzustellen. Dennoch können Internetbasierte Datenübertragungen
			grundsätzlich Sicherheitslücken aufweisen, sodass ein absoluter Schutz nicht gewährleistet
			werden kann.
		</p>

		<h4>1. Begriffsbestimmungen</h4>
		<p>
			Die Datenschutzerklärung von swzpln.de beruht auf den Begrifflichkeiten, die durch den
			Europäischen Richtlinien- und Verordnungsgeber beim Erlass der Datenschutz-Grundverordnung
			(DS-GVO) verwendet wurden.
		</p>

		<h4>2. Name und Anschrift des für die Verarbeitung Verantwortlichen</h4>
		<p>
			Verantwortlicher im Sinne der Datenschutz-Grundverordnung, sonstiger in den Mitgliedstaaten
			der Europäischen Union geltenden Datenschutzgesetze und anderer Bestimmungen mit
			datenschutzrechtlichem Charakter ist die:
		</p>

		<p>swzpln.de</p>
		<p>Wühlischstr. 20</p>
		<p>10245 Berlin</p>
		<p>Deutschland</p>
		<p>E-Mail: timo ø swzpln · de</p>
		<p>Website: swzpln.de</p>

		<h4>3. Cookies</h4>
		<p>
			Die Internetseiten verwenden Cookies. Cookies sind Textdateien, welche über einen
			Internetbrowser auf einem Computersystem abgelegt und gespeichert werden.
		</p>

		<p>
			Zahlreiche Internetseiten und Server verwenden Cookies. Viele Cookies enthalten eine
			sogenannte Cookie-ID. Eine Cookie-ID ist eine eindeutige Kennung des Cookies. Sie besteht aus
			einer Zeichenfolge, durch welche Internetseiten und Server dem konkreten Internetbrowser
			zugeordnet werden können, in dem das Cookie gespeichert wurde. Dies ermöglicht es den
			besuchten Internetseiten und Servern, den individuellen Browser der betroffenen Person von
			anderen Internetbrowsern, die andere Cookies enthalten, zu unterscheiden. Ein bestimmter
			Internetbrowser kann über die eindeutige Cookie-ID wiedererkannt und identifiziert werden.
		</p>

		<p>
			Durch den Einsatz von Cookies kann die swzpln.de den Nutzern dieser Internetseite
			nutzerfreundlichere Services bereitstellen, die ohne die Cookie-Setzung nicht möglich wären.
		</p>

		<p>
			Mittels eines Cookies können die Informationen und Angebote auf unserer Internetseite im Sinne
			des Benutzers optimiert werden. Cookies ermöglichen uns, wie bereits erwähnt, die Benutzer
			unserer Internetseite wiederzuerkennen. Zweck dieser Wiedererkennung ist es, den Nutzern die
			Verwendung unserer Internetseite zu erleichtern.
		</p>

		<p>
			Die betroffene Person kann die Setzung von Cookies durch unsere Internetseite jederzeit
			mittels einer entsprechenden Einstellung des genutzten Internetbrowsers verhindern und damit
			der Setzung von Cookies dauerhaft widersprechen. Ferner können bereits gesetzte Cookies
			jederzeit über einen Internetbrowser oder andere Softwareprogramme gelöscht werden. Dies ist
			in allen gängigen Internetbrowsern möglich. Deaktiviert die betroffene Person die Setzung von
			Cookies in dem genutzten Internetbrowser, sind unter Umständen nicht alle Funktionen unserer
			Internetseite vollumfänglich nutzbar.
		</p>

		<p>
			Folgende Cookies werden gesetzt:<br />
			• darkmode: true oder false: Speichert die Einstellung, ob die dunkle Version der Webseite aktiviert
			wurde<br />
			• lastCenter: [latitude, longitude, zoom]: Speichert den letzten gesetzten Standort der Karte,
			um diesen bei neuem Laden wieder anzeigen zu können.<br />
			• layers: [Liste mit true oder false Werten]: Speichert die zuletzt ausgewählten Ebenen, um diese
			bei neuem Laden wieder einstellen zu können.<br />
			• privacy_accepted: true oder false: Speichert, ob die Datenschutzbestimmungen bereits akzeptiert
			wurden, um diese bei neuem Laden nicht nochmal abfragen zu müssen.
		</p>

		<h4>4. Erfassung von allgemeinen Daten und Informationen</h4>
		<p>
			Die Internetseite swzpln.de erfasst mit jedem Aufruf der Internetseite durch eine betroffene
			Person oder ein automatisiertes System eine Reihe von allgemeinen Daten und Informationen.
			Diese allgemeinen Daten und Informationen werden in den Logfiles des Servers gespeichert.
			Erfasst werden können die (1) verwendeten Browsertypen und Versionen, (2) das vom zugreifenden
			System verwendete Betriebssystem, (3) die Internetseite, von welcher ein zugreifendes System
			auf unsere Internetseite gelangt (sogenannte Referrer), (4) die Unterwebseiten, welche über
			ein zugreifendes System auf unserer Internetseite angesteuert werden, (5) das Datum und die
			Uhrzeit eines Zugriffs auf die Internetseite, (6) eine Internet-Protokoll-Adresse
			(IP-Adresse), (7) der Internet-Service-Provider des zugreifenden Systems und (8) sonstige
			ähnliche Daten und Informationen, die der Gefahrenabwehr im Falle von Angriffen auf unsere
			informationstechnologischen Systeme dienen.
		</p>

		<p>
			Bei der Nutzung dieser allgemeinen Daten und Informationen zieht die swzpln.de keine
			Rückschlüsse auf die betroffene Person. Diese Informationen werden vielmehr benötigt, um (1)
			die Inhalte unserer Internetseite korrekt auszuliefern, (2) die Inhalte unserer Internetseite
			zu optimieren, (3) die dauerhafte Funktionsfähigkeit unserer informationstechnologischen
			Systeme und der Technik unserer Internetseite zu gewährleisten sowie (4) um
			Strafverfolgungsbehörden im Falle eines Cyberangriffes die zur Strafverfolgung notwendigen
			Informationen bereitzustellen. Diese anonym erhobenen Daten und Informationen werden durch
			swzpln.de daher nur mit dem Ziel ausgewertet, den Datenschutz und die Datensicherheit zu
			erhöhen, um letztlich ein optimales Schutzniveau für die von uns verarbeiteten
			personenbezogenen Daten sicherzustellen. Die anonymen Daten der Server-Logfiles werden
			getrennt von allen durch eine betroffene Person angegebenen personenbezogenen Daten
			gespeichert.
		</p>

		<p>Wir verpflichten uns diese Daten nach maximal 24 Stunden vollständig zu löschen.</p>

		<h4>5. Kontaktmöglichkeit über die Internetseite</h4>
		<p>
			Die Internetseiten enthalten aufgrund von gesetzlichen Vorschriften Angaben, die eine schnelle
			elektronische Kontaktaufnahme, sowie eine unmittelbare Kommunikation mit uns ermöglichen, was
			ebenfalls eine allgemeine Adresse der sogenannten elektronischen Post (E-Mail-Adresse)
			umfasst. Sofern eine betroffene Person per E-Mail den Kontakt mit dem für die Verarbeitung
			Verantwortlichen aufnimmt, werden die von der betroffenen Person übermittelten
			personenbezogenen Daten automatisch gespeichert. Solche auf freiwilliger Basis von einer
			betroffenen Person an den für die Verarbeitung Verantwortlichen übermittelten
			personenbezogenen Daten werden für Zwecke der Bearbeitung oder der Kontaktaufnahme zur
			betroffenen Person gespeichert. Es erfolgt keine Weitergabe dieser personenbezogenen Daten an
			Dritte.
		</p>

		<h4>6. Routinemäßige Löschung und Sperrung von personenbezogenen Daten</h4>
		<p>
			Der für die Verarbeitung Verantwortliche verarbeitet und speichert personenbezogene Daten der
			betroffenen Person nur für den Zeitraum, der zur Erreichung des Speicherungszwecks
			erforderlich ist oder sofern dies durch den Europäischen Richtlinien- und Verordnungsgeber
			oder einen anderen Gesetzgeber in Gesetzen oder Vorschriften, welchen der für die Verarbeitung
			Verantwortliche unterliegt, vorgesehen wurde.
		</p>

		<p>
			Entfällt der Speicherungszweck oder läuft eine vom Europäischen Richtlinien- und
			Verordnungsgeber oder einem anderen zuständigen Gesetzgeber vorgeschriebene Speicherfrist ab,
			werden die personenbezogenen Daten routinemäßig und entsprechend den gesetzlichen Vorschriften
			gesperrt oder gelöscht.
		</p>

		<h4>7. Externe Diensteanbieter</h4>
		<p>
			Bei der Nutzung von SWZPLN werden Daten von externen Servern übertragen. Es gelten die
			jeweiligen Datenschutzbestimmungen der Unternehmen. Bei der Auswahl der Unternehmen wurde auf
			einen rigorosen Datenschutz geachtet.
		</p>
		<p>
			Die Vorschaukarte wird von <strong>CARTO</strong> bereitgestellt. Die Kartendaten stammen von
			<strong>OpenStreetMap</strong>
			Mitwirkenden. Die Suchfunktion nutzt die <strong>Photon API von Komoot</strong>.
			<a href="https://carto.com/privacy" target="_blank" rel="noopener noreferrer"
				>CARTO Datenschutzbestimmungen (extern)</a
			>
			|
			<a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener noreferrer"
				>OpenStreetMap Copyright (extern)</a
			>
		</p>
		<p>
			Die verarbeiteten Kartendaten werden von der <strong>Overpass-API von Private.coffee</strong>
			geladen.
			<a href="https://overpass.private.coffee/" target="_blank" rel="noopener noreferrer"
				>Datenschutzbestimmungen. (extern)</a
			>
		</p>
		<p>
			Topographie-API bereitgestellt von
			<a target="_blank" href="https://www.opentopodata.org" rel="noopener noreferrer"
				>Open Topo Data</a
			>
			mit Daten von
			<a
				href="https://github.com/tilezen/joerd/blob/master/docs/attribution.md"
				target="_blank"
				rel="noopener noreferrer">Mapzen</a
			>. Die Höhendaten basieren auf SRTM, ASTER GDEM, GMTED2010, und NED Daten.
		</p>

		<p>
			Teilweise entwickelt von den
			<a href="https://willing-able.com/" rel="noopener noreferrer">Legal Tech</a>
			Spezialisten von Willing & Able, die auch das System für datenschutzrechtlich durchdachte und
			<a href="https://abletotrack.com/" rel="noopener noreferrer">gesetzeskonforme Zeiterfassung</a
			>
			entwickelt haben. Die Texte des Datenschutzerklärungs-Generators wurden von
			<a href="https://dg-datenschutz.de/" rel="noopener noreferrer"
				>Prof. Dr. h.c. Heiko Jonny Maniero</a
			>
			und Rechtsanwalt
			<a href="https://www.wbs-law.de/" rel="nofollow noopener noreferrer">Christian Solmecke</a>
			erstellt und publiziert.
		</p>
	</div>
</div>

<style>
	:global(.prose h1) {
		font-size: 1.875rem;
		font-weight: 700;
		margin-bottom: 1.5rem;
		margin-top: 2rem;
	}

	:global(.prose h2) {
		font-size: 1.5rem;
		font-weight: 700;
		margin-bottom: 1rem;
		margin-top: 2rem;
	}

	:global(.prose h3) {
		font-size: 1.25rem;
		font-weight: 700;
		margin-bottom: 0.75rem;
		margin-top: 1.5rem;
	}

	:global(.prose h4) {
		font-size: 1.125rem;
		font-weight: 600;
		margin-bottom: 0.5rem;
		margin-top: 1rem;
	}

	:global(.prose p) {
		margin-bottom: 1rem;
		line-height: 1.75;
	}

	:global(.prose a) {
		color: hsl(var(--primary));
		text-decoration: underline;
	}

	:global(.prose a:hover) {
		opacity: 0.8;
	}

	:global(.prose strong) {
		font-weight: 600;
	}

	:global(.prose hr) {
		border-top: 1px solid hsl(var(--border));
	}
</style>
