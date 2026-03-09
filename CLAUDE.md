# CLAUDE.md — PriceToken

> **PriceToken** — The missing API for LLM pricing. Real-time pricing data scraped from providers, served via REST API, visualized on a website, and distributed as an npm package.

## Tech Stack

| Layer | Technology |
|-------|------------|
| Frontend | Next.js 15+ (App Router), TypeScript, CSS Modules |
| Database | PostgreSQL 16 + Prisma ORM |
| Cache | Redis 7 (rate limiting + response caching) |
| AI | Anthropic Claude (pricing extraction from provider pages) |
| Hosting | Hetzner VPS (Docker Compose + Caddy) |

## Monorepo

npm workspaces: `@pricetoken/web` (`apps/web/`), `pricetoken` (`packages/sdk/`).
Root `package.json` proxies to `@pricetoken/web`.

## Environment Variables

All secrets via **Doppler** — NEVER use `.env` files. Project: `pricetoken`, config: `dev`.
Scripts wrap with `doppler run --`.

Critical: `DATABASE_URL`, `REDIS_URL`, `ANTHROPIC_API_KEY`.

## Build Commands

```bash
npm install                    # All workspaces
docker-compose up -d           # PostgreSQL + Redis
npx prisma db push --schema=apps/web/prisma/schema.prisma
npx prisma generate --schema=apps/web/prisma/schema.prisma
npm run dev                    # Web app on :3001 (wraps with doppler run)
npm run ci                     # lint + typecheck + test + build
npm run seed                   # Seed DB from static pricing data
npm run fetch-pricing          # Run pricing scraper
```

## File Index

### `apps/web/src/app/` — Pages & API routes

| Path | Purpose |
|------|---------|
| `page.tsx` | Landing page — hero, pricing table, cost calculator |
| `layout.tsx` | Root layout — fonts, metadata, ThemeToggle |
| `calculator/page.tsx` | Standalone cost calculator page |
| `compare/page.tsx` | Model comparison page |
| `docs/page.tsx` | API documentation page |
| `history/page.tsx` | Price history chart page |
| `robots.ts` | Robots.txt generation |
| `sitemap.ts` | Sitemap generation |
| `api/health/route.ts` | Health check endpoint |
| `api/v1/text/route.ts` | `GET /api/v1/text` — all text models |
| `api/v1/text/[modelId]/route.ts` | `GET /api/v1/text/:modelId` — single model |
| `api/v1/text/cheapest/route.ts` | `GET /api/v1/text/cheapest` |
| `api/v1/text/compare/route.ts` | `GET /api/v1/text/compare` |
| `api/v1/text/history/route.ts` | `GET /api/v1/text/history` |
| `api/v1/text/providers/route.ts` | `GET /api/v1/text/providers` |
| `api/v1/avatar/route.ts` | `GET /api/v1/avatar` — all avatar models |
| `api/v1/avatar/[modelId]/route.ts` | `GET /api/v1/avatar/:modelId` — single avatar model |
| `api/v1/avatar/cheapest/route.ts` | `GET /api/v1/avatar/cheapest` |
| `api/v1/avatar/compare/route.ts` | `GET /api/v1/avatar/compare` |
| `api/v1/avatar/history/route.ts` | `GET /api/v1/avatar/history` |
| `api/v1/avatar/providers/route.ts` | `GET /api/v1/avatar/providers` |
| `avatar/page.tsx` | Avatar pricing page — table + non-API providers |
| `avatar/calculator/page.tsx` | Avatar cost calculator |
| `avatar/compare/page.tsx` | Avatar model comparison |
| `avatar/history/page.tsx` | Avatar price history |

### `apps/web/src/components/` — UI components

| Component | Purpose |
|-----------|---------|
| `PricingTable/` | Main pricing data table with provider filtering |
| `CostCalculator/` | Token cost calculator |
| `ModelCompare/` | Side-by-side model comparison |
| `PriceHistoryChart/` | Recharts-based price history chart |
| `Navigation/` | Top navigation bar |
| `Footer/` | Page footer |
| `CodeBlock/` | Syntax-highlighted code blocks |
| `AvatarPricingTable/` | Avatar pricing table with avatarType column |
| `AvatarCostCalculator/` | Avatar cost calculator |
| `AvatarModelCompare/` | Avatar model comparison |
| `AvatarPriceHistoryChart/` | Avatar price history chart |
| `NonApiProviderCards/` | Non-API provider directory cards |

### `apps/web/src/lib/` — Core logic

| File | Purpose |
|------|---------|
| `prisma.ts` | Prisma client singleton |
| `redis.ts` | Redis client + cache helpers |
| `api-response.ts` | `apiSuccess()`/`apiError()` response helpers |
| `api-key.ts` | API key validation + rate limiting |
| `pricing-queries.ts` | Shared pricing query logic for API routes |
| `avatar-pricing-queries.ts` | Avatar pricing query logic |
| `avatar-non-api-providers.ts` | Static config for non-API avatar providers |

