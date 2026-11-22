# syntax=docker/dockerfile:1

# 1. Зависимости
FROM node:24-bookworm-slim AS deps
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci

# 2. Сборка Next.js
FROM node:24-bookworm-slim AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
ENV NEXT_TELEMETRY_DISABLED=1
RUN npm run build

# 3. Запуск (production)
FROM node:24-bookworm-slim AS runner
WORKDIR /app
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV PORT=3000

COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/.next ./.next
COPY --from=builder /app/public ./public
COPY --from=builder /app/package.json ./package.json
COPY --from=builder /app/next.config.mjs ./next.config.mjs

# Каталог для SQLite-базы и загруженных файлов (монтируется как volume)
RUN mkdir -p /app/.data

# Запуск от непривилегированного пользователя (defense in depth)
RUN groupadd --system app && useradd --system --gid app app \
    && chown -R app:app /app/.data /app/.next
USER app

EXPOSE 3000
CMD ["npm", "run", "start"]
