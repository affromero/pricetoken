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

## Design System: "Developer Dark"

Background: `#0a0a0a`. Surface: `#141414`. Accent: `#22c55e` (green).
Fonts: Inter (body), JetBrains Mono (code).

## Engineering Patterns

- **Component**: `Name.tsx` + `Name.module.css`. Named export, `styles.root`.
- **API Route**: Zod validate → query → `NextResponse.json()` with `PriceTokenResponse<T>` shape.
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
