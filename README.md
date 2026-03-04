<div align="center">

# PriceToken

**The missing API for LLM pricing.**

Real-time pricing data scraped from providers, served via REST API, visualized on a website, and distributed as npm and PyPI packages.

[![CI](https://github.com/affromero/pricetoken/actions/workflows/ci.yml/badge.svg)](https://github.com/affromero/pricetoken/actions/workflows/ci.yml)
[![npm](https://img.shields.io/npm/v/pricetoken)](https://www.npmjs.com/package/pricetoken)
[![PyPI](https://img.shields.io/pypi/v/pricetoken)](https://pypi.org/project/pricetoken/)
[![npm downloads](https://img.shields.io/npm/dt/pricetoken)](https://www.npmjs.com/package/pricetoken)
[![PyPI downloads](https://img.shields.io/pypi/dm/pricetoken)](https://pypi.org/project/pricetoken/)
[![npm package size](https://img.shields.io/npm/unpacked-size/pricetoken)](https://www.npmjs.com/package/pricetoken)
[![TypeScript](https://img.shields.io/badge/TypeScript-strict-blue)](https://www.typescriptlang.org/)
[![License: MIT](https://img.shields.io/badge/License-MIT-green.svg)](https://opensource.org/licenses/MIT)
[![PRs Welcome](https://img.shields.io/badge/PRs-welcome-brightgreen.svg)](https://github.com/affromero/pricetoken/pulls)

[**pricetoken.ai**](https://pricetoken.ai) — Live dashboard, cost calculator, and API docs

</div>

![PriceToken — Real-time LLM pricing dashboard](assets/hero.png)

## Quick Start

### JavaScript / TypeScript

```bash
npm install pricetoken
```

```typescript
import { PriceTokenClient, calculateModelCost } from 'pricetoken';

// Fetch live pricing
const client = new PriceTokenClient();
const pricing = await client.getPricing();

// Calculate cost (offline — no API call)
const cost = calculateModelCost('claude-sonnet-4-6', 1_000_000, 100_000);
console.log(cost.totalCost); // $4.50
```

### Python

```bash
pip install pricetoken
```

```python
from pricetoken import PriceTokenClient, calculate_model_cost

# Fetch live pricing
client = PriceTokenClient()
pricing = client.get_pricing()

# Calculate cost (offline — no API call)
cost = calculate_model_cost("claude-sonnet-4-6", 1_000_000, 100_000)
print(cost.total_cost)  # $4.50
```

### REST API

```bash
# All models
curl https://pricetoken.ai/api/v1/pricing

# Single model
curl https://pricetoken.ai/api/v1/pricing/claude-sonnet-4-6

# Price history
curl https://pricetoken.ai/api/v1/pricing/history?days=30

# Compare models
curl https://pricetoken.ai/api/v1/pricing/compare?models=claude-sonnet-4-6,gpt-4.1

# Cheapest model
curl https://pricetoken.ai/api/v1/pricing/cheapest
```

## API Reference

| Endpoint | Description |
|----------|-------------|
| `GET /api/v1/pricing` | Current pricing. `?provider=anthropic` |
| `GET /api/v1/pricing/:modelId` | Single model |
| `GET /api/v1/pricing/history` | Historical data. `?days=30&modelId=x&provider=y` |
| `GET /api/v1/pricing/providers` | Provider list with stats |
| `GET /api/v1/pricing/compare` | Compare models. `?models=a,b,c` |
| `GET /api/v1/pricing/cheapest` | Cheapest model. `?provider=x` |

### Rate Limits

- **No API key**: 30 requests/hour
- **With API key**: 500 requests/hour

Rate limit headers: `X-RateLimit-Limit`, `X-RateLimit-Remaining`, `X-RateLimit-Reset`.

## How Data is Verified

PriceToken uses a multi-agent verification pipeline to ensure pricing accuracy:

1. **Scrape** — Puppeteer fetches each provider's official pricing page daily
2. **Extract** — An AI agent extracts structured pricing data from the raw page text
3. **Verify** — Three independent AI agents from different providers (Claude Haiku, GPT-4.1 Mini, Gemini Flash) cross-check every data point against the raw text. A model is only accepted when at least two agents agree.
4. **Prior check** — Extracted prices are compared against the last known snapshot. Price changes exceeding 50% are flagged for manual review, even if all agents agree.

Models that fail verification are logged but never saved to the database. If a daily run fails entirely, pricing updates freeze until an admin reviews and resolves the issue.

## Architecture

```
Provider pricing pages → Daily cron (AI extraction)
                              ↓
                     Multi-agent verification
                    (3 independent AI agents)
                              ↓
                     Prior consistency check
                              ↓
              Approved models → PostgreSQL snapshots
                              ↓
               Next.js API routes ← Redis cache (5min TTL)
                              ↓
                    npm package (typed client)
```

## Self-Hosting

### Prerequisites

- Node.js 22+
- PostgreSQL 16+
- Redis 7+
- AI API key — Anthropic, OpenAI, or Google (for price scraping)
- (Optional) All three API keys for full multi-agent verification

### Development

```bash
git clone https://github.com/affromero/pricetoken.git
cd pricetoken
npm install
docker compose up -d
npx prisma db push --schema=apps/web/prisma/schema.prisma
npx prisma generate --schema=apps/web/prisma/schema.prisma
npm run dev
```

### Production (Docker)

```bash
cp .env.example .env  # Configure DATABASE_URL, REDIS_URL, ANTHROPIC_API_KEY
docker compose -f docker-compose.prod.yml up -d
```

### Daily Cron

Set up a daily cron job to trigger the pricing scraper:

```
0 6 * * * curl -sf -H "Authorization: Bearer $CRON_SECRET" https://your-domain/api/cron/fetch-pricing
```

Add `CRON_SECRET` to your environment variables.

## Screenshots

| Cost Calculator | Compare Models |
|:---:|:---:|
| ![Calculator](assets/calculator.png) | ![Compare](assets/compare.png) |

| Price History | API Docs |
|:---:|:---:|
| ![History](assets/history.png) | ![Docs](assets/docs.png) |

## Related Projects

There are several great projects tackling LLM pricing from different angles. We're grateful to all of them for pushing this space forward — PriceToken builds on ideas pioneered by many of these tools.

| Feature | PriceToken | [LiteLLM](https://github.com/BerriAI/litellm) | [tokencost](https://github.com/AgentOps-AI/tokencost) | [pricepertoken](https://pricepertoken.com) | [LLM Price Check](https://llmpricecheck.com) | [Helicone](https://github.com/Helicone/helicone) | [genai-prices](https://github.com/pydantic/genai-prices) | [llm-info](https://www.npmjs.com/package/llm-info) |
|---------|:---:|:---:|:---:|:---:|:---:|:---:|:---:|:---:|
| Free REST API | **Yes** | No | No | No | No | No | No | No |
| npm Package | **Yes** | No | No | No | No | No | **Yes** | **Yes** |
| PyPI Package | **Yes** | **Yes** | **Yes** | No | No | No | **Yes** | No |
| Offline Calculator | **Yes** | No | **Yes** | No | No | No | **Yes** | No |
| Price History | **Yes** | No | No | Partial | No | No | **Yes** | No |
| Self-Hostable | **Yes** | **Yes** | N/A | No | No | **Yes** | N/A | N/A |
| Open Source | **Yes** | **Yes** | **Yes** | No | No | **Yes** | **Yes** | **Yes** |
| AI-Verified Data | **Yes** | No | No | No | No | No | No | No |
| TypeScript Types | **Yes** | No | No | No | No | No | **Yes** | **Yes** |
| Zero Dependencies | **Yes** | No | No | N/A | N/A | No | No | **Yes** |

### PriceToken & genai-prices

[genai-prices](https://github.com/pydantic/genai-prices) by Pydantic is the closest project in scope, and a great resource — especially for its breadth of provider coverage.

**What we share:** Multi-provider LLM pricing data, Python & JS/TS packages, static pricing data bundled in packages, historic price tracking.

| | PriceToken | genai-prices |
|---|---|---|
| **Data source** | AI-powered scraping (Puppeteer + Claude) with multi-agent verification | Hand-curated YAML files + community PRs |
| **Distribution** | REST API + website + npm SDK | Python/JS packages + raw JSON download |
| **Web UI** | Full site (table, calculator, history charts, compare) | Planned |
| **API** | Live REST API with Redis caching | Planned |
| **Provider count** | ~handful of major providers | 29 providers, 700+ models |
| **Backing** | Solo project | Pydantic (established OSS org) |

**Where PriceToken focuses:** Live REST API, full web UI with cost calculator and history charts, and automated scraping with multi-agent verification.

**Where genai-prices shines:** Far broader model coverage (700+ models across 29 providers), variable/tiered pricing support (e.g., Gemini context tiers, DeepSeek off-peak), and the strength of Pydantic's ecosystem and community.

Depending on your needs, you might use one or both — they complement each other well.

**See also:** [Artificial Analysis](https://artificialanalysis.ai) — benchmarks and pricing data for comparing AI model performance.

## Disclaimer

Pricing data is provided on a best-effort basis and may be inaccurate, incomplete, or outdated. LLM providers change prices without notice, and our scraping pipeline may not capture every change immediately.

**This data is for informational purposes only. Do not use it as the sole basis for financial decisions.** Always verify pricing directly with the provider before committing to spend.

If you get a bill you weren't expecting, that's between you and your provider — not us. See the [MIT License](LICENSE) under which this project is distributed (specifically the "AS IS" and "NO WARRANTY" clauses).

Found incorrect pricing? [Open an issue](https://github.com/affromero/pricetoken/issues).

## License

MIT
