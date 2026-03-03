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
| `api/v1/pricing/route.ts` | `GET /api/v1/pricing` — all models |
| `api/v1/pricing/[modelId]/route.ts` | `GET /api/v1/pricing/:modelId` — single model |
| `api/v1/pricing/cheapest/route.ts` | `GET /api/v1/pricing/cheapest` |
| `api/v1/pricing/compare/route.ts` | `GET /api/v1/pricing/compare` |
| `api/v1/pricing/history/route.ts` | `GET /api/v1/pricing/history` |
| `api/v1/pricing/providers/route.ts` | `GET /api/v1/pricing/providers` |

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

### `apps/web/src/lib/` — Core logic

| File | Purpose |
|------|---------|
| `prisma.ts` | Prisma client singleton |
| `redis.ts` | Redis client + cache helpers |
| `api-response.ts` | `apiSuccess()`/`apiError()` response helpers |
| `api-key.ts` | API key validation + rate limiting |
| `pricing-queries.ts` | Shared pricing query logic for API routes |

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

### `packages/sdk/` — npm package (`pricetoken`)

| File | Purpose |
|------|---------|
| `src/client.ts` | `PriceTokenClient` — typed HTTP client |
| `src/types.ts` | `PriceTokenResponse<T>`, `ModelPricing`, etc. |
| `src/cost.ts` | `calculateModelCost()` — offline cost calculation |
| `src/static.ts` | Static pricing data array |
| `src/index.ts` | Public exports |

## Prisma Schema

Models: `ModelPricingSnapshot` (pricing data points), `ApiKey` (API key management).

## Design System: "Developer Dark"

Background: `#0a0a0a`. Surface: `#141414`. Accent: `#22c55e` (green).
Fonts: Inter (body), JetBrains Mono (code).

## Engineering Patterns

- **Component**: `Name.tsx` + `Name.module.css`. Named export, `styles.root`.
- **API Route**: Zod validate → query → `NextResponse.json()` with `PriceTokenResponse<T>` shape.
- **API helpers**: Use `apiSuccess(data, meta)` and `apiError(message, status)` from `@/lib/api-response.ts`.
- **SDK**: Zero runtime deps, native `fetch`, tsup build (CJS + ESM + `.d.ts`).

## DO

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
- Add runtime dependencies to the SDK package
