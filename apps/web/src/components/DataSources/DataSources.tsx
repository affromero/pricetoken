import { PRICING_PROVIDERS } from '@/lib/fetcher/providers';
import styles from './DataSources.module.css';

const PIPELINE_STEPS = [
  {
    number: 1,
    title: 'Scrape',
    description:
      'Puppeteer fetches each provider\'s official pricing page daily, extracting the raw text content.',
  },
  {
    number: 2,
    title: 'Extract',
    description:
      'An AI agent parses the raw text into structured pricing data — model IDs, prices, and context windows.',
  },
  {
    number: 3,
    title: 'Verify',
    description:
      'Three independent AI agents from different providers cross-check every data point. A model is only accepted when at least two agents agree and the price is consistent with historical data.',
  },
  {
    number: 4,
    title: 'Store',
    description:
      'Verified models are saved as timestamped snapshots in PostgreSQL, so you can track price changes over time.',
  },
];

export function DataSources() {
  const providers = Object.entries(PRICING_PROVIDERS);

  return (
    <div className={styles.root}>
      <div className={styles.pipeline}>
        {PIPELINE_STEPS.map((step) => (
          <div key={step.number} className={styles.step}>
            <div className={styles.stepNumber}>{step.number}</div>
            <div className={styles.stepContent}>
              <div className={styles.stepTitle}>{step.title}</div>
              <p className={styles.stepDescription}>{step.description}</p>
            </div>
          </div>
        ))}
      </div>

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
          While our multi-agent verification catches the vast majority of errors,
          prices may occasionally be inaccurate. Always verify against the official
          pricing page before making purchasing decisions.
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
