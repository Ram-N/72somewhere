import requests
import pandas as pd
import argparse
import csv
import time
from datetime import datetime
from pathlib import Path

def get_coordinates(city_name, country=None, lat=None, lon=None):
    """
    Converts city name to lat/long using Open-Meteo Geocoding API.
    Returns: dict with keys: name, country, state, latitude, longitude
    If lat/lon provided, still geocodes to get name/country/state.
    """
    if lat is not None and lon is not None:
        # Coordinates provided, but we still want to get metadata
        # Use reverse geocoding or just use provided city name
        return {
            'name': city_name,
            'country': country or 'Unknown',
            'state': '',
            'latitude': lat,
            'longitude': lon
        }

    # Geocode the city name
    url = f"https://geocoding-api.open-meteo.com/v1/search?name={city_name}&count=1&language=en&format=json"
    try:
        response = requests.get(url, timeout=10).json()
        if not response.get('results'):
            return None
        res = response['results'][0]
        return {
            'name': res.get('name', city_name),
            'country': res.get('country', 'Unknown'),
            'state': res.get('admin1', ''),  # State/province/region
            'latitude': res['latitude'],
            'longitude': res['longitude']
        }
    except Exception as e:
        print(f"Error geocoding {city_name}: {e}")
        return None

def fetch_monthly_averages(city_query, start_date, end_date, lat=None, lon=None, country=None):
    """
    Fetches climate data for a city and aggregates by month.

    Args:
        city_query: City name
        start_date: Start date (YYYY-MM-DD)
        end_date: End date (YYYY-MM-DD)
        lat: Optional latitude (if pre-provided)
        lon: Optional longitude (if pre-provided)
        country: Optional country (if pre-provided)

    Returns:
        DataFrame with monthly climate data
    """
    coords = get_coordinates(city_query, country, lat, lon)
    if not coords:
        print(f"Could not find city: {city_query}")
        return None

    city_name = coords['name']
    country_name = coords['country']
    state = coords['state']
    latitude = coords['latitude']
    longitude = coords['longitude']

    print(f"Fetching data for {city_name}, {country_name} ({latitude:.4f}, {longitude:.4f})...")

    # Open-Meteo Archive API call with expanded fields
    params = {
        "latitude": latitude,
        "longitude": longitude,
        "start_date": start_date,
        "end_date": end_date,
        "daily": [
            "temperature_2m_max",
            "temperature_2m_min",
            "temperature_2m_mean",
            "apparent_temperature_max",
            "apparent_temperature_min",
            "precipitation_sum",
            "precipitation_hours",
            "sunshine_duration",
            "relative_humidity_2m_mean",
            "cloud_cover_mean"
        ],
        "timezone": "auto"
    }

    url = "https://archive-api.open-meteo.com/v1/archive"

    # Retry logic
    max_retries = 3
    for attempt in range(max_retries):
        try:
            response = requests.get(url, params=params, timeout=30)
            response.raise_for_status()
            data = response.json()
            break
        except Exception as e:
            if attempt < max_retries - 1:
                print(f"  Attempt {attempt + 1} failed, retrying... ({e})")
                time.sleep(2)
            else:
                print(f"  Failed to fetch data after {max_retries} attempts: {e}")
                return None

    # Process into a DataFrame
    df = pd.DataFrame(data['daily'])
    df['time'] = pd.to_datetime(df['time'])
    df['month'] = df['time'].dt.month

    # Convert sunshine_duration from seconds to hours
    if 'sunshine_duration' in df.columns:
        df['sunshine_duration'] = df['sunshine_duration'] / 3600.0

    # Aggregate by month
    agg_dict = {
        'temperature_2m_max': 'mean',
        'temperature_2m_min': 'mean',
        'temperature_2m_mean': 'mean',
        'apparent_temperature_max': 'mean',
        'apparent_temperature_min': 'mean',
        'precipitation_sum': 'mean',
        'precipitation_hours': 'mean',
        'sunshine_duration': 'mean',
        'relative_humidity_2m_mean': 'mean',
        'cloud_cover_mean': 'mean'
    }

    # Only aggregate fields that exist in the response
    agg_dict = {k: v for k, v in agg_dict.items() if k in df.columns}

    monthly_data = df.groupby('month').agg(agg_dict).reset_index()

    # Add metadata columns
    monthly_data['city_name'] = city_name
    monthly_data['country'] = country_name
    monthly_data['state'] = state
    monthly_data['latitude'] = latitude
    monthly_data['longitude'] = longitude
    monthly_data['start_date'] = start_date
    monthly_data['end_date'] = end_date

    # Rename columns to match schema
    column_mapping = {
        'temperature_2m_max': 'avg_high_temp_c',
        'temperature_2m_min': 'avg_low_temp_c',
        'temperature_2m_mean': 'avg_temp_c',
        'apparent_temperature_max': 'avg_apparent_temp_max_c',
        'apparent_temperature_min': 'avg_apparent_temp_min_c',
        'precipitation_sum': 'avg_precip_mm',
        'precipitation_hours': 'avg_precip_hours',
        'sunshine_duration': 'avg_sunshine_hours',
        'relative_humidity_2m_mean': 'avg_humidity_percent',
        'cloud_cover_mean': 'avg_cloud_cover_percent'
    }
    monthly_data = monthly_data.rename(columns=column_mapping)

    # Reorder columns
    cols = [
        'city_name', 'country', 'state', 'latitude', 'longitude',
        'start_date', 'end_date', 'month',
        'avg_temp_c', 'avg_high_temp_c', 'avg_low_temp_c',
        'avg_apparent_temp_max_c', 'avg_apparent_temp_min_c',
        'avg_precip_mm', 'avg_precip_hours',
        'avg_sunshine_hours', 'avg_humidity_percent', 'avg_cloud_cover_percent'
    ]

    # Only include columns that exist
    cols = [c for c in cols if c in monthly_data.columns]

    return monthly_data[cols]

