<?php
require('php/functions.php');

if (isset($_COOKIE['lang'])){
    $l = clean($_COOKIE['lang']);
} else{
  $langs = ['de', 'en'];
  $userLang = substr($_SERVER['HTTP_ACCEPT_LANGUAGE'], 0, 2);
  $l = in_array($userLang, $langs) ? $userLang : 'de';
}

$la = getTranslations($l);

if (isset($_COOKIE['darkmode'])){
  $darkmode = filter_var(clean($_COOKIE['darkmode']), FILTER_VALIDATE_BOOLEAN);
} else {
  if (date('H') > 19 || date('H') < 7) {
    $darkmode = true;
  } else {
    $darkmode = false;
  }
}

if (isset($_COOKIE['layers'])){
  $layers = explode(",", clean($_COOKIE['layers']));
} else {
  $layers = [];
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
      <div id="logoCont"><h1 id="logo">SWZPLN</h1><div><a href="https://old.swzpln.de"><?php __($la,$l,'backToOld'); ?></a></div></div>
      <div id="search_c">
        <div id="search_b"><?php echo file_get_contents("img/search.svg"); ?></div>
        <form id="search_form">
          <input id="search" name="search" type="text" />
          <label for="search" id="search_l"><?php __($la,$l,'search'); ?></label>
        </form>
        <div id="search_exit_b"><?php echo file_get_contents("img/exit.svg"); ?></div>
      </div>
    </header>

    <div id="layers">
      <input type="checkbox" id="l_buildings" name="l_buildings" value="building" checked>
      <label for="l_buildings"><?php echo file_get_contents("img/layers/buildings.svg"); ?><?php __($la,$l,'buildings');?></label>
      <input type="checkbox" id="l_green" name="l_green" value="green">
      <label for="l_green"><?php echo file_get_contents("img/layers/green.svg"); ?><?php __($la,$l,'green'); ?></label>
      <input type="checkbox" id="l_water" name="l_water" value="water">
      <label for="l_water"><?php echo file_get_contents("img/layers/water.svg"); ?><?php __($la,$l,'water'); ?></label>
      <input type="checkbox" id="l_forest" name="l_forest" value="forest">
      <label for="l_forest"><?php echo file_get_contents("img/layers/forest.svg"); ?><?php __($la,$l,'forest'); ?></label>
      <input type="checkbox" id="l_land" name="l_land" value="farmland">
      <label for="l_land"><?php echo file_get_contents("img/layers/land.svg"); ?><?php __($la,$l,'land'); ?></label>
      <input type="checkbox" id="l_streets" name="l_streets" value="highway">
      <label for="l_streets"><?php echo file_get_contents("img/layers/streets.svg"); ?><?php __($la,$l,'roads'); ?></label>
      <input type="checkbox" id="l_rails" name="l_rails" value="railway">
      <label for="l_rails"><?php echo file_get_contents("img/layers/rails.svg"); ?><?php __($la,$l,'rails'); ?></label>
      <!-- <input type="checkbox" id="l_contours" name="l_contours" value="contours">
      <label for="l_contours"><?php echo file_get_contents("img/layers/contours.svg"); ?><?php __($la,$l,'contours'); ?></label> -->
    </div>

    <div id="map">
    </div>

    <div id="dl_b_c">
      <div id="dl_b" class="fab">
        <?php echo file_get_contents("img/dl.svg"); ?>
      </div>
      <div id="dl_dxf_b" class="fab_small dl_bs">
        dxf
      </div>
      <div id="dl_svg_b" class="fab_small dl_bs">
        svg
      </div>
      <div id="dl_pdf_b" class="fab_small dl_bs">
        pdf
      </div>
    </div>

    <noscript>
      <div id="noscript">
        <?php __($la,$l,'noscript'); ?>
        <a href="legal"><?php __($la,$l,'legal'); ?></a>
      </div>
    </noscript>

  </div>

  <div id="menu">
    <h2><?php __($la,$l,'m_title'); ?></h2>
    <p id="menu_subtitle"><?php __($la,$l,'m_subtitle'); ?></p>
    
    <div class="menu_item" id="m_lang"><?php echo file_get_contents("img/lang.svg"); __($la,$l,'m_lang'); echo file_get_contents("img/arrow_right.svg");?></div>
    <!-- <div class="menu_item" id="m_help"><?php echo file_get_contents("img/help.svg"); __($la,$l,'m_help'); echo file_get_contents("img/arrow_right.svg");?></div> -->
    <a class="menu_item" id="m_donate" href="https://www.paypal.com/donate/?hosted_button_id=TYWDA9EHEJZYA"><?php echo file_get_contents("img/donate.svg"); __($la,$l,'m_donate'); echo file_get_contents("img/arrow_right.svg");?></a>
    <div class="menu_item" id="m_darkmode"><?php echo file_get_contents("img/darkmode.svg"); __($la,$l,'m_darkmode'); echo file_get_contents("img/arrow_right.svg");?></div>
    <a class="menu_item" id="m_github" href="https://github.com/TheMoMStudio/swzpln.de"><?php echo file_get_contents("img/github.svg"); __($la,$l,'m_source'); echo file_get_contents("img/arrow_right.svg");?></a>
    <div class="menu_item" id="m_legal"><?php echo file_get_contents("img/imprint.svg"); __($la,$l,'legal'); echo file_get_contents("img/arrow_right.svg");?></div>
    
    <div id="menu_footer">
      <p id="counter"><span id="counter_no"></span> <?php __($la,$l,'m_counter'); ?></p>
      <p>&copy; <?php echo date("Y")." "; __($la,$l,'m_footer'); ?>
    </div>
  </div>
  <div id="menu_shadow"></div>

  <div id="legal" class="dialog closable"></div>
  <div id="dl_scale" class="dialog">
    <h2><?php __($la,$l,'dl_scales'); ?></h2>
    <p><?php __($la,$l,'dl_scales_info'); ?></p>
    <a class="scale_opt">-</a>
    <a class="scale_opt">-</a>
    <a class="scale_opt">-</a>
    <div class="dialog_b_cont">
      <a id="dl_scales_close" class="dialog_b active" href="javascript:"><?php __($la,$l,'dl_close'); ?></a>
    </div>
  </div>
  <div id="dl_progress" class="dialog">
    <?php echo file_get_contents("img/world.svg");?>
    <h2><?php __($la,$l,'dl_gen'); ?></h2>
    <div id="dl_status_text"></div>
    <div id="dl_bar"><div></div></div>
    <div id="dl_status_percent"></div>
    <div id="dl_ad"><?php __($la,$l,'dl_donate'); ?></div>
    <div class="dialog_b_cont">
      <a id="dl_cancel" class="dialog_b" href="javascript:"><?php __($la,$l,'dl_cancel'); ?></a>
      <a id="dl_close" class="dialog_b" href="javascript:"><?php __($la,$l,'dl_close'); ?></a>
      <a id="dl_start" class="dialog_b" href="javascript:">download</a>
    </div>
  </div>
  <div id="dialog_shadow"></div>

  <script src="js/jquery-3.6.0.min.js"></script>
  <script src="js/leaflet/leaflet.js"></script>
  <script src="js/main.js" type="module"></script>
</body>

</html>

<?php
exit();
?>