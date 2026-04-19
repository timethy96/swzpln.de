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

// Migration: add is3d column to existing databases
try {
	db.exec('ALTER TABLE download_log ADD COLUMN is3d INTEGER NOT NULL DEFAULT 0');
} catch {
	// Column already exists
}

/**
 * Record a successful download
 * Thread-safe via SQLite's built-in locking
 */
export function recordDownload(is3d = false): void {
	const stmt = db.prepare('INSERT INTO download_log (timestamp, is3d) VALUES (?, ?)');
	stmt.run(Date.now(), is3d ? 1 : 0);
}

/**
 * Get download records with a safety limit to prevent unbounded memory usage
 */
export function getAllDownloads(
	limit = 100_000,
	is3d?: boolean
): Array<{ id: number; timestamp: number; is3d: number }> {
	if (is3d !== undefined) {
		const stmt = db.prepare(
			'SELECT id, timestamp, is3d FROM download_log WHERE is3d = ? ORDER BY timestamp LIMIT ?'
		);
		return stmt.all(is3d ? 1 : 0, limit) as Array<{ id: number; timestamp: number; is3d: number }>;
	}
	const stmt = db.prepare(
		'SELECT id, timestamp, is3d FROM download_log ORDER BY timestamp LIMIT ?'
	);
	return stmt.all(limit) as Array<{ id: number; timestamp: number; is3d: number }>;
}

/**
 * Get download records grouped by interval
 */
export function getDownloadsByInterval(
	intervalMs: number,
	is3d?: boolean
): Array<{ timestamp: number; count: number }> {
	const where = is3d !== undefined ? `WHERE is3d = ${is3d ? 1 : 0}` : '';
	const stmt = db.prepare(`
		SELECT 
			CAST(CAST(timestamp / ? AS INTEGER) * ? AS INTEGER) as timestamp,
			COUNT(id) as count
		FROM download_log
		${where}
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
	intervalMs: number,
	is3d?: boolean
): Array<{ timestamp: number; count: number }> {
	const where = is3d !== undefined ? `WHERE is3d = ${is3d ? 1 : 0}` : '';
	const stmt = db.prepare(`
		SELECT
			timestamp,
			SUM(count) OVER (ORDER BY timestamp) as count
		FROM (
			SELECT
				CAST(CAST(timestamp / ? AS INTEGER) * ? AS INTEGER) as timestamp,
				COUNT(id) as count
			FROM download_log
			${where}
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
