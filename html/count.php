<?php

class countDB extends SQLite3 {
    function __construct() {
       $this->open('count.db');
    }
 }

 $db = new countDB();
 if(!$db) {
    echo $db->lastErrorMsg();
 } else {
    $sql ="CREATE TABLE IF NOT EXISTS SWZPLN (TS DATETIME NOT NULL);";
    $r = $db->exec($sql);

    if (file_exists('count.txt')){
        $fr = fopen('count.txt', 'r');
        if ($fr) {
            $txtCount = intval(fgets($fr));
            fclose($fr);
            $sql = "";
            $datetime = time();
            for ($i=0; $i < $txtCount; $i++) { 
                $sql .= "INSERT INTO SWZPLN (TS) VALUES ($datetime);";
            }
            $r = $db->exec($sql);

            if(!$r){
                echo $db->lastErrorMsg();
            } else {
                unlink('count.txt');
            }

        }
    }
    
    if(!$r){
        echo $db->lastErrorMsg();
    } else {
        $count = 0;

        $sql = "SELECT COUNT(*) as c FROM SWZPLN;";
        $ret = $db->query($sql);
        $arr = $ret->fetchArray(SQLITE3_ASSOC);
        $count = $arr["c"];

        if (isset($_GET['count'])){
            $datetime = time();
            $sql = "INSERT INTO SWZPLN (TS) VALUES ($datetime);";
            $r = $db->exec($sql);

            if(!$r){
                echo $db->lastErrorMsg();
            } else {
                $count += 1;
            };
        }

        return $count;
    }
 }
 