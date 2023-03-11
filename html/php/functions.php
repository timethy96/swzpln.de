<?php

function clean($str){
    $str = mb_convert_encoding($str, 'UTF-8', 'UTF-8');
    $str = htmlentities($str, ENT_QUOTES, 'UTF-8');
    return $str;
}

function getTranslations($lang){
    if (in_array($lang, ['de','en'])) {
        $file = file_get_contents(dirname(__FILE__).'/../translations.json');
        $json_a = json_decode($file, true);
        return $json_a;
    };
}

function _n($la,$l,$str){
    if (isset($la) && isset ($l) && isset ($la[$str][$l])){
        return $la[$str][$l];
    }
    return $str;
}

function __($la,$l,$str){
    echo _n($la,$l,$str);
}