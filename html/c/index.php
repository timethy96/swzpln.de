<?php
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, OPTIONS');
header('Access-Control-Max-Age: 600');
header('Access-Control-Allow-Headers: *');
header("Expires: Tue, 03 Jul 2001 06:00:00 GMT"); // *
header("Last-Modified: " . gmdate("D, d M Y H:i:s") . " GMT");
header("Cache-Control: no-store, no-cache, must-revalidate, max-age=0");
header("Cache-Control: post-check=0, pre-check=0", false);
header("Pragma: no-cache");

error_reporting(0);

$db = new SQLite3('./db/counter.db');
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
