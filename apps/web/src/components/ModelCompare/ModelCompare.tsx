'use client';

import { useState } from 'react';
import type { ModelPricing } from 'pricetoken';
import { ProviderFilterChips } from '@/components/ProviderFilterChips/ProviderFilterChips';
import styles from './ModelCompare.module.css';

interface ModelCompareProps {
  pricing: ModelPricing[];
}

const MAX_COMPARE = 5;

export function ModelCompare({ pricing }: ModelCompareProps) {
  const [providerFilter, setProviderFilter] = useState('');
  const [selected, setSelected] = useState<string[]>([]);

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
  const maxInput = Math.max(...selectedModels.map((m) => m.inputPerMTok), 0.01);
  const maxOutput = Math.max(...selectedModels.map((m) => m.outputPerMTok), 0.01);

  return (
    <div className={styles.root}>
      <div className={styles.providerFilter}>
        <ProviderFilterChips providers={providers} selected={providerFilter} onSelect={handleProviderChange} />
      </div>

      <div className={styles.picker}>
        <p className={styles.pickerLabel}>
          Select up to {MAX_COMPARE} models to compare ({selected.length}/{MAX_COMPARE})
        </p>
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
            <h3 className={styles.sectionTitle}>Input Price ($/MTok)</h3>
            {selectedModels.map((m) => (
              <div key={m.modelId} className={styles.barRow}>
                <span className={styles.barLabel}>{m.displayName}</span>
                <div className={styles.barTrack}>
                  <div
                    className={styles.barFill}
                    style={{ width: `${(m.inputPerMTok / maxInput) * 100}%` }}
                  />
                </div>
                <span className={styles.barValue}>${m.inputPerMTok.toFixed(4)}</span>
              </div>
            ))}
          </div>

          <div className={styles.section}>
            <h3 className={styles.sectionTitle}>Output Price ($/MTok)</h3>
            {selectedModels.map((m) => (
              <div key={m.modelId} className={styles.barRow}>
                <span className={styles.barLabel}>{m.displayName}</span>
                <div className={styles.barTrack}>
                  <div
                    className={styles.barFill}
                    style={{ width: `${(m.outputPerMTok / maxOutput) * 100}%` }}
                  />
                </div>
                <span className={styles.barValue}>${m.outputPerMTok.toFixed(4)}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
