import { PRICING_PROVIDERS } from '@/lib/fetcher/providers';
import styles from './DataSources.module.css';

export function DataSources() {
  const providers = Object.entries(PRICING_PROVIDERS);

  return (
    <div className={styles.root}>
      <p className={styles.description}>
        Pricing data is extracted daily from official provider pricing pages using AI.
        Each run creates a timestamped snapshot in PostgreSQL, so you can track price
        changes over time.
      </p>

      <div className={styles.grid}>
        {providers.map(([key, provider]) => (
          <a
            key={key}
            href={provider.url}
            target="_blank"
            rel="noopener noreferrer"
            className={styles.card}
          >
            <span
              className={styles.dot}
              style={{ background: `var(--pt-provider-${key})` }}
            />
            <span className={styles.providerName}>{provider.displayName}</span>
            <span className={styles.arrow}>&rarr;</span>
          </a>
        ))}
      </div>

      <div className={styles.notices}>
        <p>
          Prices are extracted by an LLM and may occasionally be inaccurate.
          Always verify against the official pricing page before making purchasing decisions.
        </p>
        <p>
          Missing a provider or found a wrong price?{' '}
          <a
            href="https://github.com/affromero/pricetoken/issues"
            target="_blank"
            rel="noopener noreferrer"
          >
            Open an issue
          </a>{' '}
          or{' '}
          <a
            href="https://github.com/affromero/pricetoken/pulls"
            target="_blank"
            rel="noopener noreferrer"
          >
            submit a PR
          </a>.
        </p>
      </div>
    </div>
  );
}
