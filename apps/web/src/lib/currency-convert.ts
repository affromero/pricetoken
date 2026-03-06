import type { ModelPricing, ImageModelPricing, VideoModelPricing, AvatarModelPricing, TtsModelPricing, SttModelPricing } from 'pricetoken';
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

export function convertImagePricing<T extends ImageModelPricing | ImageModelPricing[]>(
  data: T,
  rate: number
): T {
  if (Array.isArray(data)) {
    return data.map((m) => ({
      ...m,
      pricePerImage: m.pricePerImage * rate,
      pricePerMegapixel: m.pricePerMegapixel ? m.pricePerMegapixel * rate : null,
    })) as T;
  }

  const model = data as ImageModelPricing;
  return {
    ...model,
    pricePerImage: model.pricePerImage * rate,
    pricePerMegapixel: model.pricePerMegapixel ? model.pricePerMegapixel * rate : null,
  } as T;
}

export function convertVideoPricing<T extends VideoModelPricing | VideoModelPricing[]>(
  data: T,
  rate: number
): T {
  if (Array.isArray(data)) {
    return data.map((m) => ({
      ...m,
      costPerMinute: m.costPerMinute * rate,
    })) as T;
  }

  const model = data as VideoModelPricing;
  return {
    ...model,
    costPerMinute: model.costPerMinute * rate,
  } as T;
}

export function convertAvatarPricing<T extends AvatarModelPricing | AvatarModelPricing[]>(
  data: T,
  rate: number
): T {
  if (Array.isArray(data)) {
    return data.map((m) => ({
      ...m,
      costPerMinute: m.costPerMinute * rate,
    })) as T;
  }

  const model = data as AvatarModelPricing;
  return {
    ...model,
    costPerMinute: model.costPerMinute * rate,
  } as T;
}

export function convertTtsPricing<T extends TtsModelPricing | TtsModelPricing[]>(data: T, rate: number): T {
  if (Array.isArray(data)) {
    return data.map((m) => ({ ...m, costPerMChars: m.costPerMChars * rate })) as T;
  }
  const model = data as TtsModelPricing;
  return { ...model, costPerMChars: model.costPerMChars * rate } as T;
}

export function convertSttPricing<T extends SttModelPricing | SttModelPricing[]>(data: T, rate: number): T {
  if (Array.isArray(data)) {
    return data.map((m) => ({ ...m, costPerMinute: m.costPerMinute * rate })) as T;
  }
  const model = data as SttModelPricing;
  return { ...model, costPerMinute: model.costPerMinute * rate } as T;
}
