import type { TotalStats } from '@/lib/analytics/query';
import styles from './OverviewCards.module.css';

function formatDuration(ms: number | null): string {
  if (ms === null) return '—';
  const seconds = Math.round(ms / 1000);
  if (seconds < 60) return `${seconds}s`;
  const minutes = Math.floor(seconds / 60);
  const remaining = seconds % 60;
  return `${minutes}m ${remaining}s`;
}

export function OverviewCards({ totals }: { totals: TotalStats }) {
  const cards = [
    { label: 'Page Views', value: totals.totalViews.toLocaleString() },
    { label: 'Unique Visitors', value: totals.uniqueVisitors.toLocaleString() },
    { label: 'Bounce Rate', value: `${totals.bounceRate}%` },
    { label: 'Avg Duration', value: formatDuration(totals.avgDuration) },
  ];

  return (
    <div className={styles.grid}>
      {cards.map((card) => (
        <div key={card.label} className={styles.card}>
          <span className={styles.label}>{card.label}</span>
          <span className={styles.value}>{card.value}</span>
        </div>
      ))}
    </div>
  );
}
