import { cookies } from 'next/headers';
import Link from 'next/link';
import { ThemeToggle } from '@/components/ThemeToggle/ThemeToggle';
import { COOKIE_NAME, verifySessionToken } from '@/lib/admin-auth';
import styles from './Navigation.module.css';

async function isAdmin(): Promise<boolean> {
  const cookieStore = await cookies();
  const token = cookieStore.get(COOKIE_NAME)?.value;
  if (!token) return false;
  return verifySessionToken(token);
}

export async function Navigation() {
  const admin = await isAdmin();

  return (
    <nav className={styles.root}>
      <div className={styles.inner}>
        <Link href="/" className={styles.logo}>
          PriceToken
        </Link>
        <div className={styles.actions}>
          <div className={styles.links}>
            <Link href="/history" className={styles.link}>
              History
            </Link>
            <Link href="/calculator" className={styles.link}>
              Calculator
            </Link>
            <Link href="/compare" className={styles.link}>
              Compare
            </Link>
            <Link href="/docs" className={styles.link}>
              API Docs
            </Link>
            {admin && (
              <Link href="/admin" className={styles.adminLink} title="Admin Panel">
                <svg
                  width="16"
                  height="16"
                  viewBox="0 0 16 16"
                  fill="none"
                  aria-hidden="true"
                >
                  <path
                    d="M8 1.5a1.25 1.25 0 0 1 1.177.824l.963 2.681 2.825.213a1.25 1.25 0 0 1 .712 2.19l-2.142 1.818.658 2.77a1.25 1.25 0 0 1-1.863 1.354L8 11.885 5.67 13.35a1.25 1.25 0 0 1-1.863-1.354l.658-2.77-2.142-1.818a1.25 1.25 0 0 1 .712-2.19l2.825-.213.963-2.681A1.25 1.25 0 0 1 8 1.5Z"
                    fill="currentColor"
                  />
                </svg>
              </Link>
            )}
          </div>
          <ThemeToggle />
        </div>
      </div>
    </nav>
  );
}
