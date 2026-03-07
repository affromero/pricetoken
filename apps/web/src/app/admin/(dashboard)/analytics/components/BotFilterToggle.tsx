'use client';

import { useRouter, usePathname, useSearchParams } from 'next/navigation';
import type { BotFilter } from '@/lib/analytics/query';
import styles from './BotFilterToggle.module.css';

const OPTIONS: { label: string; value: BotFilter }[] = [
  { label: 'Humans', value: 'humans' },
  { label: 'Bots', value: 'bots' },
  { label: 'All', value: 'all' },
];

export function BotFilterToggle({ current }: { current: BotFilter }) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  function setFilter(value: BotFilter) {
    const params = new URLSearchParams(searchParams.toString());
    if (value === 'humans') {
      params.delete('botFilter');
    } else {
      params.set('botFilter', value);
    }
    router.push(`${pathname}?${params.toString()}`);
  }

  return (
    <div className={styles.toggle}>
      {OPTIONS.map((opt) => (
        <button
          key={opt.value}
          className={`${styles.button} ${current === opt.value ? styles.active : ''}`}
          onClick={() => setFilter(opt.value)}
        >
          {opt.label}
        </button>
      ))}
    </div>
  );
}
