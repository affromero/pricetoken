import { getRawDb } from './db';

export function markSuspectedBots(): number {
  const db = getRawDb();
  const tenMinAgo = Date.now() - 10 * 60 * 1000;

  const result = db
    .prepare(
      `UPDATE page_events
       SET bot_score = 2, is_bot = 1
       WHERE bot_score = 1 AND duration_ms IS NULL AND timestamp < ?`,
    )
    .run(tenMinAgo);

  return result.changes;
}

export function aggregateDay(
  dateStr?: string,
): { aggregated: string; eventsProcessed: number; suspectedBots: number } {
  const suspectedBots = markSuspectedBots();
  const db = getRawDb();

  const target = dateStr || new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString().slice(0, 10);

  const dayStart = new Date(target + 'T00:00:00.000Z').getTime();
  const dayEnd = new Date(target + 'T23:59:59.999Z').getTime();

  const transaction = db.transaction(() => {
    db.prepare(
      `INSERT OR REPLACE INTO daily_stats (date, path, views, unique_visitors)
       SELECT
         ? as date,
         path,
         COUNT(*) as views,
         COUNT(DISTINCT visitor_id) as unique_visitors
       FROM page_events
       WHERE timestamp >= ? AND timestamp <= ?
       GROUP BY path`,
    ).run(target, dayStart, dayEnd);

    db.prepare(
      `INSERT OR REPLACE INTO referrer_stats (date, referrer, count)
       SELECT
         ? as date,
         referrer,
         COUNT(*) as count
       FROM page_events
       WHERE timestamp >= ? AND timestamp <= ? AND referrer IS NOT NULL
       GROUP BY referrer`,
    ).run(target, dayStart, dayEnd);

    const countRow = db
      .prepare('SELECT COUNT(*) as cnt FROM page_events WHERE timestamp >= ? AND timestamp <= ?')
      .get(dayStart, dayEnd) as { cnt: number };

    return countRow.cnt;
  });

  const eventsProcessed = transaction();
  return { aggregated: target, eventsProcessed, suspectedBots };
}

export function cleanupOldEvents(days = 90): number {
  const db = getRawDb();
  const cutoff = Date.now() - days * 24 * 60 * 60 * 1000;

  const result = db.prepare('DELETE FROM page_events WHERE timestamp < ?').run(cutoff);
  return result.changes;
}

export function cleanupOldSalts(days = 90): number {
  const db = getRawDb();
  const cutoff = new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString().slice(0, 10);

  const result = db.prepare('DELETE FROM daily_salts WHERE date < ?').run(cutoff);
  return result.changes;
}
