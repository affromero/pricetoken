import { getRawDb } from './db';
import { classifyBot } from './bots';

export type BotFilter = 'humans' | 'bots' | 'all';

export interface QueryOptions {
  from: string; // YYYY-MM-DD
  to: string;
  botFilter?: BotFilter;
}

function botClause(filter: BotFilter = 'humans'): string {
  if (filter === 'humans') return ' AND bot_score <= 1';
  if (filter === 'bots') return ' AND bot_score >= 2';
  return '';
}

function toTimestamps(opts: QueryOptions): { fromTs: number; toTs: number } {
  return {
    fromTs: new Date(opts.from).getTime(),
    toTs: new Date(opts.to + 'T23:59:59.999Z').getTime(),
  };
}

export interface PageViewsOverTime {
  date: string;
  views: number;
  visitors: number;
}

export function getPageViewsOverTime(opts: QueryOptions): PageViewsOverTime[] {
  const db = getRawDb();
  const { fromTs, toTs } = toTimestamps(opts);
  const bot = botClause(opts.botFilter);

  return db
    .prepare(
      `SELECT
        date(timestamp / 1000, 'unixepoch') as date,
        COUNT(*) as views,
        COUNT(DISTINCT visitor_id) as visitors
      FROM page_events
      WHERE timestamp >= ? AND timestamp <= ?${bot}
      GROUP BY date
      ORDER BY date`,
    )
    .all(fromTs, toTs) as PageViewsOverTime[];
}

export interface TopPage {
  path: string;
  views: number;
  visitors: number;
}

export function getTopPages(opts: QueryOptions, limit = 10): TopPage[] {
  const db = getRawDb();
  const { fromTs, toTs } = toTimestamps(opts);
  const bot = botClause(opts.botFilter);

  return db
    .prepare(
      `SELECT
        path,
        COUNT(*) as views,
        COUNT(DISTINCT visitor_id) as visitors
      FROM page_events
      WHERE timestamp >= ? AND timestamp <= ?${bot}
      GROUP BY path
      ORDER BY views DESC
      LIMIT ?`,
    )
    .all(fromTs, toTs, limit) as TopPage[];
}

export interface ReferrerDomain {
  domain: string;
  count: number;
}

export function getTopReferrerDomains(opts: QueryOptions, limit = 10): ReferrerDomain[] {
  const db = getRawDb();
  const { fromTs, toTs } = toTimestamps(opts);
  const bot = botClause(opts.botFilter);

  return db
    .prepare(
      `SELECT
        SUBSTR(
          SUBSTR(referrer, INSTR(referrer, '://') + 3),
          1,
          CASE WHEN INSTR(SUBSTR(referrer, INSTR(referrer, '://') + 3), '/') > 0
            THEN INSTR(SUBSTR(referrer, INSTR(referrer, '://') + 3), '/') - 1
            ELSE LENGTH(SUBSTR(referrer, INSTR(referrer, '://') + 3))
          END
        ) as domain,
        COUNT(*) as count
      FROM page_events
      WHERE timestamp >= ? AND timestamp <= ? AND referrer IS NOT NULL${bot}
      GROUP BY domain
      ORDER BY count DESC
      LIMIT ?`,
    )
    .all(fromTs, toTs, limit) as ReferrerDomain[];
}

export interface ReferrerLandingPage {
  domain: string;
  path: string;
  count: number;
}

export function getReferrerLandingPages(opts: QueryOptions, limit = 20): ReferrerLandingPage[] {
  const db = getRawDb();
  const { fromTs, toTs } = toTimestamps(opts);
  const bot = botClause(opts.botFilter);

  return db
    .prepare(
      `SELECT
        SUBSTR(
          SUBSTR(referrer, INSTR(referrer, '://') + 3),
          1,
          CASE WHEN INSTR(SUBSTR(referrer, INSTR(referrer, '://') + 3), '/') > 0
            THEN INSTR(SUBSTR(referrer, INSTR(referrer, '://') + 3), '/') - 1
            ELSE LENGTH(SUBSTR(referrer, INSTR(referrer, '://') + 3))
          END
        ) as domain,
        path,
        COUNT(*) as count
      FROM page_events
      WHERE timestamp >= ? AND timestamp <= ? AND referrer IS NOT NULL${bot}
      GROUP BY domain, path
      ORDER BY count DESC
      LIMIT ?`,
    )
    .all(fromTs, toTs, limit) as ReferrerLandingPage[];
}

