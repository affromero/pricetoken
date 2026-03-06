import styles from './NonApiProviderCards.module.css';

interface NonApiProvider {
  id: string;
  displayName: string;
  description: string;
  websiteUrl: string;
  reason: string;
  pricingModel: string;
}

interface NonApiProviderCardsProps {
  providers: NonApiProvider[];
}

export function NonApiProviderCards({ providers }: NonApiProviderCardsProps) {
  return (
    <div className={styles.root}>
      <div className={styles.grid}>
        {providers.map((p) => (
          <a
            key={p.id}
            href={p.websiteUrl}
            target="_blank"
            rel="noopener noreferrer"
            className={styles.card}
          >
            <h3 className={styles.cardName}>{p.displayName}</h3>
            <p className={styles.cardDescription}>{p.description}</p>
            <div className={styles.cardMeta}>
              <span className={styles.pricingModel}>{p.pricingModel}</span>
              <span className={styles.reason}>{p.reason}</span>
            </div>
            <span className={styles.link}>Visit site &rarr;</span>
          </a>
        ))}
      </div>
    </div>
  );
}
