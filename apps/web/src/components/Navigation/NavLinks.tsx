'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import styles from './Navigation.module.css';

interface NavLinksProps {
  isAdmin: boolean;
}

export function NavLinks({ isAdmin }: NavLinksProps) {
  const [open, setOpen] = useState(false);

  const close = useCallback(() => setOpen(false), []);

  useEffect(() => {
    if (!open) return;
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') close();
    };
    document.addEventListener('keydown', handleKey);
    return () => document.removeEventListener('keydown', handleKey);
  }, [open, close]);

  return (
    <>
      <button
        className={`${styles.burger} ${open ? styles.burgerOpen : ''}`}
        onClick={() => setOpen(!open)}
        aria-label="Toggle navigation menu"
        aria-expanded={open}
      >
        <span />
        <span />
        <span />
      </button>
      <div className={`${styles.links} ${open ? styles.linksOpen : ''}`}>
        <Link href="/image" className={styles.link} onClick={close}>
          Image Pricing
        </Link>
        <Link href="/history" className={styles.link} onClick={close}>
          History
        </Link>
        <Link href="/calculator" className={styles.link} onClick={close}>
          Calculator
        </Link>
        <Link href="/compare" className={styles.link} onClick={close}>
          Compare
        </Link>
        <Link href="/docs" className={styles.link} onClick={close}>
          API Docs
        </Link>
        {isAdmin && (
          <Link href="/admin" className={styles.adminLink} onClick={close} title="Admin Panel">
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
    </>
  );
}
