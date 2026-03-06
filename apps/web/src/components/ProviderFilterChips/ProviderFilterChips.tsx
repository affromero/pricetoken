'use client';

import styles from './ProviderFilterChips.module.css';

interface ProviderFilterChipsProps {
  providers: string[];
  selected: string;
  onSelect: (provider: string) => void;
  displayNames?: Record<string, string>;
}

export const PROVIDER_COLORS: Record<string, string> = {
  anthropic: 'var(--pt-provider-anthropic)',
  openai: 'var(--pt-provider-openai)',
  google: 'var(--pt-provider-google)',
  deepseek: 'var(--pt-provider-deepseek)',
  xai: 'var(--pt-provider-xai)',
  qwen: 'var(--pt-provider-qwen)',
  cohere: 'var(--pt-provider-cohere)',
  ai21: 'var(--pt-provider-ai21)',
  stability: 'var(--pt-provider-stability)',
  bfl: 'var(--pt-provider-bfl)',
  recraft: 'var(--pt-provider-recraft)',
  bytedance: 'var(--pt-provider-bytedance)',
  fal: 'var(--pt-provider-fal)',
  ideogram: 'var(--pt-provider-ideogram)',
  runway: 'var(--pt-provider-runway)',
  sora: 'var(--pt-provider-sora)',
  veo: 'var(--pt-provider-veo)',
  pika: 'var(--pt-provider-pika)',
  kling: 'var(--pt-provider-kling)',
  luma: 'var(--pt-provider-luma)',
  minimax: 'var(--pt-provider-minimax)',
  seedance: 'var(--pt-provider-seedance)',
};

export function ProviderFilterChips({ providers, selected, onSelect, displayNames }: ProviderFilterChipsProps) {
  return (
    <div className={styles.root}>
      <button
        className={`${styles.chip} ${!selected ? styles.chipActive : ''}`}
        onClick={() => onSelect('')}
      >
        All
      </button>
      {providers.map((p) => (
        <button
          key={p}
          className={`${styles.chip} ${selected === p ? styles.chipActive : ''}`}
          onClick={() => onSelect(p)}
          style={{ '--chip-color': PROVIDER_COLORS[p] ?? 'var(--pt-accent)' } as React.CSSProperties}
        >
          {displayNames?.[p] ?? p}
        </button>
      ))}
    </div>
  );
}
