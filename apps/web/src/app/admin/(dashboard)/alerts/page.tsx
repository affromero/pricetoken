import { prisma } from '@/lib/prisma';
import { getRecentWarnings } from '@/lib/fetcher/store';
import styles from './page.module.css';

export const dynamic = 'force-dynamic';

export default async function AdminAlertsPage() {
  const [warnings, lowConfidenceModels] = await Promise.all([
    getRecentWarnings(30),
    prisma.modelPricingSnapshot.findMany({
      where: { confidence: 'low' },
      select: {
        modelId: true,
        provider: true,
        displayName: true,
        createdAt: true,
      },
      orderBy: { createdAt: 'desc' },
    }),
  ]);

  return (
    <>
      <h1 className={styles.title}>Alerts</h1>

      <div className={styles.section}>
        <h2 className={styles.sectionTitle}>Missing Models (last 30 days)</h2>
        {warnings.length === 0 ? (
          <p className={styles.empty}>No missing model alerts.</p>
        ) : (
          <div className={styles.alertList}>
            {warnings.map((w, i) => (
              <div key={i} className={styles.alertCard}>
                <span className={styles.alertIcon}>!</span>
                <div className={styles.alertContent}>
                  {w.message}
                  {w.modelIds && w.modelIds.length > 0 && (
                    <div className={styles.alertModels}>{w.modelIds.join(', ')}</div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className={styles.section}>
        <h2 className={styles.sectionTitle}>Low Confidence Snapshots</h2>
        {lowConfidenceModels.length === 0 ? (
          <p className={styles.empty}>No low confidence data.</p>
        ) : (
          <table className={styles.lowConfTable}>
            <thead>
              <tr>
                <th>Model</th>
                <th>Provider</th>
                <th>Date</th>
              </tr>
            </thead>
            <tbody>
              {lowConfidenceModels.map((m) => (
                <tr key={`${m.modelId}-${m.createdAt.toISOString()}`}>
                  <td>{m.displayName || m.modelId}</td>
                  <td>{m.provider}</td>
                  <td>{new Date(m.createdAt).toLocaleDateString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </>
  );
}
