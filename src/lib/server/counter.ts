// Thread-safe download counter using Node's built-in SQLite
// Requires Node 22.5+

import { DatabaseSync } from 'node:sqlite';
import { mkdirSync, existsSync } from 'node:fs';
import { join } from 'node:path';

const DB_DIR = join(process.cwd(), 'data');
const DB_PATH = join(DB_DIR, 'counter.db');

// Ensure data directory exists
if (!existsSync(DB_DIR)) {
	mkdirSync(DB_DIR, { recursive: true });
}

// Initialize database connection
const db = new DatabaseSync(DB_PATH);

// Create table if it doesn't exist
db.exec(`
	CREATE TABLE IF NOT EXISTS download_log (
		id INTEGER PRIMARY KEY AUTOINCREMENT,
		timestamp INTEGER NOT NULL
	)
`);

/**
 * Record a successful download
 * Thread-safe via SQLite's built-in locking
 */
export function recordDownload(): void {
	const stmt = db.prepare('INSERT INTO download_log (timestamp) VALUES (?)');
	stmt.run(Date.now());
}

/**
 * Get download records with a safety limit to prevent unbounded memory usage
 */
export function getAllDownloads(limit = 100_000): Array<{ id: number; timestamp: number }> {
	const stmt = db.prepare('SELECT id, timestamp FROM download_log ORDER BY timestamp LIMIT ?');
	return stmt.all(limit) as Array<{ id: number; timestamp: number }>;
}

/**
 * Get download records grouped by interval
 */
export function getDownloadsByInterval(
	intervalMs: number
): Array<{ timestamp: number; count: number }> {
	const stmt = db.prepare(`
		SELECT 
			CAST(CAST(timestamp / ? AS INTEGER) * ? AS INTEGER) as timestamp,
			COUNT(id) as count
		FROM download_log
		GROUP BY CAST(CAST(timestamp / ? AS INTEGER) * ? AS INTEGER)
		ORDER BY timestamp
	`);
	return stmt.all(intervalMs, intervalMs, intervalMs, intervalMs) as Array<{
		timestamp: number;
		count: number;
	}>;
}

/**
 * Get cumulative download count grouped by interval (running total)
 */
export function getCumulativeByInterval(
	intervalMs: number
): Array<{ timestamp: number; count: number }> {
	const stmt = db.prepare(`
		SELECT
			timestamp,
			SUM(count) OVER (ORDER BY timestamp) as count
		FROM (
			SELECT
				CAST(CAST(timestamp / ? AS INTEGER) * ? AS INTEGER) as timestamp,
				COUNT(id) as count
			FROM download_log
			GROUP BY CAST(CAST(timestamp / ? AS INTEGER) * ? AS INTEGER)
		)
		ORDER BY timestamp
	`);
	return stmt.all(intervalMs, intervalMs, intervalMs, intervalMs) as Array<{
		timestamp: number;
		count: number;
	}>;
}

/**
 * Get total download count
 */
export function getTotalDownloads(): number {
	const stmt = db.prepare('SELECT COUNT(*) as count FROM download_log');
	const result = stmt.get() as { count: number };
	return result.count;
}
