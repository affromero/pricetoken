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
import { ProviderFilterChips } from '@/components/ProviderFilterChips/ProviderFilterChips';
import { CurrencySelector } from '@/components/CurrencySelector/CurrencySelector';
import { useIsMobile } from '@/lib/useIsMobile';
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

function formatShortDate(dateStr: string): string {
  const d = new Date(dateStr + 'T00:00:00Z');
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  return `${months[d.getUTCMonth()]} ${d.getUTCDate()}`;
}

function truncateName(name: string, max: number): string {
  return name.length > max ? name.slice(0, max - 1) + '…' : name;
}

export function PriceHistoryChart({ history }: PriceHistoryChartProps) {
  const [priceType, setPriceType] = useState<PriceType>('input');
  const [providerFilter, setProviderFilter] = useState('');
  const [dateRange, setDateRange] = useState<DateRange>('30d');
  const [currency, setCurrency] = useState('USD');
  const [exchangeRate, setExchangeRate] = useState(1);
  const mobile = useIsMobile();

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
          const value = priceType === 'input' ? match.inputPerMTok : match.outputPerMTok;
          point[model.modelId] = value * exchangeRate;
        }
      }
      return point;
    });
  }, [filteredHistory, priceType, exchangeRate]);

  const currencySymbol = currency === 'USD' ? '$' : `${currency} `;

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
            <CurrencySelector onChange={handleCurrencyChange} />
          </div>
        </div>
      </div>

      <ResponsiveContainer width="100%" height={mobile ? 280 : 400}>
        <LineChart data={chartData} margin={mobile ? { top: 5, right: 10, bottom: 5, left: 0 } : { top: 5, right: 20, bottom: 5, left: 10 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="var(--pt-border)" />
          <XAxis
            dataKey="date"
            stroke="var(--pt-text-secondary)"
            tick={{ fontSize: mobile ? 10 : 12 }}
            tickFormatter={mobile ? formatShortDate : undefined}
            interval={mobile ? 'preserveStartEnd' : undefined}
          />
          <YAxis
            stroke="var(--pt-text-secondary)"
            tick={{ fontSize: mobile ? 10 : 12 }}
            width={mobile ? 40 : undefined}
            tickCount={mobile ? 5 : undefined}
            tickFormatter={(v: number) =>
              mobile
                ? `${currencySymbol}${v < 1 ? v.toFixed(1) : Math.round(v)}`
                : `${currencySymbol}${v.toFixed(3)}`
            }
          />
          <Tooltip
            shared={false}
            contentStyle={{
              background: 'var(--pt-surface)',
              border: '1px solid var(--pt-border)',
              borderRadius: 'var(--radius)',
              fontSize: '0.8125rem',
            }}
            labelStyle={{ color: 'var(--pt-text)' }}
            formatter={(value: number, name: string) => [`${currencySymbol}${value.toFixed(2)}/MTok`, name]}
          />
          <Legend
            wrapperStyle={mobile ? { fontSize: '0.6875rem' } : undefined}
          />
          {filteredHistory.map((model, i) => (
            <Line
              key={model.modelId}
              type="monotone"
              dataKey={model.modelId}
              name={mobile ? truncateName(model.displayName, 15) : model.displayName}
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
