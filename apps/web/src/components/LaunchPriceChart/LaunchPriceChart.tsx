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
import type { ModelPricing } from 'pricetoken';
import { ProviderFilterChips, PROVIDER_COLORS } from '@/components/ProviderFilterChips/ProviderFilterChips';
import { ChartContainer } from '@/components/ChartContainer/ChartContainer';
import { useIsMobile } from '@/lib/useIsMobile';
import styles from './LaunchPriceChart.module.css';

interface LaunchPriceChartProps {
  pricing: ModelPricing[];
}

type PriceType = 'input' | 'output';

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

export function LaunchPriceChart({ pricing }: LaunchPriceChartProps) {
  const [priceType, setPriceType] = useState<PriceType>('input');
  const [providerFilter, setProviderFilter] = useState('');
  const [logScale, setLogScale] = useState(false);
  const mobile = useIsMobile();

  const modelsWithDate = useMemo(
    () => pricing.filter((m) => m.launchDate !== null),
    [pricing]
  );

  const providers = useMemo(
    () => [...new Set(modelsWithDate.map((m) => m.provider))],
    [modelsWithDate]
  );

  const filteredModels = useMemo(
    () => providerFilter ? modelsWithDate.filter((m) => m.provider === providerFilter) : modelsWithDate,
    [modelsWithDate, providerFilter]
  );

  const seriesByProvider = useMemo(() => {
    const groups = new Map<string, ScatterPoint[]>();
    for (const m of filteredModels) {
      const price = priceType === 'input' ? m.inputPerMTok : m.outputPerMTok;
      const timestamp = new Date(m.launchDate!).getTime();
      const point: ScatterPoint = {
        x: timestamp,
        y: price,
        modelId: m.modelId,
        displayName: m.displayName,
        provider: m.provider,
        launchDate: m.launchDate!,
        price,
      };
      if (!groups.has(m.provider)) groups.set(m.provider, []);
      groups.get(m.provider)!.push(point);
    }
    return groups;
  }, [filteredModels, priceType]);

  if (modelsWithDate.length === 0) return null;

  return (
    <div className={styles.root}>
      <div className={styles.controlsGroup}>
        <ProviderFilterChips providers={providers} selected={providerFilter} onSelect={setProviderFilter} />

        <div className={styles.controlsRow}>
          <div className={styles.controls}>
            <button
              className={`${styles.toggle} ${priceType === 'input' ? styles.toggleActive : ''}`}
              onClick={() => setPriceType('input')}
            >
              Input Price
            </button>
            <button
              className={`${styles.toggle} ${priceType === 'output' ? styles.toggleActive : ''}`}
              onClick={() => setPriceType('output')}
            >
              Output Price
            </button>
          </div>
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
                  ? v >= 1 ? `$${Math.round(v)}` : `$${v.toFixed(1)}`
                  : `$${v}`
              }
              name="Price/MTok"
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
                    <div>${p.price.toFixed(2)}/MTok</div>
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
