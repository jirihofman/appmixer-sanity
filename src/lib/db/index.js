import Database from 'better-sqlite3';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DB_PATH = path.resolve(__dirname, '../../../data/sanity-check.db');

// Ensure data directory exists
const dataDir = path.dirname(DB_PATH);
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

const db = new Database(DB_PATH);

// Enable foreign keys
db.pragma('foreign_keys = ON');

// Initialize schema
db.exec(`
  CREATE TABLE IF NOT EXISTS test_runs (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    status TEXT CHECK(status IN ('in_progress', 'completed')) DEFAULT 'in_progress'
  );

  CREATE TABLE IF NOT EXISTS connectors (
    id TEXT PRIMARY KEY,
    test_run_id TEXT NOT NULL,
    connector_name TEXT NOT NULL,
    version TEXT NOT NULL,
    label TEXT,
    description TEXT,
    icon TEXT,
    status TEXT CHECK(status IN ('pending', 'ok', 'fail', 'blocked')) DEFAULT 'pending',
    blocked_reason TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (test_run_id) REFERENCES test_runs(id) ON DELETE CASCADE
  );

  CREATE TABLE IF NOT EXISTS components (
    id TEXT PRIMARY KEY,
    connector_id TEXT NOT NULL,
    component_name TEXT NOT NULL,
    label TEXT,
    description TEXT,
    icon TEXT,
    version TEXT,
    is_private BOOLEAN DEFAULT FALSE,
    status TEXT CHECK(status IN ('pending', 'ok', 'fail')) DEFAULT 'pending',
    github_issue TEXT,
    tested_at DATETIME,
    FOREIGN KEY (connector_id) REFERENCES connectors(id) ON DELETE CASCADE
  );

  CREATE INDEX IF NOT EXISTS idx_connectors_test_run ON connectors(test_run_id);
  CREATE INDEX IF NOT EXISTS idx_components_connector ON components(connector_id);
  CREATE INDEX IF NOT EXISTS idx_test_runs_created ON test_runs(created_at DESC);
`);

export default db;
