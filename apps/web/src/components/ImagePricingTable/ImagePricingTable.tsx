'use client';

import { useState, useCallback } from 'react';
import type { ImageModelPricing } from 'pricetoken';
import { ProviderFilterChips, PROVIDER_COLORS } from '@/components/ProviderFilterChips/ProviderFilterChips';
import { CurrencySelector } from '@/components/CurrencySelector/CurrencySelector';
import { StatusBadge } from '@/components/StatusBadge/StatusBadge';
import { FreshnessIndicator } from '@/components/FreshnessIndicator/FreshnessIndicator';
import styles from './ImagePricingTable.module.css';

interface ImagePricingTableProps {
  data: ImageModelPricing[];
}

const QUALITY_LABELS: Record<string, string> = {
  standard: 'Standard',
  hd: 'HD',
  ultra: 'Ultra',
};

const PROVIDER_DISPLAY_NAMES: Record<string, string> = {
  openai: 'OpenAI',
  google: 'Google',
  stability: 'Stability AI',
  bfl: 'Black Forest Labs',
  'black-forest-labs': 'Black Forest Labs',
  amazon: 'Amazon',
  recraft: 'Recraft',
  mistral: 'Mistral',
  bytedance: 'Bytedance',
  fal: 'fal.ai',
  ideogram: 'Ideogram',
  xai: 'xAI',
};

type SortKey = 'provider' | 'displayName' | 'pricePerImage' | 'qualityTier' | 'confidenceScore' | 'launchDate';

function formatPrice(price: number): string {
  if (price < 0.001) return `${price.toFixed(4)}`;
  return `${price.toFixed(3)}`;
}

function formatLaunchDate(iso: string): string {
  const [year, month] = iso.split('-');
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  return `${months[parseInt(month!, 10) - 1]} ${year}`;
}

export function ImagePricingTable({ data: initialData }: ImagePricingTableProps) {
  const [data, setData] = useState(initialData);
  const [sortKey, setSortKey] = useState<SortKey>('pricePerImage');
  const [sortAsc, setSortAsc] = useState(true);
  const [filter, setFilter] = useState<string>('');
  const [currency, setCurrency] = useState('USD');
  const [hideDeprecated, setHideDeprecated] = useState(true);

  const providers = [...new Set(data.map((m) => m.provider))];

  const handleCurrencyChange = useCallback(async (code: string) => {
    setCurrency(code);
    if (code === 'USD') {
      setData(initialData);
      return;
    }
    try {
      const res = await fetch(`/api/v1/image?currency=${code}`);
      if (res.ok) {
        const json = await res.json();
        setData(json.data);
      }
    } catch {
      // Fall back to initial data
    }
  }, [initialData]);

  let filtered = filter ? data.filter((m) => m.provider === filter) : data;
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

  const currencySymbol = currency === 'USD' ? '$' : `${currency} `;

  return (
    <div className={styles.root}>
      <div className={styles.filters}>
        <ProviderFilterChips providers={providers} selected={filter} onSelect={setFilter} displayNames={PROVIDER_DISPLAY_NAMES} />
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
                Provider {sortKey === 'provider' ? (sortAsc ? '\u2191' : '\u2193') : ''}
              </th>
              <th onClick={() => handleSort('displayName')} className={styles.sortable}>
                Model {sortKey === 'displayName' ? (sortAsc ? '\u2191' : '\u2193') : ''}
              </th>
              <th onClick={() => handleSort('pricePerImage')} className={styles.sortable}>
                $/Image {sortKey === 'pricePerImage' ? (sortAsc ? '\u2191' : '\u2193') : ''}
              </th>
              <th onClick={() => handleSort('qualityTier')} className={styles.sortable}>
                Quality {sortKey === 'qualityTier' ? (sortAsc ? '\u2191' : '\u2193') : ''}
              </th>
              <th>Resolution</th>
              <th onClick={() => handleSort('confidenceScore')} className={styles.sortable}>
                Freshness {sortKey === 'confidenceScore' ? (sortAsc ? '\u2191' : '\u2193') : ''}
              </th>
              <th onClick={() => handleSort('launchDate')} className={styles.sortable}>
                Launched {sortKey === 'launchDate' ? (sortAsc ? '\u2191' : '\u2193') : ''}
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
                  {PROVIDER_DISPLAY_NAMES[model.provider] ?? model.provider}
                </td>
                <td className={styles.modelName}>
                  {model.displayName}
                  <StatusBadge status={model.status} confidence={model.confidence} />
                </td>
                <td className={styles.price}>{currencySymbol}{formatPrice(model.pricePerImage)}</td>
                <td>{QUALITY_LABELS[model.qualityTier] ?? model.qualityTier}</td>
                <td className={styles.resolution}>{model.defaultResolution}</td>
                <td className={styles.freshness}>
                  <FreshnessIndicator
                    freshness={model.freshness}
                    confidenceScore={model.confidenceScore}
                    confidenceLevel={model.confidenceLevel}
                  />
                </td>
                <td className={styles.date}>
                  {model.launchDate ? formatLaunchDate(model.launchDate) : '\u2014'}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
