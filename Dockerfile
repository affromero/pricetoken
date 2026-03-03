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

WORKDIR /app/apps/web
RUN npm run build

# ---- Stage 3: Production runner ----
FROM node:22-alpine AS runner
RUN apk add --no-cache libc6-compat openssl

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV PORT=3001
ENV HOSTNAME="0.0.0.0"

RUN addgroup --system --gid 1001 pricetoken
RUN adduser --system --uid 1001 pricetoken

WORKDIR /app

COPY --from=builder /app/apps/web/public ./apps/web/public
COPY --from=builder --chown=pricetoken:pricetoken /app/apps/web/.next/standalone ./
COPY --from=builder --chown=pricetoken:pricetoken /app/apps/web/.next/static ./apps/web/.next/static

# Prisma runtime
COPY --from=builder --chown=pricetoken:pricetoken /app/apps/web/prisma ./apps/web/prisma
COPY --from=deps --chown=pricetoken:pricetoken /app/node_modules/.prisma ./node_modules/.prisma
COPY --from=deps --chown=pricetoken:pricetoken /app/node_modules/@prisma ./node_modules/@prisma

USER pricetoken
WORKDIR /app
EXPOSE 3001

CMD ["node", "server.js"]
