import { getExchangeRates, getSupportedCurrencies } from '@/lib/currency';
import { apiSuccess, apiError } from '@/lib/api-response';

export async function GET() {
  try {
    const rates = await getExchangeRates();
    const supported = getSupportedCurrencies();

    const currencies = Object.entries(supported).map(([code, info]) => ({
      code,
      symbol: info.symbol,
      name: info.name,
      rate: rates[code] ?? 1,
    }));

    return apiSuccess(currencies);
  } catch (err) {
    console.error('GET /api/v1/pricing/currencies error:', err);
    return apiError('Internal server error', 500);
  }
}
