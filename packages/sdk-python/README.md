# pricetoken

Real-time LLM pricing data — typed client, cost calculator, and static pricing.

[![PyPI](https://img.shields.io/pypi/v/pricetoken)](https://pypi.org/project/pricetoken/)
[![Python](https://img.shields.io/pypi/pyversions/pricetoken)](https://pypi.org/project/pricetoken/)
[![License: MIT](https://img.shields.io/badge/License-MIT-green.svg)](https://opensource.org/licenses/MIT)

Python SDK for [PriceToken](https://pricetoken.ai). Zero runtime dependencies.

## Install

```bash
pip install pricetoken
# or
uv add pricetoken
```

## Quick Start

### Calculate cost offline (no API call)

```python
from pricetoken import calculate_model_cost

cost = calculate_model_cost("claude-sonnet-4-6", 1_000_000, 100_000)
print(cost.total_cost)  # $4.50
```

### Fetch live pricing

```python
from pricetoken import PriceTokenClient

client = PriceTokenClient()
pricing = client.get_pricing()

for model in pricing:
    print(f"{model.display_name}: ${model.input_per_m_tok}/MTok in, ${model.output_per_m_tok}/MTok out")
```

### With API key (higher rate limits)

```python
client = PriceTokenClient(api_key="pt_your_key_here")
```

## Cost Calculation

```python
from pricetoken import calculate_cost, calculate_model_cost

# By model ID (uses bundled static pricing)
cost = calculate_model_cost("gpt-4.1", 500_000, 100_000)
print(cost.input_cost)   # $1.00
print(cost.output_cost)  # $0.80
print(cost.total_cost)   # $1.80

# With explicit rates
cost = calculate_cost("custom-model", 5.0, 15.0, 1_000_000, 500_000)
print(cost.total_cost)   # $12.50
```

## Static Pricing Data

21 models from Anthropic, OpenAI, Google, and DeepSeek are bundled for offline use:

```python
from pricetoken import STATIC_PRICING

for model in STATIC_PRICING:
    print(f"{model.model_id}: ${model.input_per_m_tok}/MTok")
```

> **Note:** Static data reflects prices at the time the package was published and does not auto-update. For the latest prices, use `PriceTokenClient` to fetch live data from the API.

## API Reference

| Method | API Path |
|--------|----------|
| `get_pricing(provider=, currency=)` | `GET /api/v1/text` |
| `get_model(model_id, currency=)` | `GET /api/v1/text/{model_id}` |
| `get_history(days=, model_id=, provider=)` | `GET /api/v1/text/history` |
| `get_providers()` | `GET /api/v1/text/providers` |
| `compare(model_ids, currency=)` | `GET /api/v1/text/compare` |
| `get_cheapest(provider=, currency=)` | `GET /api/v1/text/cheapest` |

## Types

All types are `dataclass(slots=True)` for performance and type safety:

- `ModelPricing` — model pricing data
- `CostEstimate` — cost calculation result
- `PriceHistoryPoint` — historical price data point
- `ModelHistory` — price history for a model
- `ProviderSummary` — provider overview with stats
- `PriceTokenError` — API error (extends `Exception`)

Type aliases: `ModelStatus`, `DataConfidence`, `Source` (all `Literal` types).

## Requirements

- Python >= 3.10
- Zero runtime dependencies

## License

MIT
