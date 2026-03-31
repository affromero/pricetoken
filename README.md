<div align="center">

# PriceToken

**The missing API for AI pricing.**

Real-time pricing data across text, image, video, avatar, TTS, and STT — scraped from providers, served via REST API, visualized on a website, and distributed as npm and PyPI packages.

[![CI](https://github.com/affromero/pricetoken/actions/workflows/ci.yml/badge.svg)](https://github.com/affromero/pricetoken/actions/workflows/ci.yml)
[![npm](https://img.shields.io/npm/v/pricetoken)](https://www.npmjs.com/package/pricetoken)
[![PyPI](https://img.shields.io/pypi/v/pricetoken)](https://pypi.org/project/pricetoken/)
[![npm downloads](https://img.shields.io/npm/dt/pricetoken)](https://www.npmjs.com/package/pricetoken)
[![PyPI downloads](https://img.shields.io/pypi/dm/pricetoken)](https://pypi.org/project/pricetoken/)
[![npm package size](https://img.shields.io/npm/unpacked-size/pricetoken)](https://www.npmjs.com/package/pricetoken)
[![TypeScript](https://img.shields.io/badge/TypeScript-strict-blue)](https://www.typescriptlang.org/)
[![License: MIT](https://img.shields.io/badge/License-MIT-green.svg)](https://opensource.org/licenses/MIT)
[![Docker](https://img.shields.io/badge/Docker-deployed-2496ED?logo=docker&logoColor=white)](https://www.docker.com)
[![Socket](https://img.shields.io/badge/Socket-protected-blueviolet?logo=socket.dev)](https://socket.dev)
[![min-release-age](https://img.shields.io/badge/min--release--age-7%20days-brightgreen)](https://docs.npmjs.com/cli/v10/using-npm/config#min-release-age)
[![PRs Welcome](https://img.shields.io/badge/PRs-welcome-brightgreen.svg)](https://github.com/affromero/pricetoken/pulls)

[**pricetoken.ai**](https://pricetoken.ai) — Live dashboard, cost calculator, and API docs

</div>

![PriceToken — Real-time AI pricing dashboard](assets/hero.png)

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
# Text models
curl https://pricetoken.ai/api/v1/text
curl https://pricetoken.ai/api/v1/text/claude-sonnet-4-6

# Image models
curl https://pricetoken.ai/api/v1/image
curl https://pricetoken.ai/api/v1/image/gpt-image-1

# Video, avatar, TTS, STT — same pattern
curl https://pricetoken.ai/api/v1/video
curl https://pricetoken.ai/api/v1/avatar
curl https://pricetoken.ai/api/v1/tts
curl https://pricetoken.ai/api/v1/stt

# History, compare, cheapest (available for every modality)
curl https://pricetoken.ai/api/v1/text/history?days=30
curl https://pricetoken.ai/api/v1/text/compare?models=claude-sonnet-4-6,gpt-4.1
curl https://pricetoken.ai/api/v1/text/cheapest
```

## API Reference

Every modality (`text`, `image`, `video`, `avatar`, `tts`, `stt`) exposes the same six endpoints:

| Endpoint | Description |
|----------|-------------|
| `GET /api/v1/{modality}` | Current pricing. `?provider=anthropic` |
| `GET /api/v1/{modality}/:modelId` | Single model |
| `GET /api/v1/{modality}/history` | Historical data. `?days=30&modelId=x&provider=y` |
| `GET /api/v1/{modality}/providers` | Provider list with stats |
| `GET /api/v1/{modality}/compare` | Compare models. `?models=a,b,c` |
| `GET /api/v1/{modality}/cheapest` | Cheapest model. `?provider=x` |

### Rate Limits

- **No API key**: 30 requests/hour
- **With API key**: 500 requests/hour

Rate limit headers: `X-RateLimit-Limit`, `X-RateLimit-Remaining`, `X-RateLimit-Reset`.

## How Data is Verified

PriceToken uses a conference-style multi-agent verification pipeline — modeled after academic peer review — to ensure pricing accuracy:

1. **Scrape** — Puppeteer fetches each provider's official pricing page daily
2. **Extract** — An AI agent extracts structured pricing data from the raw page text
3. **Reviewers** — Independent AI agents from different providers cross-check every extracted price against the raw page text. Each agent must quote the exact price it found. A model is accepted when at least two out of three reviewers agree.
4. **Prior check** — Extracted prices are compared against the last known snapshot. Price changes exceeding 50% require unanimous reviewer approval.
5. **Area Chair** — Models that reviewers couldn't agree on get a second round of review. Area chair agents see the previous reviewers' arguments and disagreements, then make their own independent judgment.
6. **General Chair** — If the area chair round still can't reach consensus, an optional arbitrator agent (configurable in the admin panel) makes the final ruling. It sees all prior verdicts and has final authority.

Models rejected at every tier are saved to the database as "flagged" for admin review. If a daily run fails entirely, pricing updates freeze until an admin resolves the issue.

### Confidence Scoring

Every model gets a Bayesian confidence score (0–100) computed at query time. The score starts with a prior based on data source (verified scrape = 0.90, manual seed = 0.55, stale carry-forward = 0.25), then updates with evidence: agent consensus strength, data age, and price stability. Scores decay naturally as data ages — a model verified 2 hours ago scores ~99, while week-old seed data scores ~62.

| Field | Description |
|-------|-------------|
| `confidenceScore` | 0–100 numeric score |
| `confidenceLevel` | `"high"` (≥80), `"medium"` (50–79), `"low"` (<50) |
| `freshness.lastVerified` | ISO timestamp of last verification |
| `freshness.ageHours` | Hours since last verification |
| `freshness.stale` | `true` if older than 48 hours |

See the [docs](https://pricetoken.ai/docs) for the full Bayesian model and prior table.

## Architecture

```
Provider pricing pages → Daily cron (AI extraction)
                              ↓
                     Tier 1: Reviewers
                    (N independent AI agents)
                              ↓
                     Prior consistency check
                              ↓
                  Disagreements? → Tier 2: Area Chair
                                   (re-review with context)
                              ↓
                  Still flagged? → Tier 3: General Chair
                                   (arbitrator, final ruling)
                              ↓
              Approved models → PostgreSQL snapshots
                              ↓
               Next.js API routes ← Redis cache (5min TTL)
                              ↓
                  npm + PyPI packages (typed clients)
```

### Data Pipeline

All pricing data flows through a YAML model registry — the single source of truth for both SDKs:

```
registry/*.yaml  ──→  scripts/generate-static.ts  ──→  12 static files (6 TS + 6 Python)
     ↑                                                          ↓
  Contributors                                            SDK packages
  edit here                                              (npm + PyPI)
     ↑
  Daily cron
  (API → YAML)
```

- **Automated**: Daily cron scrapes providers → writes to DB → `update-static.ts` pulls from the API and updates `registry/*.yaml` → `generate-static.ts` produces static files
- **Manual**: Contributors edit `registry/*.yaml` directly → run `npm run generate-static` → open a PR
- **CI**: `generate-static --check` validates YAML and ensures static files match on every PR

## Contributing

Adding a new model is as simple as editing a YAML file — no TypeScript or Python knowledge required:

```yaml
# registry/text.yaml
models:
  - modelId: my-provider-model-v1
    provider: my-provider
    displayName: My Provider Model v1
    inputPerMTok: 3
    outputPerMTok: 15
    contextWindow: 128000
    pricingUrl: https://my-provider.com/pricing
```

```bash
npm run generate-static   # produces 12 static files from YAML
npm run ci                # verify everything passes
```

See [CONTRIBUTING.md](CONTRIBUTING.md) for the full guide, or [open an issue](../../issues/new?template=new-model.yml) to submit pricing data without writing code.

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

There are several great projects tackling AI pricing from different angles. We're grateful to all of them for pushing this space forward — PriceToken builds on ideas pioneered by many of these tools.

| Feature | PriceToken | [models.dev](https://models.dev) | [LiteLLM](https://github.com/BerriAI/litellm) | [tokencost](https://github.com/AgentOps-AI/tokencost) | [pricepertoken](https://pricepertoken.com) | [LLM Price Check](https://llmpricecheck.com) | [Helicone](https://github.com/Helicone/helicone) | [genai-prices](https://github.com/pydantic/genai-prices) | [llm-info](https://www.npmjs.com/package/llm-info) |
|---------|:---:|:---:|:---:|:---:|:---:|:---:|:---:|:---:|:---:|
| Free REST API | **Yes** | **Yes** | No | No | No | No | No | No | No |
| npm Package | **Yes** | No | No | No | No | No | No | **Yes** | **Yes** |
| PyPI Package | **Yes** | No | **Yes** | **Yes** | No | No | No | **Yes** | No |
| Offline Calculator | **Yes** | No | No | **Yes** | No | No | No | **Yes** | No |
| Price History | **Yes** | No | No | No | Partial | No | No | **Yes** | No |
| Self-Hostable | **Yes** | **Yes** | **Yes** | N/A | No | No | **Yes** | N/A | N/A |
| Open Source | **Yes** | **Yes** | **Yes** | **Yes** | No | No | **Yes** | **Yes** | **Yes** |
| AI-Verified Data | **Yes** | No | No | No | No | No | No | No | No |
| TypeScript Types | **Yes** | No | No | No | No | No | No | **Yes** | **Yes** |
| Zero Dependencies | **Yes** | N/A | No | No | N/A | N/A | No | No | **Yes** |

### PriceToken & models.dev

[models.dev](https://models.dev) by Anomaly is the largest open-source AI model database — community-curated TOML files covering hundreds of models with detailed capability metadata.

| | PriceToken | models.dev |
|---|---|---|
| **Data source** | YAML registry + AI-powered scraping with multi-agent verification | Community-curated TOML files + GitHub PRs |
| **Distribution** | REST API + website + npm/PyPI SDKs | Single `api.json` endpoint + web UI |
| **Focus** | Pricing depth (cost calculators, history charts, compare) | Model breadth (capabilities, modalities, context windows) |
| **Model count** | ~handful of major providers | Hundreds of models across many providers |
| **Backing** | Solo project | Anomaly (active OSS community, 600+ forks) |

**Where PriceToken focuses:** Live pricing API with offline cost calculators, price history tracking, and multi-agent data verification.

**Where models.dev shines:** Broadest model catalog with rich capability metadata (modalities, reasoning, tool use, knowledge cutoffs) — ideal for model discovery and selection.

### PriceToken & genai-prices

[genai-prices](https://github.com/pydantic/genai-prices) by Pydantic is the closest project in scope, and a great resource — especially for its breadth of provider coverage.

**What we share:** Multi-provider LLM pricing data, Python & JS/TS packages, static pricing data bundled in packages, historic price tracking.

| | PriceToken | genai-prices |
|---|---|---|
| **Data source** | YAML registry + AI-powered scraping (Puppeteer + Claude) with multi-agent verification | Hand-curated YAML files + community PRs |
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

## Trusted by

<table>
  <tr>
    <td align="center" width="200">
      <a href="https://sotto.fm">
        <img src="https://sotto.fm/apple-touch-icon.png" width="48" alt="Sotto" /><br />
        <strong>Sotto</strong><br />
        <sub>AI-powered podcast creation<br />and remixing platform</sub>
      </a>
    </td>
  </tr>
</table>

<sub>Using PriceToken? <a href="https://github.com/affromero/pricetoken/issues">Let us know</a> and we'll add you here.</sub>

## Related Projects

| Project | Description |
|---------|-------------|
| [**Fairtrail**](https://github.com/affromero/fairtrail) | Flight price evolution tracker with natural language search |
| [**gitpane**](https://github.com/affromero/gitpane) | Multi-repo Git workspace dashboard for the terminal |
| [**kin3o**](https://github.com/affromero/kin3o) | AI-powered Lottie animation generator CLI |

## License

MIT
