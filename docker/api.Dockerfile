# ─── build ───────────────────────────────────────────────────────────────────
FROM node:22-slim AS builder
WORKDIR /app

# Debian slim: Prisma ha bisogno di openssl per i suoi engine.
RUN apt-get update && apt-get install -y --no-install-recommends openssl ca-certificates \
    && rm -rf /var/lib/apt/lists/*

# I package.json di tutti i workspace servono a npm ci per risolvere il lockfile.
COPY package.json package-lock.json ./
COPY apps/api/package.json apps/api/
COPY apps/web/package.json apps/web/
RUN npm ci --workspace @rs/api --include-workspace-root

COPY apps/api apps/api
RUN npm run build --workspace @rs/api

# ─── runtime ─────────────────────────────────────────────────────────────────
FROM node:22-slim AS runner
WORKDIR /app
ENV NODE_ENV=production

RUN apt-get update && apt-get install -y --no-install-recommends openssl ca-certificates curl \
    && rm -rf /var/lib/apt/lists/*

COPY --from=builder /app/node_modules node_modules
COPY --from=builder /app/apps/api/dist apps/api/dist
COPY --from=builder /app/apps/api/package.json apps/api/
COPY --from=builder /app/apps/api/prisma apps/api/prisma
COPY package.json ./

# Le immagini caricate dal backoffice vivono su un volume, non nell'immagine.
RUN mkdir -p /data/uploads && chown -R node:node /data
USER node

WORKDIR /app/apps/api
EXPOSE 3000

# Le migration vengono applicate a ogni avvio: un deploy nuovo allinea da solo il DB.
CMD ["sh", "-c", "npx prisma migrate deploy && node dist/index.js"]
