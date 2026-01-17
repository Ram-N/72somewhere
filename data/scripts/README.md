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

## Notes

- The script adds a 0.5 second delay between API calls to be respectful to the free API
- Historical data is aggregated by month for all cities
- Sunshine duration is converted from seconds to hours
- All temperature values are in Celsius
