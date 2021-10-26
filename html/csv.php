<?php 
header("Content-Type: text/csv");
header("Content-Disposition: inline; filename=swzpln.csv");

class countDB extends SQLite3 {
    function __construct() {
       $this->open('count.db');
    }
}

function clean($str){
    $str = mb_convert_encoding($str, 'UTF-8', 'UTF-8');
    $str = htmlentities($str, ENT_QUOTES, 'UTF-8');
    return $str;
}

$intvals = 3600;

if (isset($_REQUEST["intval"])){
    $intvals = clean($_REQUEST["intval"]);
};


echo "ID;TS;\n";

$db = new countDB();
if(!$db) {
    echo $db->lastErrorMsg();
} else {
    /*$sql = "SELECT ROWID,TS FROM SWZPLN;";
    $sql = "SELECT 
        UNIX_TIMESTAMP(DATE_ADD(the_date, INTERVAL the_hour HOUR)) as time_sec, 
        the_sum as value,
        'hourly' as metric
    from (
        select
        DATE(`TS`) as the_date,
        HOUR(`TS`) as the_hour,
        SUM(`ROWID`) AS the_sum
        FROM SWZPLN
        WHERE $__timeFilter(`TS`)
        GROUP BY 1,2 
        ORDER BY `TS` ASC
    ) x";*/
    $sql = "SELECT
        TS, 
        count(ROWID) as val
    FROM SWZPLN
    GROUP BY cast(cast(TS/($intvals) as signed)*$intvals as signed);";
    $ret = $db->query($sql);
    while($row = $ret->fetchArray(SQLITE3_ASSOC) ) {
        echo $row['TS'] . ";" . $row['val'] . ";\n";
    }

}

 
die();