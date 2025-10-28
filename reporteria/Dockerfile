# =========
# STAGE 1: Node (opcional, para Vite build si usas assets)
# =========
FROM node:20-bookworm AS node_builder
WORKDIR /app
# Copiamos lo mínimo para no invalidar caché si no cambian assets
COPY package.json package-lock.json* pnpm-lock.yaml* yarn.lock* .npmrc* ./
# Si no hay lock, usar npm ci con fallback
RUN if [ -f package-lock.json ]; then npm ci; else npm install; fi
COPY resources ./resources
COPY vite.config.* postcss.config.* tailwind.config.* ./ 2>/dev/null || true
# Si no hay scripts de build, no fallar
RUN npm run build || echo "No Vite build (sin scripts) – continuando"

# =========
# STAGE 2: Runtime PHP (CLI), con extensiones MySQL y SQL Server
# =========
FROM php:8.4-cli-bookworm

ENV DEBIAN_FRONTEND=noninteractive \
    ACCEPT_EULA=Y \
    TZ=America/Guatemala \
    COMPOSER_ALLOW_SUPERUSER=1

WORKDIR /var/www/html

# SO + ODBC18 + extensiones PHP (MySQL y SQL Server)
RUN apt-get update && apt-get install -y --no-install-recommends \
    ca-certificates gnupg curl wget unzip git tzdata \
    build-essential autoconf make g++ \
    libzip-dev libicu-dev libonig-dev \
    libpng-dev libjpeg-dev libfreetype6-dev \
    locales unixodbc-dev \
 && echo "en_US.UTF-8 UTF-8" > /etc/locale.gen \
 && locale-gen \
 && mkdir -p /usr/share/keyrings \
 && curl -fsSL https://packages.microsoft.com/keys/microsoft.asc \
    | gpg --dearmor -o /usr/share/keyrings/microsoft-prod.gpg \
 && echo "deb [arch=amd64,arm64 signed-by=/usr/share/keyrings/microsoft-prod.gpg] https://packages.microsoft.com/debian/12/prod bookworm main" \
    > /etc/apt/sources.list.d/microsoft-prod.list \
 && apt-get update \
 && apt-get install -y --no-install-recommends msodbcsql18 mssql-tools18 \
 && docker-php-ext-configure intl \
 && docker-php-ext-install -j$(nproc) intl zip pdo_mysql bcmath pcntl \
 && docker-php-ext-configure gd --with-freetype --with-jpeg \
 && docker-php-ext-install -j$(nproc) gd \
 && pecl install sqlsrv pdo_sqlsrv \
 && docker-php-ext-enable sqlsrv pdo_sqlsrv \
 && apt-get purge -y --auto-remove build-essential autoconf g++ make \
 && rm -rf /var/lib/apt/lists/* /tmp/* /var/tmp/*

# Composer
COPY --from=composer:2 /usr/bin/composer /usr/bin/composer

# Copia TODO el proyecto (incluye 'artisan') ANTES de instalar
COPY . .

# Instala dependencias PHP (deja los hooks habilitados porque ya existe 'artisan')
RUN composer install --prefer-dist --no-interaction --no-progress

# Permisos Laravel
RUN mkdir -p storage bootstrap/cache \
 && chown -R www-data:www-data storage bootstrap/cache \
 && chmod -R 775 storage bootstrap/cache

# ======== BLOQUE DOMPDF/Blade (robusto durante la build) ========
RUN set -e \
 && mkdir -p storage/framework/cache storage/framework/sessions storage/framework/views storage/fonts bootstrap/cache \
 && chown -R www-data:www-data storage storage/framework storage/fonts bootstrap/cache \
 && chmod -R 775 storage storage/framework storage/fonts bootstrap/cache \
 && php artisan view:clear || true \
 && php artisan optimize:clear || true \
 && php artisan config:clear || true \
 && php artisan cache:clear || true \
 && php artisan route:clear || true
# ================================================================

ENV APP_ENV=local \
    APP_DEBUG=true \
    APP_URL=http://localhost \
    SESSION_DRIVER=database \
    QUEUE_CONNECTION=database

EXPOSE 8000

HEALTHCHECK --interval=20s --timeout=3s --retries=5 \
  CMD php -r "fsockopen('127.0.0.1', 8000);" >/dev/null 2>&1 || exit 1

CMD [ "php", "artisan", "serve", "--host=0.0.0.0", "--port=8000" ]
