import type { ReferrerLandingPage } from '@/lib/analytics/query';
import styles from './ReferrerLandingTable.module.css';

export function ReferrerLandingTable({ data }: { data: ReferrerLandingPage[] }) {
  return (
    <div className={styles.card}>
      <h2 className={styles.cardTitle}>Referrer → Landing Page</h2>
      {data.length === 0 ? (
        <p className={styles.empty}>No referrer data</p>
      ) : (
        <table className={styles.table}>
          <thead>
            <tr>
              <th>Domain</th>
              <th>Landing Page</th>
              <th>Count</th>
            </tr>
          </thead>
          <tbody>
            {data.map((row) => (
              <tr key={`${row.domain}-${row.path}`}>
                <td className={styles.domain}>{row.domain}</td>
                <td className={styles.path}>{row.path}</td>
                <td>{row.count.toLocaleString()}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}
