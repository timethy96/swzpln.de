<?php
require('php/functions.php');

$main_title_array = explode(".",$_SERVER['SERVER_NAME']);
if (isset($main_title_array[count($main_title_array) - 2])) {
  $main_title = strtoupper($main_title_array[count($main_title_array) - 2]);
  $server_name = $main_title_array[count($main_title_array) - 2] . "." . $main_title_array[count($main_title_array) - 1];
} else {
  $main_title = strtoupper($main_title_array[0]);
  $server_name = $_SERVER['SERVER_NAME'];
}

if ($main_title == "OPENCITYPLANS"){
    $l = "en";
} else if ($main_title == "SWZPLN") {
    $l = "de";
} else {
  $langs = ['de', 'en'];
  if (isset($_SERVER['HTTP_ACCEPT_LANGUAGE'])) {
    $userLang = substr($_SERVER['HTTP_ACCEPT_LANGUAGE'], 0, 2);
    $l = in_array($userLang, $langs) ? $userLang : 'de';
  } else {
    $l = 'de';
  }
  
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
  $layers = json_decode(clean($_COOKIE['layers']));
} else {
  $layers = [true,false,false,false,false,false,false,false];
}

if ($l == "en") {
  $change_lang_url = "https://swzpln.de";
} else {
  $change_lang_url = "https://opencityplans.com";
}

if (isset($_GET['url'])){
  $searchString = clean($_GET['url']);
  $searchSubtitle = _n($la,$l,'fromCity') . $searchString;
} else {
  $searchString = "";
  $searchSubtitle = "";
}


?>
<!DOCTYPE html>
<html lang="<?php echo $l; ?>">

<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta http-equiv="X-UA-Compatible" content="ie=edge">

  <title><?php echo $server_name; ?> | <?php __($la,$l,'title'); ?> | <?php echo $searchString; ?></title>

  <meta name="title" content="<?php echo $server_name; ?> | <?php __($la,$l,'title'); ?> | <?php echo $searchString; ?>"/>
  <meta name="author" content="Timo Bilhöfer"/>
  <meta name="publisher" content="Timo Bilhöfer"/>
  <meta name="copyright" content="Timo Bilhöfer <?php echo date("Y"); ?>"/>
  <meta name="revisit" content="After 30 days"/>
  <meta name="keywords" content="<?php echo $searchString ?> architecture building urbanism technology plans nolli black schwarz schwarzpläne architektur gebäude schwarzplan stadtplanung generieren generator technologie dwg dxf svg pdf contours höhenlinien"/>
  <meta name="description" content="<?php __($la,$l,'m_subtitle1'); ?> <?php echo $searchSubtitle ?> <?php __($la,$l,'m_subtitle2'); ?>"/>
  <meta name="page-topic" content="<?php echo $searchString ?> architecture building urbanism technology plans nolli black schwarz schwarzpläne architektur gebäude schwarzplan stadtplanung generieren generator technologie dwg dxf svg pdf contours höhenlinien"/>
  <meta name="robots" content="INDEX,FOLLOW"/>
  <meta name="language" http-equiv="content-language" content="<?php echo $l; ?>"/>

  <link rel="apple-touch-icon" sizes="180x180" href="/meta/apple-touch-icon.png">
  <link rel="icon" type="image/png" sizes="32x32" href="/meta/favicon-32x32.png">
  <link rel="icon" type="image/png" sizes="16x16" href="/meta/favicon-16x16.png">
  <link rel="manifest" href="/meta/site.webmanifest">
  <link rel="mask-icon" href="/meta/safari-pinned-tab.svg" color="#000000">
  <link rel="shortcut icon" href="/meta/favicon.ico">
  <link rel="canonical" href="https://<?php echo $server_name."/".$searchString ?>">
  <meta name="apple-mobile-web-app-title" content="<?php echo $server_name ?>">
  <meta name="application-name" content="<?php echo $server_name ?>">
  <meta name="msapplication-TileColor" content="#000000">
  <meta name="msapplication-config" content="/meta/browserconfig.xml">
  <meta name="theme-color" content="#ffffff">

  <meta property="og:image:height" content="1257">
  <meta property="og:image:width" content="2400">
  <meta property="og:description" content="<?php __($la,$l,'m_subtitle1'); ?> <?php echo $searchSubtitle; ?> <?php __($la,$l,'m_subtitle2'); ?>">
  <meta property="og:url" content="https://<?php echo $server_name ?>">
  <meta property="og:image" content="https://<?php echo $server_name ?>/meta/og-image.jpg">
  <meta property="og:title" content="<?php echo $server_name ?> | <?php __($la,$l,'title') ?>">

  <link rel="stylesheet" href="/css/reset.css">
  <?php
  if ($darkmode){
   echo '<link rel="stylesheet" href="/css/colors.dark.css" id="colors">';
  } else {
    echo '<link rel="stylesheet" href="/css/colors.light.css" id="colors">';
  }
  if ($_SERVER['SERVER_NAME'] != 'localhost') {
    echo '<link rel="stylesheet" href="/css/style.pref.css?v='.filemtime('css/style.pref.css').'">'; // only use prefixed css on production servers
  } else {
    echo '<link rel="stylesheet" href="/css/style.css">';
  };
  ?>

  <link rel="stylesheet" href="/js/leaflet/leaflet.css?v=<?php echo filemtime('js/leaflet/leaflet.css'); ?>">

