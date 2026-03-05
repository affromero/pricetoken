'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import styles from './ModalitySubNav.module.css';

type Modality = 'text' | 'image' | 'video';

const TABS: { label: string; suffix: string }[] = [
  { label: 'Pricing', suffix: '' },
  { label: 'Calculator', suffix: '/calculator' },
  { label: 'Compare', suffix: '/compare' },
  { label: 'History', suffix: '/history' },
];

const BASE_PATHS: Record<Modality, string> = {
  text: '',
  image: '/image',
  video: '/video',
};

interface ModalitySubNavProps {
  modality: Modality;
}

export function ModalitySubNav({ modality }: ModalitySubNavProps) {
  const pathname = usePathname();
  const base = BASE_PATHS[modality];

  return (
    <nav className={styles.root}>
      {TABS.map((tab) => {
        const href = base + tab.suffix || '/';
        const isActive =
          tab.suffix === ''
            ? pathname === href || pathname === base || (modality === 'text' && pathname === '/')
            : pathname === href;

        return (
          <Link
            key={tab.suffix}
            href={href}
            className={`${styles.tab} ${isActive ? styles.tabActive : ''}`}
          >
            {tab.label}
          </Link>
        );
      })}
    </nav>
  );
}
