<?php
$isAjax = isset($_SERVER['HTTP_X_REQUESTED_WITH']) and
    strtolower($_SERVER['HTTP_X_REQUESTED_WITH']) === 'xmlhttprequest';
if (!$isAjax) {
?>

    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no">
        <meta http-equiv="X-UA-Compatible" content="ie=edge">

        <title>swzpln.de | Impressum</title>

        <meta name="title" content="swzpln.de | Impressum" />
        <meta name="author" content="Timo Bilhöfer" />
        <meta name="publisher" content="Timo Bilhöfer" />
        <meta name="copyright" content="Timo Bilhöfer <?php echo date("Y"); ?>" />
        <meta name="robots" content="NOINDEX" />
        <meta name="language" http-equiv="content-language" content="de" />
    </head>

    <body id="legal">
    <?php
}
    ?>
    <h2 id="imprint">Impressum</h2>
    <p>Angaben gemäß § 5 TMG</p>
    <p>Timo Bilhöfer <br>
        Wühlischstr. 20<br>
        10245 Berlin <br><br />
        E-Mail: timo ø swzpln · de
    </p>
    <p>
        <br><br><h3>Haftung für Inhalte</h3><br><br>
        Die Inhalte unserer Seiten wurden mit größter Sorgfalt erstellt. Für die Richtigkeit, Vollständigkeit und Aktualität der Inhalte können wir jedoch keine Gewähr übernehmen. Als Diensteanbieter sind wir gemäß § 7 Abs.1 TMG für eigene Inhalte auf diesen Seiten nach den allgemeinen Gesetzen verantwortlich. Nach §§ 8 bis 10 TMG sind wir als Diensteanbieter jedoch nicht verpflichtet, übermittelte oder gespeicherte fremde Informationen zu überwachen oder nach Umständen zu forschen, die auf eine rechtswidrige Tätigkeit hinweisen. Verpflichtungen zur Entfernung oder Sperrung der Nutzung von Informationen nach den allgemeinen Gesetzen bleiben hiervon unberührt. Eine diesbezügliche Haftung ist jedoch erst ab dem Zeitpunkt der Kenntnis einer konkreten Rechtsverletzung möglich. Bei Bekanntwerden von entsprechenden Rechtsverletzungen werden wir diese Inhalte umgehend entfernen.
        <br><br><h3>Haftung für Links</h3><br><br>
        Unser Angebot enthält Links zu externen Webseiten Dritter, auf deren Inhalte wir keinen Einfluss haben. Deshalb können wir für diese fremden Inhalte auch keine Gewähr übernehmen. Für die Inhalte der verlinkten Seiten ist stets der jeweilige Anbieter oder Betreiber der Seiten verantwortlich. Die verlinkten Seiten wurden zum Zeitpunkt der Verlinkung auf mögliche Rechtsverstöße überprüft. Rechtswidrige Inhalte waren zum Zeitpunkt der Verlinkung nicht erkennbar. Eine permanente inhaltliche Kontrolle der verlinkten Seiten ist jedoch ohne konkrete Anhaltspunkte einer Rechtsverletzung nicht zumutbar. Bei Bekanntwerden von Rechtsverletzungen werden wir derartige Links umgehend
        entfernen.
        <br><br><h3>Urheberrecht</h3><br><br>
        Die Webseite und ihr Quellcode sind unter der freien <a href="https://github.com/TheMoMStudio/swzpln.de/blob/main/LICENSE" target="_blank">GNU Affero General Public License v3.0</a> quelloffen lizenziert. Die Downloads (Schwarzpläne) werden soweit möglich lizenzlos bereitgestellt (<a target="_blank" href="https://creativecommons.org/publicdomain/zero/1.0/">CC0</a>). Die Rechte an
        den Kartendaten liegen bei den <a target="_blank" href="https://osm.org/copyright">OpenStreetMap</a>-Mitwirkenden. Soweit die Inhalte auf dieser Seite nicht vom Betreiber erstellt wurden, werden die Urheberrechte Dritter beachtet. Insbesondere werden Inhalte Dritter als solche gekennzeichnet. Sollten Sie trotzdem auf eine Urheberrechtsverletzung aufmerksam werden, bitten wir um einen entsprechenden Hinweis. Bei Bekanntwerden von Rechtsverletzungen werden wir derartige Inhalte umgehend entfernen.
        <br><br><h3>Datenschutz</h3><br><br>
        Die Nutzung unserer Webseite ist ohne Angabe personenbezogener Daten möglich. Ohne wenn und aber! <br>
        Wir weisen darauf hin, dass die Datenübertragung im Internet (z.B. bei der Kommunikation per E-Mail)
        Sicherheitslücken aufweisen kann. Ein lückenloser Schutz der Daten vor dem Zugriff durch Dritte ist nicht möglich. Weitere Informationen finden sich in der unten stehenden Datenschutzerklärung.
        <br>
        Zur Bereitstellung der Kartendaten, werden Koordinaten des gewählten Ausschnitts an die Overpass API von <a target="_blank" href="https://overpass.kumi.systems/">kumi.systems</a> übermittelt. Bei Nutzung der Suchfunktion
        wird der Suchbegriff an die <a href="https://nominatim.openstreetmaps.org/ui/about.html" target="_blank">Nominatim API</a> übermittelt.
        Die Vorschaukarte wird von <a href="https://openstreetmaps.org" target="_blank">openstreetmaps.org</a> heruntergeladen.
        Der Nutzung von im Rahmen der Impressumspflicht veröffentlichten Kontaktdaten durch Dritte zur Übersendung von nicht
        ausdrücklich angeforderter Werbung und Informationsmaterialien wird hiermit ausdrücklich widersprochen. Die
        Betreiber der Seiten behalten sich ausdrücklich rechtliche Schritte im Falle der unverlangten Zusendung von
        Werbeinformationen, etwa durch Spam-Mails, vor.<br>
    </p><br>
    Website Impressum teilweise von <a href="https://www.impressum-generator.de">impressum-generator.de</a>

    <p>Kartendaten: &copy;
        <?php echo date("Y"); ?> <a target="_blank" href="https://osm.org/copyright">OpenStreetMap</a> contributors
    </p>
    <p>Overpass-API bereitgestellt von <a target="_blank" href="https://overpass.kumi.systems/">kumi.systems</a></p>

    <p>Topographie-API bereitgestellt von <a target="_blank" href="https://opentopography.org">OpenTopography</a> mit Daten vom Copernicus 30m Digital Elevation Model. EO data provided under COPERNICUS by the European Union and ESA.</a></p>

    <h2 id="privacy">Datenschutzbestimmungen</h2>

