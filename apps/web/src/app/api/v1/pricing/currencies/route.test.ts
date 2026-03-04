import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('@/lib/currency', () => ({
  getExchangeRates: vi.fn(),
  getSupportedCurrencies: vi.fn(),
}));

import { GET } from './route';
import { getExchangeRates, getSupportedCurrencies } from '@/lib/currency';

const mockGetExchangeRates = vi.mocked(getExchangeRates);
const mockGetSupportedCurrencies = vi.mocked(getSupportedCurrencies);

const mockSupported = {
  USD: { symbol: '$', name: 'US Dollar' },
  EUR: { symbol: '€', name: 'Euro' },
  GBP: { symbol: '£', name: 'British Pound' },
};

const mockRates: Record<string, number> = { USD: 1, EUR: 0.92, GBP: 0.79 };

describe('GET /api/v1/pricing/currencies', () => {
  beforeEach(() => vi.clearAllMocks());

  it('returns all supported currencies with rates', async () => {
    mockGetExchangeRates.mockResolvedValue(mockRates);
    mockGetSupportedCurrencies.mockReturnValue(mockSupported);

    const res = await GET();
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.data).toHaveLength(3);
  });

  it('defaults rate to 1 when exchange rate is missing', async () => {
    mockGetExchangeRates.mockResolvedValue({ USD: 1 });
    mockGetSupportedCurrencies.mockReturnValue(mockSupported);

    const res = await GET();
    const body = await res.json();

    const eur = body.data.find((c: { code: string }) => c.code === 'EUR');
    expect(eur.rate).toBe(1);
  });

  it('includes correct code, symbol, and name fields', async () => {
    mockGetExchangeRates.mockResolvedValue(mockRates);
    mockGetSupportedCurrencies.mockReturnValue(mockSupported);

    const res = await GET();
    const body = await res.json();

    const usd = body.data.find((c: { code: string }) => c.code === 'USD');
    expect(usd).toEqual({ code: 'USD', symbol: '$', name: 'US Dollar', rate: 1 });
  });

  it('returns full CORS and Cache-Control headers on success', async () => {
    mockGetExchangeRates.mockResolvedValue(mockRates);
    mockGetSupportedCurrencies.mockReturnValue(mockSupported);

    const res = await GET();

    expect(res.headers.get('Access-Control-Allow-Origin')).toBe('*');
    expect(res.headers.get('Access-Control-Allow-Methods')).toBe('GET, OPTIONS');
    expect(res.headers.get('Access-Control-Allow-Headers')).toBe('Authorization, Content-Type');
    expect(res.headers.get('Cache-Control')).toBe('public, max-age=300');
  });

  it('returns apiSuccess shape with data and meta', async () => {
    mockGetExchangeRates.mockResolvedValue(mockRates);
    mockGetSupportedCurrencies.mockReturnValue(mockSupported);

    const res = await GET();
    const body = await res.json();

    expect(body).toHaveProperty('data');
    expect(body).toHaveProperty('meta');
    expect(body.meta.currency).toBe('USD');
    expect(body.meta.timestamp).toBeDefined();
  });

  it('returns 500 with apiError shape when getExchangeRates throws', async () => {
    mockGetExchangeRates.mockRejectedValue(new Error('API down'));
    mockGetSupportedCurrencies.mockReturnValue(mockSupported);

    const res = await GET();
    const body = await res.json();

    expect(res.status).toBe(500);
    expect(body).toEqual({ error: 'Internal server error', status: 500 });
    expect(res.headers.get('Access-Control-Allow-Origin')).toBe('*');
    expect(res.headers.get('Access-Control-Allow-Methods')).toBeNull();
  });
});
