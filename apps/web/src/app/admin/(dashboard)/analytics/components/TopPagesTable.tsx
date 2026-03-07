import type { TopPageEngagement } from '@/lib/analytics/query';
import styles from './TopPagesTable.module.css';

function formatDuration(ms: number | null): string {
  if (ms === null) return '—';
  const seconds = Math.round(ms / 1000);
  if (seconds < 60) return `${seconds}s`;
  return `${Math.floor(seconds / 60)}m ${seconds % 60}s`;
}

function formatScroll(depth: number | null): string {
  if (depth === null) return '—';
  return `${Math.round(depth * 100)}%`;
}

export function TopPagesTable({ pages }: { pages: TopPageEngagement[] }) {
  return (
    <div className={styles.card}>
      <h2 className={styles.cardTitle}>Top Pages</h2>
      {pages.length === 0 ? (
        <p className={styles.empty}>No data</p>
      ) : (
        <table className={styles.table}>
          <thead>
            <tr>
              <th>Page</th>
              <th>Views</th>
              <th>Visitors</th>
              <th>Avg Duration</th>
              <th>Avg Scroll</th>
            </tr>
          </thead>
          <tbody>
            {pages.map((page) => (
              <tr key={page.path}>
                <td className={styles.path}>{page.path}</td>
                <td>{page.views.toLocaleString()}</td>
                <td>{page.visitors.toLocaleString()}</td>
                <td>{formatDuration(page.avgDuration)}</td>
                <td>{formatScroll(page.avgScroll)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}
