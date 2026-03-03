'use client';

import { useState, useEffect } from 'react';
import styles from './ThemeToggle.module.css';

function SunIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="5" />
      <line x1="12" y1="1" x2="12" y2="3" />
      <line x1="12" y1="21" x2="12" y2="23" />
      <line x1="4.22" y1="4.22" x2="5.64" y2="5.64" />
      <line x1="18.36" y1="18.36" x2="19.78" y2="19.78" />
      <line x1="1" y1="12" x2="3" y2="12" />
      <line x1="21" y1="12" x2="23" y2="12" />
      <line x1="4.22" y1="19.78" x2="5.64" y2="18.36" />
      <line x1="18.36" y1="5.64" x2="19.78" y2="4.22" />
    </svg>
  );
}

function MoonIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
    </svg>
  );
}

export function ThemeToggle() {
  const [mounted, setMounted] = useState(false);
  const [theme, setThemeState] = useState<'dark' | 'light'>('dark');

  useEffect(() => {
    const stored = localStorage.getItem('pt-theme');
    if (stored === 'light' || stored === 'dark') {
      setThemeState(stored);
    } else {
      const prefersLight = window.matchMedia('(prefers-color-scheme: light)').matches;
      setThemeState(prefersLight ? 'light' : 'dark');
    }
    setMounted(true);
  }, []);

  function toggleTheme() {
    const next = theme === 'dark' ? 'light' : 'dark';
    setThemeState(next);
    localStorage.setItem('pt-theme', next);
    document.documentElement.setAttribute('data-theme', next);
    document.documentElement.style.colorScheme = next;
  }

  const label = theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode';

  return (
    <button
      type="button"
      className={styles.toggle}
      onClick={toggleTheme}
      aria-label={label}
      title={label}
    >
      {mounted ? (theme === 'dark' ? <SunIcon /> : <MoonIcon />) : <div className={styles.placeholder} />}
    </button>
  );
}
