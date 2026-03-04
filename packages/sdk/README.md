# pricetoken

Real-time LLM pricing data. Typed client, offline cost calculator, and static pricing for every major provider.

## Install

```bash
npm install pricetoken
```

## Quick start

```typescript
import { PriceTokenClient } from 'pricetoken';

const pt = new PriceTokenClient();

// Get all model pricing
const models = await pt.getPricing();

// Filter by provider
const anthropic = await pt.getPricing({ provider: 'anthropic' });

// Get a single model
const opus = await pt.getModel('claude-opus-4-6');

// Find the cheapest model
const cheapest = await pt.getCheapest();

// Compare models side by side
const compared = await pt.compare(['gpt-4o', 'claude-sonnet-4-6']);

// Price history (last 30 days)
const history = await pt.getHistory({ days: 30 });

// List providers
const providers = await pt.getProviders();
```

## Authentication

Free tier: 30 requests/hour (no key required).

For higher limits, pass an API key:

```typescript
const pt = new PriceTokenClient({ apiKey: 'pt_...' });
```

## Offline cost calculation

Calculate costs without any API calls using bundled static pricing:

```typescript
import { calculateModelCost } from 'pricetoken';

const cost = calculateModelCost('gpt-4o', 1000, 500);
// { modelId: 'gpt-4o', inputTokens: 1000, outputTokens: 500,
//   inputCost: 0.0025, outputCost: 0.0075, totalCost: 0.01 }
```

Or use your own pricing data:

```typescript
import { calculateCost } from 'pricetoken';

const cost = calculateCost('my-model', 2.50, 10.00, 1000, 500);
```

## Static pricing data

Access bundled pricing without network calls:

```typescript
import { STATIC_PRICING } from 'pricetoken';

console.log(STATIC_PRICING.length); // 21 models
```

## API

### `PriceTokenClient`

| Method | Returns | Description |
|--------|---------|-------------|
| `getPricing(opts?)` | `ModelPricing[]` | All models. Filter by `provider`, `currency`. |
| `getModel(modelId, opts?)` | `ModelPricing` | Single model by ID. |
| `getCheapest(opts?)` | `ModelPricing` | Cheapest model. Filter by `provider`. |
| `compare(modelIds, opts?)` | `ModelPricing[]` | Compare specific models. |
| `getHistory(opts?)` | `ModelHistory[]` | Price history. Filter by `days`, `modelId`, `provider`. |
| `getProviders()` | `ProviderSummary[]` | All providers with model counts. |

### Options

```typescript
new PriceTokenClient({
  baseUrl: 'https://pricetoken.ai', // default
  apiKey: 'pt_...',                  // optional
});
```

## Types

All types are exported:

```typescript
import type {
  ModelPricing,
  PriceHistoryPoint,
  ModelHistory,
  ProviderSummary,
  CostEstimate,
  PriceTokenResponse,
  PriceTokenError,
} from 'pricetoken';
```

## Disclaimer

Pricing data is provided on a best-effort basis and may be inaccurate, incomplete, or outdated. LLM providers change prices without notice, and our scraping pipeline may not capture every change immediately.

**This data is for informational purposes only. Do not use it as the sole basis for financial decisions.** Always verify pricing directly with the provider before committing to spend.

If you get a bill you weren't expecting, that's between you and your provider — not us. See the [MIT License](LICENSE) under which this project is distributed (specifically the "AS IS" and "NO WARRANTY" clauses).

Found incorrect pricing? [Open an issue](https://github.com/affromero/pricetoken/issues).

## License

MIT
