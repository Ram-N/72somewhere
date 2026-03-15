#!/usr/bin/env python3
"""
Validate climate data CSV for completeness and quality.
"""

import csv
from pathlib import Path
from collections import defaultdict

def main():
    import sys

    # Parse command line arguments
    if len(sys.argv) > 1:
        input_filename = sys.argv[1]
    else:
        input_filename = "climate_data_top20.csv"

    script_dir = Path(__file__).parent
    data_dir = script_dir.parent
    input_file = data_dir / input_filename

    if not input_file.exists():
        print(f"Error: File not found: {input_file}")
        return 1

    # Load data
    rows = []
    with open(input_file, 'r', encoding='utf-8') as f:
        reader = csv.DictReader(f)
        for row in reader:
            rows.append(row)

    print(f"Loaded {len(rows)} rows from {input_file.name}")

    # Group by city
    cities = defaultdict(list)
    for row in rows:
        city_key = (row['city_id'], row['city_name'], row['country'])
        cities[city_key].append(row)

    print(f"Found {len(cities)} unique cities")

    # Validation checks
    print("\n" + "="*60)
    print("VALIDATION CHECKS")
    print("="*60)

    all_good = True

    # Check 1: Each city should have exactly 12 months
    print("\n1. Checking month completeness...")
    for city_key, city_rows in cities.items():
        city_name = city_key[1]
        country = city_key[2]
        months = set(int(row['month']) for row in city_rows)

        if len(months) != 12:
            print(f"  ✗ {city_name}, {country}: Has {len(months)} months (expected 12)")
            print(f"    Missing months: {sorted(set(range(1, 13)) - months)}")
            all_good = False
        elif months != set(range(1, 13)):
            print(f"  ✗ {city_name}, {country}: Has 12 rows but wrong months: {sorted(months)}")
            all_good = False

    if all_good:
        print(f"  ✓ All {len(cities)} cities have complete 12-month data")

    # Check 2: No missing values
    print("\n2. Checking for missing values...")
    missing_count = 0
    for row in rows:
        for field in ['avg_high_temp_c', 'avg_low_temp_c', 'avg_precip_mm']:
            if not row[field] or row[field] == 'None':
                city_name = row['city_name']
                month = row['month']
                print(f"  ✗ {city_name} month {month}: Missing {field}")
                missing_count += 1

    if missing_count == 0:
        print(f"  ✓ No missing values found")
    else:
        print(f"  ✗ Found {missing_count} missing values")
        all_good = False

    # Check 3: Temperature ranges are reasonable
    print("\n3. Checking temperature reasonableness...")
    temp_issues = 0
    for row in rows:
        try:
            high = float(row['avg_high_temp_c'])
            low = float(row['avg_low_temp_c'])

            # Check if high is actually higher than low
            if high < low:
                print(f"  ✗ {row['city_name']} month {row['month']}: High ({high}°C) < Low ({low}°C)")
                temp_issues += 1

            # Check for extreme values (likely errors)
            if high > 60 or high < -60:
                print(f"  ✗ {row['city_name']} month {row['month']}: Extreme high temp {high}°C")
                temp_issues += 1

            if low > 50 or low < -70:
                print(f"  ✗ {row['city_name']} month {row['month']}: Extreme low temp {low}°C")
                temp_issues += 1

        except (ValueError, TypeError) as e:
            print(f"  ✗ {row['city_name']} month {row['month']}: Invalid temperature value")
            temp_issues += 1

    if temp_issues == 0:
        print(f"  ✓ All temperature values are reasonable")
    else:
        print(f"  ✗ Found {temp_issues} temperature issues")
        all_good = False

    # Check 4: Precipitation is non-negative
    print("\n4. Checking precipitation values...")
    precip_issues = 0
    for row in rows:
        try:
            precip = float(row['avg_precip_mm'])
            if precip < 0:
                print(f"  ✗ {row['city_name']} month {row['month']}: Negative precipitation {precip}mm")
                precip_issues += 1
        except (ValueError, TypeError) as e:
            print(f"  ✗ {row['city_name']} month {row['month']}: Invalid precipitation value")
            precip_issues += 1

    if precip_issues == 0:
        print(f"  ✓ All precipitation values are valid")
    else:
        print(f"  ✗ Found {precip_issues} precipitation issues")
        all_good = False

    # Summary statistics
    print("\n" + "="*60)
    print("SUMMARY STATISTICS")
    print("="*60)

    all_highs = [float(row['avg_high_temp_c']) for row in rows if row['avg_high_temp_c']]
    all_lows = [float(row['avg_low_temp_c']) for row in rows if row['avg_low_temp_c']]
    all_precip = [float(row['avg_precip_mm']) for row in rows if row['avg_precip_mm']]

    print(f"\nTemperature ranges (across all cities and months):")
    print(f"  High: {min(all_highs):.1f}°C to {max(all_highs):.1f}°C")
    print(f"  Low:  {min(all_lows):.1f}°C to {max(all_lows):.1f}°C")
    print(f"\nPrecipitation range:")
    print(f"  {min(all_precip):.1f}mm to {max(all_precip):.1f}mm")

    # Geographic distribution
    print(f"\nCities by region:")
    countries = defaultdict(int)
    for city_key in cities.keys():
        country = city_key[2]
        countries[country] += 1

    for country in sorted(countries.keys()):
        print(f"  {country}: {countries[country]} city/cities")

    # Final verdict
    print("\n" + "="*60)
    if all_good:
        print("✓ VALIDATION PASSED - Data is ready for use!")
    else:
        print("✗ VALIDATION FAILED - Please review issues above")
    print("="*60)

    return 0 if all_good else 1


if __name__ == "__main__":
    exit(main())
