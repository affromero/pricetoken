import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { COOKIE_NAME, verifySessionToken } from '@/lib/admin-auth';
import { LogoutButton } from '@/components/LogoutButton/LogoutButton';
import styles from './layout.module.css';

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const cookieStore = await cookies();
  const token = cookieStore.get(COOKIE_NAME)?.value;
  const valid = token ? await verifySessionToken(token) : false;
  if (!valid) redirect('/admin/login');

  return (
    <div className={styles.root}>
      <aside className={styles.sidebar}>
        <div className={styles.sidebarHeader}>
          <div className={styles.sidebarTitle}>Admin</div>
          <LogoutButton />
        </div>
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
          <Link href="/admin/downloads" className={styles.navLink}>
            Downloads
          </Link>
        </nav>
      </aside>
      <main className={styles.content}>{children}</main>
    </div>
  );
}
