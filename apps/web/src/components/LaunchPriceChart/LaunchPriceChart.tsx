'use client';

import { useState, useMemo } from 'react';
import {
  ScatterChart,
  Scatter,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from 'recharts';
import { ProviderFilterChips, PROVIDER_COLORS } from '@/components/ProviderFilterChips/ProviderFilterChips';
import { ChartContainer } from '@/components/ChartContainer/ChartContainer';
import { useIsMobile } from '@/lib/useIsMobile';
import styles from './LaunchPriceChart.module.css';

export interface PriceFieldConfig {
  key: string;
  label: string;
  unit: string;
}

interface LaunchPriceChartProps {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  pricing: Array<Record<string, any>>;
  priceFields: PriceFieldConfig[];
}

const PROVIDER_COLOR_VALUES: Record<string, string> = {
  anthropic: '#d4a574',
  openai: '#10a37f',
  google: '#4285f4',
  deepseek: '#22c55e',
  xai: '#ef4444',
  mistral: '#d97706',
};

interface ScatterPoint {
  x: number;
  y: number;
  modelId: string;
  displayName: string;
  provider: string;
  launchDate: string;
  price: number;
}

function formatDateTick(timestamp: number): string {
  const d = new Date(timestamp);
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  return `${months[d.getUTCMonth()]} '${String(d.getUTCFullYear()).slice(2)}`;
}

export function LaunchPriceChart({ pricing, priceFields }: LaunchPriceChartProps) {
  const [activeFieldIdx, setActiveFieldIdx] = useState(0);
  const [providerFilter, setProviderFilter] = useState('');
  const [logScale, setLogScale] = useState(false);
  const mobile = useIsMobile();

  const activeField = priceFields[activeFieldIdx]!;

  const modelsWithDate = useMemo(
    () => pricing.filter((m) => m.launchDate !== null && m.launchDate !== undefined),
    [pricing]
  );

  const providers = useMemo(
    () => [...new Set(modelsWithDate.map((m) => m.provider as string))],
    [modelsWithDate]
  );

  const filteredModels = useMemo(
    () => providerFilter ? modelsWithDate.filter((m) => m.provider === providerFilter) : modelsWithDate,
    [modelsWithDate, providerFilter]
  );

  const seriesByProvider = useMemo(() => {
    const groups = new Map<string, ScatterPoint[]>();
    for (const m of filteredModels) {
      const price = m[activeField.key] as number;
      if (price == null) continue;
      const timestamp = new Date(m.launchDate as string).getTime();
      const point: ScatterPoint = {
        x: timestamp,
        y: price,
        modelId: m.modelId as string,
        displayName: m.displayName as string,
        provider: m.provider as string,
        launchDate: m.launchDate as string,
        price,
      };
      if (!groups.has(point.provider)) groups.set(point.provider, []);
      groups.get(point.provider)!.push(point);
    }
    return groups;
  }, [filteredModels, activeField.key]);

  if (modelsWithDate.length === 0) return null;

  return (
    <div className={styles.root}>
      <div className={styles.controlsGroup}>
        <ProviderFilterChips providers={providers} selected={providerFilter} onSelect={setProviderFilter} />

        <div className={styles.controlsRow}>
          {priceFields.length > 1 && (
            <div className={styles.controls}>
              {priceFields.map((field, idx) => (
                <button
                  key={field.key}
                  className={`${styles.toggle} ${activeFieldIdx === idx ? styles.toggleActive : ''}`}
                  onClick={() => setActiveFieldIdx(idx)}
                >
                  {field.label}
                </button>
              ))}
            </div>
          )}
          <div className={styles.controls}>
            <button
              className={`${styles.toggle} ${logScale ? styles.toggleActive : ''}`}
              onClick={() => setLogScale(!logScale)}
            >
              Log Scale
            </button>
          </div>
        </div>
      </div>

      <ChartContainer mobile={mobile}>
        {(width) => (
          <ScatterChart width={width} height={mobile ? 280 : 400} margin={mobile ? { top: 5, right: 10, bottom: 5, left: 0 } : { top: 5, right: 20, bottom: 5, left: 10 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="var(--pt-border)" />
            <XAxis
              dataKey="x"
              type="number"
              domain={['dataMin', 'dataMax']}
              tickFormatter={formatDateTick}
              stroke="var(--pt-text-secondary)"
              tick={{ fontSize: mobile ? 10 : 12 }}
              interval="preserveStartEnd"
              name="Launch Date"
            />
            <YAxis
              dataKey="y"
              type="number"
              scale={logScale ? 'log' : 'auto'}
              domain={logScale ? ['auto', 'auto'] : [0, 'auto']}
              stroke="var(--pt-text-secondary)"
              tick={{ fontSize: mobile ? 10 : 12 }}
              width={mobile ? 40 : 60}
              tickCount={mobile ? 5 : 5}
              tickFormatter={(v: number) =>
                mobile
                  ? v >= 1 ? `$${Math.round(v)}` : `$${v.toFixed(2)}`
                  : `$${v}`
              }
              name={activeField.unit}
            />
            <Tooltip
              content={({ payload }) => {
                if (!payload?.[0]) return null;
                const p = payload[0].payload as ScatterPoint;
                return (
                  <div className={styles.tooltip}>
                    <strong>{p.displayName}</strong>
                    <div>{p.provider}</div>
                    <div>{p.launchDate}</div>
                    <div>${p.price.toFixed(2)} {activeField.unit}</div>
                  </div>
                );
              }}
            />
            {seriesByProvider.size <= 10 && (
              <Legend
                wrapperStyle={mobile ? { fontSize: '0.6875rem' } : undefined}
              />
            )}
            {[...seriesByProvider.entries()].map(([provider, data]) => (
              <Scatter
                key={provider}
                name={provider}
                data={data}
                fill={PROVIDER_COLOR_VALUES[provider] ?? PROVIDER_COLORS[provider] ?? '#22c55e'}
              />
            ))}
          </ScatterChart>
        )}
      </ChartContainer>
    </div>
  );
}
