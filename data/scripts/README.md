# Open-Meteo Climate Data Fetcher

Enhanced script to fetch historical climate data from Open-Meteo API for multiple cities and output enriched monthly averages.

## Features

- Flexible date range inputs (start_date, end_date as CLI arguments)
- Expanded weather fields (temperature, sunshine, humidity, precipitation hours, cloud cover)
- Scientific metadata (city, country, state, lat, long, dates in each row)
- Auto-generated descriptive filename with timestamp
- Support for both text and CSV input formats
- Automatic geocoding with Open-Meteo API
- Retry logic for API failures
- Progress tracking and error reporting

## Installation

```bash
cd /home/ram/projects/72somewhere/data/scripts
source .venv/bin/activate  # Activate existing virtual environment
# Dependencies are already installed in .venv
```

## Usage

### Basic Usage

```bash
python fetch_from_open_meteo.py --cities-file ../cities.txt
```

### Custom Date Range

```bash
python fetch_from_open_meteo.py \
  --cities-file ../cities.txt \
  --start-date 2020-01-01 \
  --end-date 2023-12-31 \
  --output-dir ../
```

### Command-Line Arguments

- `--cities-file` (required): Path to cities input file (text or CSV format)
- `--start-date` (optional): Start date in YYYY-MM-DD format (default: 2022-01-01)
- `--end-date` (optional): End date in YYYY-MM-DD format (default: 2024-12-31)
- `--output-dir` (optional): Output directory for CSV file (default: ../data/)

## Input Formats

### Simple Text File

Create a file with one city per line:

```text
# cities.txt
Chicago
Paris
Tokyo
```

### CSV File

Create a CSV with optional metadata:

```csv
city,country
Chicago,USA
Paris,France
Tokyo,Japan
```

With coordinates (optional):

```csv
city,country,latitude,longitude
Chicago,USA,41.8781,-87.6298
Paris,France,48.8566,2.3522
Tokyo,Japan,35.6762,139.6503
```

## Output Schema

The script generates a CSV file with the following columns:

