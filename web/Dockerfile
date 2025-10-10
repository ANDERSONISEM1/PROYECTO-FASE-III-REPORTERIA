# =========================
# Build Angular
# =========================
FROM node:20-alpine AS builder
WORKDIR /app

# Copia archivos de configuración primero (mejor cacheo)
COPY package*.json ./
COPY angular.json ./
COPY tsconfig*.json ./

# Instala dependencias de forma reproducible
RUN npm ci

# Copia el resto del código y construye
COPY . .
RUN rm -rf dist && npm run build -- --configuration=production-docker

# =========================
# Serve con Nginx
# =========================
FROM nginx:alpine

# Instalar curl para healthcheck
RUN apk add --no-cache curl

# Limpia el docroot y copia el build (Angular v17+ suele quedar en dist/<app>/browser)
RUN rm -rf /usr/share/nginx/html/*
COPY --from=builder /app/dist/web/browser/. /usr/share/nginx/html/

# Verificación build-time (no rompe si falla el ls)
RUN echo "=== LISTANDO /usr/share/nginx/html ===" && ls -la /usr/share/nginx/html/ || true

# Nginx config
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80

# Healthcheck simple al index
HEALTHCHECK --interval=30s --timeout=5s --start-period=15s --retries=3 \
  CMD curl -fsS http://127.0.0.1/ || exit 1

CMD ["nginx", "-g", "daemon off;"]
