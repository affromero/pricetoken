import { createHash, randomBytes } from 'crypto';
import { getRawDb } from './db';

function getDateString(date: Date = new Date()): string {
  return date.toISOString().slice(0, 10);
}

function getDailySalt(date: string): string {
  const db = getRawDb();

  const row = db.prepare('SELECT salt FROM daily_salts WHERE date = ?').get(date) as
    | { salt: string }
    | undefined;

  if (row) return row.salt;

  const salt = randomBytes(32).toString('hex');
  db.prepare('INSERT OR IGNORE INTO daily_salts (date, salt) VALUES (?, ?)').run(date, salt);

  return salt;
}

function hash(input: string): string {
  return createHash('sha256').update(input).digest('hex').slice(0, 16);
}

export function generateVisitorId(ip: string, userAgent: string): string {
  const date = getDateString();
  const salt = getDailySalt(date);
  return hash(`${ip}|${userAgent}|${salt}`);
}

export function generateSessionId(ip: string, userAgent: string): string {
  const now = Date.now();
  const bucket = Math.floor(now / (30 * 60 * 1000));
  return hash(`${ip}|${userAgent}|${bucket}`);
}
