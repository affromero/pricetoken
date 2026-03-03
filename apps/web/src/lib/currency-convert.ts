import type { ModelPricing } from 'pricetoken';
import { getExchangeRates, isSupportedCurrency } from '@/lib/currency';

export interface CurrencyInfo {
  currency: string;
  exchangeRate: number;
}

export async function resolveCurrency(
  currencyParam: string | null
): Promise<CurrencyInfo | null> {
  if (!currencyParam || currencyParam === 'USD') return null;

  const code = currencyParam.toUpperCase();
  if (!isSupportedCurrency(code)) return null;

  const rates = await getExchangeRates();
  const rate = rates[code];
  if (!rate) return null;

  return { currency: code, exchangeRate: rate };
}

export function convertPricing<T extends ModelPricing | ModelPricing[]>(
  data: T,
  rate: number
): T {
  if (Array.isArray(data)) {
    return data.map((m) => ({
      ...m,
      inputPerMTok: m.inputPerMTok * rate,
      outputPerMTok: m.outputPerMTok * rate,
    })) as T;
  }

  const model = data as ModelPricing;
  return {
    ...model,
    inputPerMTok: model.inputPerMTok * rate,
    outputPerMTok: model.outputPerMTok * rate,
  } as T;
}
