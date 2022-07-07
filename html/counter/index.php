<?php
$allowed_domains = array(
    'https://swzpln.de',
    'https://www.swzpln.de',
    'https://old.swzpln.de'
  );   
if (in_array($_SERVER['HTTP_ORIGIN'], $allowed_domains)) {
    header('Access-Control-Allow-Origin: ' . $_SERVER['HTTP_ORIGIN']);
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