def parse_cities_file(file_path):
    """
    Parse cities from input file.
    Supports:
    - Simple text file (one city per line)
    - CSV file with columns: city, country (optional), latitude (optional), longitude (optional)

    Returns:
        List of dicts with keys: city, country (optional), lat (optional), lon (optional)
    """
    cities = []
    file_path = Path(file_path)

    if not file_path.exists():
        raise FileNotFoundError(f"Cities file not found: {file_path}")

    # Try to detect if it's CSV
    with open(file_path, 'r', encoding='utf-8') as f:
        first_line = f.readline().strip()
        f.seek(0)

        # Check if it looks like CSV (has commas and possibly a header)
        if ',' in first_line:
            reader = csv.DictReader(f)
            for row in reader:
                city_entry = {'city': row['city'].strip()}
                if 'country' in row and row['country']:
                    city_entry['country'] = row['country'].strip()
                if 'latitude' in row and row['latitude']:
                    city_entry['lat'] = float(row['latitude'])
                if 'longitude' in row and row['longitude']:
                    city_entry['lon'] = float(row['longitude'])
                cities.append(city_entry)
        else:
            # Simple text file, one city per line
            for line in f:
                city = line.strip()
                if city and not city.startswith('#'):  # Skip empty lines and comments
                    cities.append({'city': city})

    return cities

def main():
    parser = argparse.ArgumentParser(
        description='Fetch climate data from Open-Meteo for multiple cities'
    )
    parser.add_argument(
        '--start-date',
        default='2022-01-01',
        help='Start date in YYYY-MM-DD format (default: 2022-01-01)'
    )
    parser.add_argument(
        '--end-date',
        default='2024-12-31',
        help='End date in YYYY-MM-DD format (default: 2024-12-31)'
    )
    parser.add_argument(
        '--cities-file',
        required=True,
        help='Path to cities input file (text or CSV format)'
    )
    parser.add_argument(
        '--output-dir',
        default='../data/',
        help='Output directory for CSV file (default: ../data/)'
    )

    args = parser.parse_args()

    # Parse cities from input file
    print(f"Reading cities from {args.cities_file}...")
    cities = parse_cities_file(args.cities_file)
    print(f"Found {len(cities)} cities to process\n")

    # Fetch data for all cities
    all_data = []
    failed_cities = []

    for i, city_entry in enumerate(cities, 1):
        city_name = city_entry['city']
        print(f"[{i}/{len(cities)}] Processing {city_name}...")

        result = fetch_monthly_averages(
            city_name,
            args.start_date,
            args.end_date,
            lat=city_entry.get('lat'),
            lon=city_entry.get('lon'),
            country=city_entry.get('country')
        )

        if result is not None:
            all_data.append(result)
        else:
            failed_cities.append(city_name)

        # Small delay to be nice to the API
        time.sleep(0.5)

    if not all_data:
        print("\nError: No data was successfully fetched!")
        return

    # Combine all city data
    final_df = pd.concat(all_data, ignore_index=True)

    # Generate output filename
    output_dir = Path(args.output_dir)
    output_dir.mkdir(parents=True, exist_ok=True)

    timestamp = datetime.now().strftime('%Y%m%d')
    start_str = args.start_date.replace('-', '')
    end_str = args.end_date.replace('-', '')
    output_filename = f"climate_data_{start_str}_to_{end_str}_{timestamp}.csv"
    output_path = output_dir / output_filename

    # Save to CSV
    final_df.to_csv(output_path, index=False)

    # Print summary
    print(f"\n{'='*60}")
    print("SUCCESS!")
    print(f"{'='*60}")
    print(f"Cities processed: {len(cities) - len(failed_cities)}/{len(cities)}")
    print(f"Total rows: {len(final_df)}")
    print(f"Output file: {output_path}")

    if failed_cities:
        print(f"\nFailed to fetch data for: {', '.join(failed_cities)}")

    # Show sample statistics
    print(f"\nSample data (first city):")
    print(final_df.head(3).to_string())

if __name__ == "__main__":
    main()