'use client';

import styles from './ProviderFilterChips.module.css';

interface ProviderFilterChipsProps {
  providers: string[];
  selected: string;
  onSelect: (provider: string) => void;
}

export const PROVIDER_COLORS: Record<string, string> = {
  anthropic: 'var(--pt-provider-anthropic)',
  openai: 'var(--pt-provider-openai)',
  google: 'var(--pt-provider-google)',
  deepseek: 'var(--pt-provider-deepseek)',
};

export function ProviderFilterChips({ providers, selected, onSelect }: ProviderFilterChipsProps) {
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
          {p}
        </button>
      ))}
    </div>
  );
}
