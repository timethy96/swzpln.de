<?php
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, OPTIONS');
header('Access-Control-Max-Age: 600');
header('Access-Control-Allow-Headers: *');

error_reporting(0);

$db = new SQLite3('db/counter.db');
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
