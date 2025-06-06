<?php 
header("Content-Type: text/csv");
header("Content-Disposition: inline; filename=swzpln.csv");

class countDB extends SQLite3 {
    function __construct() {
       $this->open('./db/counter.db');
    }
}

function clean($str){
    $str = mb_convert_encoding($str, 'UTF-8', 'UTF-8');
    $str = htmlentities($str, ENT_QUOTES, 'UTF-8');
    return $str;
}

$intvals = 3600;

if (isset($_REQUEST["intval"])){
    $intvals = clean($_REQUEST["intval"]) / 1000;
};

echo "TS;VALUE;\n";

$db = new countDB();
if(!$db) {
    echo $db->lastErrorMsg();
} else {
    if (isset($_REQUEST["intval"])){
        $sql = "SELECT
            timestamp as TS, 
            count(id) as val
        FROM download_log
        GROUP BY cast(cast(timestamp/($intvals) as signed)*$intvals as signed)
        ORDER BY TS;";
        $ret = $db->query($sql);
        while($row = $ret->fetchArray(SQLITE3_ASSOC) ) {
            echo $row['TS'] . ";" . $row['val'] . ";\n";
        };
    } else {
        $sql = "SELECT
            timestamp as TS, 
            id as val
        FROM download_log
        ORDER BY TS;";
        $ret = $db->query($sql);
        while($row = $ret->fetchArray(SQLITE3_ASSOC) ) {
            echo $row['TS'] . ";" . $row['val'] . ";\n";
        };
    };
}

die();