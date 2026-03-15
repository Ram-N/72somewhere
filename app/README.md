# 72 Somewhere - MVP Web Application

Weather-first travel destination discovery. Find places based on your ideal climate.

## Tech Stack

- **Frontend:** Next.js 15 + React 19 + TypeScript
- **Styling:** Tailwind CSS
- **Database:** Supabase (PostgreSQL)
- **Hosting:** Vercel (recommended)

## Quick Start

### 1. Install Dependencies

```bash
npm install
```

### 2. Set up Supabase

1. Go to [supabase.com](https://supabase.com) and create a new project
2. Once created, go to **Project Settings → API**
3. Copy your **Project URL** and **anon/public key**

### 3. Configure Environment Variables

```bash
cp .env.local.example .env.local
```

Edit `.env.local` and add your Supabase credentials:

```env
NEXT_PUBLIC_SUPABASE_URL=your_project_url_here
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key_here
```

### 4. Set up Database Schema

1. Go to your Supabase project dashboard
2. Navigate to **SQL Editor**
3. Copy the contents of `supabase-setup.sql`
4. Paste and run it in the SQL Editor

This creates:
- `cities` table
- `climate` table
- Indexes for performance
- Row Level Security policies

### 5. Import Data

#### Option A: Using Supabase Dashboard (Easiest)

1. Go to **Table Editor** in Supabase
2. Select the `cities` table
3. Click **Insert → Import data from CSV**
4. Upload `../data/worldcities_top20.csv`
5. Map columns (should auto-match)
6. Repeat for `climate` table with `../data/climate_data_top20.csv`

#### Option B: Using SQL (Alternative)

Create a temporary script in SQL Editor:

```sql
-- You'll need to copy-paste CSV data manually or use Supabase's CSV import feature
-- This is only needed if dashboard import doesn't work
```

### 6. Run Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## Features

### Implemented ✅

- Date range selection
- Temperature range sliders (0-40°C)
- "Find Places" search functionality
- "Surprise Me" random discovery
- Destination results with climate data
- Responsive design (mobile-friendly)
- Dark mode support

### Core User Flow

1. User selects travel dates (start/end)
2. User adjusts temperature range (default: 20-25°C)
3. User clicks "Find Places" or "Surprise Me"
4. App shows 5-10 matching destinations with:
   - City name and country
   - Average temperature
   - High/low temperature range
   - Precipitation levels

## Project Structure

```
app/
├── app/
│   ├── api/
│   │   └── search/
│   │       └── route.ts          # Search API endpoint
│   ├── globals.css               # Global styles
│   ├── layout.tsx                # Root layout
│   └── page.tsx                  # Home page with search UI
├── lib/
│   └── supabase.ts               # Supabase client
├── public/                       # Static assets
├── .env.local.example            # Environment template
├── supabase-setup.sql            # Database schema
├── package.json
└── README.md
```

## API Endpoints

### POST /api/search

Search for destinations matching weather criteria.

**Request:**
```json
{
  "startDate": "2024-06-01",
  "endDate": "2024-06-14",
  "minTemp": 20,
  "maxTemp": 25
}
```

**Response:**
```json
{
  "destinations": [
    {
      "city_name": "Barcelona",
      "country": "Spain",
      "avg_high": 24.5,
      "avg_low": 18.2,
      "avg_temp": 21.4,
      "avg_precip": 3.5
    }
  ]
}
```

## Database Schema

### cities
```sql
city_id TEXT PRIMARY KEY
city_name TEXT
country TEXT
latitude REAL
longitude REAL
population BIGINT
```

### climate
```sql
city_id TEXT
city_name TEXT
country TEXT
month INTEGER (1-12)
avg_high_temp_c REAL
avg_low_temp_c REAL
avg_precip_mm REAL
PRIMARY KEY (city_id, month)
```

## Search Algorithm

1. Convert date range to months (e.g., June 1-14 → month 6)
2. Query climate table for those months
3. Filter by temperature range:
   - `avg_high_temp_c >= minTemp`
   - `avg_low_temp_c <= maxTemp`
4. Group results by city
5. Calculate average temps across selected months
6. Rank by closeness to target temperature
7. Return top 10 results

## Deployment

### Deploy to Vercel (Recommended)

1. Push code to GitHub
2. Go to [vercel.com](https://vercel.com)
3. Import your repository
4. Add environment variables:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
5. Deploy

Vercel automatically:
- Builds your Next.js app
- Serves API routes
- Provides free SSL
- Handles CDN distribution

## Testing with Sample Data

The MVP includes 20 diverse cities:

- **Hot climates:** Dubai, Bangkok, Mumbai, Singapore
- **Mediterranean:** Barcelona, Rome, Cape Town
- **Temperate:** Paris, London, Tokyo, Amsterdam
- **Cool:** Vancouver, Auckland
- **Varied:** New York, Mexico City, Rio, Buenos Aires, Seoul, Casablanca, Sydney

Try these test scenarios:

1. **Summer Europe:** June 1-14, 18-25°C → Should show Barcelona, Rome, Paris
2. **Winter Warmth:** Dec 1-14, 20-28°C → Dubai, Bangkok, Mumbai
3. **Spring Mild:** April 1-14, 15-22°C → Tokyo, Auckland, Amsterdam
4. **Surprise Me:** Random dates and temps for discovery

## Scaling to 500 Cities

When ready to expand:

```bash
cd ../data/scripts
python fetch_climate_data.py worldcities_top500.csv
```

Then re-import the larger CSV files to Supabase. No code changes needed.

## Troubleshooting

**"Database query failed"**
- Check `.env.local` has correct Supabase credentials
- Verify tables exist in Supabase
- Check browser console for detailed error

**No results returned**
- Verify data was imported (check Supabase Table Editor)
- Try broader temperature range
- Check SQL logs in Supabase

**Build errors**
- Run `npm install` again
- Check Node.js version (needs 18+)
- Delete `.next` folder and rebuild

## Next Steps

- [ ] Add map view of destinations
- [ ] Add precipitation preference filter
- [ ] Add "feels like" temperature
- [ ] Add user accounts and saved searches
- [ ] Add flight/hotel booking links
- [ ] Expand to 500 cities
- [ ] Add seasonal photos for each city

## License

MIT
