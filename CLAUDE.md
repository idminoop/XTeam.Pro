# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

XTeam.Pro is a Business Automation Assessment and Consulting Platform with a React + TypeScript SPA frontend (Vite) and a Python FastAPI backend. The frontend and backend are co-located in a single repo.

## Development Commands

```bash
# Start both frontend (Vite, port 5173) and backend (uvicorn, port 8001) concurrently
npm run dev

# Frontend only
npm run client:dev

# Backend only (via nodemon watching backend/*.py)
npm run server:dev

# Type-check without emitting
npm run check

# Lint
npm run lint

# Production build (type-check + Vite bundle)
npm run build
```

**Backend setup (first time):**
```bash
cd backend
python -m venv venv
./venv/Scripts/pip install -r requirements.txt
# Copy .env.example -> .env and fill in values
```

**No test runner is configured.** There are no test scripts in package.json and no test files present, despite the architecture docs mentioning Jest/pytest.

## Architecture

### Two-Tier Stack

```
React SPA (Vite)
    |
    | /api/* proxy (dev) → direct (prod)
    ↓
FastAPI (Python, port 8001)
    |── SQLAlchemy async → SQLite (dev) / PostgreSQL (prod)
    |── OpenAI GPT-4 (background AI audit processing)
    |── ReportLab/Matplotlib (PDF report generation)
    |── SMTP (email notifications)
    └── JWT + bcrypt (auth)
```

### Frontend Structure (`src/`)

- **`pages/`** — Route-level components (Home, Audit, AuditResults, Solutions, Pricing, About, Contact, Blog, BlogPost, Admin). All pages are lazy-loaded via `React.lazy()` + `Suspense`.
- **`components/layout/`** — Header, Footer, Layout wrapper.
- **`components/ui/`** — shadcn/ui primitives (do not modify directly; regenerate via `npx shadcn add <component>`).
- **`utils/api.ts`** — Primary API fetch wrapper; reads `VITE_API_URL` for base URL.
- **`locales/en.json`, `locales/ru.json`** — i18n translation files. The app supports EN and RU via i18next.
- **`hooks/useTheme.ts`** — Dark/light mode (localStorage + CSS class on `<html>`).
- **`lib/utils.ts`** — `cn()` helper (clsx + tailwind-merge).

### Backend Structure (`backend/`)

- **`main.py`** — App factory: mounts routers, CORS, rate limiting middleware, request logger, global exception handler.
- **`routes/`** — FastAPI routers registered at `/api/audit`, `/api/contact`, `/api/calculator`, `/api/admin`.
- **`services/`** — Business logic: `ai_service.py` (GPT-4, async background processing), `auth_service.py` (JWT), `email_service.py`, `pdf_service.py`, `analytics_service.py`.
- **`models/`** — SQLAlchemy ORM models (audit, contact, admin, blog).
- **`database/config.py`** — Engine/session factory; auto-detects SQLite vs PostgreSQL from `DATABASE_URL`.

### Async AI Processing Flow

Audit submissions immediately return a pending audit ID. Processing happens in `asyncio.create_task()` via `AIService._process_audit_background()`. Status transitions: `pending → processing → completed / failed`. The frontend polls AuditResults page for status.

## Key Conventions

- **Path alias:** `@/` maps to `src/` — use this for all frontend imports.
- **TypeScript strict mode is OFF** — avoid enabling it without addressing existing type gaps.
- **API calls (frontend):** Use the `apiCall()` wrapper in `src/utils/api.ts` (fetch-based), not axios (installed but not the primary pattern).
- **Forms:** React Hook Form + Zod schemas. Do not use uncontrolled forms.
- **Styling:** Tailwind CSS with shadcn/ui. Use CSS variables from `src/index.css` for theme colors, not hardcoded values.
- **i18n:** All user-facing strings must use `useTranslation()` hook and be added to both `en.json` and `ru.json`.

## Environment Variables

**Frontend** (`.env`, `VITE_`-prefixed, see `.env.example`):
- `VITE_API_URL` — Backend URL (default: `http://localhost:8000`)
- `VITE_OPENAI_API_KEY` — **Do not expose in production builds**

**Backend** (`backend/.env`, see `backend/.env.example`):
- `DATABASE_URL` — SQLite for dev (`sqlite+aiosqlite:///./xteam_pro.db`), PostgreSQL for prod
- `SECRET_KEY` — JWT signing key
- `OPENAI_API_KEY` — Server-side GPT-4 key
- `DEFAULT_ADMIN_EMAIL` / `DEFAULT_ADMIN_PASSWORD` — Seeded on startup

## Dead Dependencies (Known Issues)

`package.json` contains leftover Node/Express dependencies from an earlier backend iteration: `express`, `multer`, `bcryptjs`, `jsonwebtoken`, `@next/font`. These are unused — the backend is Python FastAPI. Do not use them.

The architecture docs in `.trae/documents/` describe a Next.js 14 frontend, which does not match the actual Vite + React Router implementation. Prefer the actual code over the docs when they conflict.
