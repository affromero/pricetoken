# ============================================
# PriceToken — Production Web Container
# Multi-stage build: deps → builder → runner
# Build context: repo root (.)
# ============================================

# ---- Stage 1: Install dependencies ----
FROM node:22-alpine3.22 AS deps
RUN apk add --no-cache libc6-compat openssl python3 make g++
WORKDIR /app

COPY package.json package-lock.json ./
COPY apps/web/package.json ./apps/web/
COPY packages/sdk/package.json ./packages/sdk/
COPY apps/web/prisma ./apps/web/prisma/

RUN --mount=type=cache,target=/root/.npm npm ci
RUN npx prisma generate --schema=apps/web/prisma/schema.prisma

# ---- Stage 2: Build the application ----
FROM node:22-alpine3.22 AS builder
RUN apk add --no-cache libc6-compat openssl
WORKDIR /app

COPY --from=deps /app/node_modules ./node_modules
COPY package.json ./
COPY packages/sdk ./packages/sdk/
COPY apps/web ./apps/web/
COPY tsconfig.base.json ./
COPY scripts ./scripts/

ENV NEXT_TELEMETRY_DISABLED=1
ENV NODE_ENV=production

# Build the SDK workspace first (web imports 'pricetoken')
WORKDIR /app/packages/sdk
RUN npx tsup src/index.ts --format cjs,esm --dts --clean

WORKDIR /app/apps/web
RUN npm run build
WORKDIR /app
RUN node scripts/build-runtime.mjs

# ---- Stage 3: Production runner ----
FROM node:22-alpine3.22 AS runner
RUN apk add --no-cache libc6-compat openssl chromium
ARG CLAUDE_CODE_VERSION=2.1.225
RUN npm install -g @anthropic-ai/claude-code@${CLAUDE_CODE_VERSION} \
    && npm cache clean --force
ARG SOURCE_REVISION
LABEL org.opencontainers.image.revision=${SOURCE_REVISION}

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV PORT=3001
ENV HOSTNAME="0.0.0.0"
ENV CHROME_PATH=/usr/bin/chromium-browser

# Reuse the existing node user (UID 1000) to match host sotto user for .claude mount
RUN mkdir -p /home/node/.claude && chown node:node /home/node/.claude

WORKDIR /app

# Standalone server + built app
COPY --from=builder --chown=node:node /app/apps/web/.next/standalone ./
COPY --from=builder --chown=node:node /app/apps/web/.next/static ./apps/web/.next/static
COPY --from=builder /app/apps/web/public ./apps/web/public
COPY --from=builder --chown=node:node /app/apps/web/prisma ./apps/web/prisma
COPY --from=builder --chown=node:node /app/.next/runtime-tools ./runtime-tools

COPY --chown=node:node docker-entrypoint.sh /usr/local/bin/docker-entrypoint.sh
RUN chmod +x /usr/local/bin/docker-entrypoint.sh

# Analytics SQLite data directory
RUN mkdir -p /app/data && chown node:node /app/data

USER node
WORKDIR /app
EXPOSE 3001

ENTRYPOINT ["docker-entrypoint.sh"]
CMD ["node", "apps/web/server.js"]
