# ─── build ───────────────────────────────────────────────────────────────────
FROM node:22-slim AS builder
WORKDIR /app

# Le VITE_* finiscono dentro il bundle: vanno note qui, non a runtime.
ARG VITE_API_URL=/api
ARG VITE_ADMIN_PATH=admin
ARG VITE_SITE_URL=https://riccardosensi.com
ENV VITE_API_URL=$VITE_API_URL \
    VITE_ADMIN_PATH=$VITE_ADMIN_PATH \
    VITE_SITE_URL=$VITE_SITE_URL

COPY package.json package-lock.json ./
COPY apps/web/package.json apps/web/
COPY apps/api/package.json apps/api/
RUN npm ci --workspace @rs/web --include-workspace-root

COPY apps/web apps/web
RUN npm run build --workspace @rs/web

# ─── runtime ─────────────────────────────────────────────────────────────────
FROM nginx:1.27-alpine AS runner

# Il template viene reso da envsubst all'avvio (vedi NGINX_ENVSUBST_FILTER nel compose).
# La variante TLS non è attiva: la monta docker-compose.tls.yml quando serve.
COPY docker/nginx.conf.template /etc/nginx/templates/default.conf.template
COPY docker/security-headers.conf /etc/nginx/snippets/security-headers.conf
COPY docker/snippets/site-locations.conf /etc/nginx/snippets/site-locations.conf
COPY --from=builder /app/apps/web/dist /usr/share/nginx/html

EXPOSE 80
