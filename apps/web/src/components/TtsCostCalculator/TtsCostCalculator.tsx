'use client';

import { useState, useMemo, useCallback } from 'react';
import { calculateTtsCost } from 'pricetoken';
import type { TtsModelPricing } from 'pricetoken';
import { ProviderFilterChips, PROVIDER_COLORS } from '@/components/ProviderFilterChips/ProviderFilterChips';
import { CurrencySelector } from '@/components/CurrencySelector/CurrencySelector';
import styles from './TtsCostCalculator.module.css';

interface TtsCostCalculatorProps {
  pricing: TtsModelPricing[];
}

function formatCharacters(chars: number): string {
  if (chars >= 1_000_000) return `${(chars / 1_000_000).toFixed(1)}M`;
  if (chars >= 1_000) return `${(chars / 1_000).toFixed(0)}K`;
  return `${chars}`;
}

export function TtsCostCalculator({ pricing: initialPricing }: TtsCostCalculatorProps) {
  const [pricing, setPricing] = useState(initialPricing);
  const [providerFilter, setProviderFilter] = useState('');
  const [characters, setCharacters] = useState(100_000);
  const [voiceTypeFilter, setVoiceTypeFilter] = useState('');
  const [currency, setCurrency] = useState('USD');

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

  const providers = [...new Set(pricing.map((m) => m.provider))];
  const voiceTypes = [...new Set(pricing.map((m) => m.voiceType).filter(Boolean))] as string[];

  const filteredPricing = useMemo(() => {
    let result = pricing;
    if (providerFilter) result = result.filter((m) => m.provider === providerFilter);
    if (voiceTypeFilter) result = result.filter((m) => m.voiceType === voiceTypeFilter);
    return result;
  }, [pricing, providerFilter, voiceTypeFilter]);

  const rankedModels = useMemo(() => {
    return filteredPricing
      .map((m) => ({
        model: m,
        cost: calculateTtsCost(m.modelId, m.costPerMChars, characters),
      }))
      .sort((a, b) => a.cost.totalCost - b.cost.totalCost);
  }, [filteredPricing, characters]);

  const cheapestCost = rankedModels[0]?.cost.totalCost ?? 0;
  const maxCost = rankedModels[rankedModels.length - 1]?.cost.totalCost ?? 1;

  const currencySymbol = currency === 'USD' ? '$' : `${currency} `;

  return (
    <div className={styles.root}>
      <div className={styles.hero}>
        <label className={styles.heroLabel} htmlFor="characters-slider">
          How much for <span className={styles.heroAccent}>{formatCharacters(characters)}</span> characters?
        </label>
        <input
          id="characters-slider"
          type="range"
          className={styles.slider}
          min={1000}
          max={10_000_000}
          step={1000}
          value={characters}
          onChange={(e) => setCharacters(Number(e.target.value))}
        />
        <div className={styles.sliderLabels}>
          <span>1K</span>
          <span>10M</span>
        </div>
      </div>

      <div className={styles.controls}>
        <ProviderFilterChips providers={providers} selected={providerFilter} onSelect={setProviderFilter} />
        <div className={styles.controlsRow}>
          <div className={styles.typeFilter}>
            <button
              className={`${styles.toggle} ${!voiceTypeFilter ? styles.toggleActive : ''}`}
              onClick={() => setVoiceTypeFilter('')}
            >
              All
            </button>
            {voiceTypes.map((t) => (
              <button
                key={t}
                className={`${styles.toggle} ${voiceTypeFilter === t ? styles.toggleActive : ''}`}
                onClick={() => setVoiceTypeFilter(t)}
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
                {model.voiceType && (
                  <span className={styles.modelMeta}>{model.voiceType}</span>
                )}
              </div>
              <div className={styles.modelBar}>
                <div
                  className={styles.barFill}
                  style={{ width: `${barWidth}%` }}
                />
              </div>
              <div className={styles.modelCost}>
                <span className={styles.costValue}>{currencySymbol}{cost.totalCost.toFixed(4)}</span>
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
