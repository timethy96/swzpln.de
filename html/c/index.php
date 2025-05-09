<?php
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, OPTIONS');
header('Access-Control-Max-Age: 600');
header('Access-Control-Allow-Headers: *');

error_reporting(0);

$db = new SQLite3('./db/counter.db');
if (!$db) {
    echo $db->lastErrorMsg();
    die();
}

try {
    $db->enableExceptions(true);
    
    // Create the counter table if it doesn't exist
    $db->exec('CREATE TABLE IF NOT EXISTS counter (count INTEGER DEFAULT 0)');
    
    // Create the downloads log table if it doesn't exist
    $db->exec('CREATE TABLE IF NOT EXISTS download_log (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        timestamp INTEGER NOT NULL
    )');
    
    // Create index on timestamp for faster queries
    $db->exec('CREATE INDEX IF NOT EXISTS idx_download_log_timestamp ON download_log(timestamp)');
    
    // Ensure we have exactly one row in counter
    $result = $db->query('SELECT COUNT(*) as c FROM counter');
    $row = $result->fetchArray(SQLITE3_ASSOC);
    if ($row['c'] == 0) {
        $db->exec('INSERT INTO counter (count) VALUES (0)');
    }
    
    if (isset($_GET['count'])) {
        // Start transaction
        $db->exec('BEGIN TRANSACTION');
        
        try {
            // Update the counter
            $sql = "UPDATE counter SET count = count + 1";
            $result = $db->exec($sql);
            
            if (!$result) {
                throw new Exception($db->lastErrorMsg());
            }
            
            // Log the download timestamp
            $timestamp = time();
            $stmt = $db->prepare('INSERT INTO download_log (timestamp) VALUES (:timestamp)');
            $stmt->bindValue(':timestamp', $timestamp, SQLITE3_INTEGER);
            $stmt->execute();
            
            // Commit transaction
            $db->exec('COMMIT');
        } catch (Exception $e) {
            // Rollback on error
            $db->exec('ROLLBACK');
            throw $e;
        }
    }
    
    // Get the current count
    $result = $db->query('SELECT count FROM counter LIMIT 1');
    $row = $result->fetchArray(SQLITE3_ASSOC);
    echo $row['count'];
    
} catch (Exception $e) {
    echo "Error: " . $e->getMessage();
} finally {
    $db->close();
}

die();