<p>Datenschutz hat für uns einen besonders hohen Stellenwert. Eine Nutzung der Internetseite swzpln.de und opencitymaps.com ist generell ohne jede Angabe personenbezogener Daten möglich.</p>

<p>Mittels dieser Datenschutzerklärung möchten wir über Art, Umfang und Zweck der von uns erhobenen, genutzten und verarbeiteten Daten informieren. Es gelten die Rechte und Pflichten gemäß DS-GVO.</p>

<p>Wir haben als für die Verarbeitung Verantwortliche zahlreiche technische und organisatorische Maßnahmen umgesetzt, um einen möglichst lückenlosen Schutz der über diese Internetseite verarbeiteten Daten sicherzustellen. Dennoch können Internetbasierte Datenübertragungen grundsätzlich Sicherheitslücken aufweisen, sodass ein absoluter Schutz nicht gewährleistet werden kann.</p>

<h4>1. Begriffsbestimmungen</h4>
<p>Die Datenschutzerklärung von swzpln.de beruht auf den Begrifflichkeiten, die durch den Europäischen Richtlinien- und Verordnungsgeber beim Erlass der Datenschutz-Grundverordnung (DS-GVO) verwendet wurden.</p>

<h4>2. Name und Anschrift des für die Verarbeitung Verantwortlichen</h4>
<p>Verantwortlicher im Sinne der Datenschutz-Grundverordnung, sonstiger in den Mitgliedstaaten der Europäischen Union geltenden Datenschutzgesetze und anderer Bestimmungen mit datenschutzrechtlichem Charakter ist die:</p>

<p>swzpln.de</p>
<p>Wühlischstr. 20</p>
<p>10245 Berlin</p>
<p>Deutschland</p>
<p>E-Mail: swzpln@themom.studio</p>
<p>Website: swzpln.de, opencityplans.com</p>

<h4>3. Cookies</h4>
<p>Die Internetseiten verwenden Cookies. Cookies sind Textdateien, welche über einen Internetbrowser auf einem Computersystem abgelegt und gespeichert werden.</p>

