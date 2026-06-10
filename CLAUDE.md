# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**SEMAS Casa Abrigo** — web platform for managing a temporary shelter facility in São Bento do Sul, Brazil. Covers residents (acolhidos), families (famílias), sectors (setores), materials, and deliveries.

## Development Commands

### Starting the dev environment

```bash
# From repo root — runs frontend and backend concurrently
npm run dev

# Backend only (choose mode)
cd backend && ./run-backend.sh local      # SQLite, no Supabase needed
cd backend && ./run-backend.sh supabase   # Connects to Supabase PostgreSQL

# Frontend only
npm run dev:frontend   # Vite on http://localhost:5173
```

The Vite dev server proxies `/api` → `http://127.0.0.1:8000`, so the frontend always talks to the backend without CORS issues locally.

### Testing

```bash
# Backend tests (PHPUnit)
cd backend && php artisan test

# Run a single test file
cd backend && php artisan test tests/Feature/SetoresApiTest.php

# Frontend type checking
cd Frontend && npx tsc -b --noEmit

# Frontend lint
cd Frontend && npm run lint
```

### Code style

```bash
# Check PHP style (Laravel Pint)
cd backend && vendor/bin/pint --test

# Fix PHP style
cd backend && vendor/bin/pint
```

### Database

```bash
cd backend && php artisan migrate --force
cd backend && php artisan db:seed --force
```

### Install all dependencies

```bash
npm run install:all
```

## Architecture

### Stack

- **Backend**: Laravel 13, PHP 8.3, Sanctum (opaque tokens), PostgreSQL (Supabase in prod) / SQLite (local dev)
- **Frontend**: React 19, TypeScript 5 (strict), Vite, Material UI 7, Zod, Axios

### Authentication

Sanctum opaque tokens — no sessions. Login flow:
1. `POST /api/login` → returns token + user
2. Token stored in `localStorage`, injected by `api.ts` axios instance on every request
3. App boot calls `/me` to validate token and rehydrate auth state
4. Roles: `admin`, `tecnico`, `logistica`, `saude`; most write endpoints require `role:admin,tecnico` middleware

Key files: `Frontend/src/auth/AuthContext.tsx`, `Frontend/src/services/api.ts`, `backend/routes/api.php`

### Backend structure

Standard Laravel MVC. All API routes are in `backend/routes/api.php`. Controllers live in `backend/app/Http/Controllers/` grouped by resource. Role-based access is enforced via `middleware('role:admin,tecnico')` and `middleware('admin')` on route groups — not inside controllers.

Form Requests (`backend/app/Http/Requests/`) handle validation. Resources (`backend/app/Http/Resources/`) shape JSON responses with `{ data: ... }` wrapping.

### Frontend structure

```
Frontend/src/
├── App.tsx              # All route definitions (React Router)
├── auth/                # AuthContext + useAuth hook
├── pages/               # Top-level page components
├── modules/acolhidos/   # Domain module with components, schemas, types, utils
├── components/          # Shared components
├── layouts/AppLayout.tsx
├── routes/              # ProtectedRoute, GuestRoute guards
├── services/            # One file per resource (api.ts = axios instance)
└── theme.ts             # MUI theme (indigo primary #4F46E5, no shadows)
```

Feature code goes in `modules/<domain>/` if it's complex enough to have its own types/schemas/utils. Simple pages stay in `pages/`. Shared UI stays in `components/`.

Form validation is done with **Zod schemas** in `modules/acolhidos/schemas/` and passed to React Hook Form.

### CI/CD

GitHub Actions (`.github/workflows/`):
- `ci.yml` — on push/PR to `main`: lint → typecheck → build (frontend); Pint → PHPUnit (backend)
- `deploy-backend.yml` — auto-deploys to **Render** when backend files change

Frontend deploys to **Vercel** (`vercel.json` configures SPA rewrites).

## Key Conventions

- MUI components use `elevation: 0` and 1px borders — no box shadows.
- Backend JSON responses are wrapped: `{ "data": { ... } }` or `{ "data": [ ... ] }`.
- The `Acolhido` (resident) domain is the most complex — use `modules/acolhidos/` as the reference for how to structure a new feature module.
- Pre-seeded users are the only way to log in (no self-registration). Seeder is at `backend/database/seeders/`.
