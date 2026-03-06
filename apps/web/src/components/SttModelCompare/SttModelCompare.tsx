'use client';

import { useState, useCallback } from 'react';
import type { SttModelPricing } from 'pricetoken';
import { ProviderFilterChips } from '@/components/ProviderFilterChips/ProviderFilterChips';
import { CurrencySelector } from '@/components/CurrencySelector/CurrencySelector';
import styles from './SttModelCompare.module.css';

interface SttModelCompareProps {
  pricing: SttModelPricing[];
}

const MAX_COMPARE = 5;

export function SttModelCompare({ pricing: initialPricing }: SttModelCompareProps) {
  const [pricing, setPricing] = useState(initialPricing);
  const [providerFilter, setProviderFilter] = useState('');
  const [selected, setSelected] = useState<string[]>([]);
  const [currency, setCurrency] = useState('USD');

  const handleCurrencyChange = useCallback(async (code: string) => {
    setCurrency(code);
    if (code === 'USD') {
      setPricing(initialPricing);
      return;
    }
    try {
      const res = await fetch(`/api/v1/stt?currency=${code}`);
      if (res.ok) {
        const json = await res.json();
        setPricing(json.data);
      }
    } catch {
      // Fall back to initial pricing
    }
  }, [initialPricing]);

  const providers = [...new Set(pricing.map((m) => m.provider))];
  const filteredPricing = providerFilter
    ? pricing.filter((m) => m.provider === providerFilter)
    : pricing;

  const filteredModelIds = new Set(filteredPricing.map((m) => m.modelId));
  const visibleSelected = selected.filter((id) => filteredModelIds.has(id));

  function handleProviderChange(provider: string) {
    setProviderFilter(provider);
    setSelected((prev) => {
      const nextFiltered = provider
        ? pricing.filter((m) => m.provider === provider)
        : pricing;
      const nextIds = new Set(nextFiltered.map((m) => m.modelId));
      return prev.filter((id) => nextIds.has(id));
    });
  }

  function toggleModel(modelId: string) {
    setSelected((prev) => {
      if (prev.includes(modelId)) {
        return prev.filter((id) => id !== modelId);
      }
      if (prev.length >= MAX_COMPARE) return prev;
      return [...prev, modelId];
    });
  }

  const selectedModels = pricing.filter((m) => visibleSelected.includes(m.modelId));
  const maxCostPerMinute = Math.max(...selectedModels.map((m) => m.costPerMinute), 0.01);

  const currencySymbol = currency === 'USD' ? '$' : `${currency} `;

  function formatDuration(seconds: number | null): string {
    if (!seconds) return '—';
    if (seconds >= 3600) return `${(seconds / 3600).toFixed(0)}h`;
    if (seconds >= 60) return `${(seconds / 60).toFixed(0)}min`;
    return `${seconds}s`;
  }

  return (
    <div className={styles.root}>
      <div className={styles.providerFilter}>
        <ProviderFilterChips providers={providers} selected={providerFilter} onSelect={handleProviderChange} />
      </div>

      <div className={styles.picker}>
        <div className={styles.pickerHeader}>
          <p className={styles.pickerLabel}>
            Select up to {MAX_COMPARE} models to compare ({selected.length}/{MAX_COMPARE})
          </p>
          <CurrencySelector onChange={handleCurrencyChange} />
        </div>
        <div className={styles.chips}>
          {filteredPricing.map((m) => (
            <button
              key={m.modelId}
              className={`${styles.chip} ${selected.includes(m.modelId) ? styles.chipSelected : ''}`}
              onClick={() => toggleModel(m.modelId)}
              disabled={!selected.includes(m.modelId) && selected.length >= MAX_COMPARE}
            >
              {m.displayName}
            </button>
          ))}
        </div>
      </div>

      {selectedModels.length > 0 && (
        <div className={styles.comparison}>
          <div className={styles.section}>
            <h3 className={styles.sectionTitle}>Cost per Minute ({currencySymbol}/min)</h3>
            {selectedModels.map((m) => (
              <div key={m.modelId} className={styles.barRow}>
                <span className={styles.barLabel}>{m.displayName}</span>
                <div className={styles.barTrack}>
                  <div
                    className={styles.barFill}
                    style={{ width: `${(m.costPerMinute / maxCostPerMinute) * 100}%` }}
                  />
                </div>
                <span className={styles.barValue}>{currencySymbol}{m.costPerMinute.toFixed(4)}</span>
              </div>
            ))}
          </div>

          <div className={styles.section}>
            <h3 className={styles.sectionTitle}>Details</h3>
            <div className={styles.detailsGrid}>
              <div className={styles.detailHeader}>Model</div>
              <div className={styles.detailHeader}>STT Type</div>
              <div className={styles.detailHeader}>Max Duration</div>
              <div className={styles.detailHeader}>Languages</div>
              <div className={styles.detailHeader}>Cost/Min</div>
              {selectedModels.map((m) => (
                <div key={m.modelId} className={styles.detailRow}>
                  <div className={styles.detailCell}>{m.displayName}</div>
                  <div className={styles.detailCell}>{m.sttType ?? '—'}</div>
                  <div className={styles.detailCell}>{formatDuration(m.maxDuration)}</div>
                  <div className={styles.detailCell}>{m.supportedLanguages ?? '—'}</div>
                  <div className={styles.detailCell}>{currencySymbol}{m.costPerMinute.toFixed(4)}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