- `city_name` - Resolved city name
- `country` - Country name
- `state` - State/province/region (from geocoding API's admin1 field)
- `latitude` - Decimal degrees
- `longitude` - Decimal degrees
- `start_date` - Data period start date
- `end_date` - Data period end date
- `month` - Month number (1-12)
- `avg_temp_c` - Average temperature (°C)
- `avg_high_temp_c` - Average daily maximum temperature (°C)
- `avg_low_temp_c` - Average daily minimum temperature (°C)
- `avg_apparent_temp_max_c` - Average apparent (feels-like) maximum temperature (°C)
- `avg_apparent_temp_min_c` - Average apparent minimum temperature (°C)
- `avg_precip_mm` - Average monthly precipitation (mm)
- `avg_precip_hours` - Average hours of precipitation per day
- `avg_sunshine_hours` - Average daily sunshine duration (hours)
- `avg_humidity_percent` - Average relative humidity (%)
- `avg_cloud_cover_percent` - Average cloud cover (%)

## Output Filename

Files are auto-generated with the format:

```
climate_data_{start_date}_to_{end_date}_{timestamp}.csv
```

Example: `climate_data_20220101_to_20241231_20260116.csv`

## Data Source

- **API**: [Open-Meteo Historical Weather API](https://open-meteo.com/en/docs/historical-weather-api)
- **Geocoding**: [Open-Meteo Geocoding API](https://open-meteo.com/en/docs/geocoding-api)
- **Data Model**: ERA5 and CERRA climate reanalysis

## Error Handling

- Automatic retry (up to 3 attempts) for failed API calls
- Graceful handling of cities that cannot be geocoded
- Summary report showing failed cities
- Field availability checking (some fields may be missing for certain locations/dates)

## Verification

Test data quality:

```bash
# Check row count (should be 12 × number of cities)
wc -l climate_data_*.csv

# View sample output
head -5 climate_data_*.csv

# Check cities processed
awk -F',' 'NR>1 {print $1}' climate_data_*.csv | sort | uniq -c
```

Expected data ranges:
- Temperature: -50°C to 50°C
- Humidity: 0-100%
- Cloud cover: 0-100%
- All cities should have 12 rows (one per month)

## Example Output

```
Reading cities from ../cities.txt...
Found 3 cities to process

[1/3] Processing Chicago...
Fetching data for Chicago, United States (41.8500, -87.6500)...
[2/3] Processing Paris...
Fetching data for Paris, France (48.8534, 2.3488)...
[3/3] Processing Tokyo...
Fetching data for Tokyo, Japan (35.6895, 139.6917)...

============================================================
SUCCESS!
============================================================
Cities processed: 3/3
Total rows: 36
Output file: ../climate_data_20220101_to_20241231_20260116.csv
```

## Batch Processing for Large Datasets

When processing hundreds of cities, Open-Meteo's rate limits require special handling.

### Rate Limit Considerations

**Open-Meteo Free Tier Limits:**
- 10,000 API calls per day
- Each city request for 3 years of data = ~78 weighted API calls
- 500 cities × 78 calls = 39,100 total calls (exceeds daily limit)

**Solutions:**
1. **Mini-batches (RECOMMENDED)**: Process 10 cities at a time with automatic tracking
2. **Daily batches**: Process 100 cities per day over 5 days

### Option 1: Mini-Batch Processing (Recommended)

The `run_mini_batch.py` script processes cities in small batches (default: 10 cities) and keeps a detailed index of progress.

**Quick Start:**

```bash
# Check status
python run_mini_batch.py --status

# Process next 10 cities (~13 minutes)
python run_mini_batch.py

# Process next 5 cities (~7 minutes)
python run_mini_batch.py --batch-size 5

# Process 20 cities (~27 minutes)
python run_mini_batch.py --batch-size 20
```

**Features:**
- **Automatic tracking**: Index file tracks which cities are pending/completed/failed
- **Flexible batch sizes**: Process as many or as few cities as you want
- **Resume anytime**: Just run the script again to process the next batch
- **Progress visibility**: Always shows what's done and what's next
- **No scheduling needed**: Run whenever you have time

**Index File:**

The script creates `city_index_worldcities_top500.json` with:
- Status for every city (pending, processing, completed, failed)
- Completion timestamps
- Attempt counts
- Overall progress statistics

**Typical Workflow:**

```bash
# Day 1: Process 10 cities during coffee break
python run_mini_batch.py

# Later that day: Process 10 more
python run_mini_batch.py

# Day 2: Check progress
python run_mini_batch.py --status

# Process another batch
python run_mini_batch.py --batch-size 15

# ... continue until all 500 cities are done
```

**Advantages:**
- No long waits (~13 min per 10 cities vs 2+ hours per 100)
- Can stop/resume anytime
- Clear visibility into progress
- Automatic retry for failed cities (just run again)

### Option 2: Large Batch Processing

### Using the Batch Helper Script

The `run_batch_fetch.sh` script automates batch processing:

```bash
# Day 1: Process cities 0-99
./run_batch_fetch.sh 1

# Day 2: Process cities 100-199
./run_batch_fetch.sh 2

# Day 3: Process cities 200-299
./run_batch_fetch.sh 3

# Day 4: Process cities 300-399
./run_batch_fetch.sh 4

# Day 5: Process cities 400-499
./run_batch_fetch.sh 5
```

**Each batch:**
- Takes ~2+ hours to complete
- Uses ~7,800 API calls (well within 10,000/day limit)
- Creates separate output and progress files
- Can be resumed if interrupted

### Manual Batch Processing

You can also run batches manually:

```bash
# Batch 1: Cities 0-99
python fetch_climate_data.py worldcities_top500.csv \
  --start-row 0 \
  --end-row 99 \
  --batch-name batch1

# Batch 2: Cities 100-199
python fetch_climate_data.py worldcities_top500.csv \
  --start-row 100 \
  --end-row 199 \
  --batch-name batch2

# ... and so on
```

### Batch Command-Line Arguments

- `--start-row N`: Start processing at row N (0-indexed, inclusive)
- `--end-row N`: Stop processing at row N (0-indexed, inclusive)
- `--batch-name NAME`: Custom name for output/progress files (e.g., "batch1")

### Output Files per Batch

Each batch creates:
- `climate_data_top500_batch1.csv` - Climate data for that batch
- `climate_fetch_progress_worldcities_top500_batch1.json` - Progress tracking

### Merging Batch Results

After all batches complete, merge the CSV files:

```bash
# Merge all batch files (skip headers from batches 2-5)
cat climate_data_top500_batch1.csv > climate_data_top500_merged.csv
tail -n +2 climate_data_top500_batch2.csv >> climate_data_top500_merged.csv
tail -n +2 climate_data_top500_batch3.csv >> climate_data_top500_merged.csv
tail -n +2 climate_data_top500_batch4.csv >> climate_data_top500_merged.csv
tail -n +2 climate_data_top500_batch5.csv >> climate_data_top500_merged.csv
```

### Progress Tracking

Each batch has its own progress file. If a batch is interrupted:

```bash
# Resume batch 3 (automatically skips completed cities)
./run_batch_fetch.sh 3
```

The script remembers which cities in that batch were already processed.

## Notes

- The `fetch_climate_data.py` script uses an 80-second delay between API calls to respect rate limits
- Historical data is aggregated by month for all cities
- Sunshine duration is converted from seconds to hours
- All temperature values are in Celsius
