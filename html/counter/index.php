<?php
$allowedOrigins = array(
    '(http(s)?:\/\/)?(www\.)?swzpln.de',
    '(http(s)?:\/\/)?(old\.)?swzpln.de'
  );
   
if (isset($_SERVER['HTTP_ORIGIN']) && $_SERVER['HTTP_ORIGIN'] != '') {
    foreach ($allowedOrigins as $allowedOrigin) {
        if (preg_match('#' . $allowedOrigin . '#', $_SERVER['HTTP_ORIGIN'])) {
        header('Access-Control-Allow-Origin: ' . $_SERVER['HTTP_ORIGIN']);
        header('Access-Control-Allow-Methods: GET, OPTIONS');
        header('Access-Control-Max-Age: 1000');
        header('Access-Control-Allow-Headers: Content-Type, Authorization, X-Requested-With');
        break;
        }
    }
}

error_reporting(0);

$db = new SQLite3('counter.db');
if (!$db) {
    echo $db->lastErrorMsg();
} else {
    $count = 0;

    $sql = "SELECT COUNT(*) as c FROM SWZPLN;";
    $db->enableExceptions();
    $ret = $db->query($sql);
    $arr = $ret->fetchArray(SQLITE3_ASSOC);
    $count = $arr["c"];

    if (isset($_GET['count'])) {
        $datetime = time();
        $sql = "INSERT INTO SWZPLN (TS) VALUES ($datetime);";
        $r = $db->exec($sql);

        if (!$r) {
            echo $db->lastErrorMsg();
        } else {
            $count += 1;
        };
    }

    echo $count;
}

die();