<p>Zahlreiche Internetseiten und Server verwenden Cookies. Viele Cookies enthalten eine sogenannte Cookie-ID. Eine Cookie-ID ist eine eindeutige Kennung des Cookies. Sie besteht aus einer Zeichenfolge, durch welche Internetseiten und Server dem konkreten Internetbrowser zugeordnet werden können, in dem das Cookie gespeichert wurde. Dies ermöglicht es den besuchten Internetseiten und Servern, den individuellen Browser der betroffenen Person von anderen Internetbrowsern, die andere Cookies enthalten, zu unterscheiden. Ein bestimmter Internetbrowser kann über die eindeutige Cookie-ID wiedererkannt und identifiziert werden.</p>

<p>Durch den Einsatz von Cookies kann die swzpln.de den Nutzern dieser Internetseite nutzerfreundlichere Services bereitstellen, die ohne die Cookie-Setzung nicht möglich wären.</p>

<p>Mittels eines Cookies können die Informationen und Angebote auf unserer Internetseite im Sinne des Benutzers optimiert werden. Cookies ermöglichen uns, wie bereits erwähnt, die Benutzer unserer Internetseite wiederzuerkennen. Zweck dieser Wiedererkennung ist es, den Nutzern die Verwendung unserer Internetseite zu erleichtern.</p>

<p>Die betroffene Person kann die Setzung von Cookies durch unsere Internetseite jederzeit mittels einer entsprechenden Einstellung des genutzten Internetbrowsers verhindern und damit der Setzung von Cookies dauerhaft widersprechen. Ferner können bereits gesetzte Cookies jederzeit über einen Internetbrowser oder andere Softwareprogramme gelöscht werden. Dies ist in allen gängigen Internetbrowsern möglich. Deaktiviert die betroffene Person die Setzung von Cookies in dem genutzten Internetbrowser, sind unter Umständen nicht alle Funktionen unserer Internetseite vollumfänglich nutzbar.</p>

<p>
    Folgende Cookies werden gesetzt:
    - darkmode: true oder false: Speichert die Einstellung, ob de dunkle Version der Webseite aktiviert wurde
    - lastCenter: [latitude, longitude, zoom]: Speichert den letzten gesetzten Standort der Karte, um diesen bei neuem Laden wieder anzeigen zu können.
    - layers: [Liste mit true oder false Werten]: Speichert die zuletzt ausgewählten Ebenen, um diese bei neuem Laden wieder einstellen zu können.
    - privacy_accepted: true oder false: Speichert, ob die Datenschutzbestimmungen bereits akzeptiert wurden, um diese bei neuem Laden nicht nochmal abfragen zu müssen.
</p>

<h4>4. Erfassung von allgemeinen Daten und Informationen</h4>
<p>Die Internetseiten swzpln.de und opencitymaps.com erfassen mit jedem Aufruf der Internetseite durch eine betroffene Person oder ein automatisiertes System eine Reihe von allgemeinen Daten und Informationen. Diese allgemeinen Daten und Informationen werden in den Logfiles des Servers gespeichert. Erfasst werden können die (1) verwendeten Browsertypen und Versionen, (2) das vom zugreifenden System verwendete Betriebssystem, (3) die Internetseite, von welcher ein zugreifendes System auf unsere Internetseite gelangt (sogenannte Referrer), (4) die Unterwebseiten, welche über ein zugreifendes System auf unserer Internetseite angesteuert werden, (5) das Datum und die Uhrzeit eines Zugriffs auf die Internetseite, (6) eine Internet-Protokoll-Adresse (IP-Adresse), (7) der Internet-Service-Provider des zugreifenden Systems und (8) sonstige ähnliche Daten und Informationen, die der Gefahrenabwehr im Falle von Angriffen auf unsere informationstechnologischen Systeme dienen.</p>

<p>Bei der Nutzung dieser allgemeinen Daten und Informationen zieht die swzpln.de keine Rückschlüsse auf die betroffene Person. Diese Informationen werden vielmehr benötigt, um (1) die Inhalte unserer Internetseite korrekt auszuliefern, (2) die Inhalte unserer Internetseite zu optimieren, (3) die dauerhafte Funktionsfähigkeit unserer informationstechnologischen Systeme und der Technik unserer Internetseite zu gewährleisten sowie (4) um Strafverfolgungsbehörden im Falle eines Cyberangriffes die zur Strafverfolgung notwendigen Informationen bereitzustellen. Diese anonym erhobenen Daten und Informationen werden durch swzpln.de daher nur mit dem Ziel ausgewertet, den Datenschutz und die Datensicherheit zu erhöhen, um letztlich ein optimales Schutzniveau für die von uns verarbeiteten personenbezogenen Daten sicherzustellen. Die anonymen Daten der Server-Logfiles werden getrennt von allen durch eine betroffene Person angegebenen personenbezogenen Daten gespeichert.</p>

