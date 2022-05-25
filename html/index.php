<?php
require('php/functions.php');

$langs = ['de', 'en'];
$userLang = substr($_SERVER['HTTP_ACCEPT_LANGUAGE'], 0, 2);
$l = in_array($userLang, $langs) ? $userLang : 'en';

$la = getTranslations($l); // var $la and $l get read by translation-functions

if (isset($_COOKIE['darkmode'])){
  $darkmode = filter_var(clean($_COOKIE['darkmode']), FILTER_VALIDATE_BOOLEAN);
} else {
  if (date('H') > 19 || date('H') < 7) {
    $darkmode = true;
  } else {
    $darkmode = false;
  }
}

?>
<!DOCTYPE html>
<html lang="<?php echo $l; ?>">

<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta http-equiv="X-UA-Compatible" content="ie=edge">

  <title>swzpln.de</title>

  <link rel="stylesheet" href="/css/reset.css">
  <?php
  if ($darkmode){
   echo '<link rel="stylesheet" href="/css/colors.dark.css" id="colors">';
  } else {
    echo '<link rel="stylesheet" href="/css/colors.light.css" id="colors">';
  }
  if ($_SERVER['SERVER_NAME'] != 'localhost') {
    echo '<link rel="stylesheet" href="/css/style.css">'; // only use prefixed css on production servers
  } else {
    echo '<link rel="stylesheet" href="/css/style.css">';
  };
  ?>

  <link rel="stylesheet" href="/js/leaflet/leaflet.css">

</head>

<body>
  <div id="main">
    <header>
      <div id="burger_b_menu"><?php echo file_get_contents("img/menu_close.svg"); ?></div>
      <div id="burger_b"><?php echo file_get_contents("img/menu.svg"); ?></div>
      <h1 id="logo">SWZPLN</h1>
      <div id="search_c">
        <div id="search_b"><?php echo file_get_contents("img/search.svg"); ?></div>
        <form id="search_form">
          <input id="search" name="search" type="text" />
          <label for="search" id="search_l"><?php __('Suche'); ?></label>
        </form>
        <div id="search_exit_b"><?php echo file_get_contents("img/exit.svg"); ?></div>
      </div>
    </header>

    <div id="layers">
      <input type="checkbox" id="l_buildings" name="l_buildings" value="buildings" checked>
      <label for="l_buildings"><?php echo file_get_contents("img/layers/buildings.svg"); ?><?php __('Gebäude'); ?></label>
      <input type="checkbox" id="l_green" name="l_green" value="green">
      <label for="l_green"><?php echo file_get_contents("img/layers/green.svg"); ?><?php __('Grünflächen'); ?></label>
      <input type="checkbox" id="l_water" name="l_water" value="water">
      <label for="l_water"><?php echo file_get_contents("img/layers/water.svg"); ?><?php __('Wasserflächen'); ?></label>
      <input type="checkbox" id="l_forest" name="l_forest" value="forest">
      <label for="l_forest"><?php echo file_get_contents("img/layers/forest.svg"); ?><?php __('Waldflächen'); ?></label>
      <input type="checkbox" id="l_land" name="l_land" value="land">
      <label for="l_land"><?php echo file_get_contents("img/layers/land.svg"); ?><?php __('Landwirtschaft'); ?></label>
      <input type="checkbox" id="l_streets" name="l_streets" value="streets">
      <label for="l_streets"><?php echo file_get_contents("img/layers/streets.svg"); ?><?php __('Straßen'); ?></label>
      <input type="checkbox" id="l_rails" name="l_rails" value="rails">
      <label for="l_rails"><?php echo file_get_contents("img/layers/rails.svg"); ?><?php __('Schienen'); ?></label>
      <input type="checkbox" id="l_contours" name="l_contours" value="contours">
      <label for="l_contours"><?php echo file_get_contents("img/layers/contours.svg"); ?><?php __('Höhenlinien'); ?></label>
    </div>

    <div id="map">
    </div>

    <div id="dl_b_c">
      <div id="dl_b" class="fab">
        <?php echo file_get_contents("img/dl.svg"); ?>
      </div>
      <div id="dl_dxf_b" class="fab_small">
        dxf
      </div>
      <div id="dl_svg_b" class="fab_small">
        svg
      </div>
      <div id="dl_pdf_b" class="fab_small">
        pdf
      </div>
    </div>

    <noscript>
      <div id="noscript">
        <?php __('Die Kernfunktion dieser Webseite (Pläne erstellen) ist in JavaScript geschrieben. Daher funktioniert die Webseite nur mit aktiviertem JavaScript!'); ?>
        <a href="imprint"><?php __('Impressum'); ?></a>
      </div>
    </noscript>

  </div>

  <div id="menu">
    <h2><?php __('Schwarzpläne für alle!'); ?></h2>
    <p id="menu_subtitle"><?php __('Auf dieser Webseite kannst du dir mit einem Klick kostenlos beliebig viele Schwarzpläne von überall erstellen. Und wir sammeln nicht einmal deine Daten!'); ?></p>
    
    <div class="menu_item" id="lang"><?php echo file_get_contents("img/lang.svg"); __('English'); echo file_get_contents("img/arrow_right.svg");?></div>
    <div class="menu_item" id="help"><?php echo file_get_contents("img/help.svg"); __('Hilfe (Tutorial)'); echo file_get_contents("img/arrow_right.svg");?></div>
    <div class="menu_item" id="donate" data-href="https://www.paypal.com/donate/?hosted_button_id=TYWDA9EHEJZYA"><?php echo file_get_contents("img/donate.svg"); __('Spenden (PayPal)'); echo file_get_contents("img/arrow_right.svg");?></div>
    <div class="menu_item" id="darkmode"><?php echo file_get_contents("img/darkmode.svg"); __('Dunkel-Modus'); echo file_get_contents("img/arrow_right.svg");?></div>
    <div class="menu_item" id="github" data-href="https://github.com/TheMoMStudio/swzpln.de"><?php echo file_get_contents("img/github.svg"); __('Quellcode (GitHub)'); echo file_get_contents("img/arrow_right.svg");?></div>
    <div class="menu_item" id="imprint"><?php echo file_get_contents("img/imprint.svg"); __('Impressum'); echo file_get_contents("img/arrow_right.svg");?></div>
    
    <div id="menu_footer">
      <p>&copy; <?php echo date("Y"); ?> <span class="logo">SWZPLN</span> erstellt in Stuttgart von <a href="https://timo.bilhoefer.de">Timo Bilhöfer</a><br />unterstützt durch <a href="https://themom.studio">The MoM Studio</a>.</p>
      <p>Diese Webseite ist Quelloffen und unter der <a href="https://github.com/TheMoMStudio/swzpln.de/blob/main/LICENSE">AGPL-3 Lizenz</a> veröffentlicht.</p>
    </div>
  </div>
  <div id="menu_shadow"></div>


  <script src="js/jquery-3.6.0.min.js"></script>
  <script src="js/leaflet/leaflet.js"></script>
  <script src="js/main.js" type="module"></script>
</body>

</html>

<?php
exit();
?>