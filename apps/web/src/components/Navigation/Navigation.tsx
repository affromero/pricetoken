import { cookies } from 'next/headers';
import Link from 'next/link';
import { ThemeToggle } from '@/components/ThemeToggle/ThemeToggle';
import { NavLinks } from './NavLinks';
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
          <NavLinks isAdmin={admin} />
          <ThemeToggle />
        </div>
      </div>
    </nav>
  );
}
