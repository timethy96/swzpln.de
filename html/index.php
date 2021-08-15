<?php

$lang = 'de';

$count = 0;

$fr = fopen('count.txt', 'r');
if ($fr) {
    $count = intval(fgets($fr));
    fclose($fr);
}

?>
<!DOCTYPE html>
<html lang="<?php echo $lang; ?>">
<head>
    <meta charset="utf-8">

    <title>SWZ PLN | Schwarzplan - Generator</title>
    <meta name="description" content="Auf dieser Webseite kannst du dir mit einem Klick kostenlos beliebig viele Schwarzpl&auml;ne von &uuml;berall erstellen. Und wir sammeln nicht einmal deine Daten!">
    <meta name="author" content="Timo Bilhöfer">
    <meta name="viewport" content="width=device-width, initial-scale=1">

    <link rel="apple-touch-icon" sizes="180x180" href="/apple-touch-icon.png">
    <link rel="icon" type="image/png" sizes="32x32" href="/favicon-32x32.png">
    <link rel="icon" type="image/png" sizes="16x16" href="/favicon-16x16.png">
    <link rel="manifest" href="/site.webmanifest">
    <link rel="mask-icon" href="/safari-pinned-tab.svg" color="#000000">
    <meta name="msapplication-TileColor" content="#000000">
    <meta name="theme-color" content="#ffffff">

    <meta property="og:image:height" content="1257">
    <meta property="og:image:width" content="2400">
    <meta property="og:description" content="Auf dieser Webseite kannst du dir mit einem Klick kostenlos beliebig viele Schwarzpl&auml;ne von &uuml;berall erstellen. Und wir sammeln nicht einmal deine Daten!">
    <meta property="og:url" content="https://swzpln.de">
    <meta property="og:image" content="https://swzpln.de/og-image.jpg">
    <meta property="og:title" content="swzpln.de | Schwarzplan - Generator">

    <link rel="stylesheet" href="css/styles.css?v=<?php echo filemtime('css/styles.css') ?>">
    <link rel="stylesheet" href="https://unpkg.com/leaflet@1.7.1/dist/leaflet.css" integrity="sha512-xodZBNTC5n17Xt2atTPuE1HxjVMSvLVW9ocqUKLsCC5CXdbqCmblAshOMAS6/keqq/sMZMZ19scR4PsZChSR7A==" crossorigin=""/>

</head>

