'use client';

import { useState } from 'react';
import styles from './CodeBlock.module.css';

interface CodeBlockProps {
  tabs: { label: string; code: string }[];
}

export function CodeBlock({ tabs }: CodeBlockProps) {
  const [active, setActive] = useState(0);

  function handleCopy() {
    const code = tabs[active]?.code ?? '';
    navigator.clipboard.writeText(code);
  }

  return (
    <div className={styles.root}>
      <div className={styles.header}>
        <div className={styles.tabs}>
          {tabs.map((tab, i) => (
            <button
              key={tab.label}
              className={`${styles.tab} ${i === active ? styles.tabActive : ''}`}
              onClick={() => setActive(i)}
            >
              {tab.label}
            </button>
          ))}
        </div>
        <button className={styles.copy} onClick={handleCopy} aria-label="Copy code">
          Copy
        </button>
      </div>
      <pre className={styles.code}>
        <code>{tabs[active]?.code ?? ''}</code>
      </pre>
    </div>
  );
}