</head>

<body>
  <div id="main">
    <header>
      <div id="burger_b_menu"><?php echo file_get_contents("img/menu_close.svg"); ?></div>
      <div id="burger_b"><?php echo file_get_contents("img/menu.svg"); ?></div>
      <div id="logoCont"><h1 id="logo"><?php echo $main_title; ?></h1></div>
      <div id="search_c">
        <div id="search_b" class="inactive"><?php echo file_get_contents("img/search.svg"); ?></div>
        <form id="search_form">
          <input id="search" name="search" type="text" />
          <label for="search" id="search_l"><?php __($la,$l,'search'); ?></label>
        </form>
        <div id="search_exit_b"><?php echo file_get_contents("img/exit.svg"); ?></div>
      </div>
    </header>

    <div id="menu">

      <div id="menu_scroll_cont">
        <h2><?php __($la,$l,'m_title'); ?></h2>
        <h3 id="menu_subtitle"><?php __($la,$l,'m_subtitle1'); ?><?php echo $searchSubtitle; ?> <?php __($la,$l,'m_subtitle2'); ?></h3>
        <h4 id="menu_tags"><?php __($la,$l,'m_tags'); ?></h4>
        <h4 id="menu_city"><?php echo $searchString; ?></h4>

        <a class="menu_item" id="m_lang" href="<?php echo $change_lang_url; ?>"><?php echo file_get_contents("img/lang.svg"); __($la,$l,'m_lang'); echo file_get_contents("img/arrow_right.svg");?></a>
        <!-- <div class="menu_item" id="m_help"><?php echo file_get_contents("img/help.svg"); __($la,$l,'m_help'); echo file_get_contents("img/arrow_right.svg");?></div> -->
        <a class="menu_item" id="m_donate" href="https://ko-fi.com/swzpln"><?php echo file_get_contents("img/donate.svg"); __($la,$l,'m_donate'); echo file_get_contents("img/arrow_right.svg");?></a>
        <a class="menu_item" id="m_shop" href="https://shop.swzpln.de"><?php echo file_get_contents("img/shop.svg"); __($la,$l,'m_shop'); echo file_get_contents("img/arrow_right.svg");?></a>
        <div class="menu_item" id="m_darkmode"><?php echo file_get_contents("img/darkmode.svg"); __($la,$l,'m_darkmode'); echo file_get_contents("img/arrow_right.svg");?></div>
        <a class="menu_item" id="m_github" href="https://github.com/TheMoMStudio/swzpln.de"><?php echo file_get_contents("img/github.svg"); __($la,$l,'m_source'); echo file_get_contents("img/arrow_right.svg");?></a>
        <div class="menu_item" id="m_legal"><?php echo file_get_contents("img/imprint.svg"); __($la,$l,'legal'); echo file_get_contents("img/arrow_right.svg");?></div>
      </div>

      <div id="menu_footer">
        <p id="counter"><span id="counter_no"></span> <?php __($la,$l,'m_counter'); ?></p>
        <p>&copy; <?php echo date("Y")." "; echo "<span class='logo'>".$main_title."</span>"; __($la,$l,'m_footer'); ?>
      </div>
    
    </div>
    <div id="menu_shadow"></div>

    <div id="layers">
      <input type="checkbox" id="l_buildings" name="l_buildings" value="building" <?php echo ($layers[0]) ? 'checked' : ''; ?> >
        <label for="l_buildings"><?php echo file_get_contents("img/layers/buildings.svg"); ?><?php __($la,$l,'buildings');?></label>
      <input type="checkbox" id="l_green" name="l_green" value="green" <?php echo ($layers[1]) ? 'checked' : ''; ?> >
        <label for="l_green"><?php echo file_get_contents("img/layers/green.svg"); ?><?php __($la,$l,'green'); ?></label>
      <input type="checkbox" id="l_forest" name="l_forest" value="forest" <?php echo ($layers[2]) ? 'checked' : ''; ?> >
        <label for="l_forest"><?php echo file_get_contents("img/layers/forest.svg"); ?><?php __($la,$l,'forest'); ?></label>
      <input type="checkbox" id="l_water" name="l_water" value="water" <?php echo ($layers[3]) ? 'checked' : ''; ?> >
        <label for="l_water"><?php echo file_get_contents("img/layers/water.svg"); ?><?php __($la,$l,'water'); ?></label>
      <input type="checkbox" id="l_land" name="l_land" value="farmland" <?php echo ($layers[4]) ? 'checked' : ''; ?> >
        <label for="l_land"><?php echo file_get_contents("img/layers/land.svg"); ?><?php __($la,$l,'land'); ?></label>
      <input type="checkbox" id="l_streets" name="l_streets" value="highway" <?php echo ($layers[5]) ? 'checked' : ''; ?> >
        <label for="l_streets"><?php echo file_get_contents("img/layers/streets.svg"); ?><?php __($la,$l,'roads'); ?></label>
      <input type="checkbox" id="l_rails" name="l_rails" value="railway" <?php echo ($layers[6]) ? 'checked' : ''; ?> >
        <label for="l_rails"><?php echo file_get_contents("img/layers/rails.svg"); ?><?php __($la,$l,'rails'); ?></label>
      <input type="checkbox" id="l_contours" name="l_contours" value="contours" <?php echo ($layers[7]) ? 'checked' : ''; ?> >
        <label for="l_contours"><?php echo file_get_contents("img/layers/contours.svg"); ?><?php __($la,$l,'contours'); ?>&nbsp;<span id="cl_interval">10</span>m<sup>beta</sup></label>
    </div>

    <div id="map">
      <div id="map_p">
        <p><?php __($la,$l,'priv_1'); ?> <a href="javascript:" class="open_privacy"><?php __($la,$l,'privacy_agreement'); ?></a> <?php __($la,$l,'priv_2'); ?> <a href="javascript:" class="open_privacy"><?php __($la,$l,'more_infos'); ?></a>.</p>
        <p><?php __($la,$l,'priv_3'); ?></p>
        <p><?php __($la,$l,'priv_4'); ?>. <a href="https://wiki.osmfoundation.org/wiki/Privacy_Policy" target="_blank"><?php __($la,$l,'privacy_agreement'); ?></a>.</p>
        <p><?php __($la,$l,'priv_5'); ?> <a href="https://overpass.kumi.systems/" target="_blank"><?php __($la,$l,'privacy_agreement'); ?></a>.</p>
        <p><?php __($la,$l,'priv_7'); ?> <a href="https://opentopography.org/privacypolicy" target="_blank"><?php __($la,$l,'privacy_agreement'); ?></a>.</p>
        <div id="map_p_b"><?php __($la,$l,'priv_6'); ?></div>
      </div>
    </div>

    <div id="dl_b_c">
      <div id="dl_b" class="fab inactive">
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
  <div id="dl_err" class="dialog closable">
    <?php echo file_get_contents("img/error.svg");?>
    <h2><?php __($la,$l,'dl_err'); ?></h2>
    <div id="err_main"><?php __($la,$l,'err_main'); ?></div>
    <code id="err_log"></code>
    <div class="dialog_b_cont">
      <a id="err_send" class="dialog_b" href="javascript:"><?php __($la,$l,'dl_send'); ?></a>
      <a id="err_close" class="dialog_b" href="javascript:"><?php __($la,$l,'dl_close'); ?></a>
    </div>
  </div>
  <div id="dialog_shadow"></div>

  <script src="js/jquery-3.7.0.min.js"></script>
  <script src="js/leaflet/leaflet.js?v=<?php echo filemtime('js/leaflet/leaflet.js'); ?>"></script>
  <script src="js/main.js?v=<?php echo filemtime('js/main.js'); ?>" type="module"></script>

</body>

</html>

<?php
exit();
?>