### `apps/web/src/lib/fetcher/` — Pricing scraper pipeline

Pipeline: `providers.ts` → `scraper.ts` → `extractor.ts` → `store.ts` → `run-fetch.ts`

| File | Purpose |
|------|---------|
| `providers.ts` | Provider registry (URLs, selectors) |
| `scraper.ts` | Puppeteer page scraping |
| `extractor.ts` | AI-powered pricing extraction (Claude) |
| `system-prompt.ts` | System prompt for AI extraction |
| `store.ts` | Save/read pricing snapshots to DB |
| `run-fetch.ts` | Orchestrates full fetch run |
| `avatar-providers.ts` | Avatar provider registry (HeyGen, FAL, Runway) |
| `avatar-extractor.ts` | AI-powered avatar pricing extraction |
| `avatar-store.ts` | Save/read avatar pricing snapshots |
| `run-avatar-fetch.ts` | Orchestrates avatar fetch pipeline |

### `registry/` — YAML model registry (single source of truth)

| File | Purpose |
|------|---------|
| `text.yaml` | Text/LLM model pricing |
| `tts.yaml` | Text-to-Speech model pricing |
| `stt.yaml` | Speech-to-Text model pricing |
| `avatar.yaml` | Avatar video model pricing |
| `image.yaml` | Image generation model pricing |
| `video.yaml` | Video generation model pricing |

### `scripts/` — Build & generation scripts

| File | Purpose |
|------|---------|
| `lib/formatters.ts` | Shared TS/Python formatter functions for static file generation |
| `generate-static.ts` | Generates 12 static files from `registry/*.yaml` (`--check` for CI) |
| `bootstrap-registry.ts` | One-time: bootstrapped YAML from existing TS static files |
| `update-static.ts` | Fetches pricing from live API → writes static files |

### `packages/sdk/` — npm package (`pricetoken`)

| File | Purpose |
|------|---------|
| `src/client.ts` | `PriceTokenClient` — typed HTTP client |
| `src/types.ts` | `PriceTokenResponse<T>`, `ModelPricing`, etc. |
| `src/cost.ts` | `calculateModelCost()` — offline cost calculation |
| `src/static.ts` | Static pricing data array (generated — do not hand-edit) |
| `src/index.ts` | Public exports |
| `src/avatar-static.ts` | Static avatar pricing data (generated — do not hand-edit) |
| `src/avatar-cost.ts` | `calculateAvatarCost()` — offline avatar cost calculation |

## Prisma Schema

Models: `ModelPricingSnapshot` (pricing data), `AvatarPricingSnapshot` (avatar pricing), `ApiKey` (API key management).

## Design System: "Developer Dark"

Background: `#0a0a0a`. Surface: `#141414`. Accent: `#22c55e` (green).
Fonts: Inter (body), JetBrains Mono (code).

## Engineering Patterns

- **Component**: `Name.tsx` + `Name.module.css`. Named export, `styles.root`.
- **API Route**: Zod validate → query → `NextResponse.json()` with `PriceTokenResponse<T>` shape.
- **API helpers**: Use `apiSuccess(data, meta)` and `apiError(message, status)` from `@/lib/api-response.ts`.
- **SDK**: Zero runtime deps, native `fetch`, tsup build (CJS + ESM + `.d.ts`).

## Adding a New Model or Provider

When adding a new model or provider to **any** category (text, tts, stt, avatar, image, video), complete **all** of these steps:

1. **Registry** — add the model entry to `registry/<category>.yaml`
2. **Generate static** — `npm run generate-static` (regenerates both TS + Python SDK files)
3. **Update model count** — fix the assertion in `scripts/__tests__/generate-static.test.ts`
4. **Scraper pipeline** — if this is a new **provider** (not just a new model from an existing provider):
   - Add provider config to the category's `*-providers.ts` (e.g. `avatar-providers.ts`, `providers.ts`)
   - Add model IDs + conversion rules to the category's `*-system-prompt.ts`
5. **CI** — `npm run ci` (lint + typecheck + test + build + python tests)
6. **Deploy + seed** — after deploy, run the category seed script (e.g. `seed-avatar.ts`) to insert new models into the DB

## DO

- **Add/update models via `registry/*.yaml`** — edit the YAML, run `npm run generate-static`, commit the results. The generator keeps both SDKs in sync automatically.
- Use CSS Modules for all styling
- Use TypeScript strict mode
- Use Server Components by default
- Return proper HTTP status codes
- Set CORS headers on all API routes
- Cache API responses in Redis (5min TTL)

## DON'T

- Use Tailwind, inline styles, or styled-components
- Use `any` type
- Hardcode model names in the SDK — use static data array
- Hand-edit generated static files (`*-static.ts`, `*_static.py`) — they are auto-generated from `registry/*.yaml`
- Add runtime dependencies to the SDK package
