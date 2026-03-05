'use client';

import { useState, useEffect, useRef, type ReactNode } from 'react';

interface ChartContainerProps {
  mobile: boolean;
  children: (width: number) => ReactNode;
}

export function ChartContainer({ mobile, children }: ChartContainerProps) {
  const ref = useRef<HTMLDivElement>(null);
  const [width, setWidth] = useState(0);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const update = () => setWidth(el.clientWidth);
    update();

    const observer = new ResizeObserver(update);
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  return (
    <div ref={ref} style={{ width: '100%', minHeight: mobile ? 280 : 400 }}>
      {width > 0 && children(width)}
    </div>
  );
}
