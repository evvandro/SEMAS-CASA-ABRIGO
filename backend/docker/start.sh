#!/bin/sh

set -eu

required_vars="APP_KEY DB_CONNECTION DB_HOST DB_PORT DB_DATABASE DB_USERNAME DB_PASSWORD"
missing_vars=""

for var_name in $required_vars; do
    eval "var_value=\${$var_name:-}"

    if [ -z "$var_value" ]; then
        missing_vars="$missing_vars $var_name"
    fi
done

if [ -n "$missing_vars" ]; then
    echo "[startup] ERRO: variaveis obrigatorias ausentes no ambiente do Render:$missing_vars" >&2
    echo "[startup] Configure-as em Render > Service > Environment. O render.yaml nao altera automaticamente um servico criado manualmente." >&2
    exit 1
fi

if [ "$DB_CONNECTION" != "pgsql" ]; then
    echo "[startup] ERRO: DB_CONNECTION deve ser pgsql em producao; valor recebido: $DB_CONNECTION" >&2
    exit 1
fi

echo "[startup] Iniciando API Casa Abrigo"
echo "[startup] APP_ENV=${APP_ENV:-production} PORT=${PORT:-8000}"
echo "[startup] DB_CONNECTION=$DB_CONNECTION DB_HOST=$DB_HOST DB_PORT=$DB_PORT DB_DATABASE=$DB_DATABASE DB_USERNAME=$DB_USERNAME DB_SSLMODE=${DB_SSLMODE:-prefer}"
echo "[startup] LOG_CHANNEL=${LOG_CHANNEL:-stderr} LOG_LEVEL=${LOG_LEVEL:-info}"

php artisan config:clear

echo "[startup] Executando migrations"
php artisan migrate --force

echo "[startup] Executando seeders"
php artisan db:seed --force

echo "[startup] Servidor pronto para iniciar na porta ${PORT:-8000}"
exec php artisan serve --host=0.0.0.0 --port="${PORT:-8000}"