<body>
    <a href="https://rundgaenge.com" target="_blank" id="rundgaenge">Uni Stuttgart Arch Rundgänge</a>
    <div class="spacer"></div>
    <div id="main">
        <div id="title">
            <h1><img id="logoimg" src="logo.png" alt="SWZ PLN"/></h1>
            <h2>Schwarzpläne für alle!<br/>(<a target="_blank" class="blacklink" href="https://github.com/TheMoMStudio/swzpln.de/releases">Beta3 : jetzt hyperspeed durch web-worker</a>)</h2>
        </div>
        <form id="searchForm">
          <input type="text" id="searchField" placeholder="Ort suchen...">
        </form>
        <div id="map">
        </div>
        <div id="buttons">
            <a href="javascript:" id="svgButton" class="cButtons">SVG</a>
            <a href="javascript:" id="dwgButton" class="cButtons">DWG/DXF</a>
            <a href="javascript:" id="pdfButton" class="cButtons">PDF</a>
        </div>
        <div id="processing" class="hidden">
            <div id="sbBorder">
                <div id="sBar"></div>
            </div>
            <p id="statusPercent">0</p>
            <p id="statusStep">Laden...</p>
        </div>
        <div id="finish" class="hidden">
            <p>Download wird in wenigen Sekunden gestartet. Falls nicht, bitte <a id="dllink" href="javascript:">Download starten</a> klicken!</p>
            <br/>
            <a id="backlink" href="javascript:">> Weiteren Schwarzplan erstellen <</a>
            <br/>
            <br/>
            <p>Wenn ihr uns bei der Instandhaltung und Entwicklung dieses Angebots unterstützen wollt, freuen wir uns natürlich sehr über eine <a href="https://paypal.me/timothy96" target="_blank">Spende</a>.</p>
            <p>Bereits über <?php echo $count ?> generierte Schwarzpläne!</p>
            <p>&copy; <?php echo date("Y"); ?> <span class="logo">SWZPLN</span> erstellt in Stuttgart von <a target="_blank" href="https://timo.bilhoefer.de">Timo Bilhöfer</a>, <a target="_blank" href="https://themom.studio">The MoM Studio</a>.
        </div>
    </div>
    <div id="scrollArrow">&#8964;</div>
    <div id="legend">
        <h2>SCHWARZPLAN GENERIEREN</h2>
        <p>Die Karte auf den gewünschten Ausschnitt zentrieren, das gewünschte Dateiformat auswählen und schon wird der Schwarzplan generiert und automatisch heruntergeladen.<br/>SVG und PDF-Dateien sind im Maßstab 1:1000 (eine Einstellungsmöglichkeit ist in Planung), DWG/DXF-Dateien sind in Meter definiert (1 Unit = 1 Meter).</p>
        <p>Die kostenlose und freie Bereitstellung von Informationen, Know-How und Inhalten ist uns ein grundsätzliches Anliegen! Wenn ihr uns bei der Instandhaltung und Entwicklung dieses Angebots unterstützen wollt, freuen wir uns natürlich sehr über eine <a href="https://paypal.me/timothy96" target="_blank">Spende</a>.</p>
        <p>Übrigens: Der Schwarzplan wird über JavaScript lokal auf deinem Computer erstellt, es werden keine Daten an SWZPLN geschickt. Lediglich die Koordinaten des Ausschnitts werden an die  OpenStreetMaps Overpass-API versendet, die die nötigen  Karteninformationen bereitstellt.</p>
        <p>Bereits über <?php echo $count ?> generierte Schwarzpläne!</p>
        <p>&copy; <?php echo date("Y"); ?> <span class="logo">SWZPLN</span> erstellt in Stuttgart von <a target="_blank" href="https://timo.bilhoefer.de">Timo Bilhöfer</a>, <a target="_blank" href="https://themom.studio">The MoM Studio</a>.</p>
        <p>Diese Webseite ist Quelloffen und unter der <a href="https://github.com/TheMoMStudio/swzpln.de/blob/main/LICENSE" target="_blank">AGPL-3 Lizenz</a> veröffentlicht.</p>
        <div id="lFooter">
            <a href="https://github.com/TheMoMStudio/swzpln.de" target="_blank">GITHUB</a>
            <a id="openLegal" href="javascript:">IMPRESSUM</a>
        </div>
    </div>
    <div id="legal">
        <a id="closeLegal" href="javascript:">x</a>
        <h2>Impressum</h2><p>Angaben gemäß § 5 TMG</p><p>Timo Bilhöfer <br> 
        Boslerstraße 19<br> 
        70188 Stuttgart <br><br/>
        E-Mail: swzpln ø bilhoefer · de</br></p><p><strong>Haftungsausschluss: </strong><br><br><strong>Haftung für Inhalte</strong><br><br>
        Die Inhalte unserer Seiten wurden mit größter Sorgfalt erstellt. Für die Richtigkeit, Vollständigkeit und Aktualität der Inhalte können wir jedoch keine Gewähr übernehmen. Als Diensteanbieter sind wir gemäß § 7 Abs.1 TMG für eigene Inhalte auf diesen Seiten nach den allgemeinen Gesetzen verantwortlich. Nach §§ 8 bis 10 TMG sind wir als Diensteanbieter jedoch nicht verpflichtet, übermittelte oder gespeicherte fremde Informationen zu überwachen oder nach Umständen zu forschen, die auf eine rechtswidrige Tätigkeit hinweisen. Verpflichtungen zur Entfernung oder Sperrung der Nutzung von Informationen nach den allgemeinen Gesetzen bleiben hiervon unberührt. Eine diesbezügliche Haftung ist jedoch erst ab dem Zeitpunkt der Kenntnis einer konkreten Rechtsverletzung möglich. Bei Bekanntwerden von entsprechenden Rechtsverletzungen werden wir diese Inhalte umgehend entfernen.<br><br><strong>Haftung für Links</strong><br><br>
        Unser Angebot enthält Links zu externen Webseiten Dritter, auf deren Inhalte wir keinen Einfluss haben. Deshalb können wir für diese fremden Inhalte auch keine Gewähr übernehmen. Für die Inhalte der verlinkten Seiten ist stets der jeweilige Anbieter oder Betreiber der Seiten verantwortlich. Die verlinkten Seiten wurden zum Zeitpunkt der Verlinkung auf mögliche Rechtsverstöße überprüft. Rechtswidrige Inhalte waren zum Zeitpunkt der Verlinkung nicht erkennbar. Eine permanente inhaltliche Kontrolle der verlinkten Seiten ist jedoch ohne konkrete Anhaltspunkte einer Rechtsverletzung nicht zumutbar. Bei Bekanntwerden von Rechtsverletzungen werden wir derartige Links umgehend entfernen.<br><br><strong>Urheberrecht</strong><br><br>
        Die Webseite und ihr Quellcode sind unter der freien <a href="https://github.com/TheMoMStudio/swzpln.de/blob/main/LICENSE" target="_blank">GNU Affero General Public License v3.0</a> quelloffen lizenziert. Die Downloads (Schwarzpläne) werden soweit möglich lizenzlos bereitgestellt (<a target="_blank" href="https://creativecommons.org/publicdomain/zero/1.0/">CC0</a>). Die Rechte an den Kartendaten liegen bei den <a target="_blank" href="https://osm.org/copyright">OpenStreetMap</a>-Mitwirkenden. Soweit die Inhalte auf dieser Seite nicht vom Betreiber erstellt wurden, werden die Urheberrechte Dritter beachtet. Insbesondere werden Inhalte Dritter als solche gekennzeichnet. Sollten Sie trotzdem auf eine Urheberrechtsverletzung aufmerksam werden, bitten wir um einen entsprechenden Hinweis. Bei Bekanntwerden von Rechtsverletzungen werden wir derartige Inhalte umgehend entfernen.<br><br><strong>Datenschutz</strong><br><br>
        Die Nutzung unserer Webseite ist ohne Angabe personenbezogener Daten möglich. Ohne wenn und aber! <br>
        Wir weisen darauf hin, dass die Datenübertragung im Internet (z.B. bei der Kommunikation per E-Mail) Sicherheitslücken aufweisen kann. Ein lückenloser Schutz der Daten vor dem Zugriff durch Dritte ist nicht möglich. <br>
        Der Nutzung von im Rahmen der Impressumspflicht veröffentlichten Kontaktdaten durch Dritte zur Übersendung von nicht ausdrücklich angeforderter Werbung und Informationsmaterialien wird hiermit ausdrücklich widersprochen. Die Betreiber der Seiten behalten sich ausdrücklich rechtliche Schritte im Falle der unverlangten Zusendung von Werbeinformationen, etwa durch Spam-Mails, vor.<br>
        </p><br> 
        Website Impressum teilweise von <a href="https://www.impressum-generator.de">impressum-generator.de</a>
 
        <p>Kartendaten: &copy; <?php echo date("Y"); ?> <a target="_blank" href="https://osm.org/copyright">OpenStreetMap</a> contributors</p>
        <p>Overpass-API bereitgestellt von <a target="_blank" href="https://overpass.kumi.systems/">kumi.systems</a></p>
        <br/><br/><br/><br/>

    </div>
    <div id="tempsvg"></div>
    <script src="js/jquery-3.5.1.min.js"></script>
    <script src="https://unpkg.com/leaflet@1.7.1/dist/leaflet.js" integrity="sha512-XQoYMqMTK8LvdxXYG3nZ448hOEQiglfqkJs1NOQV44cWnUrBc8PkAOcXy20w0vlaXaVUearIOBhiXZ5V3ynxwA==" crossorigin=""></script>
    <script src="https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.0.0/jspdf.umd.min.js" integrity="sha512-g77bZKU4ktH2I5nNioWzOMcbd3fN/svB0vQM73Uo5GRn/EGfcSJB0DlR1ithxnFsDaa0HmlOwHYiUFeM1P3RRw==" crossorigin="anonymous"></script>
    <script type="application/javascript" src="https://cdn.jsdelivr.net/npm/js-cookie@3.0.0/dist/js.cookie.min.js"></script>
    <script src="js/svg2pdf.umd.min.js"></script>
    <script src="js/subworkers.js"></script>
    <script src="js/main.js"></script>
</body>
</html>

<?php