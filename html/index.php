<?php

$lang = 'de';

$count = 0;

$count = file_get_contents("https://swzpln.de/counter/");

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

    <script>
        function unScramble(eMail1,eMail2,linkText,subjectText,statusText){
        var a,b,c,d,e;a=eMail1;c=linkText;b=eMail2.substring(0,eMail2.length-6);
        if(subjectText!=""){d="?subject="+escape(subjectText);}else{d="";}
        if(statusText!=""){e=" onMouseOver=\"top.status=\'"+statusText+
        "\'\;return true\;\" onMouseOut=\"top.status=\'\'\;return true\;\"";}else{e="";}
        document.write("<A HREF=\"mai"+"lto:"+a+"@"+b+d+"\""+e+">"+c+"</A>");}
    </script> 

</head>

<body>
    <a href="https://synästhetische-ki.de" target="_blank" id="info_banner">Synästhetische Künstliche Intelligenz</a>
    <div class="spacer"></div>
    <div id="main">
        <div id="title">
            <a class="backlinks" href="javascript:"><h1><img id="logoimg" src="logo.png" alt="SWZ PLN"/></h1></a>
            <h2>Schwarzpläne für alle!<br/>(<a target="_blank" class="blacklink" href="https://github.com/TheMoMStudio/swzpln.de/releases">Beta5.1 :</a> Jetzt auch auf <a href="https://pläne.io" style="text-decoration:underline;color:black;">pläne.io</a>)</h2>
        </div>
        <form id="searchForm" data-ajax="false">
          <input type="text" id="searchField" placeholder="Ort suchen..." autocomplete="off">
        </form>
        <div id="mapCont">           
            <div id="options">
                <ul>
                    <li>
                        <input type="checkbox" class="layerCheckbox" value="buildings" id="oBuildings" checked disabled /><label for="oBuildings" class="layerLabel" id="lBuildings"><span class="tooltiptext">Gebäude</span></label>
                    </li>
                    <li>
                        <input type="checkbox" class="layerCheckbox" value="green" id="oGreen" /><label for="oGreen" class="layerLabel" id="lGreen"><span class="tooltiptext">Grünflächen</span></label>
                    </li>
                    <li>
                        <input type="checkbox" class="layerCheckbox" value="water" id="oWater" /><label for="oWater" class="layerLabel" id="lWater"><span class="tooltiptext">Wasserflächen</span></label>
                    </li>
                    <li>
                        <input type="checkbox" class="layerCheckbox" value="forest" id="oForest" /><label for="oForest" class="layerLabel" id="lForest"><span class="tooltiptext">Waldflächen</span></label>
                    </li>
                    <li>
                        <input type="checkbox" class="layerCheckbox" value="farmland" id="oFarmland" /><label for="oFarmland" class="layerLabel" id="lFarmland"><span class="tooltiptext">Landwirtschaft</span></label>
                    </li>
                    <li>
                        <input type="checkbox" class="layerCheckbox" value="highways" id="oHighways" disabled /><label for="oHighways" class="layerLabel" id="lHighways"><span class="tooltiptext">Straßen<br />(in Arbeit)</span></label>
                    </li>
                    <li>
                        <input type="checkbox" class="layerCheckbox" value="railway" id="oRailway" disabled /><label for="oRailway" class="layerLabel" id="lRailway"><span class="tooltiptext">Schienen<br />(in Arbeit)</span></label>
                    </li>
                    <li>
                        <input type="checkbox" class="layerCheckbox" value="contours" id="oContours" disabled /><label for="oContours" class="layerLabel" id="lContours"><span class="tooltiptext">Höhenlinien<br />(in Arbeit)</span></label>
                    </li>
                </ul>
            </div>
            <div id="map">
            </div>
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
            <a class="backlinks" href="javascript:">> Weiteren Schwarzplan erstellen <</a>
            <br/>
            <br/>
            <p>Wenn ihr uns bei der Instandhaltung und Entwicklung dieses Angebots, sowie bei den monatlich anfallenden Serverkosten unterstützen wollt, freuen wir uns natürlich sehr über eine Spende. <form action="https://www.paypal.com/donate" method="post" target="_top" style="width:86px;width:fit-content;margin:5px auto;display:block;"><input type="hidden" name="hosted_button_id" value="P3L3M55U4WBT8" /><input type="image" src="/img/paypal-large.png" width="100px" border="0" name="submit" title="PayPal - The safer, easier way to pay online!" alt="Donate with PayPal button" /></form></p>
            <p>Bereits über <?php echo $count ?> generierte Schwarzpläne!</p>
            <p>&copy; <?php echo date("Y"); ?> <span class="logo">SWZPLN</span> erstellt in Stuttgart von <a target="_blank" href="https://timo.bilhoefer.de">Timo Bilhöfer</a>, <a target="_blank" href="https://themom.studio">The MoM Studio</a>.
        </div>
    </div>
    <div id="scrollArrow">&#8964;</div>
    <div id="legend">
        <h2>SCHWARZPLAN GENERIEREN</h2>
        <p>Die Karte auf den gewünschten Ausschnitt zentrieren, das gewünschte Dateiformat auswählen und schon wird der Schwarzplan generiert und automatisch heruntergeladen.<br/>SVG und PDF-Dateien sind im Maßstab 1:1000 (eine Einstellungsmöglichkeit ist in Planung), DWG/DXF-Dateien sind in Meter definiert (1 Unit = 1 Meter).</p>
        <p>Die kostenlose und freie Bereitstellung von Informationen, Know-How und Inhalten ist uns ein grundsätzliches Anliegen! Wenn ihr uns bei der Instandhaltung und Entwicklung dieses Angebots, sowie bei den monatlich anfallenden Serverkosten unterstützen wollt, freuen wir uns natürlich sehr über eine Spende. <form action="https://www.paypal.com/donate" method="post" target="_top" style="width:86px;width:fit-content;margin:5px auto;display:block;"><input type="hidden" name="hosted_button_id" value="P3L3M55U4WBT8" /><input type="image" src="/img/paypal-small.png" width="100px" border="0" name="submit" title="PayPal - The safer, easier way to pay online!" alt="Donate with PayPal button" /></form></p>
        <p>Übrigens: Der Schwarzplan wird über JavaScript lokal auf deinem Computer erstellt, es werden keine Daten an SWZPLN geschickt. Lediglich die Koordinaten des Ausschnitts werden an die OpenStreetMaps Overpass-API versendet, die die nötigen  Karteninformationen bereitstellt. Bei Nutzung der Suchfunktion wird der Suchbegriff an die Nominatim API übermittelt.</p>
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
        Rötestraße 10B<br> 
        70197 Stuttgart <br><br/>
        E-Mail: <script>unScramble("swzpln","theMoM.studiodazzle","swzpln ø theMoM · studio","","");</script><noscript>swzpln ø theMoM · studio</noscript></br></p><p><strong>Haftungsausschluss: </strong><br><br><strong>Haftung für Inhalte</strong><br><br>
        Die Inhalte unserer Seiten wurden mit größter Sorgfalt erstellt. Für die Richtigkeit, Vollständigkeit und Aktualität der Inhalte können wir jedoch keine Gewähr übernehmen. Als Diensteanbieter sind wir gemäß § 7 Abs.1 TMG für eigene Inhalte auf diesen Seiten nach den allgemeinen Gesetzen verantwortlich. Nach §§ 8 bis 10 TMG sind wir als Diensteanbieter jedoch nicht verpflichtet, übermittelte oder gespeicherte fremde Informationen zu überwachen oder nach Umständen zu forschen, die auf eine rechtswidrige Tätigkeit hinweisen. Verpflichtungen zur Entfernung oder Sperrung der Nutzung von Informationen nach den allgemeinen Gesetzen bleiben hiervon unberührt. Eine diesbezügliche Haftung ist jedoch erst ab dem Zeitpunkt der Kenntnis einer konkreten Rechtsverletzung möglich. Bei Bekanntwerden von entsprechenden Rechtsverletzungen werden wir diese Inhalte umgehend entfernen.<br><br><strong>Haftung für Links</strong><br><br>
        Unser Angebot enthält Links zu externen Webseiten Dritter, auf deren Inhalte wir keinen Einfluss haben. Deshalb können wir für diese fremden Inhalte auch keine Gewähr übernehmen. Für die Inhalte der verlinkten Seiten ist stets der jeweilige Anbieter oder Betreiber der Seiten verantwortlich. Die verlinkten Seiten wurden zum Zeitpunkt der Verlinkung auf mögliche Rechtsverstöße überprüft. Rechtswidrige Inhalte waren zum Zeitpunkt der Verlinkung nicht erkennbar. Eine permanente inhaltliche Kontrolle der verlinkten Seiten ist jedoch ohne konkrete Anhaltspunkte einer Rechtsverletzung nicht zumutbar. Bei Bekanntwerden von Rechtsverletzungen werden wir derartige Links umgehend entfernen.<br><br><strong>Urheberrecht</strong><br><br>
        Die Webseite und ihr Quellcode sind unter der freien <a href="https://github.com/TheMoMStudio/swzpln.de/blob/main/LICENSE" target="_blank">GNU Affero General Public License v3.0</a> quelloffen lizenziert. Die Downloads (Schwarzpläne) werden soweit möglich lizenzlos bereitgestellt (<a target="_blank" href="https://creativecommons.org/publicdomain/zero/1.0/">CC0</a>). Die Rechte an den Kartendaten liegen bei den <a target="_blank" href="https://osm.org/copyright">OpenStreetMap</a>-Mitwirkenden. Soweit die Inhalte auf dieser Seite nicht vom Betreiber erstellt wurden, werden die Urheberrechte Dritter beachtet. Insbesondere werden Inhalte Dritter als solche gekennzeichnet. Sollten Sie trotzdem auf eine Urheberrechtsverletzung aufmerksam werden, bitten wir um einen entsprechenden Hinweis. Bei Bekanntwerden von Rechtsverletzungen werden wir derartige Inhalte umgehend entfernen.<br><br><strong>Datenschutz</strong><br><br>
        Die Nutzung unserer Webseite ist ohne Angabe personenbezogener Daten möglich. Ohne wenn und aber! <br>
        Wir weisen darauf hin, dass die Datenübertragung im Internet (z.B. bei der Kommunikation per E-Mail) Sicherheitslücken aufweisen kann. Ein lückenloser Schutz der Daten vor dem Zugriff durch Dritte ist nicht möglich. <br>
        Zur Bereitstellung der Kartendaten, werden Koordinaten des gewählten Ausschnitts an die Overpass API von <a target="_blank" href="https://overpass.kumi.systems/">kumi.systems</a> übermittelt. Bei Nutzung der Suchfunktion wird der Suchbegriff an die <a href="https://nominatim.openstreetmaps.org/ui/about.html" target="_blank">Nominatim API</a> übermittelt.
        Der Nutzung von im Rahmen der Impressumspflicht veröffentlichten Kontaktdaten durch Dritte zur Übersendung von nicht ausdrücklich angeforderter Werbung und Informationsmaterialien wird hiermit ausdrücklich widersprochen. Die Betreiber der Seiten behalten sich ausdrücklich rechtliche Schritte im Falle der unverlangten Zusendung von Werbeinformationen, etwa durch Spam-Mails, vor.<br>
        </p><br> 
        Website Impressum teilweise von <a href="https://www.impressum-generator.de">impressum-generator.de</a>
 
        <p>Kartendaten: &copy; <?php echo date("Y"); ?> <a target="_blank" href="https://osm.org/copyright">OpenStreetMap</a> contributors</p>
        <p>Overpass-API bereitgestellt von <a target="_blank" href="https://overpass.kumi.systems/">kumi.systems</a></p>
        <p>PayPal-Button von <a target="_blank" href="https://www.pngall.com/?p=6289">pngall.com</a></p>
        <p>House by Rahman Haryanto from the Noun Project</p>
        <p>grass by Zulfa Mahendra from the Noun Project</p>
        <p>wave by Ahmad Arzaha from the Noun Project</p>
        <p>Tree by Saideep Karipalli from the Noun Project</p>
        <p>Wheat by Bohdan Burmich from the Noun Project</p>
        <p>Highway by StringLabs from the Noun Project</p>
        <p>railway by KP Arts from the Noun Project</p>
        <br/><br/><br/><br/>

    </div>
    <div id="tempsvg"></div>
    <script src="js/jquery-3.5.1.min.js"></script>
    <script src="https://unpkg.com/leaflet@1.7.1/dist/leaflet.js" integrity="sha512-XQoYMqMTK8LvdxXYG3nZ448hOEQiglfqkJs1NOQV44cWnUrBc8PkAOcXy20w0vlaXaVUearIOBhiXZ5V3ynxwA==" crossorigin=""></script>
    <script src="https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.0.0/jspdf.umd.min.js" integrity="sha512-g77bZKU4ktH2I5nNioWzOMcbd3fN/svB0vQM73Uo5GRn/EGfcSJB0DlR1ithxnFsDaa0HmlOwHYiUFeM1P3RRw==" crossorigin="anonymous"></script>
    <script type="application/javascript" src="https://cdn.jsdelivr.net/npm/js-cookie@3.0.0/dist/js.cookie.min.js"></script>
    <script src="js/svg2pdf.umd.min.js"></script>
    <script src="js/subworkers.js"></script>
    <script src="js/main.js?v=<?php echo filemtime('js/main.js') ?>"></script>
</body>
</html>

<?php