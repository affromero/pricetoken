import { prisma } from '@/lib/prisma';
import { getFetcherConfig } from '@/lib/fetcher-config';
import { EXTRACTION_PROVIDERS } from '@/lib/fetcher/ai-registry';
import { getRecentWarnings } from '@/lib/fetcher/store';
import styles from './page.module.css';

export const dynamic = 'force-dynamic';

export default async function AdminOverviewPage() {
  const [config, totalModels, providers, lastSnapshot, warnings, lowConfidenceCount] = await Promise.all([
    getFetcherConfig(),
    prisma.modelPricingSnapshot.count(),
    prisma.modelPricingSnapshot
      .findMany({ select: { provider: true }, distinct: ['provider'] })
      .then((rows) => rows.map((r) => r.provider)),
    prisma.modelPricingSnapshot.findFirst({
      orderBy: { createdAt: 'desc' },
      select: { createdAt: true },
    }),
    getRecentWarnings(7),
    prisma.modelPricingSnapshot.count({ where: { confidence: 'low' } }),
  ]);

  const extractionProvider = EXTRACTION_PROVIDERS[config.extractionProvider];

  return (
    <>
      <h1 className={styles.cardLabel} style={{ fontSize: '1.5rem', marginBottom: '1.5rem', color: 'var(--pt-text)' }}>
        Overview
      </h1>

      {(warnings.length > 0 || lowConfidenceCount > 0) && (
        <div className={styles.warningsSection}>
          {warnings.map((w, i) => (
            <div key={i} className={styles.warningCard}>
              <span className={styles.warningIcon}>!</span>
              {w.message}
            </div>
          ))}
          {lowConfidenceCount > 0 && (
            <div className={styles.warningCard}>
              <span className={styles.warningIcon}>!</span>
              {lowConfidenceCount} snapshot(s) with low confidence data
            </div>
          )}
        </div>
      )}

      <div className={styles.grid}>
        <div className={styles.card}>
          <div className={styles.cardLabel}>Total Models</div>
          <div className={styles.cardValue}>{totalModels}</div>
        </div>
        <div className={styles.card}>
          <div className={styles.cardLabel}>Providers</div>
          <div className={styles.cardValue}>{providers.length}</div>
          <div className={styles.cardSubtext}>{providers.join(', ')}</div>
        </div>
        <div className={styles.card}>
          <div className={styles.cardLabel}>Last Fetch</div>
          <div className={styles.cardValue}>
            {lastSnapshot
              ? new Date(lastSnapshot.createdAt).toLocaleDateString()
              : 'Never'}
          </div>
          {lastSnapshot && (
            <div className={styles.cardSubtext}>
              {new Date(lastSnapshot.createdAt).toLocaleTimeString()}
            </div>
          )}
        </div>
        <div className={styles.card}>
          <div className={styles.cardLabel}>Extraction</div>
          <div className={styles.cardValue}>
            {extractionProvider?.displayName ?? config.extractionProvider}
          </div>
          <div className={styles.cardSubtext}>{config.extractionModel}</div>
        </div>
      </div>
    </>
  );
}
