# CLAUDE.md — 72 Somewhere

Weather-first travel finder: the user picks dates and a temperature range and gets cities whose historical climate matches. Product spec: `docs/PRD.md`; scoring: `docs/matching_index_scoring_*.md`.

## Stack
- Next.js 15 + React 19 + TypeScript + Tailwind; Recharts. Deploys on Vercel.
- Supabase (Postgres) holds cities and monthly climate (`lib/supabase.ts`). Credentials in `.env.local` (never commit).
- API routes: `app/api/search/route.ts`, `app/api/city/[cityId]/route.ts`. UI components in `app/components/`; About page with release notes in `app/about/`.
- Travel advisories: `lib/advisories.ts`, generated from the State Department CSV in `data/` by `data/scripts/generate_advisories.py`.

## Data
- Python scripts in `data/scripts/` (uv): fetch climate from Open-Meteo, generate SQL inserts into `data/sql/`. No ML, no real-time weather.
- Inserts into Supabase may fail on permissions from here; give Ram the SQL to run in the Supabase SQL editor.

## Rules
- Show flags as images, not emoji (Windows renders flag emoji as letters).
- Read the counting/ranking code before explaining a number shown in the UI.
- `npm run build` and `npm run lint` before committing. Commit format: the global `/git-commit` command.
- Non-goals: booking, pricing, reviews.
