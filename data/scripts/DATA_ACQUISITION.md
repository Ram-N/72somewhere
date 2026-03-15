# Climate Data Acquisition Guide

Documentation for acquiring and validating climate data for the 72somewhere project.

## Quick Start (MVP - 20 Cities)

```bash
cd /home/ram/projects/72somewhere/data/scripts

# 1. Select top 20 cities
python select_top20_cities.py

# 2. Fetch climate data for 20 cities
python fetch_climate_data.py

# 3. Validate the data
python validate_climate_data.py
```

**Total time:** ~30 seconds

## Data Files Generated

- `worldcities_top20.csv` - Curated list of 20 diverse cities (for MVP)
- `climate_data_top20.csv` - Climate data for the top 20 cities (240 rows: 20 cities × 12 months)
- `climate_fetch_progress_worldcities_top20.json` - Progress tracking for resumable fetching

## Scripts

### 1. `select_top20_cities.py`

Selects 20 cities from the worldcities dataset with balanced geographic distribution.

**Usage:**
```bash
python select_top20_cities.py
```

**Output:**
- `../worldcities_top20.csv` - 20 selected cities

**Selection Criteria:**
- Geographic diversity (6 Asia, 5 Europe, 5 Americas, 2 Africa, 2 Oceania)
- Mix of population size and tourism appeal
- Climate variety for testing

**Cities Selected:**
- **Asia:** Tokyo, Bangkok, Singapore, Dubai, Mumbai, Seoul
- **Europe:** Paris, London, Barcelona, Rome, Amsterdam
- **Americas:** New York, Mexico City, Rio de Janeiro, Buenos Aires, Vancouver
- **Africa:** Cape Town, Casablanca
- **Oceania:** Sydney, Auckland

### 2. `fetch_climate_data.py`

Fetches climate data from Open-Meteo Historical Weather API.

**Usage:**
```bash
# Fetch for top 20 cities (default)
python fetch_climate_data.py

# Fetch for full 500 cities (when ready)
python fetch_climate_data.py worldcities_top500.csv
```

**Features:**
- Rate limiting (1 second delay between requests)
- Retry logic (3 attempts per city with 5 second backoff)
- Progress tracking (resume on failure)
- Incremental saving (data saved after each city)

**Output:**
- `../climate_data_top20.csv` - Climate data in required format
- `../climate_fetch_progress_worldcities_top20.json` - Progress file

**Data Fields:**
- `city_id` - Matches worldcities ID
- `city_name` - City name
- `country` - Country name
- `month` - Month number (1-12)
- `avg_high_temp_c` - Average high temperature in Celsius
- `avg_low_temp_c` - Average low temperature in Celsius
- `avg_precip_mm` - Average precipitation in millimeters

**Data Period:** 2022-2024 (3-year average)

### 3. `validate_climate_data.py`

Validates climate data for completeness and quality.

**Usage:**
```bash
# Validate top 20 dataset (default)
python validate_climate_data.py

# Validate full dataset
python validate_climate_data.py climate_data_top500.csv
```

**Checks:**
1. Month completeness (all 12 months for each city)
2. No missing values
3. Temperature reasonableness (high > low, no extremes)
4. Non-negative precipitation

**Output:**
- Validation report with pass/fail status
- Summary statistics
- Geographic distribution

## Validation Results (Top 20 Cities)

✓ **PASSED** - All validation checks successful

**Statistics:**
- Cities: 20
- Total rows: 240 (20 cities × 12 months)
- Temperature range: -7°C to 41°C (high), 2°C to 31°C (low)
- Precipitation range: 0mm to 34mm
- Complete coverage: All 12 months for all cities
- No missing values
- All values within reasonable ranges

## Scaling to 500 Cities

When ready to expand beyond the MVP 20 cities:

```bash
# Fetch climate data for all 500 cities
python fetch_climate_data.py worldcities_top500.csv
```

**Estimated time:** ~10 minutes (500 cities × 1 second delay + API response time)

The script will:
- Resume from where it left off if interrupted
- Save progress after each city
- Retry failed requests automatically
- Generate `climate_data_top500.csv` with 6,000 rows (500 cities × 12 months)

## API Information

**Data Source:** Open-Meteo Historical Weather API
- URL: https://archive-api.open-meteo.com/v1/archive
- License: Free for non-commercial use
- Rate limits: Respectful usage with delays

**Data Quality:**
- Based on ERA5 reanalysis data
- 3-year period (2022-2024) for recent climate patterns
- Monthly averages calculated from daily values

## Database Schema

### City Table
```sql
CREATE TABLE cities (
  city_id TEXT PRIMARY KEY,
  city_name TEXT NOT NULL,
  country TEXT NOT NULL,
  latitude REAL NOT NULL,
  longitude REAL NOT NULL,
  population INTEGER
);
```

### Climate Table
```sql
CREATE TABLE climate (
  city_id TEXT NOT NULL,
  month INTEGER NOT NULL,
  avg_high_temp_c REAL NOT NULL,
  avg_low_temp_c REAL NOT NULL,
  avg_precip_mm REAL NOT NULL,
  PRIMARY KEY (city_id, month),
  FOREIGN KEY (city_id) REFERENCES cities(city_id)
);
```

## Troubleshooting

**Script fails midway:**
- Check internet connection
- Progress is saved - just re-run the script
- It will resume from where it stopped

**Missing cities in selection:**
- Check country name format in worldcities.csv
- Some countries use "Korea, South" not "South Korea"
- Edit `TOP_20_CITIES` list in select_top20_cities.py

**Validation failures:**
- Check for API changes or data quality issues
- Review specific error messages in validation output
- Re-fetch problematic cities by deleting their city_id from progress file

## Next Steps

After generating and validating the data:

1. ✓ Load `worldcities_top20.csv` into your city database
2. ✓ Load `climate_data_top20.csv` into your climate database
3. ✓ Ensure `city_id` field links the two datasets
4. Begin web application development with this seed data
5. Test the MVP with 20 cities
6. Scale to 500 cities once MVP is validated
7. (Optional) Expand to full worldcities dataset if needed

## File Locations

```
/home/ram/projects/72somewhere/
├── data/
│   ├── worldcities_top500.csv          # Source city database
│   ├── worldcities_top20.csv           # ✓ Generated - 20 cities for MVP
│   ├── climate_data_top20.csv          # ✓ Generated - Climate data
│   └── climate_fetch_progress_*.json   # Progress tracking
└── data/scripts/
    ├── select_top20_cities.py          # City selection
    ├── fetch_climate_data.py           # Climate data fetcher
    ├── validate_climate_data.py        # Data validator
    └── DATA_ACQUISITION.md             # This file
```
