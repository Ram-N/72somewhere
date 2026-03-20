#!/usr/bin/env python3
"""
Fetch climate data from Open-Meteo Historical Weather API for cities.

Fetches temperature and precipitation data for 2022-2024, calculates monthly
averages, and outputs to CSV in the format required by 72somewhere project.

Features:
- Rate limiting with delays between API calls
- Retry logic for failed requests
- Progress tracking (resume on failure)
- Incremental saving
"""

import csv
import json
import time
from datetime import datetime
from pathlib import Path
from typing import List, Dict, Optional
import urllib.request
import urllib.parse
import urllib.error


# Configuration
API_BASE_URL = "https://archive-api.open-meteo.com/v1/archive"
START_DATE = "2022-01-01"
END_DATE = "2024-12-31"
DELAY_BETWEEN_CALLS = 15.0  # seconds (rate limit: ~78 API calls per city)
MAX_RETRIES = 3
RETRY_DELAY = 5.0  # seconds


def fetch_weather_data(city_name: str, lat: float, lng: float, country: str) -> Optional[Dict]:
    """
    Fetch historical weather data from Open-Meteo API.

    Args:
        city_name: Name of the city
        lat: Latitude
        lng: Longitude
        country: Country name (for logging)

    Returns:
        Dict with daily weather data or None on failure
    """
    params = {
        'latitude': lat,
        'longitude': lng,
        'start_date': START_DATE,
        'end_date': END_DATE,
        'daily': 'temperature_2m_max,temperature_2m_min,precipitation_sum',
        'timezone': 'auto'
    }

    url = f"{API_BASE_URL}?{urllib.parse.urlencode(params)}"

    for attempt in range(MAX_RETRIES):
        try:
            print(f"  Fetching data... (attempt {attempt + 1}/{MAX_RETRIES})")
            with urllib.request.urlopen(url, timeout=30) as response:
                data = json.loads(response.read().decode('utf-8'))
                return data

        except urllib.error.HTTPError as e:
            print(f"  HTTP Error {e.code}: {e.reason}")
            if attempt < MAX_RETRIES - 1:
                print(f"  Retrying in {RETRY_DELAY} seconds...")
                time.sleep(RETRY_DELAY)
            else:
                print(f"  Failed after {MAX_RETRIES} attempts")
                return None

        except urllib.error.URLError as e:
            print(f"  Network Error: {e.reason}")
            if attempt < MAX_RETRIES - 1:
                print(f"  Retrying in {RETRY_DELAY} seconds...")
                time.sleep(RETRY_DELAY)
            else:
                print(f"  Failed after {MAX_RETRIES} attempts")
                return None

        except Exception as e:
            print(f"  Unexpected error: {e}")
            if attempt < MAX_RETRIES - 1:
                print(f"  Retrying in {RETRY_DELAY} seconds...")
                time.sleep(RETRY_DELAY)
            else:
                print(f"  Failed after {MAX_RETRIES} attempts")
                return None

    return None


def calculate_monthly_averages(weather_data: Dict) -> List[Dict]:
    """
    Calculate monthly averages from daily weather data.

    Args:
        weather_data: Response from Open-Meteo API

    Returns:
        List of dicts with monthly averages (one per month)
    """
    if 'daily' not in weather_data:
        return []

    daily = weather_data['daily']
    dates = daily.get('time', [])
    temp_max = daily.get('temperature_2m_max', [])
    temp_min = daily.get('temperature_2m_min', [])
    precip = daily.get('precipitation_sum', [])

    # Group by month
    monthly_data = {}

    for i, date_str in enumerate(dates):
        # Parse date to get month (format: YYYY-MM-DD)
        date_parts = date_str.split('-')
        year = int(date_parts[0])
        month = int(date_parts[1])
        month_key = month  # Just use month number 1-12

        if month_key not in monthly_data:
            monthly_data[month_key] = {
                'temp_max': [],
                'temp_min': [],
                'precip': []
            }

        # Add values (skip None values)
        if temp_max[i] is not None:
            monthly_data[month_key]['temp_max'].append(temp_max[i])
        if temp_min[i] is not None:
            monthly_data[month_key]['temp_min'].append(temp_min[i])
        if precip[i] is not None:
            monthly_data[month_key]['precip'].append(precip[i])

    # Calculate averages
    monthly_averages = []
    for month in range(1, 13):  # Ensure all 12 months
        if month in monthly_data:
            data = monthly_data[month]

            avg_high = sum(data['temp_max']) / len(data['temp_max']) if data['temp_max'] else None
            avg_low = sum(data['temp_min']) / len(data['temp_min']) if data['temp_min'] else None
            avg_precip = sum(data['precip']) / len(data['precip']) if data['precip'] else None

            monthly_averages.append({
                'month': month,
                'avg_high_temp_c': round(avg_high, 2) if avg_high is not None else None,
                'avg_low_temp_c': round(avg_low, 2) if avg_low is not None else None,
                'avg_precip_mm': round(avg_precip, 2) if avg_precip is not None else None,
            })
        else:
            # No data for this month
            monthly_averages.append({
                'month': month,
                'avg_high_temp_c': None,
                'avg_low_temp_c': None,
                'avg_precip_mm': None,
            })

    return monthly_averages


def load_progress(progress_file: Path) -> Dict:
    """Load progress tracking data."""
    if progress_file.exists():
        with open(progress_file, 'r') as f:
            return json.load(f)
    return {'completed_cities': [], 'failed_cities': []}


def save_progress(progress_file: Path, progress: Dict):
    """Save progress tracking data."""
    with open(progress_file, 'w') as f:
        json.dump(progress, f, indent=2)


