<div id="menu">
  <div id="menu_scroll_cont">
    <h2><?php __($la,$l,'m_title'); ?></h2>
    <p id="menu_subtitle"><?php __($la,$l,'m_subtitle'); ?></p>
    
    <a class="menu_item" id="m_lang" href="<?php echo $change_lang_url; ?>"><?php echo file_get_contents("img/lang.svg"); __($la,$l,'m_lang'); echo file_get_contents("img/arrow_right.svg");?></a>
    <!-- <div class="menu_item" id="m_help"><?php echo file_get_contents("img/help.svg"); __($la,$l,'m_help'); echo file_get_contents("img/arrow_right.svg");?></div> -->
    <a class="menu_item" id="m_donate" href="https://ko-fi.com/swzpln"><?php echo file_get_contents("img/donate.svg"); __($la,$l,'m_donate'); echo file_get_contents("img/arrow_right.svg");?></a>
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