export interface DeviceBreakdown {
  device: string;
  count: number;
}

export function getDeviceBreakdown(opts: QueryOptions): DeviceBreakdown[] {
  const db = getRawDb();
  const { fromTs, toTs } = toTimestamps(opts);
  const bot = botClause(opts.botFilter);

  return db
    .prepare(
      `SELECT device, COUNT(*) as count
      FROM page_events
      WHERE timestamp >= ? AND timestamp <= ?${bot}
      GROUP BY device
      ORDER BY count DESC`,
    )
    .all(fromTs, toTs) as DeviceBreakdown[];
}

export interface BrowserBreakdown {
  browser: string;
  count: number;
}

export function getBrowserBreakdown(opts: QueryOptions): BrowserBreakdown[] {
  const db = getRawDb();
  const { fromTs, toTs } = toTimestamps(opts);
  const bot = botClause(opts.botFilter);

  return db
    .prepare(
      `SELECT browser, COUNT(*) as count
      FROM page_events
      WHERE timestamp >= ? AND timestamp <= ?${bot}
      GROUP BY browser
      ORDER BY count DESC`,
    )
    .all(fromTs, toTs) as BrowserBreakdown[];
}

export interface RealtimeStats {
  activeVisitors: number;
}

export function getRealtimeVisitors(): RealtimeStats {
  const db = getRawDb();
  const fiveMinAgo = Date.now() - 5 * 60 * 1000;

  const row = db
    .prepare(
      `SELECT COUNT(DISTINCT session_id) as activeVisitors
      FROM page_events
      WHERE timestamp >= ? AND bot_score <= 1`,
    )
    .get(fiveMinAgo) as { activeVisitors: number };

  return { activeVisitors: row.activeVisitors };
}

export interface TotalStats {
  totalViews: number;
  uniqueVisitors: number;
  bounceRate: number;
  avgDuration: number | null;
}

export function getTotalStats(opts: QueryOptions): TotalStats {
  const db = getRawDb();
  const { fromTs, toTs } = toTimestamps(opts);
  const bot = botClause(opts.botFilter);

  const stats = db
    .prepare(
      `SELECT
        COUNT(*) as totalViews,
        COUNT(DISTINCT visitor_id) as uniqueVisitors,
        AVG(duration_ms) as avgDuration
      FROM page_events
      WHERE timestamp >= ? AND timestamp <= ?${bot}`,
    )
    .get(fromTs, toTs) as { totalViews: number; uniqueVisitors: number; avgDuration: number | null };

  const bounceData = db
    .prepare(
      `SELECT
        COUNT(*) as total,
        SUM(CASE WHEN cnt = 1 THEN 1 ELSE 0 END) as bounced
      FROM (
        SELECT session_id, COUNT(*) as cnt
        FROM page_events
        WHERE timestamp >= ? AND timestamp <= ?${bot}
        GROUP BY session_id
      )`,
    )
    .get(fromTs, toTs) as { total: number; bounced: number };

  const bounceRate = bounceData.total > 0 ? (bounceData.bounced / bounceData.total) * 100 : 0;

  return {
    totalViews: stats.totalViews,
    uniqueVisitors: stats.uniqueVisitors,
    bounceRate: Math.round(bounceRate * 10) / 10,
    avgDuration: stats.avgDuration ? Math.round(stats.avgDuration) : null,
  };
}

export interface CountryBreakdown {
  country: string;
  count: number;
}

