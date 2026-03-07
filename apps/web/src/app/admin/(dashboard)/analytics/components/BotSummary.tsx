import type { BotStats, HumanStats } from '@/lib/analytics/query';
import styles from './BotSummary.module.css';

interface BotProps {
  mode: 'bots';
  stats: BotStats;
}

interface HumanProps {
  mode: 'humans';
  stats: HumanStats;
}

type Props = BotProps | HumanProps;

export function BotSummary(props: Props) {
  if (props.mode === 'humans') {
    const { stats } = props;
    return (
      <div className={styles.card}>
        <h2 className={styles.cardTitle}>Visitor Quality</h2>
        <div className={styles.stats}>
          <div className={styles.stat}>
            <span className={styles.statLabel}>Total Human</span>
            <span className={styles.statValue}>{stats.total.toLocaleString()}</span>
          </div>
          <div className={styles.stat}>
            <span className={styles.statLabel}>Confirmed (JS)</span>
            <span className={styles.statValue}>{stats.confirmedHumans.toLocaleString()}</span>
          </div>
          <div className={styles.stat}>
            <span className={styles.statLabel}>Presumed</span>
            <span className={styles.statValue}>{stats.presumedHumans.toLocaleString()}</span>
          </div>
        </div>
        <p className={styles.hint}>
          Confirmed = beacon received. Presumed = awaiting beacon or page still open.
        </p>
      </div>
    );
  }

  const { stats } = props;
  return (
    <div className={styles.card}>
      <h2 className={styles.cardTitle}>Bot Activity</h2>

      <div className={styles.stats}>
        <div className={styles.stat}>
          <span className={styles.statLabel}>Total Bot Hits</span>
          <span className={styles.statValue}>{stats.totalBotHits.toLocaleString()}</span>
        </div>
        <div className={styles.stat}>
          <span className={styles.statLabel}>Known Bots (UA)</span>
          <span className={styles.statValue}>{stats.knownBots.toLocaleString()}</span>
        </div>
        <div className={styles.stat}>
          <span className={styles.statLabel}>Suspected (no JS)</span>
          <span className={styles.statValue}>{stats.suspectedBots.toLocaleString()}</span>
        </div>
        <div className={styles.stat}>
          <span className={styles.statLabel}>Unique Bots</span>
          <span className={styles.statValue}>{stats.uniqueBots.toLocaleString()}</span>
        </div>
      </div>

      {stats.topBots.length > 0 && (
        <table className={styles.table}>
          <thead>
            <tr>
              <th>Bot</th>
              <th>Hits</th>
            </tr>
          </thead>
          <tbody>
            {stats.topBots.map((bot) => (
              <tr key={bot.name}>
                <td>{bot.name}</td>
                <td>{bot.count.toLocaleString()}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      {stats.topBots.length === 0 && (
        <p className={styles.empty}>No bot traffic detected yet</p>
      )}
    </div>
  );
}
