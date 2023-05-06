<?php

// Replace YOUR_API_KEY with your actual OpenTopography API key
$apiKey = "OPENTOPO_API_KEY";

// Set the API URL
$apiUrl = "https://portal.opentopography.org/API/globaldem";

// Set the location bounds (in decimal degrees)
$north = $_GET["north"];
$south = $_GET["south"];
$east = $_GET["east"];
$west = $_GET["west"];

// Set the request parameters
$params = array(
    "south" => $south,
    "west" => $west,
    "north" => $north,
    "east" => $east,
    "outputFormat" => "AAIGrid",
    "demtype" => "COP30",
    "API_Key" => $apiKey
);

// Build the request URL
$url = $apiUrl . "?" . http_build_query($params);

// Make the request to OpenTopography to download the data
$ch = curl_init();
curl_setopt($ch, CURLOPT_URL, $url);
curl_setopt($ch, CURLOPT_RETURNTRANSFER, 1);
curl_setopt($ch, CURLOPT_CUSTOMREQUEST, "GET");
$data = curl_exec($ch);
curl_close($ch);

// Remove the header lines from the Arc ASCII file
$lines = explode("\n", trim($data));
$matrix = array();
for ($i = 6; $i < count($lines); $i++) {
    $row = explode(" ", trim($lines[$i]));
    $matrix[] = $row;
}

// Convert the matrix to a JSON array
$jsonArray = json_encode($matrix);

// Return the JSON array
header("Content-Type: application/json");
echo $jsonArray;

?>
