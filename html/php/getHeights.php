<?php

// Get API key from environment variable
$apiKey = getenv('OPENTOPODATA_API_KEY');

// Set the API URL for Open Topo Data
$apiUrl = "https://api.opentopodata.org/v1/mapzen";

// Get the location bounds (in decimal degrees)
$north = $_GET["north"];
$south = $_GET["south"];
$east = $_GET["east"];
$west = $_GET["west"];

// Create a grid of points to sample the elevation data
$latStep = ($north - $south) / 9; // Sample 10 points in each direction (9 intervals)
$lngStep = ($east - $west) / 9;

$locations = array();
for ($lat = $south; $lat <= $north; $lat += $latStep) {
    for ($lng = $west; $lng <= $east; $lng += $lngStep) {
        $locations[] = $lat . "," . $lng;
    }
}

// Build the locations string for the API request
$locationsString = implode("|", $locations);

// Set the request parameters
$params = array(
    "locations" => $locationsString,
    "interpolation" => "bilinear"
);

// Build the request URL
$url = $apiUrl . "?" . http_build_query($params);

// Make the request to Open Topo Data
$ch = curl_init();
curl_setopt($ch, CURLOPT_URL, $url);
curl_setopt($ch, CURLOPT_RETURNTRANSFER, 1);
curl_setopt($ch, CURLOPT_CUSTOMREQUEST, "GET");
curl_setopt($ch, CURLOPT_HTTPHEADER, array(
    "x-api-key: " . $apiKey
));
$response = curl_exec($ch);
curl_close($ch);

// Parse the JSON response
$data = json_decode($response, true);

// Check for errors
if (isset($data['error'])) {
    header("Content-Type: application/json");
    http_response_code(400);
    echo json_encode(array('error' => $data['error']));
    exit;
}

// Extract elevations into a matrix
$matrix = array();
$row = array();
$count = 0;
foreach ($data['results'] as $result) {
    $row[] = $result['elevation'];
    $count++;
    if ($count % 10 == 0) { // 10 points per row
        $matrix[] = $row;
        $row = array();
    }
}

// Return the JSON array
header("Content-Type: application/json");
echo json_encode($matrix);

?>
