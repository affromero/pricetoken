'use client';

import { useState, useMemo } from 'react';
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
import { ProviderFilterChips } from '@/components/ProviderFilterChips/ProviderFilterChips';
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
  '#d97706',
  '#8b5cf6',
  '#ec4899',
];

type PriceType = 'input' | 'output';
type DateRange = '7d' | '30d' | '90d' | '1y';

const DATE_RANGE_LABELS: Record<DateRange, string> = {
  '7d': '7 days',
  '30d': '30 days',
  '90d': '90 days',
  '1y': '1 year',
};

function getDateCutoff(range: DateRange): Date {
  const now = new Date();
  switch (range) {
    case '7d':
      return new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    case '30d':
      return new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    case '90d':
      return new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
    case '1y':
      return new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000);
  }
}

export function PriceHistoryChart({ history }: PriceHistoryChartProps) {
  const [priceType, setPriceType] = useState<PriceType>('input');
  const [providerFilter, setProviderFilter] = useState('');
  const [dateRange, setDateRange] = useState<DateRange>('30d');

  const providers = [...new Set(history.map((m) => m.provider))];

  const filteredHistory = useMemo(() => {
    const cutoff = getDateCutoff(dateRange).toISOString().split('T')[0]!;
    const models = providerFilter
      ? history.filter((m) => m.provider === providerFilter)
      : history;

    return models.map((m) => ({
      ...m,
      history: m.history.filter((h) => h.date >= cutoff),
    })).filter((m) => m.history.length > 0);
  }, [history, providerFilter, dateRange]);

  const chartData = useMemo(() => {
    const allDates = new Set<string>();
    for (const model of filteredHistory) {
      for (const point of model.history) {
        allDates.add(point.date);
      }
    }

    const sortedDates = [...allDates].sort();

    return sortedDates.map((date) => {
      const point: Record<string, string | number> = { date };
      for (const model of filteredHistory) {
        const match = model.history.find((h) => h.date === date);
        if (match) {
          point[model.modelId] =
            priceType === 'input' ? match.inputPerMTok : match.outputPerMTok;
        }
      }
      return point;
    });
  }, [filteredHistory, priceType]);

  return (
    <div className={styles.root}>
      <div className={styles.controlsGroup}>
        <ProviderFilterChips providers={providers} selected={providerFilter} onSelect={setProviderFilter} />

        <div className={styles.controlsRow}>
          <div className={styles.controls}>
            {(Object.keys(DATE_RANGE_LABELS) as DateRange[]).map((range) => (
              <button
                key={range}
                className={`${styles.toggle} ${dateRange === range ? styles.toggleActive : ''}`}
                onClick={() => setDateRange(range)}
              >
                {DATE_RANGE_LABELS[range]}
              </button>
            ))}
          </div>

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
        </div>
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
            tickFormatter={(v: number) => `$${v}`}
          />
          <Tooltip
            contentStyle={{
              background: 'var(--pt-surface)',
              border: '1px solid var(--pt-border)',
              borderRadius: 'var(--radius)',
              fontSize: '0.8125rem',
            }}
            labelStyle={{ color: 'var(--pt-text)' }}
            formatter={(value: number) => [`$${value.toFixed(4)}/MTok`]}
          />
          <Legend />
          {filteredHistory.map((model, i) => (
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
