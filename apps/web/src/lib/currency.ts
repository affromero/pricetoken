import { getCached, setCache } from '@/lib/redis';

const SUPPORTED_CURRENCIES: Record<string, { symbol: string; name: string }> = {
  USD: { symbol: '$', name: 'US Dollar' },
  EUR: { symbol: '€', name: 'Euro' },
  GBP: { symbol: '£', name: 'British Pound' },
  JPY: { symbol: '¥', name: 'Japanese Yen' },
  CAD: { symbol: 'C$', name: 'Canadian Dollar' },
  AUD: { symbol: 'A$', name: 'Australian Dollar' },
  BRL: { symbol: 'R$', name: 'Brazilian Real' },
  INR: { symbol: '₹', name: 'Indian Rupee' },
  KRW: { symbol: '₩', name: 'South Korean Won' },
  COP: { symbol: 'COL$', name: 'Colombian Peso' },
};

interface ExchangeRates {
  [currency: string]: number;
}

let memoryCache: { rates: ExchangeRates; fetchedAt: number } | null = null;
const MEMORY_CACHE_TTL = 3600_000; // 1 hour
const REDIS_CACHE_KEY = 'pt:currency:rates';
const REDIS_CACHE_TTL = 3600; // 1 hour in seconds

async function fetchRatesFromAPI(): Promise<ExchangeRates> {
  const res = await fetch('https://open.er-api.com/v6/latest/USD');
  if (!res.ok) throw new Error(`Exchange rate API returned ${res.status}`);
  const json = await res.json();
  return json.rates as ExchangeRates;
}

export async function getExchangeRates(): Promise<ExchangeRates> {
  // 1. Memory cache
  if (memoryCache && Date.now() - memoryCache.fetchedAt < MEMORY_CACHE_TTL) {
    return memoryCache.rates;
  }

  // 2. Redis cache
  const cached = await getCached<ExchangeRates>(REDIS_CACHE_KEY);
  if (cached) {
    memoryCache = { rates: cached, fetchedAt: Date.now() };
    return cached;
  }

  // 3. Fetch from API
  const rates = await fetchRatesFromAPI();
  memoryCache = { rates, fetchedAt: Date.now() };
  await setCache(REDIS_CACHE_KEY, rates, REDIS_CACHE_TTL);
  return rates;
}

export function convertAmount(usd: number, rate: number): number {
  return usd * rate;
}

export function getSupportedCurrencies() {
  return SUPPORTED_CURRENCIES;
}

export function isSupportedCurrency(code: string): boolean {
  return code in SUPPORTED_CURRENCIES;
}
