import Link from 'next/link';
import styles from './layout.module.css';

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className={styles.root}>
      <aside className={styles.sidebar}>
        <div className={styles.sidebarTitle}>Admin</div>
        <nav className={styles.nav}>
          <Link href="/admin" className={styles.navLink}>
            Overview
          </Link>
          <Link href="/admin/config" className={styles.navLink}>
            Config
          </Link>
          <Link href="/admin/costs" className={styles.navLink}>
            Costs
          </Link>
          <Link href="/admin/alerts" className={styles.navLink}>
            Alerts
          </Link>
          <Link href="/admin/fetch-status" className={styles.navLink}>
            Fetch Status
          </Link>
        </nav>
      </aside>
      <main className={styles.content}>{children}</main>
    </div>
  );
}
