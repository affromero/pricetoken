'use client';

import { useState, useCallback, useMemo } from 'react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import type { ModelHistory } from 'pricetoken';
import { CurrencySelector } from '@/components/CurrencySelector/CurrencySelector';
import styles from './PriceHistoryChart.module.css';

interface PriceHistoryChartProps {
  history: ModelHistory[];
}

const MODEL_COLORS = [
  '#22c55e',
  '#d4a574',
  '#10a37f',
  '#4285f4',
  '#ef4444',
  '#f59e0b',
  '#8b5cf6',
  '#ec4899',
];

type PriceType = 'input' | 'output';

export function PriceHistoryChart({ history }: PriceHistoryChartProps) {
  const [priceType, setPriceType] = useState<PriceType>('input');
  const [currency, setCurrency] = useState('USD');
  const [exchangeRate, setExchangeRate] = useState(1);

  const handleCurrencyChange = useCallback(async (code: string) => {
    setCurrency(code);
    if (code === 'USD') {
      setExchangeRate(1);
      return;
    }
    try {
      const res = await fetch('/api/v1/pricing/currencies');
      if (res.ok) {
        const json = await res.json();
        const match = json.data.find((c: { code: string }) => c.code === code);
        if (match) setExchangeRate(match.rate);
      }
    } catch {
      // Fall back to USD
    }
  }, []);

  // Merge all dates across models into unified data points
  const allDates = new Set<string>();
  for (const model of history) {
    for (const point of model.history) {
      allDates.add(point.date);
    }
  }

  const sortedDates = [...allDates].sort();

  const chartData = useMemo(() => sortedDates.map((date) => {
    const point: Record<string, string | number> = { date };
    for (const model of history) {
      const match = model.history.find((h) => h.date === date);
      if (match) {
        const value = priceType === 'input' ? match.inputPerMTok : match.outputPerMTok;
        point[model.modelId] = value * exchangeRate;
      }
    }
    return point;
  }), [sortedDates, history, priceType, exchangeRate]);

  const currencySymbol = currency === 'USD' ? '$' : `${currency} `;

  return (
    <div className={styles.root}>
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
        <CurrencySelector onChange={handleCurrencyChange} />
      </div>

      <ResponsiveContainer width="100%" height={400}>
        <LineChart data={chartData} margin={{ top: 5, right: 20, bottom: 5, left: 10 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="var(--pt-border)" />
          <XAxis
            dataKey="date"
            stroke="var(--pt-text-secondary)"
            tick={{ fontSize: 12 }}
          />
          <YAxis
            stroke="var(--pt-text-secondary)"
            tick={{ fontSize: 12 }}
            tickFormatter={(v: number) => `${currencySymbol}${v}`}
          />
          <Tooltip
            contentStyle={{
              background: 'var(--pt-surface)',
              border: '1px solid var(--pt-border)',
              borderRadius: 'var(--radius)',
              fontSize: '0.8125rem',
            }}
            labelStyle={{ color: 'var(--pt-text)' }}
            formatter={(value: number) => [`${currencySymbol}${value.toFixed(4)}/MTok`]}
          />
          <Legend />
          {history.map((model, i) => (
            <Line
              key={model.modelId}
              type="monotone"
              dataKey={model.modelId}
              name={model.displayName}
              stroke={MODEL_COLORS[i % MODEL_COLORS.length]}
              strokeWidth={2}
              dot={false}
              connectNulls
            />
          ))}
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
