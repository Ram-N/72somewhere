# Setup Guide - Get 72somewhere Running in 10 Minutes

Follow these steps in order to get your MVP running.

## Step 1: Install Dependencies (2 minutes)

```bash
cd /home/ram/projects/72somewhere/app
npm install
```

This will install:
- Next.js, React, TypeScript
- Tailwind CSS
- Supabase client
- All development dependencies

## Step 2: Create Supabase Project (3 minutes)

1. Go to [https://supabase.com](https://supabase.com)
2. Sign in with GitHub
3. Click **"New Project"**
4. Fill in:
   - **Name:** 72somewhere
   - **Database Password:** (generate a strong one, save it)
   - **Region:** Choose closest to you
5. Click **"Create new project"**
6. Wait 2-3 minutes for provisioning

## Step 3: Get API Credentials (1 minute)

1. In your Supabase project, click **Settings** (gear icon) in sidebar
2. Click **API** in the left menu
3. You'll see:
   - **Project URL:** `https://xxxxxxxxxxxxx.supabase.co`
   - **anon/public key:** `eyJhbGc...` (long string)
4. Keep this tab open

## Step 4: Configure Environment (1 minute)

```bash
cd /home/ram/projects/72somewhere/app
cp .env.local.example .env.local
```

Edit `.env.local`:

```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project-ref.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

Replace with values from Step 3.

## Step 5: Create Database Tables (2 minutes)

1. In Supabase dashboard, click **SQL Editor** in sidebar
2. Click **"New query"**
3. Copy entire contents of `supabase-setup.sql`
4. Paste into the SQL editor
5. Click **"Run"** (or press Ctrl+Enter)
6. You should see success messages

Verify tables were created:
- Click **Table Editor** in sidebar
- You should see `cities` and `climate` tables (empty for now)

## Step 6: Import Data (2 minutes)

### Import Cities

1. In **Table Editor**, click the **`cities`** table
2. Click **"Insert"** → **"Import data from CSV"**
3. Click **"Choose file"**
4. Navigate to `/home/ram/projects/72somewhere/data/worldcities_top20.csv`
5. Select the file
6. Supabase will auto-detect columns
7. **Column mapping should auto-match** (all columns have same names):
   - city → city
   - city_ascii → city_ascii
   - lat → lat
   - lng → lng
   - country → country
   - iso2 → iso2
   - iso3 → iso3
   - admin_name → admin_name
   - capital → capital
   - population → population
   - id → id
8. Click **"Import data"**
9. Should import 20 rows

### Import Climate Data

1. Still in **Table Editor**, click the **`climate`** table
2. Click **"Insert"** → **"Import data from CSV"**
3. Choose file: `/home/ram/projects/72somewhere/data/climate_data_top20.csv`
4. Verify column mapping:
   - city_id → city_id
   - city_name → city_name
   - country → country
   - month → month
   - avg_high_temp_c → avg_high_temp_c
   - avg_low_temp_c → avg_low_temp_c
   - avg_precip_mm → avg_precip_mm
5. Click **"Import data"**
6. Should import 240 rows (20 cities × 12 months)

### Verify Import

Run this query in SQL Editor:

```sql
SELECT COUNT(*) as city_count FROM cities;
SELECT COUNT(*) as climate_count FROM climate;
SELECT city_name, COUNT(*) as months
FROM climate
GROUP BY city_name
ORDER BY city_name;
```

You should see:
- 20 cities
- 240 climate rows
- Each city has exactly 12 months

## Step 7: Start Development Server

```bash
npm run dev
```

Open browser to: [http://localhost:3000](http://localhost:3000)

## Step 8: Test the App

### Test 1: Find Summer Destinations

1. **Start Date:** 2024-06-01
2. **End Date:** 2024-06-14
3. **Temperature:** 20°C - 28°C
4. Click **"Find Places"**

Expected results: Barcelona, Rome, Tokyo, Amsterdam

### Test 2: Find Winter Warmth

1. **Start Date:** 2024-12-01
2. **End Date:** 2024-12-14
3. **Temperature:** 25°C - 35°C
4. Click **"Find Places"**

Expected results: Dubai, Bangkok, Mumbai, Singapore

### Test 3: Surprise Me

1. Click **"Surprise Me"**
2. Should auto-fill random dates and temperature
3. Should show random matching destinations

## Troubleshooting

### "Database query failed"

**Problem:** Can't connect to Supabase

**Solution:**
1. Check `.env.local` has correct credentials
2. Make sure you copied the full anon key (it's very long)
3. Restart dev server: `Ctrl+C` then `npm run dev`

### "No destinations found"

**Problem:** Data not imported or query too narrow

**Solution:**
1. Go to Supabase Table Editor
2. Check both tables have data
3. Try wider temperature range (10°C - 35°C)
4. Check browser console for errors

### Import fails

**Problem:** CSV import doesn't work in Supabase

**Solution:**
1. Try importing fewer rows first (test with 5 cities)
2. Check CSV encoding (should be UTF-8)
3. Use SQL INSERT as alternative (slower)

### Port already in use

**Problem:** Port 3000 is taken

**Solution:**
```bash
# Kill process on port 3000
lsof -ti:3000 | xargs kill -9

# Or use different port
npm run dev -- -p 3001
```

## Next Steps

Once everything is working:

1. **Commit your work:**
   ```bash
   cd /home/ram/projects/72somewhere
   git add app/
   git commit -m "feat: add Next.js MVP application"
   git push
   ```

2. **Deploy to Vercel:**
   - Go to [vercel.com](https://vercel.com)
   - Connect your GitHub repo
   - Add environment variables
   - Deploy

3. **Test with real users:**
   - Share the Vercel URL with friends
   - Collect feedback
   - Iterate

## Estimated Total Time

- Dependencies: 2 min
- Supabase project: 3 min
- Environment setup: 1 min
- Create tables: 2 min
- Import data: 2 min
- **Total: ~10 minutes**

Then you have a working MVP! 🚀
