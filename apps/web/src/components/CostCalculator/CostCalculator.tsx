'use client';

import { useState, useMemo } from 'react';
import { calculateCost } from 'pricetoken';
import type { ModelPricing } from 'pricetoken';
import { ProviderFilterChips } from '@/components/ProviderFilterChips/ProviderFilterChips';
import styles from './CostCalculator.module.css';

interface CostCalculatorProps {
  pricing: ModelPricing[];
}

export function CostCalculator({ pricing }: CostCalculatorProps) {
  const [providerFilter, setProviderFilter] = useState('');
  const [selectedModelId, setSelectedModelId] = useState(pricing[0]?.modelId ?? '');
  const [inputTokens, setInputTokens] = useState(100_000);
  const [outputTokens, setOutputTokens] = useState(10_000);

  const providers = [...new Set(pricing.map((m) => m.provider))];
  const filteredPricing = providerFilter
    ? pricing.filter((m) => m.provider === providerFilter)
    : pricing;

  const effectiveModelId =
    filteredPricing.some((m) => m.modelId === selectedModelId)
      ? selectedModelId
      : filteredPricing[0]?.modelId ?? '';

  if (effectiveModelId !== selectedModelId) {
    setSelectedModelId(effectiveModelId);
  }

  const selectedModel = pricing.find((m) => m.modelId === effectiveModelId);

  const cost = useMemo(() => {
    if (!selectedModel) return null;
    return calculateCost(
      selectedModel.modelId,
      selectedModel.inputPerMTok,
      selectedModel.outputPerMTok,
      inputTokens,
      outputTokens
    );
  }, [selectedModel, inputTokens, outputTokens]);

  return (
    <div className={styles.root}>
      <div className={styles.providerFilter}>
        <ProviderFilterChips providers={providers} selected={providerFilter} onSelect={setProviderFilter} />
      </div>

      <div className={styles.field}>
        <label className={styles.label} htmlFor="model-select">
          Model
        </label>
        <select
          id="model-select"
          className={styles.select}
          value={effectiveModelId}
          onChange={(e) => setSelectedModelId(e.target.value)}
        >
          {filteredPricing.map((m) => (
            <option key={m.modelId} value={m.modelId}>
              {m.displayName} ({m.provider})
            </option>
          ))}
        </select>
      </div>

      <div className={styles.sliders}>
        <div className={styles.field}>
          <label className={styles.label} htmlFor="input-tokens">
            Input tokens: {inputTokens.toLocaleString()}
          </label>
          <input
            id="input-tokens"
            type="range"
            className={styles.slider}
            min={0}
            max={10_000_000}
            step={10_000}
            value={inputTokens}
            onChange={(e) => setInputTokens(Number(e.target.value))}
          />
        </div>

        <div className={styles.field}>
          <label className={styles.label} htmlFor="output-tokens">
            Output tokens: {outputTokens.toLocaleString()}
          </label>
          <input
            id="output-tokens"
            type="range"
            className={styles.slider}
            min={0}
            max={1_000_000}
            step={1_000}
            value={outputTokens}
            onChange={(e) => setOutputTokens(Number(e.target.value))}
          />
        </div>
      </div>

      {cost && (
        <div className={styles.result}>
          <div className={styles.costRow}>
            <span className={styles.costLabel}>Input cost</span>
            <span className={styles.costValue}>${cost.inputCost.toFixed(6)}</span>
          </div>
          <div className={styles.costRow}>
            <span className={styles.costLabel}>Output cost</span>
            <span className={styles.costValue}>${cost.outputCost.toFixed(6)}</span>
          </div>
          <div className={`${styles.costRow} ${styles.costTotal}`}>
            <span className={styles.costLabel}>Total</span>
            <span className={styles.costValue}>${cost.totalCost.toFixed(6)}</span>
          </div>
        </div>
      )}
    </div>
  );
}
