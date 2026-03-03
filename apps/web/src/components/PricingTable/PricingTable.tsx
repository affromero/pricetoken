'use client';

import { useState } from 'react';
import type { ModelPricing } from 'pricetoken';
import styles from './PricingTable.module.css';

interface PricingTableProps {
  pricing: ModelPricing[];
}

type SortKey = 'provider' | 'displayName' | 'inputPerMTok' | 'outputPerMTok';

const PROVIDER_COLORS: Record<string, string> = {
  anthropic: 'var(--pt-provider-anthropic)',
  openai: 'var(--pt-provider-openai)',
  google: 'var(--pt-provider-google)',
};

export function PricingTable({ pricing }: PricingTableProps) {
  const [sortKey, setSortKey] = useState<SortKey>('inputPerMTok');
  const [sortAsc, setSortAsc] = useState(true);
  const [filter, setFilter] = useState<string>('');

  const providers = [...new Set(pricing.map((m) => m.provider))];

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
    if (price < 0.01) return `$${price.toFixed(4)}`;
    if (price < 1) return `$${price.toFixed(3)}`;
    return `$${price.toFixed(2)}`;
  }

  return (
    <div className={styles.root}>
      <div className={styles.filters}>
        <button
          className={`${styles.chip} ${!filter ? styles.chipActive : ''}`}
          onClick={() => setFilter('')}
        >
          All
        </button>
        {providers.map((p) => (
          <button
            key={p}
            className={`${styles.chip} ${filter === p ? styles.chipActive : ''}`}
            onClick={() => setFilter(p)}
            style={{ '--chip-color': PROVIDER_COLORS[p] ?? 'var(--pt-accent)' } as React.CSSProperties}
          >
            {p}
          </button>
        ))}
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
                <td className={styles.price}>{formatPrice(model.inputPerMTok)}</td>
                <td className={styles.price}>{formatPrice(model.outputPerMTok)}</td>
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
