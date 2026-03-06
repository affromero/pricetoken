# ============================================
# PriceToken — Production Web Container
# Multi-stage build: deps → builder → runner
# Build context: repo root (.)
# ============================================

# ---- Stage 1: Install dependencies ----
FROM node:22-alpine AS deps
RUN apk add --no-cache libc6-compat openssl
WORKDIR /app

COPY package.json package-lock.json ./
COPY apps/web/package.json ./apps/web/
COPY packages/sdk/package.json ./packages/sdk/
COPY apps/web/prisma ./apps/web/prisma/

RUN --mount=type=cache,target=/root/.npm npm ci --ignore-scripts
RUN npx prisma generate --schema=apps/web/prisma/schema.prisma

# ---- Stage 2: Build the application ----
FROM node:22-alpine AS builder
RUN apk add --no-cache libc6-compat openssl
WORKDIR /app

COPY --from=deps /app/node_modules ./node_modules
COPY package.json ./
COPY packages/sdk ./packages/sdk/
COPY apps/web ./apps/web/
COPY tsconfig.base.json ./

ENV NEXT_TELEMETRY_DISABLED=1
ENV NODE_ENV=production

# Build the SDK workspace first (web imports 'pricetoken')
WORKDIR /app/packages/sdk
RUN npx tsup src/index.ts --format cjs,esm --dts --clean

WORKDIR /app/apps/web
RUN npm run build

# ---- Stage 3: Production runner ----
FROM node:22-alpine AS runner
RUN apk add --no-cache libc6-compat openssl chromium
RUN npm install -g @anthropic-ai/claude-code

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV PORT=3001
ENV HOSTNAME="0.0.0.0"
ENV CHROME_PATH=/usr/bin/chromium-browser

# Reuse the existing node user (UID 1000) to match host sotto user for .claude mount
RUN mkdir -p /home/node/.claude && chown node:node /home/node/.claude

WORKDIR /app

# Node modules (standalone trace fails in monorepo — copy full deps)
COPY --from=deps --chown=node:node /app/node_modules ./node_modules

# Standalone server + built app
COPY --from=builder --chown=node:node /app/apps/web/.next/standalone ./
# Static assets: server.js looks at both ./.next/static and ./apps/web/.next/static
COPY --from=builder --chown=node:node /app/apps/web/.next/static ./.next/static
COPY --from=builder --chown=node:node /app/apps/web/.next/static ./apps/web/.next/static
COPY --from=builder /app/apps/web/public ./public
COPY --from=builder /app/apps/web/public ./apps/web/public
COPY --from=builder --chown=node:node /app/apps/web/prisma ./apps/web/prisma

# Seed scripts + SDK source (for STATIC_*_PRICING imports via tsx)
COPY --from=builder --chown=node:node /app/packages/sdk/src/static.ts ./packages/sdk/src/static.ts
COPY --from=builder --chown=node:node /app/packages/sdk/src/static-image.ts ./packages/sdk/src/static-image.ts
COPY --from=builder --chown=node:node /app/packages/sdk/src/video-static.ts ./packages/sdk/src/video-static.ts
COPY --from=builder --chown=node:node /app/packages/sdk/src/types.ts ./packages/sdk/src/types.ts
COPY --chown=node:node scripts/seed.ts ./scripts/seed.ts
COPY --chown=node:node scripts/seed-video.ts ./scripts/seed-video.ts
COPY --chown=node:node tsconfig.base.json ./tsconfig.base.json
COPY --chown=node:node packages/sdk/tsconfig.json ./packages/sdk/tsconfig.json

COPY --chown=node:node docker-entrypoint.sh /usr/local/bin/docker-entrypoint.sh
RUN chmod +x /usr/local/bin/docker-entrypoint.sh

USER node
WORKDIR /app
EXPOSE 3001

ENTRYPOINT ["docker-entrypoint.sh"]
CMD ["node", "server.js"]
