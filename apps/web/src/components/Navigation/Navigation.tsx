import Link from 'next/link';
import { ThemeToggle } from '@/components/ThemeToggle/ThemeToggle';
import styles from './Navigation.module.css';

export function Navigation() {
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
          </div>
          <ThemeToggle />
        </div>
      </div>
    </nav>
  );
}
