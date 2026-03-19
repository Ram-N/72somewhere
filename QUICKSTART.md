# 72 Somewhere — Quickstart

> "Find places where the weather matches what you want."
> Weather-first travel discovery: pick dates + temp range, get matching destinations.

## What This Project Is

A Next.js web app backed by Supabase. Users enter a date range and temperature preference; the app returns cities whose historical climate matches. No real-time weather, no login required.

**Stack:** Next.js 15 + React 19 + TypeScript + Tailwind CSS + Supabase (PostgreSQL)

---

## Start the App (30 seconds)

```bash
cd /home/ram/projects/72somewhere
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

> **Prerequisite:** `.env.local` must have valid Supabase credentials (see below if missing).

---

## Environment Setup (first time or after credential loss)

```bash
cp .env.local.example .env.local
# Edit .env.local and add:
# NEXT_PUBLIC_SUPABASE_URL=...
# NEXT_PUBLIC_SUPABASE_ANON_KEY=...
```

Credentials live in [supabase.com](https://supabase.com) → your project → **Settings → API**.

---

## Key Files to Know

| File/Dir | Purpose |
|---|---|
| `app/page.tsx` | Main UI — date picker, temp sliders, results |
| `app/api/search/route.ts` | Search API endpoint |
| `lib/supabase.ts` | Supabase client config |
| `supabase-setup.sql` | DB schema (cities + climate tables) |
| `data/climate_data_top500_mini_batch_*.csv` | Climate data batches (510 cities) |
| `data/scripts/fetch_from_open_meteo.py` | Script that fetched climate data |
| `data/worldcities_top500.csv` | Curated 510-city list |
| `TODO.md` | Last session's work and next steps |

---

## Where Things Stand (as of 2026-03)

- **Frontend:** Implemented — date range, temp sliders, Find Places, Surprise Me, dark mode
- **Data:** Climate data fetched for ~510 cities across mini-batch CSVs (not yet fully merged/imported)
- **Database:** Supabase schema defined; top-20 cities imported and working
- **Remaining:** Merge mini-batch CSVs → import full 500-city dataset → test at scale

### Picking up data work

```bash
cd /home/ram/projects/72somewhere/data/scripts
source .venv/bin/activate
python fetch_from_open_meteo.py --help
```

Mini-batch CSVs are in `data/` — they need to be merged and re-imported to Supabase when ready.

---

## Quick Test Scenarios

Once the app is running with data loaded:

| Scenario | Dates | Temp Range | Expected |
|---|---|---|---|
| Summer Europe | Jun 1–14 | 18–25°C | Barcelona, Rome, Paris |
| Winter warmth | Dec 1–14 | 20–28°C | Dubai, Bangkok, Mumbai |
| Spring mild | Apr 1–14 | 15–22°C | Tokyo, Auckland, Amsterdam |

---

## Troubleshooting

**No results / "Database query failed"**
- Check `.env.local` credentials
- Verify data exists: Supabase → Table Editor → `climate`
- Try a wider temperature range

**Build errors**
```bash
rm -rf .next node_modules
npm install
npm run dev
```

**Climate data fetch script fails**
```bash
cd data/scripts && source .venv/bin/activate
# Open-Meteo is free, no API key needed
# Script adds 0.5s delay between requests (~4-5 min for 510 cities)
```

---

## Deploy to Vercel

```bash
git push origin main
# Vercel auto-deploys on push (if connected)
# Add env vars in Vercel dashboard: NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_ANON_KEY
```
