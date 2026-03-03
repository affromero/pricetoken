'use client';

import { useState, useCallback } from 'react';
import type { ModelPricing } from 'pricetoken';
import { ProviderFilterChips, PROVIDER_COLORS } from '@/components/ProviderFilterChips/ProviderFilterChips';
import { CurrencySelector } from '@/components/CurrencySelector/CurrencySelector';
import styles from './PricingTable.module.css';

interface PricingTableProps {
  pricing: ModelPricing[];
}

type SortKey = 'provider' | 'displayName' | 'inputPerMTok' | 'outputPerMTok';

export function PricingTable({ pricing: initialPricing }: PricingTableProps) {
  const [pricing, setPricing] = useState(initialPricing);
  const [sortKey, setSortKey] = useState<SortKey>('inputPerMTok');
  const [sortAsc, setSortAsc] = useState(true);
  const [filter, setFilter] = useState<string>('');
  const [currency, setCurrency] = useState('USD');

  const providers = [...new Set(pricing.map((m) => m.provider))];

  const handleCurrencyChange = useCallback(async (code: string) => {
    setCurrency(code);
    if (code === 'USD') {
      setPricing(initialPricing);
      return;
    }
    try {
      const res = await fetch(`/api/v1/pricing?currency=${code}`);
      if (res.ok) {
        const json = await res.json();
        setPricing(json.data);
      }
    } catch {
      // Fall back to initial pricing
    }
  }, [initialPricing]);

  const filtered = filter ? pricing.filter((m) => m.provider === filter) : pricing;

  const sorted = [...filtered].sort((a, b) => {
    const aVal = a[sortKey];
    const bVal = b[sortKey];
    if (typeof aVal === 'number' && typeof bVal === 'number') {
      return sortAsc ? aVal - bVal : bVal - aVal;
    }
    return sortAsc
      ? String(aVal).localeCompare(String(bVal))
      : String(bVal).localeCompare(String(aVal));
  });

  function handleSort(key: SortKey) {
    if (sortKey === key) {
      setSortAsc(!sortAsc);
    } else {
      setSortKey(key);
      setSortAsc(true);
    }
  }

  function formatPrice(price: number): string {
    if (price < 0.01) return `${price.toFixed(4)}`;
    if (price < 1) return `${price.toFixed(3)}`;
    return `${price.toFixed(2)}`;
  }

  const currencySymbol = currency === 'USD' ? '$' : `${currency} `;

  return (
    <div className={styles.root}>
      <div className={styles.filters}>
        <ProviderFilterChips providers={providers} selected={filter} onSelect={setFilter} />
        <CurrencySelector onChange={handleCurrencyChange} />
      </div>

      <div className={styles.tableWrapper}>
        <table className={styles.table}>
          <thead>
            <tr>
              <th onClick={() => handleSort('provider')} className={styles.sortable}>
                Provider {sortKey === 'provider' ? (sortAsc ? '↑' : '↓') : ''}
              </th>
              <th onClick={() => handleSort('displayName')} className={styles.sortable}>
                Model {sortKey === 'displayName' ? (sortAsc ? '↑' : '↓') : ''}
              </th>
              <th onClick={() => handleSort('inputPerMTok')} className={styles.sortable}>
                Input/MTok {sortKey === 'inputPerMTok' ? (sortAsc ? '↑' : '↓') : ''}
              </th>
              <th onClick={() => handleSort('outputPerMTok')} className={styles.sortable}>
                Output/MTok {sortKey === 'outputPerMTok' ? (sortAsc ? '↑' : '↓') : ''}
              </th>
              <th>Context</th>
            </tr>
          </thead>
          <tbody>
            {sorted.map((model) => (
              <tr key={model.modelId}>
                <td>
                  <span
                    className={styles.providerDot}
                    style={{ background: PROVIDER_COLORS[model.provider] ?? 'var(--pt-accent)' }}
                  />
                  {model.provider}
                </td>
                <td className={styles.modelName}>{model.displayName}</td>
                <td className={styles.price}>{currencySymbol}{formatPrice(model.inputPerMTok)}</td>
                <td className={styles.price}>{currencySymbol}{formatPrice(model.outputPerMTok)}</td>
                <td className={styles.context}>
                  {model.contextWindow ? `${(model.contextWindow / 1000).toFixed(0)}K` : '—'}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
