'use client';

import { useState, useMemo, useCallback } from 'react';
import { calculateMusicCost } from 'pricetoken';
import type { MusicModelPricing } from 'pricetoken';
import { ProviderFilterChips, PROVIDER_COLORS } from '@/components/ProviderFilterChips/ProviderFilterChips';
import { CurrencySelector } from '@/components/CurrencySelector/CurrencySelector';
import styles from './MusicCostCalculator.module.css';

interface MusicCostCalculatorProps {
  pricing: MusicModelPricing[];
}

export function MusicCostCalculator({ pricing: initialPricing }: MusicCostCalculatorProps) {
  const [pricing, setPricing] = useState(initialPricing);
  const [providerFilter, setProviderFilter] = useState('');
  const [durationMinutes, setDurationMinutes] = useState(5);
  const [currency, setCurrency] = useState('USD');

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

  const providers = [...new Set(pricing.map((m) => m.provider))];

  const filteredPricing = useMemo(() => {
    if (providerFilter) return pricing.filter((m) => m.provider === providerFilter);
    return pricing;
  }, [pricing, providerFilter]);

  const durationSeconds = durationMinutes * 60;

  const rankedModels = useMemo(() => {
    return filteredPricing
      .map((m) => ({
        model: m,
        cost: calculateMusicCost(m.modelId, m.costPerMinute, durationSeconds),
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
          How much for a <span className={styles.heroAccent}>{durationMinutes}-minute</span> music track?
        </label>
        <input
          id="duration-slider"
          type="range"
          className={styles.slider}
          min={1}
          max={60}
          step={1}
          value={durationMinutes}
          onChange={(e) => setDurationMinutes(Number(e.target.value))}
        />
        <div className={styles.sliderLabels}>
          <span>1 min</span>
          <span>60 min</span>
        </div>
      </div>

      <div className={styles.controls}>
        <ProviderFilterChips providers={providers} selected={providerFilter} onSelect={setProviderFilter} />
        <div className={styles.controlsRow}>
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
