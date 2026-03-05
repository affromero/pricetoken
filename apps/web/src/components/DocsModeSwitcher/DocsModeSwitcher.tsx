'use client';

import { useState } from 'react';
import styles from './DocsModeSwitcher.module.css';

type Modality = 'text' | 'image' | 'video';

interface Tab {
  id: Modality;
  label: string;
  icon: React.ReactNode;
}

const TABS: Tab[] = [
  {
    id: 'text',
    label: 'Text',
    icon: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
        <polyline points="14 2 14 8 20 8" />
        <line x1="16" y1="13" x2="8" y2="13" />
        <line x1="16" y1="17" x2="8" y2="17" />
        <polyline points="10 9 9 9 8 9" />
      </svg>
    ),
  },
  {
    id: 'image',
    label: 'Image',
    icon: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
        <circle cx="8.5" cy="8.5" r="1.5" />
        <polyline points="21 15 16 10 5 21" />
      </svg>
    ),
  },
  {
    id: 'video',
    label: 'Video',
    icon: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <polygon points="23 7 16 12 23 17 23 7" />
        <rect x="1" y="5" width="15" height="14" rx="2" ry="2" />
      </svg>
    ),
  },
];

interface DocsModeSwitcherProps {
  textContent: React.ReactNode;
  imageContent: React.ReactNode;
  videoContent: React.ReactNode;
}

export function DocsModeSwitcher({ textContent, imageContent, videoContent }: DocsModeSwitcherProps) {
  const [active, setActive] = useState<Modality>('text');

  const contentMap: Record<Modality, React.ReactNode> = {
    text: textContent,
    image: imageContent,
    video: videoContent,
  };

  return (
    <div className={styles.root}>
      <div className={styles.tabBar} role="tablist" aria-label="API modality">
        {TABS.map((tab) => (
          <button
            key={tab.id}
            type="button"
            role="tab"
            aria-selected={active === tab.id}
            aria-controls={`panel-${tab.id}`}
            className={`${styles.tab} ${active === tab.id ? styles.tabActive : ''}`}
            onClick={() => setActive(tab.id)}
          >
            <span className={styles.tabIcon}>{tab.icon}</span>
            {tab.label}
          </button>
        ))}
        <div
          className={styles.indicator}
          style={{
            transform: `translateX(${TABS.findIndex((t) => t.id === active) * 100}%)`,
          }}
        />
      </div>

      {TABS.map((tab) => (
        <div
          key={tab.id}
          id={`panel-${tab.id}`}
          role="tabpanel"
          aria-labelledby={tab.id}
          className={styles.panel}
          hidden={active !== tab.id}
        >
          {contentMap[tab.id]}
        </div>
      ))}
    </div>
  );
}