def main():
    """Fetch climate data for all cities and save to CSV."""
    import sys
    import argparse

    # Parse command line arguments
    parser = argparse.ArgumentParser(description='Fetch climate data from Open-Meteo API')
    parser.add_argument('input_file', nargs='?', default='worldcities_top20.csv',
                        help='Input CSV file with city data (default: worldcities_top20.csv)')
    parser.add_argument('--start-row', type=int, default=None,
                        help='Start row index for batch processing (0-indexed, inclusive)')
    parser.add_argument('--end-row', type=int, default=None,
                        help='End row index for batch processing (0-indexed, inclusive)')
    parser.add_argument('--batch-name', type=str, default=None,
                        help='Custom batch name for progress/output files (e.g., "batch1")')

    args = parser.parse_args()
    input_filename = args.input_file

    # Set up paths
    script_dir = Path(__file__).parent
    data_dir = script_dir.parent
    input_file = data_dir / input_filename

    # Generate file names with batch suffix if provided
    base_name = input_filename.replace('worldcities_', '').replace('.csv', '')
    batch_suffix = f"_{args.batch_name}" if args.batch_name else ""

    output_file = data_dir / f"climate_data_{base_name}{batch_suffix}.csv"
    progress_file = data_dir / f"climate_fetch_progress_{input_filename.replace('.csv', '')}{batch_suffix}.json"

    if not input_file.exists():
        print(f"Error: Input file not found: {input_file}")
        return 1

    # Load cities
    cities = []
    with open(input_file, 'r', encoding='utf-8') as f:
        reader = csv.DictReader(f)
        for row in reader:
            cities.append(row)

    print(f"Loaded {len(cities)} cities from {input_file.name}")

    # Apply batch filtering if specified
    if args.start_row is not None or args.end_row is not None:
        start = args.start_row if args.start_row is not None else 0
        end = args.end_row + 1 if args.end_row is not None else len(cities)
        cities = cities[start:end]
        print(f"Batch mode: Processing rows {start} to {end-1} ({len(cities)} cities)")
        if args.batch_name:
            print(f"Batch name: {args.batch_name}")

    # Load progress
    progress = load_progress(progress_file)
    completed_ids = set(progress['completed_cities'])

    print(f"Previously completed: {len(completed_ids)} cities")
    remaining = [c for c in cities if c['id'] not in completed_ids]
    print(f"Remaining: {len(remaining)} cities")

    # Initialize output file if needed
    if not output_file.exists():
        with open(output_file, 'w', encoding='utf-8', newline='') as f:
            writer = csv.DictWriter(f, fieldnames=['city_id', 'city_name', 'country', 'month', 'avg_high_temp_c', 'avg_low_temp_c', 'avg_precip_mm'])
            writer.writeheader()

    # Process each city
    for idx, city in enumerate(remaining, 1):
        city_id = city['id']
        city_name = city['city_ascii']
        country = city['country']
        lat = float(city['lat'])
        lng = float(city['lng'])

        print(f"\n[{idx}/{len(remaining)}] {city_name}, {country}")

        # Fetch weather data
        weather_data = fetch_weather_data(city_name, lat, lng, country)

        if weather_data is None:
            print(f"  ✗ Failed to fetch data for {city_name}")
            progress['failed_cities'].append({
                'city_id': city_id,
                'city_name': city_name,
                'country': country,
                'timestamp': datetime.now().isoformat()
            })
            save_progress(progress_file, progress)
            time.sleep(DELAY_BETWEEN_CALLS)
            continue

        # Calculate monthly averages
        monthly_averages = calculate_monthly_averages(weather_data)

        if not monthly_averages:
            print(f"  ✗ No data returned for {city_name}")
            progress['failed_cities'].append({
                'city_id': city_id,
                'city_name': city_name,
                'country': country,
                'timestamp': datetime.now().isoformat()
            })
            save_progress(progress_file, progress)
            time.sleep(DELAY_BETWEEN_CALLS)
            continue

        # Write to CSV
        with open(output_file, 'a', encoding='utf-8', newline='') as f:
            writer = csv.DictWriter(f, fieldnames=['city_id', 'city_name', 'country', 'month', 'avg_high_temp_c', 'avg_low_temp_c', 'avg_precip_mm'])

            for month_data in monthly_averages:
                writer.writerow({
                    'city_id': city_id,
                    'city_name': city_name,
                    'country': country,
                    'month': month_data['month'],
                    'avg_high_temp_c': month_data['avg_high_temp_c'],
                    'avg_low_temp_c': month_data['avg_low_temp_c'],
                    'avg_precip_mm': month_data['avg_precip_mm'],
                })

        print(f"  ✓ Wrote 12 months of data for {city_name}")

        # Update progress
        progress['completed_cities'].append(city_id)
        save_progress(progress_file, progress)

        # Rate limiting
        if idx < len(remaining):
            print(f"  Waiting {DELAY_BETWEEN_CALLS}s before next request...")
            time.sleep(DELAY_BETWEEN_CALLS)

    # Final report
    print("\n" + "="*60)
    print("SUMMARY")
    print("="*60)
    print(f"Successfully processed: {len(progress['completed_cities'])} cities")
    print(f"Failed: {len(progress['failed_cities'])} cities")
    print(f"Output file: {output_file}")
    print(f"Progress file: {progress_file}")

    if progress['failed_cities']:
        print("\nFailed cities:")
        for failed in progress['failed_cities']:
            print(f"  - {failed['city_name']}, {failed['country']}")

    return 0


if __name__ == "__main__":
    exit(main())
