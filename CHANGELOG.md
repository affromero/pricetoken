# Changelog

## [0.5.0] - 2026-03-04

### Added
- `launchDate` field across the full stack: SDK types, Prisma schema, static data for all 42 models
- `after` and `before` date query params on `/api/v1/pricing` and `/api/v1/pricing/cheapest` endpoints for filtering models by launch date
- Sortable "Launched" column in the PricingTable (formats as "Mon YYYY", nulls sorted last)
- Launch Price Timeline scatter plot on `/history` page showing price trends across providers over time
- `after`/`before` params in both TS and Python SDK clients (`getPricing`, `getCheapest`, `get_pricing`, `get_cheapest`)
- GPT-5.3 Instant and GPT-5.3 Codex to static pricing data
- Legal disclaimer page (`/legal`) and footer link
- 7 new tests for date range filtering and SDK param forwarding (188 total)

### Fixed
- Seed script now backfills `launchDate` on existing DB records (previously only inserted new models)
- 6 launch dates corrected to use API GA dates instead of announcement dates (Grok 3/Mini, Gemini 2.0 Flash-Lite, DeepSeek V3, GPT-5.3 Codex, GPT-5.1)
- Deploy workflow seed step added to populate new models on deploy

## [0.4.1] - 2026-03-04

### Added
- Comprehensive API route handler tests: 67 tests across all 8 public endpoints covering HTTP status codes, CORS headers, Cache-Control, cache behavior, query params, currency conversion, and response shapes
- Curl example with JSON response preview in landing page hero section

### Fixed
- Seed script now inserts missing models instead of skipping when database already has data

## [0.4.0] - 2026-03-04

### Added
- xAI provider (Grok 4, Grok 4.1 Fast, Grok 3, Grok 3 Mini)
- Mistral provider (Mistral Large 3, Mistral Medium 3, Codestral, Mistral Small 3.1)
- OpenAI models: GPT-5.1, o3 Pro, o3 Mini
- Google preview models: Gemini 3.1 Pro Preview, Gemini 3 Flash Preview
- Puppeteer-based scraping for JS-rendered pricing pages (React SPAs)
- Provider brand colors for xAI and Mistral in dark/light themes
- PyPI install option in landing page hero CTA

### Fixed
- Deploy workflow Prisma schema path
- Docker build caching in deploy workflow
- USD currency included in API responses by default

## [0.3.1] - 2026-03-04

### Changed
- Admin authentication: replaced IP allowlist with password + HMAC-signed session cookies
- Admin routes restructured with Next.js route groups — login page has no sidebar

### Added
- `/admin/login` page with password form
- `POST /api/admin/auth` login endpoint with timing-safe password comparison
- `POST /api/admin/auth/logout` endpoint
- Logout button in admin sidebar
- Session cookie auth library (`admin-auth.ts`) using `crypto.subtle` (Edge-compatible)

### Removed
- `ADMIN_ALLOWED_IPS` env var — replaced by `ADMIN_PASSWORD` + `ADMIN_SESSION_SECRET`

## [py-0.3.0] - 2026-03-04

### Added
- Python SDK (`packages/sdk-python/`) — zero-dependency Python package mirroring the JS/TS SDK
- `PriceTokenClient` with all 6 API methods (get_pricing, get_model, get_history, get_providers, compare, get_cheapest)
- `calculate_cost` and `calculate_model_cost` for offline cost calculation
- 21 static pricing entries (Anthropic, OpenAI, Google, DeepSeek)
- Full type coverage with `dataclass(slots=True)` and PEP 561 `py.typed` marker
- `ci-python` job in CI workflow (ruff, mypy strict, pytest)
- `publish-python.yml` workflow for PyPI publishing on `py-v*` tags
- Python quick start section and PyPI badge in root README
- PyPI Package row in comparison table

### Fixed
- ESLint `no-undef` for `process` in `.mjs` files
- `package-lock.json` sync for `@pricetoken/sdk-python` workspace

## [0.3.0] - 2026-03-04

### Added
- Multi-agent verification pipeline: three AI providers (Anthropic, OpenAI, Google) cross-check extracted pricing with 2-of-3 consensus
- Admin panel with IP allowlist: fetch status dashboard, alerts page, cost tracking, and provider config
- Admin icon in navigation bar (visible to allowed IPs only)
- Daily cron trigger for automated pricing fetches
- Paste-text input mode for the cost calculator
- Model lifecycle status detection (active, deprecated) with StatusBadge component
- Missing model detection with admin warnings and fallback URL pipeline
- Custom pill dropdown for currency selector
- Full SEO suite: OpenGraph metadata, security headers, structured data
- Trust system with model status badges and confidence scores
- Auto-deploy on push to main via GitHub Actions

### Fixed
- Static pricing data corrections: removed hallucinated models, fixed context windows and prices
- SDK workspace build order in Docker
- OG metadata and social sharing image
- Price history chart tooltip precision (2 decimal places)

### Changed
- README overhauled with feature comparison table and verification explanation
- DataSources component updated with 4-step pipeline explanation

## [0.2.0] - 2026-03-03

### Added
- Gemini 3.1 Pro Preview to static pricing data ($2.00/$12.00 per MTok)
- "How We Get Our Data" transparency section on landing page with provider links and contribution CTA
- Pricing section subtitle explaining update frequency and units
- Alternatives comparison table in README

### Fixed
- Rate limit text corrected from "100 requests/day" to "30 requests/hour" (landing page + SDK README)
- Missing `.filters` CSS class in PricingTable causing unstyled filter bar