export function getCountryBreakdown(opts: QueryOptions, limit = 15): CountryBreakdown[] {
  const db = getRawDb();
  const { fromTs, toTs } = toTimestamps(opts);
  const bot = botClause(opts.botFilter);

  return db
    .prepare(
      `SELECT COALESCE(country, 'Unknown') as country, COUNT(*) as count
      FROM page_events
      WHERE timestamp >= ? AND timestamp <= ?${bot}
      GROUP BY COALESCE(country, 'Unknown')
      ORDER BY count DESC
      LIMIT ?`,
    )
    .all(fromTs, toTs, limit) as CountryBreakdown[];
}

export interface BotStats {
  totalBotHits: number;
  uniqueBots: number;
  suspectedBots: number;
  knownBots: number;
  topBots: { name: string; count: number }[];
}

export function getBotStats(opts: { from: string; to: string }): BotStats {
  const db = getRawDb();
  const fromTs = new Date(opts.from).getTime();
  const toTs = new Date(opts.to + 'T23:59:59.999Z').getTime();

  const totals = db
    .prepare(
      `SELECT
        COUNT(*) as totalBotHits,
        COUNT(DISTINCT user_agent) as uniqueBots,
        SUM(CASE WHEN bot_score = 2 THEN 1 ELSE 0 END) as suspectedBots,
        SUM(CASE WHEN bot_score = 3 THEN 1 ELSE 0 END) as knownBots
      FROM page_events
      WHERE timestamp >= ? AND timestamp <= ? AND bot_score >= 2`,
    )
    .get(fromTs, toTs) as {
    totalBotHits: number;
    uniqueBots: number;
    suspectedBots: number;
    knownBots: number;
  };

  const rawBots = db
    .prepare(
      `SELECT user_agent as userAgent, COUNT(*) as count
      FROM page_events
      WHERE timestamp >= ? AND timestamp <= ? AND bot_score >= 2
      GROUP BY user_agent
      ORDER BY count DESC
      LIMIT 50`,
    )
    .all(fromTs, toTs) as { userAgent: string; count: number }[];

  const nameMap = new Map<string, number>();
  for (const row of rawBots) {
    const classification = classifyBot(row.userAgent);
    const name = classification.name || 'Unknown Bot';
    nameMap.set(name, (nameMap.get(name) || 0) + row.count);
  }
  const topBots = [...nameMap.entries()]
    .map(([name, count]) => ({ name, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 10);

  return {
    totalBotHits: totals.totalBotHits,
    uniqueBots: totals.uniqueBots,
    suspectedBots: totals.suspectedBots,
    knownBots: totals.knownBots,
    topBots,
  };
}

export interface HumanStats {
  confirmedHumans: number;
  presumedHumans: number;
  total: number;
}

export function getHumanStats(opts: { from: string; to: string }): HumanStats {
  const db = getRawDb();
  const fromTs = new Date(opts.from).getTime();
  const toTs = new Date(opts.to + 'T23:59:59.999Z').getTime();

  const row = db
    .prepare(
      `SELECT
        SUM(CASE WHEN bot_score = 0 THEN 1 ELSE 0 END) as confirmedHumans,
        SUM(CASE WHEN bot_score = 1 THEN 1 ELSE 0 END) as presumedHumans,
        COUNT(*) as total
      FROM page_events
      WHERE timestamp >= ? AND timestamp <= ? AND bot_score <= 1`,
    )
    .get(fromTs, toTs) as { confirmedHumans: number; presumedHumans: number; total: number };

  return row;
}

export interface OsBreakdown {
  os: string;
  count: number;
}

export function getOsBreakdown(opts: QueryOptions): OsBreakdown[] {
  const db = getRawDb();
  const { fromTs, toTs } = toTimestamps(opts);
  const bot = botClause(opts.botFilter);

  return db
    .prepare(
      `SELECT os, COUNT(*) as count
      FROM page_events
      WHERE timestamp >= ? AND timestamp <= ?${bot}
      GROUP BY os
      ORDER BY count DESC`,
    )
    .all(fromTs, toTs) as OsBreakdown[];
}

export interface TopPageEngagement {
  path: string;
  views: number;
  visitors: number;
  avgDuration: number | null;
  avgScroll: number | null;
}

export function getTopPagesEngagement(opts: QueryOptions, limit = 10): TopPageEngagement[] {
  const db = getRawDb();
  const { fromTs, toTs } = toTimestamps(opts);
  const bot = botClause(opts.botFilter);

  return db
    .prepare(
      `SELECT
        path,
        COUNT(*) as views,
        COUNT(DISTINCT visitor_id) as visitors,
        AVG(duration_ms) as avgDuration,
        AVG(scroll_depth) as avgScroll
      FROM page_events
      WHERE timestamp >= ? AND timestamp <= ?${bot}
      GROUP BY path
      ORDER BY views DESC
      LIMIT ?`,
    )
    .all(fromTs, toTs, limit) as TopPageEngagement[];
}

export interface EntryExitPage {
  path: string;
  count: number;
}

export function getEntryPages(opts: QueryOptions, limit = 10): EntryExitPage[] {
  const db = getRawDb();
  const { fromTs, toTs } = toTimestamps(opts);
  const bot = botClause(opts.botFilter);

  return db
    .prepare(
      `SELECT path, COUNT(*) as count
      FROM (
        SELECT path, ROW_NUMBER() OVER (PARTITION BY session_id ORDER BY timestamp ASC) as rn
        FROM page_events
        WHERE timestamp >= ? AND timestamp <= ?${bot}
      )
      WHERE rn = 1
      GROUP BY path
      ORDER BY count DESC
      LIMIT ?`,
    )
    .all(fromTs, toTs, limit) as EntryExitPage[];
}

export function getExitPages(opts: QueryOptions, limit = 10): EntryExitPage[] {
  const db = getRawDb();
  const { fromTs, toTs } = toTimestamps(opts);
  const bot = botClause(opts.botFilter);

  return db
    .prepare(
      `SELECT path, COUNT(*) as count
      FROM (
        SELECT path, ROW_NUMBER() OVER (PARTITION BY session_id ORDER BY timestamp DESC) as rn
        FROM page_events
        WHERE timestamp >= ? AND timestamp <= ?${bot}
      )
      WHERE rn = 1
      GROUP BY path
      ORDER BY count DESC
      LIMIT ?`,
    )
    .all(fromTs, toTs, limit) as EntryExitPage[];
}

export interface SessionDepthBucket {
  depth: string;
  count: number;
}

export function getPagesPerSession(opts: QueryOptions): SessionDepthBucket[] {
  const db = getRawDb();
  const { fromTs, toTs } = toTimestamps(opts);
  const bot = botClause(opts.botFilter);

  return db
    .prepare(
      `SELECT
        CASE WHEN pages >= 5 THEN '5+' ELSE CAST(pages AS TEXT) END as depth,
        COUNT(*) as count
      FROM (
        SELECT session_id, COUNT(*) as pages
        FROM page_events
        WHERE timestamp >= ? AND timestamp <= ?${bot}
        GROUP BY session_id
      )
      GROUP BY depth
      ORDER BY depth`,
    )
    .all(fromTs, toTs) as SessionDepthBucket[];
}

export interface HourlyHeatmapCell {
  day: number;
  hour: number;
  count: number;
}

export function getHourlyHeatmap(opts: QueryOptions): HourlyHeatmapCell[] {
  const db = getRawDb();
  const { fromTs, toTs } = toTimestamps(opts);
  const bot = botClause(opts.botFilter);

  return db
    .prepare(
      `SELECT
        CAST(strftime('%w', timestamp / 1000, 'unixepoch') AS INTEGER) as day,
        CAST(strftime('%H', timestamp / 1000, 'unixepoch') AS INTEGER) as hour,
        COUNT(*) as count
      FROM page_events
      WHERE timestamp >= ? AND timestamp <= ?${bot}
      GROUP BY day, hour
      ORDER BY day, hour`,
    )
    .all(fromTs, toTs) as HourlyHeatmapCell[];
}
