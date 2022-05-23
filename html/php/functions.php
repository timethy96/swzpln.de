<?php

function clean($str){
    $str = mb_convert_encoding($str, 'UTF-8', 'UTF-8');
    $str = htmlentities($str, ENT_QUOTES, 'UTF-8');
    return $str;
}

function getTranslations($lang){
    if (in_array($lang, ['de','en'])) {
        $file = file_get_contents(dirname(__FILE__).'/../translations.json');
        $json_a = json_decode($file);
        return $json_a;
    };
}

function _n($str){
    if (isset($la) && isset ($l)){
        return $la[$str][$l];
    }
    return $str;
}

function __($str){
    echo _n($str);
}