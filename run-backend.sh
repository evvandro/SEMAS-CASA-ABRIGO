#!/usr/bin/env bash

set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
BACKEND_DIR="$ROOT_DIR/backend"
MODE="${1:-local}"
HOST="${HOST:-127.0.0.1}"
PORT="${PORT:-8000}"

if [[ ! -d "$BACKEND_DIR" ]]; then
  echo "Erro: pasta backend nao encontrada em $BACKEND_DIR" >&2
  exit 1
fi

cd "$BACKEND_DIR"

if [[ ! -f ".env" ]]; then
  cp .env.example .env
  echo "Arquivo .env criado a partir de .env.example"
fi

if ! grep -q '^APP_KEY=base64:' .env; then
  php artisan key:generate --ansi --force
fi

case "$MODE" in
  local)
    SQLITE_DB="$BACKEND_DIR/database/database.sqlite"
    touch "$SQLITE_DB"

    echo "Iniciando backend em modo LOCAL (SQLite)..."
    DB_CONNECTION=sqlite \
    DB_DATABASE="$SQLITE_DB" \
    CACHE_STORE=file \
    SESSION_DRIVER=file \
    php artisan migrate --force --seed

    DB_CONNECTION=sqlite \
    DB_DATABASE="$SQLITE_DB" \
    CACHE_STORE=file \
    SESSION_DRIVER=file \
    php artisan serve --host="$HOST" --port="$PORT"
    ;;

  supabase)
    echo "Iniciando backend em modo SUPABASE (usando .env)..."
    php artisan migrate --force --seed
    php artisan serve --host="$HOST" --port="$PORT"
    ;;

  *)
    echo "Uso: ./run-backend.sh [local|supabase]" >&2
    exit 1
    ;;
esac
