'use client';

import { useState, useMemo, useCallback } from 'react';
import { calculateSttCost } from 'pricetoken';
import type { SttModelPricing } from 'pricetoken';
import { ProviderFilterChips, PROVIDER_COLORS } from '@/components/ProviderFilterChips/ProviderFilterChips';
import { CurrencySelector } from '@/components/CurrencySelector/CurrencySelector';
import styles from './SttCostCalculator.module.css';

interface SttCostCalculatorProps {
  pricing: SttModelPricing[];
}

export function SttCostCalculator({ pricing: initialPricing }: SttCostCalculatorProps) {
  const [pricing, setPricing] = useState(initialPricing);
  const [providerFilter, setProviderFilter] = useState('');
  const [durationMinutes, setDurationMinutes] = useState(10);
  const [sttTypeFilter, setSttTypeFilter] = useState('');
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
  const sttTypes = [...new Set(pricing.map((m) => m.sttType).filter(Boolean))] as string[];

  const filteredPricing = useMemo(() => {
    let result = pricing;
    if (providerFilter) result = result.filter((m) => m.provider === providerFilter);
    if (sttTypeFilter) result = result.filter((m) => m.sttType === sttTypeFilter);
    return result;
  }, [pricing, providerFilter, sttTypeFilter]);

  const durationSeconds = durationMinutes * 60;

  const rankedModels = useMemo(() => {
    return filteredPricing
      .map((m) => ({
        model: m,
        cost: calculateSttCost(m.modelId, m.costPerMinute, durationSeconds),
      }))
      .sort((a, b) => a.cost.totalCost - b.cost.totalCost);
  }, [filteredPricing, durationSeconds]);

  const cheapestCost = rankedModels[0]?.cost.totalCost ?? 0;
  const maxCost = rankedModels[rankedModels.length - 1]?.cost.totalCost ?? 1;

  const currencySymbol = currency === 'USD' ? '$' : `${currency} `;

  return (
    <div className={styles.root}>
      <div className={styles.hero}>
        <label className={styles.heroLabel} htmlFor="duration-slider">
          How much for <span className={styles.heroAccent}>{durationMinutes}</span> minutes of transcription?
        </label>
        <input
          id="duration-slider"
          type="range"
          className={styles.slider}
          min={1}
          max={1000}
          step={1}
          value={durationMinutes}
          onChange={(e) => setDurationMinutes(Number(e.target.value))}
        />
        <div className={styles.sliderLabels}>
          <span>1 min</span>
          <span>1000 min</span>
        </div>
      </div>

      <div className={styles.controls}>
        <ProviderFilterChips providers={providers} selected={providerFilter} onSelect={setProviderFilter} />
        <div className={styles.controlsRow}>
          <div className={styles.typeFilter}>
            <button
              className={`${styles.toggle} ${!sttTypeFilter ? styles.toggleActive : ''}`}
              onClick={() => setSttTypeFilter('')}
            >
              All
            </button>
            {sttTypes.map((t) => (
              <button
                key={t}
                className={`${styles.toggle} ${sttTypeFilter === t ? styles.toggleActive : ''}`}
                onClick={() => setSttTypeFilter(t)}
              >
                {t.charAt(0).toUpperCase() + t.slice(1)}
              </button>
            ))}
          </div>
          <CurrencySelector onChange={handleCurrencyChange} />
        </div>
      </div>

      <div className={styles.list}>
        {rankedModels.map(({ model, cost }, i) => {
          const multiplier = cheapestCost > 0 ? cost.totalCost / cheapestCost : 1;
          const barWidth = maxCost > 0 ? (cost.totalCost / maxCost) * 100 : 0;

          return (
            <div key={model.modelId} className={styles.modelRow}>
              <div className={styles.modelInfo}>
                <span className={styles.rank}>#{i + 1}</span>
                <span
                  className={styles.providerDot}
                  style={{ background: PROVIDER_COLORS[model.provider] ?? 'var(--pt-accent)' }}
                />
                <span className={styles.modelName}>{model.displayName}</span>
                {model.sttType && (
                  <span className={styles.modelMeta}>{model.sttType}</span>
                )}
              </div>
              <div className={styles.modelBar}>
                <div
                  className={styles.barFill}
                  style={{ width: `${barWidth}%` }}
                />
              </div>
              <div className={styles.modelCost}>
                <span className={styles.costValue}>{currencySymbol}{cost.totalCost.toFixed(2)}</span>
                {i > 0 && (
                  <span className={styles.costMultiplier}>{multiplier.toFixed(1)}x</span>
                )}
              </div>
            </div>
          );
        })}
      </div>

      <p className={styles.disclaimer}>
        Prices are for API/programmatic access. Consumer subscription plans may differ.
        Always check your provider dashboard for final billing.
      </p>
    </div>
  );
}
