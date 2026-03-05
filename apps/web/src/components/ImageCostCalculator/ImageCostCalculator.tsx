'use client';

import { useState, useMemo } from 'react';
import { calculateImageCost } from 'pricetoken';
import type { ImageModelPricing } from 'pricetoken';
import styles from './ImageCostCalculator.module.css';

interface ImageCostCalculatorProps {
  models: ImageModelPricing[];
}

export function ImageCostCalculator({ models }: ImageCostCalculatorProps) {
  const [selectedModelId, setSelectedModelId] = useState(models[0]?.modelId ?? '');
  const [imageCount, setImageCount] = useState(100);

  const selectedModel = models.find((m) => m.modelId === selectedModelId);

  const cost = useMemo(() => {
    if (!selectedModel) return null;
    return calculateImageCost(selectedModel.modelId, selectedModel.pricePerImage, imageCount);
  }, [selectedModel, imageCount]);

  return (
    <div className={styles.root}>
      <div className={styles.controls}>
        <div className={styles.field}>
          <label className={styles.label} htmlFor="image-model-select">
            Model
          </label>
          <select
            id="image-model-select"
            className={styles.select}
            value={selectedModelId}
            onChange={(e) => setSelectedModelId(e.target.value)}
          >
            {models.map((m) => (
              <option key={m.modelId} value={m.modelId}>
                {m.displayName} ({m.provider})
              </option>
            ))}
          </select>
        </div>

        <div className={styles.field}>
          <label className={styles.label} htmlFor="image-count">
            Number of images: {imageCount.toLocaleString()}
          </label>
          <input
            id="image-count"
            type="range"
            className={styles.slider}
            min={1}
            max={10_000}
            step={1}
            value={imageCount}
            onChange={(e) => setImageCount(Number(e.target.value))}
          />
        </div>
      </div>

      {cost && (
        <div className={styles.result}>
          <div className={styles.costRow}>
            <span className={styles.costLabel}>Price per image</span>
            <span className={styles.costValue}>${cost.pricePerImage.toFixed(3)}</span>
          </div>
          <div className={`${styles.costRow} ${styles.costTotal}`}>
            <span className={styles.costLabel}>Total ({cost.imageCount.toLocaleString()} images)</span>
            <span className={styles.costValue}>${cost.totalCost.toFixed(2)}</span>
          </div>
        </div>
      )}
    </div>
  );
}
