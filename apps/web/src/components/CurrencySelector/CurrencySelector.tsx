'use client';

import { useState, useEffect } from 'react';
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

  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored && CURRENCIES.some((c) => c.code === stored)) {
      setCurrency(stored);
      onChange(stored);
    }
  }, [onChange]);

  const handleChange = (code: string) => {
    setCurrency(code);
    localStorage.setItem(STORAGE_KEY, code);
    onChange(code);
  };

  return (
    <div className={styles.root}>
      <select
        className={styles.select}
        value={currency}
        onChange={(e) => handleChange(e.target.value)}
        aria-label="Currency"
      >
        {CURRENCIES.map((c) => (
          <option key={c.code} value={c.code}>
            {c.code} {c.symbol}
          </option>
        ))}
      </select>
    </div>
  );
}
