'use client';

import { useState } from 'react';
import type { ModelPricing } from 'pricetoken';
import styles from './ModelCompare.module.css';

interface ModelCompareProps {
  pricing: ModelPricing[];
}

const MAX_COMPARE = 5;

export function ModelCompare({ pricing }: ModelCompareProps) {
  const [selected, setSelected] = useState<string[]>([]);

  function toggleModel(modelId: string) {
    setSelected((prev) => {
      if (prev.includes(modelId)) {
        return prev.filter((id) => id !== modelId);
      }
      if (prev.length >= MAX_COMPARE) return prev;
      return [...prev, modelId];
    });
  }

  const selectedModels = pricing.filter((m) => selected.includes(m.modelId));
  const maxInput = Math.max(...selectedModels.map((m) => m.inputPerMTok), 0.01);
  const maxOutput = Math.max(...selectedModels.map((m) => m.outputPerMTok), 0.01);

  return (
    <div className={styles.root}>
      <div className={styles.picker}>
        <p className={styles.pickerLabel}>
          Select up to {MAX_COMPARE} models to compare ({selected.length}/{MAX_COMPARE})
        </p>
        <div className={styles.chips}>
          {pricing.map((m) => (
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