<p>Wir verpflichten uns diese Daten nach maximal 24 Stunden vollständig zu löschen.</p>

<h4>5. Kontaktmöglichkeit über die Internetseite</h4>
<p>Die Internetseiten enthalten aufgrund von gesetzlichen Vorschriften Angaben, die eine schnelle elektronische Kontaktaufnahme, sowie eine unmittelbare Kommunikation mit uns ermöglichen, was ebenfalls eine allgemeine Adresse der sogenannten elektronischen Post (E-Mail-Adresse) umfasst. Sofern eine betroffene Person per E-Mail den Kontakt mit dem für die Verarbeitung Verantwortlichen aufnimmt, werden die von der betroffenen Person übermittelten personenbezogenen Daten automatisch gespeichert. Solche auf freiwilliger Basis von einer betroffenen Person an den für die Verarbeitung Verantwortlichen übermittelten personenbezogenen Daten werden für Zwecke der Bearbeitung oder der Kontaktaufnahme zur betroffenen Person gespeichert. Es erfolgt keine Weitergabe dieser personenbezogenen Daten an Dritte.</p>

<h4>6. Routinemäßige Löschung und Sperrung von personenbezogenen Daten</h4>
<p>Der für die Verarbeitung Verantwortliche verarbeitet und speichert personenbezogene Daten der betroffenen Person nur für den Zeitraum, der zur Erreichung des Speicherungszwecks erforderlich ist oder sofern dies durch den Europäischen Richtlinien- und Verordnungsgeber oder einen anderen Gesetzgeber in Gesetzen oder Vorschriften, welchen der für die Verarbeitung Verantwortliche unterliegt, vorgesehen wurde.</p>

<p>Entfällt der Speicherungszweck oder läuft eine vom Europäischen Richtlinien- und Verordnungsgeber oder einem anderen zuständigen Gesetzgeber vorgeschriebene Speicherfrist ab, werden die personenbezogenen Daten routinemäßig und entsprechend den gesetzlichen Vorschriften gesperrt oder gelöscht.</p>

<h4>7. Externe Diensteanbieter</h4>
<p>Bei der Nutzung von SWZPLN werden Daten von externen Servern übertragen. Es gelten die jeweiligen Datenschutzbestimmungen der Unternehmen. Bei der Auswahl der Unternehmen wurde auf einen rigorosen Datenschutz geachtet.</p>
<p>Die Vorschaukarte wird von <b>openstreetmaps.org</b> heruntergeladen. Die Suchfunktion nutzt die <b>Nominatim API</b>. <a href="https://wiki.osmfoundation.org/wiki/Privacy_Policy" target="_blank">Datenschutzbestimmungen. (extern)</a></p>
<p>Die verarbeiteten Kartendaten werden von der <b>Overpass-API von kumi.systems</b> geladen. <a href="https://overpass.kumi.systems/" target="_blank">Datenschutzbestimmungen. (extern)</a></p>
<p>Topographie-API bereitgestellt von <a target="_blank" href="https://opentopography.org">OpenTopography </a> mit Daten vom Copernicus 30m Digital Elevation Model. EO data provided under COPERNICUS by the European Union and ESA.</a></p>


<p>Teilweise entwickelt von den <a href="https://willing-able.com/">Legal Tech</a> Spezialisten von Willing & Able, die auch das System für datenschutzrechtlich durchdachte und  <a href="https://abletotrack.com/">gesetzeskonforme Zeiterfassung</a> entwickelt haben. Die Texte des Datenschutzerklärungs-Generators wurden von <a href="https://dg-datenschutz.de/">Prof. Dr. h.c. Heiko Jonny Maniero</a> und Rechtsanwalt <a href="https://www.wbs-law.de/" rel="nofollow">Christian Solmecke</a> erstellt und publiziert.</p>



    <?php
    if (!$isAjax) {
        echo "</body>";
    }

    die();
    ?>
