import { getAdopters } from '@/lib/github-adopters';
import styles from './TrustedBy.module.css';

export async function TrustedBy() {
  const adopters = await getAdopters();

  if (adopters.length === 0) return null;

  return (
    <section className={styles.section}>
      <p className={styles.label}>Trusted by</p>
      <div className={styles.grid}>
        {adopters.map((adopter) => (
          <a
            key={adopter.fullName}
            href={adopter.htmlUrl}
            target="_blank"
            rel="noopener noreferrer"
            className={styles.card}
          >
            <div className={styles.logoWrap}>
              <img
                src={adopter.avatarUrl}
                alt=""
                className={styles.logo}
                width={44}
                height={44}
              />
            </div>
            <div className={styles.info}>
              <span className={styles.name}>
                {adopter.displayName ?? adopter.fullName.split('/')[0]}
              </span>
              {adopter.description && (
                <span className={styles.desc}>{adopter.description}</span>
              )}
            </div>
            <svg
              className={styles.arrow}
              width="16"
              height="16"
              viewBox="0 0 16 16"
              fill="none"
              aria-hidden="true"
            >
              <path
                d="M6 3l5 5-5 5"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </a>
        ))}
      </div>
    </section>
  );
}
