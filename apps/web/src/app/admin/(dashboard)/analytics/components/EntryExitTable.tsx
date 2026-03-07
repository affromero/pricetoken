import type { EntryExitPage } from '@/lib/analytics/query';
import styles from './EntryExitTable.module.css';

function PageTable({ title, pages }: { title: string; pages: EntryExitPage[] }) {
  return (
    <div className={styles.card}>
      <h2 className={styles.cardTitle}>{title}</h2>
      {pages.length === 0 ? (
        <p className={styles.empty}>No data</p>
      ) : (
        <table className={styles.table}>
          <thead>
            <tr>
              <th>Page</th>
              <th>Sessions</th>
            </tr>
          </thead>
          <tbody>
            {pages.map((page) => (
              <tr key={page.path}>
                <td className={styles.path}>{page.path}</td>
                <td>{page.count.toLocaleString()}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}

export function EntryExitTable({ entryPages, exitPages }: { entryPages: EntryExitPage[]; exitPages: EntryExitPage[] }) {
  return (
    <div className={styles.container}>
      <PageTable title="Entry Pages" pages={entryPages} />
      <PageTable title="Exit Pages" pages={exitPages} />
    </div>
  );
}
