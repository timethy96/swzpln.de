<?php

$count = 0;

$fr = fopen('count.txt', 'r');
if ($fr) {
    $count = intval(fgets($fr));
    fclose($fr);
}
if (isset($_GET['count'])){
    $count = $count + 1;
    $fw = fopen('count.txt', 'w');
    fwrite($fw, $count);
    fclose($fw);
}

echo $count;

