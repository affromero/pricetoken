'use client';

import { useState, useCallback } from 'react';
import type { MusicModelPricing } from 'pricetoken';
import { ProviderFilterChips, PROVIDER_COLORS } from '@/components/ProviderFilterChips/ProviderFilterChips';
import { CurrencySelector } from '@/components/CurrencySelector/CurrencySelector';
import { StatusBadge } from '@/components/StatusBadge/StatusBadge';
import { FreshnessIndicator } from '@/components/FreshnessIndicator/FreshnessIndicator';
import styles from './MusicPricingTable.module.css';

interface MusicPricingTableProps {
  pricing: MusicModelPricing[];
}

type SortKey = 'provider' | 'displayName' | 'costPerMinute' | 'outputFormat' | 'confidenceScore' | 'launchDate';

export function MusicPricingTable({ pricing: initialPricing }: MusicPricingTableProps) {
  const [pricing, setPricing] = useState(initialPricing);
  const [sortKey, setSortKey] = useState<SortKey>('costPerMinute');
  const [sortAsc, setSortAsc] = useState(true);
  const [filter, setFilter] = useState<string>('');
  const [hideDeprecated, setHideDeprecated] = useState(true);
  const [currency, setCurrency] = useState('USD');

  const providers = [...new Set(pricing.map((m) => m.provider))];

  const handleCurrencyChange = useCallback(async (code: string) => {
    setCurrency(code);
    if (code === 'USD') {
      setPricing(initialPricing);
      return;
    }
    try {
      const res = await fetch(`/api/v1/music?currency=${code}`);
      if (res.ok) {
        const json = await res.json();
        setPricing(json.data);
      }
    } catch {
      // Fall back to initial pricing
    }
  }, [initialPricing]);

  let filtered = filter ? pricing.filter((m) => m.provider === filter) : pricing;
  if (hideDeprecated) {
    filtered = filtered.filter((m) => m.status !== 'deprecated');
  }

  const sorted = [...filtered].sort((a, b) => {
    if (sortKey === 'launchDate') {
      const aDate = a.launchDate ?? '';
      const bDate = b.launchDate ?? '';
      if (!aDate && !bDate) return 0;
      if (!aDate) return 1;
      if (!bDate) return -1;
      return sortAsc ? aDate.localeCompare(bDate) : bDate.localeCompare(aDate);
    }
    if (sortKey === 'outputFormat') {
      const aVal = a.outputFormat ?? '';
      const bVal = b.outputFormat ?? '';
      return sortAsc ? aVal.localeCompare(bVal) : bVal.localeCompare(aVal);
    }
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

  function formatLaunchDate(iso: string): string {
    const [year, month] = iso.split('-');
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    return `${months[parseInt(month!, 10) - 1]} ${year}`;
  }

  function formatPrice(price: number): string {
    if (price < 0.01) return `${price.toFixed(3)}`;
    if (price < 1) return `${price.toFixed(3)}`;
    return `${price.toFixed(2)}`;
  }

  function formatDuration(seconds: number | null): string {
    if (!seconds) return '—';
    if (seconds >= 60) return `${(seconds / 60).toFixed(0)}min`;
    return `${seconds}s`;
  }

  const currencySymbol = currency === 'USD' ? '$' : `${currency} `;

  return (
    <div className={styles.root}>
      <div className={styles.filters}>
        <ProviderFilterChips providers={providers} selected={filter} onSelect={setFilter} />
        <label className={styles.toggleLabel}>
          <input
            type="checkbox"
            checked={hideDeprecated}
            onChange={(e) => setHideDeprecated(e.target.checked)}
            className={styles.toggleCheckbox}
          />
          Hide deprecated
        </label>
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
              <th onClick={() => handleSort('costPerMinute')} className={styles.sortable}>
                Cost/Min {sortKey === 'costPerMinute' ? (sortAsc ? '↑' : '↓') : ''}
              </th>
              <th onClick={() => handleSort('outputFormat')} className={styles.sortable}>
                Format {sortKey === 'outputFormat' ? (sortAsc ? '↑' : '↓') : ''}
              </th>
              <th>Vocals</th>
              <th>Max Duration</th>
              <th onClick={() => handleSort('confidenceScore')} className={styles.sortable}>
                Freshness {sortKey === 'confidenceScore' ? (sortAsc ? '↑' : '↓') : ''}
              </th>
              <th onClick={() => handleSort('launchDate')} className={styles.sortable}>
                Launched {sortKey === 'launchDate' ? (sortAsc ? '↑' : '↓') : ''}
              </th>
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
                <td className={styles.modelName}>
                  {model.displayName}
                  <StatusBadge status={model.status} confidence={model.confidence} source={model.source} freshness={model.freshness} official={model.official} />
                </td>
                <td className={styles.price}>
                  {currencySymbol}{formatPrice(model.costPerMinute)}
                  {model.pricingNote && (
                    <span
                      className={styles.priceNote}
                      data-tooltip={model.pricingNote}
                    >
                      ⓘ
                    </span>
                  )}
                </td>
                <td className={styles.meta}>{model.outputFormat ?? '—'}</td>
                <td className={styles.meta}>{model.vocals == null ? '—' : model.vocals ? 'Yes' : 'No'}</td>
                <td className={styles.meta}>{formatDuration(model.maxDuration)}</td>
                <td className={styles.freshness}>
                  <FreshnessIndicator
                    freshness={model.freshness}
                    confidenceScore={model.confidenceScore}
                    confidenceLevel={model.confidenceLevel}
                    source={model.source}
                  />
                </td>
                <td className={styles.date}>
                  {model.launchDate ? formatLaunchDate(model.launchDate) : '—'}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
