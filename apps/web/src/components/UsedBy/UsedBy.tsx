import { getAdopters } from '@/lib/github-adopters';
import styles from './UsedBy.module.css';

export async function UsedBy() {
  const adopters = await getAdopters();

  if (adopters.length === 0) return null;

  return (
    <section className={styles.section}>
      <h2 className={styles.sectionTitle}>Used by</h2>
      <div className={styles.row}>
        {adopters.map((adopter) => (
          <a
            key={adopter.fullName}
            href={adopter.htmlUrl}
            target="_blank"
            rel="noopener noreferrer"
            className={styles.card}
          >
            <img
              src={adopter.avatarUrl}
              alt={adopter.fullName}
              className={styles.avatar}
              width={32}
              height={32}
            />
            <div className={styles.info}>
              <span className={styles.name}>{adopter.fullName}</span>
              {adopter.description && (
                <span className={styles.desc}>{adopter.description}</span>
              )}
              <span className={styles.badge}>{adopter.file}</span>
            </div>
          </a>
        ))}
      </div>
    </section>
  );
}
