import styles from './Footer.module.css';

export function Footer() {
  return (
    <footer className={styles.root}>
      <div className={styles.inner}>
        <span className={styles.brand}>PriceToken</span>
        <div className={styles.links}>
          <a
            href="https://github.com/affromero/pricetoken"
            className={styles.link}
            target="_blank"
            rel="noopener noreferrer"
          >
            GitHub
          </a>
          <a
            href="https://www.npmjs.com/package/pricetoken"
            className={styles.link}
            target="_blank"
            rel="noopener noreferrer"
          >
            npm
          </a>
          <a href="/api/health" className={styles.link}>
            Status
          </a>
        </div>
      </div>
    </footer>
  );
}
