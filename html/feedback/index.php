<?php
require_once('../php/functions.php');

//error_reporting(0);

if (isset($_POST["type"]) && isset($_POST["feedback"])) {
    $db = new SQLite3('feedback.db');
    if (!$db) {
        echo $db->lastErrorMsg();
    } else {
        $type = clean($_POST["type"]);

        if ($type == "quick"){
            $datetime = time();
            $feedback = intval(clean($_POST["feedback"]));
            $sql = "INSERT INTO FEEDBACK (TS, QUICK, LONG) VALUES ($datetime, $feedback, null);";
            $r = $db->exec($sql);
            if (!$r) {
                echo $db->lastErrorMsg();
            } else {
                $id = $db->lastInsertRowid();
                echo $id;
            };

        } elseif ($type == "long") {
            $id = intval(clean($_POST["id"]));
            $feedback = clean($_POST["feedback"]);
            $sql = "UPDATE FEEDBACK SET LONG = $feedback WHERE ID = $id;";
            $r = $db->exec($sql);
            if (!$r) {
                echo $db->lastErrorMsg();
            } else {
                $id = $db->lastInsertRowid();
                echo $id;
            };
        }
    }
} else {
    echo "No feedback specified!";
}


die();