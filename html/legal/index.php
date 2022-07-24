<?php
$isAjax = isset($_SERVER['HTTP_X_REQUESTED_WITH']) AND
strtolower($_SERVER['HTTP_X_REQUESTED_WITH']) === 'xmlhttprequest';
if(!$isAjax) {  
    ?>
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no">
    <meta http-equiv="X-UA-Compatible" content="ie=edge">

    <title>swzpln.de | Impressum</title>

    <meta name="title" content="swzpln.de | Impressum"/>
    <meta name="author" content="Timo Bilhöfer"/>
    <meta name="publisher" content="Timo Bilhöfer"/>
    <meta name="copyright" content="Timo Bilhöfer <?php echo date("Y"); ?>"/>
    <meta name="robots" content="NOINDEX"/>
    <meta name="language" http-equiv="content-language" content="de"/>
</head>
<body>
    <?php
}
?>
<h2>Impressum</h2>
<p>Angaben gemäß § 5 TMG</p>
<p>Timo Bilhöfer <br>
    Rötestraße 10B<br>
    70197 Stuttgart <br><br />
    E-Mail: swzpln ø theMoM · studio
</p>
<p><strong>Haftungsausschluss: </strong><br><br><strong>Haftung für Inhalte</strong><br><br>
    Die Inhalte unserer Seiten wurden mit größter Sorgfalt erstellt. Für die Richtigkeit, Vollständigkeit und Aktualität
    der Inhalte können wir jedoch keine Gewähr übernehmen. Als Diensteanbieter sind wir gemäß § 7 Abs.1 TMG für eigene
    Inhalte auf diesen Seiten nach den allgemeinen Gesetzen verantwortlich. Nach §§ 8 bis 10 TMG sind wir als
    Diensteanbieter jedoch nicht verpflichtet, übermittelte oder gespeicherte fremde Informationen zu überwachen oder
    nach Umständen zu forschen, die auf eine rechtswidrige Tätigkeit hinweisen. Verpflichtungen zur Entfernung oder
    Sperrung der Nutzung von Informationen nach den allgemeinen Gesetzen bleiben hiervon unberührt. Eine diesbezügliche
    Haftung ist jedoch erst ab dem Zeitpunkt der Kenntnis einer konkreten Rechtsverletzung möglich. Bei Bekanntwerden
    von entsprechenden Rechtsverletzungen werden wir diese Inhalte umgehend entfernen.<br><br><strong>Haftung für
        Links</strong><br><br>
    Unser Angebot enthält Links zu externen Webseiten Dritter, auf deren Inhalte wir keinen Einfluss haben. Deshalb
    können wir für diese fremden Inhalte auch keine Gewähr übernehmen. Für die Inhalte der verlinkten Seiten ist stets
    der jeweilige Anbieter oder Betreiber der Seiten verantwortlich. Die verlinkten Seiten wurden zum Zeitpunkt der
    Verlinkung auf mögliche Rechtsverstöße überprüft. Rechtswidrige Inhalte waren zum Zeitpunkt der Verlinkung nicht
    erkennbar. Eine permanente inhaltliche Kontrolle der verlinkten Seiten ist jedoch ohne konkrete Anhaltspunkte einer
    Rechtsverletzung nicht zumutbar. Bei Bekanntwerden von Rechtsverletzungen werden wir derartige Links umgehend
    entfernen.<br><br><strong>Urheberrecht</strong><br><br>
    Die Webseite und ihr Quellcode sind unter der freien <a
        href="https://github.com/TheMoMStudio/swzpln.de/blob/main/LICENSE" target="_blank">GNU Affero General Public
        License v3.0</a> quelloffen lizenziert. Die Downloads (Schwarzpläne) werden soweit möglich lizenzlos
    bereitgestellt (<a target="_blank" href="https://creativecommons.org/publicdomain/zero/1.0/">CC0</a>). Die Rechte an
    den Kartendaten liegen bei den <a target="_blank" href="https://osm.org/copyright">OpenStreetMap</a>-Mitwirkenden.
    Soweit die Inhalte auf dieser Seite nicht vom Betreiber erstellt wurden, werden die Urheberrechte Dritter beachtet.
    Insbesondere werden Inhalte Dritter als solche gekennzeichnet. Sollten Sie trotzdem auf eine Urheberrechtsverletzung
    aufmerksam werden, bitten wir um einen entsprechenden Hinweis. Bei Bekanntwerden von Rechtsverletzungen werden wir
    derartige Inhalte umgehend entfernen.<br><br><strong>Datenschutz</strong><br><br>
    Die Nutzung unserer Webseite ist ohne Angabe personenbezogener Daten möglich. Ohne wenn und aber! <br>
    Wir weisen darauf hin, dass die Datenübertragung im Internet (z.B. bei der Kommunikation per E-Mail)
    Sicherheitslücken aufweisen kann. Ein lückenloser Schutz der Daten vor dem Zugriff durch Dritte ist nicht möglich.
    <br>
    Zur Bereitstellung der Kartendaten, werden Koordinaten des gewählten Ausschnitts an die Overpass API von <a
        target="_blank" href="https://overpass.kumi.systems/">kumi.systems</a> übermittelt. Bei Nutzung der Suchfunktion
    wird der Suchbegriff an die <a href="https://nominatim.openstreetmaps.org/ui/about.html" target="_blank">Nominatim
        API</a> übermittelt.
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

<?php
if(!$isAjax) {
    echo "</body>";
}

die();
?>