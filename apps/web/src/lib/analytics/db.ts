import Database from 'better-sqlite3';
import * as fs from 'fs';
import path from 'path';

const DB_PATH = process.env.ANALYTICS_DB_PATH || path.join(process.cwd(), 'data', 'analytics.db');

let sqlite: Database.Database | null = null;

function getSqlite(): Database.Database {
  if (!sqlite) {
    const dir = path.dirname(DB_PATH);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }

    const db = new Database(DB_PATH);

    db.pragma('journal_mode = WAL');
    db.pragma('busy_timeout = 5000');
    db.pragma('synchronous = NORMAL');
    db.pragma('foreign_keys = ON');

    db.exec(`
      CREATE TABLE IF NOT EXISTS page_events (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        timestamp INTEGER NOT NULL,
        type TEXT NOT NULL DEFAULT 'pageview',
        path TEXT NOT NULL,
        referrer TEXT,
        visitor_id TEXT NOT NULL,
        session_id TEXT NOT NULL,
        user_agent TEXT,
        browser TEXT,
        os TEXT,
        device TEXT,
        country TEXT,
        is_bot INTEGER NOT NULL DEFAULT 0,
        bot_score INTEGER NOT NULL DEFAULT 1,
        duration_ms INTEGER,
        scroll_depth REAL,
        meta TEXT
      );

      CREATE TABLE IF NOT EXISTS daily_stats (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        date TEXT NOT NULL,
        path TEXT NOT NULL,
        views INTEGER NOT NULL DEFAULT 0,
        unique_visitors INTEGER NOT NULL DEFAULT 0,
        UNIQUE(date, path)
      );

      CREATE TABLE IF NOT EXISTS referrer_stats (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        date TEXT NOT NULL,
        referrer TEXT NOT NULL,
        count INTEGER NOT NULL DEFAULT 0,
        UNIQUE(date, referrer)
      );

      CREATE TABLE IF NOT EXISTS daily_salts (
        date TEXT PRIMARY KEY,
        salt TEXT NOT NULL
      );

      CREATE INDEX IF NOT EXISTS idx_page_events_timestamp ON page_events(timestamp);
      CREATE INDEX IF NOT EXISTS idx_page_events_path ON page_events(path);
      CREATE INDEX IF NOT EXISTS idx_page_events_visitor_id ON page_events(visitor_id);
      CREATE INDEX IF NOT EXISTS idx_page_events_session_id ON page_events(session_id);
      CREATE INDEX IF NOT EXISTS idx_page_events_country ON page_events(country);
      CREATE INDEX IF NOT EXISTS idx_page_events_is_bot ON page_events(is_bot);
      CREATE INDEX IF NOT EXISTS idx_page_events_bot_score ON page_events(bot_score);
      CREATE INDEX IF NOT EXISTS idx_page_events_session_timestamp ON page_events(session_id, timestamp);
    `);

    sqlite = db;
  }
  return sqlite;
}

export function getRawDb() {
  return getSqlite();
}
