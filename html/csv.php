<?php 
header("Content-Type: text/csv");
header("Content-Disposition: inline; filename=swzpln.csv");

class countDB extends SQLite3 {
    function __construct() {
       $this->open('count.db');
    }
}

echo "ID;TS;\n";

$db = new countDB();
if(!$db) {
    echo $db->lastErrorMsg();
} else {
    $sql = "SELECT ROWID,TS FROM SWZPLN;";
    $ret = $db->query($sql);
    while($row = $ret->fetchArray(SQLITE3_ASSOC) ) {
        echo $row['rowid'] . ";" . $row['TS'] . ";\n";
    }

}

 
die();