FROM php:8.4-cli

RUN apt-get update && apt-get install -y \
    libpq-dev libzip-dev libonig-dev libxml2-dev unzip git curl \
    && docker-php-ext-install pdo_pgsql pgsql zip bcmath mbstring xml dom xmlwriter \
    && rm -rf /var/lib/apt/lists/*

COPY --from=composer:2 /usr/bin/composer /usr/bin/composer

WORKDIR /app

COPY composer.json composer.lock ./
RUN composer install --no-dev --no-interaction --prefer-dist --optimize-autoloader --no-scripts

COPY . .

RUN cp .env.example .env \
    && php artisan key:generate --force \
    && composer run-script post-autoload-dump

EXPOSE 8000

# IMPORTANTE: limpar a config em RUNTIME (não no build) garante que as variáveis de
# ambiente do Render (DB_CONNECTION=pgsql etc.) valham. Se a config for cacheada no
# build — quando essas vars ainda não existem — o app sobe preso em sqlite e ignora o env.
CMD php artisan config:clear \
    && php artisan migrate --force \
    && php artisan db:seed --force \
    && php artisan serve --host=0.0.0.0 --port=${PORT:-8000}
