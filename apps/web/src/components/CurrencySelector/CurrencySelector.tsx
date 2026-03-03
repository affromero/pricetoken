'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import styles from './CurrencySelector.module.css';

const CURRENCIES = [
  { code: 'USD', symbol: '$' },
  { code: 'EUR', symbol: '€' },
  { code: 'GBP', symbol: '£' },
  { code: 'JPY', symbol: '¥' },
  { code: 'CAD', symbol: 'C$' },
  { code: 'AUD', symbol: 'A$' },
  { code: 'BRL', symbol: 'R$' },
  { code: 'INR', symbol: '₹' },
  { code: 'KRW', symbol: '₩' },
  { code: 'COP', symbol: 'COL$' },
];

const STORAGE_KEY = 'pt-currency';

interface CurrencySelectorProps {
  onChange: (currency: string) => void;
}

export function CurrencySelector({ onChange }: CurrencySelectorProps) {
  const [currency, setCurrency] = useState('USD');
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored && CURRENCIES.some((c) => c.code === stored)) {
      setCurrency(stored);
      onChange(stored);
    }
  }, [onChange]);

  const select = useCallback(
    (code: string) => {
      setCurrency(code);
      localStorage.setItem(STORAGE_KEY, code);
      onChange(code);
      setOpen(false);
    },
    [onChange],
  );

  useEffect(() => {
    if (!open) return;

    function onClickOutside(e: MouseEvent) {
      if (rootRef.current && !rootRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    function onEscape(e: KeyboardEvent) {
      if (e.key === 'Escape') setOpen(false);
    }

    document.addEventListener('mousedown', onClickOutside);
    document.addEventListener('keydown', onEscape);
    return () => {
      document.removeEventListener('mousedown', onClickOutside);
      document.removeEventListener('keydown', onEscape);
    };
  }, [open]);

  const current = CURRENCIES.find((c) => c.code === currency) ?? CURRENCIES[0]!;

  return (
    <div className={styles.root} ref={rootRef}>
      <button
        className={`${styles.trigger} ${open ? styles.triggerOpen : ''}`}
        onClick={() => setOpen(!open)}
        aria-expanded={open}
        aria-haspopup="listbox"
        aria-label="Select currency"
      >
        <span className={styles.triggerSymbol}>{current.symbol}</span>
        <span className={styles.triggerCode}>{current.code}</span>
        <svg
          className={styles.chevron}
          width="10"
          height="6"
          viewBox="0 0 10 6"
          fill="none"
          aria-hidden="true"
        >
          <path d="M1 1L5 5L9 1" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </button>

      <div className={`${styles.dropdown} ${open ? styles.dropdownOpen : ''}`} role="listbox">
        {CURRENCIES.map((c) => (
          <button
            key={c.code}
            className={`${styles.option} ${c.code === currency ? styles.optionActive : ''}`}
            onClick={() => select(c.code)}
            role="option"
            aria-selected={c.code === currency}
          >
            <span className={styles.optionSymbol}>{c.symbol}</span>
            <span className={styles.optionCode}>{c.code}</span>
          </button>
        ))}
      </div>
    </div>
  );
}
