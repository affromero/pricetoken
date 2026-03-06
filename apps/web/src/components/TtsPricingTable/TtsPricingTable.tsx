'use client';

import { useState, useCallback } from 'react';
import type { TtsModelPricing } from 'pricetoken';
import { ProviderFilterChips, PROVIDER_COLORS } from '@/components/ProviderFilterChips/ProviderFilterChips';
import { CurrencySelector } from '@/components/CurrencySelector/CurrencySelector';
import { StatusBadge } from '@/components/StatusBadge/StatusBadge';
import { FreshnessIndicator } from '@/components/FreshnessIndicator/FreshnessIndicator';
import styles from './TtsPricingTable.module.css';

interface TtsPricingTableProps {
  pricing: TtsModelPricing[];
}

type SortKey = 'provider' | 'displayName' | 'costPerMChars' | 'voiceType' | 'maxCharacters' | 'confidenceScore' | 'launchDate';

export function TtsPricingTable({ pricing: initialPricing }: TtsPricingTableProps) {
  const [pricing, setPricing] = useState(initialPricing);
  const [sortKey, setSortKey] = useState<SortKey>('costPerMChars');
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
      const res = await fetch(`/api/v1/tts?currency=${code}`);
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
    if (sortKey === 'launchDate') {
      const aDate = a.launchDate ?? '';
      const bDate = b.launchDate ?? '';
      if (!aDate && !bDate) return 0;
      if (!aDate) return 1;
      if (!bDate) return -1;
      return sortAsc ? aDate.localeCompare(bDate) : bDate.localeCompare(aDate);
    }
    if (sortKey === 'voiceType') {
      const aVal = a.voiceType ?? '';
      const bVal = b.voiceType ?? '';
      return sortAsc ? aVal.localeCompare(bVal) : bVal.localeCompare(aVal);
    }
    if (sortKey === 'maxCharacters') {
      const aVal = a.maxCharacters ?? 0;
      const bVal = b.maxCharacters ?? 0;
      return sortAsc ? aVal - bVal : bVal - aVal;
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

  function formatMaxChars(chars: number | null): string {
    if (!chars) return '—';
    if (chars >= 1_000_000) return `${(chars / 1_000_000).toFixed(0)}M`;
    if (chars >= 1_000) return `${(chars / 1_000).toFixed(0)}K`;
    return `${chars}`;
  }

  function formatVoiceType(type: string | null): string {
    if (!type) return '—';
    return type.charAt(0).toUpperCase() + type.slice(1);
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
              <th onClick={() => handleSort('costPerMChars')} className={styles.sortable}>
                Cost/1M Chars {sortKey === 'costPerMChars' ? (sortAsc ? '↑' : '↓') : ''}
              </th>
              <th onClick={() => handleSort('voiceType')} className={styles.sortable}>
                Voice Type {sortKey === 'voiceType' ? (sortAsc ? '↑' : '↓') : ''}
              </th>
              <th onClick={() => handleSort('maxCharacters')} className={styles.sortable}>
                Max Chars {sortKey === 'maxCharacters' ? (sortAsc ? '↑' : '↓') : ''}
              </th>
              <th>Languages</th>
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
                  <StatusBadge status={model.status} confidence={model.confidence} />
                </td>
                <td className={styles.price}>{currencySymbol}{formatPrice(model.costPerMChars)}</td>
                <td className={styles.meta}>{formatVoiceType(model.voiceType)}</td>
                <td className={styles.meta}>{formatMaxChars(model.maxCharacters)}</td>
                <td className={styles.meta}>{model.supportedLanguages ?? '—'}</td>
                <td className={styles.freshness}>
                  <FreshnessIndicator
                    freshness={model.freshness}
                    confidenceScore={model.confidenceScore}
                    confidenceLevel={model.confidenceLevel}
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
