#!/usr/bin/env python3
"""
Select top 20 cities from worldcities_top500.csv for MVP seed data.

Selection criteria:
- Mix of population (largest cities)
- Geographic diversity (spread across continents)
- Tourism appeal (popular destinations)
"""

import csv
from pathlib import Path

# Handpicked 20 cities balancing population, geography, and tourism
# Format: (city_ascii, country) - matches worldcities.csv format
TOP_20_CITIES = [
    # Asia (6 cities)
    ("Tokyo", "Japan"),              # Massive population + tourism
    ("Bangkok", "Thailand"),         # Major tourism hub
    ("Singapore", "Singapore"),      # City-state, business hub
    ("Dubai", "United Arab Emirates"), # Tourism + unique climate
    ("Mumbai", "India"),             # South Asia representation
    ("Seoul", "Korea, South"),       # Technology hub + tourism

    # Europe (5 cities)
    ("Paris", "France"),             # Top tourism destination
    ("London", "United Kingdom"),    # Global city + tourism
    ("Barcelona", "Spain"),          # Mediterranean climate + tourism
    ("Rome", "Italy"),               # Historical tourism
    ("Amsterdam", "Netherlands"),    # Northern Europe representation

    # Americas (5 cities)
    ("New York", "United States"),   # Major global city
    ("Mexico City", "Mexico"),       # Largest city in Americas
    ("Rio de Janeiro", "Brazil"),    # South America + unique climate
    ("Buenos Aires", "Argentina"),   # Southern hemisphere
    ("Vancouver", "Canada"),         # Temperate climate + tourism

    # Africa (2 cities)
    ("Cape Town", "South Africa"),   # Major tourism destination
    ("Casablanca", "Morocco"),       # Major city + unique climate

    # Oceania (2 cities)
    ("Sydney", "Australia"),         # Major city + tourism
    ("Auckland", "New Zealand"),     # Temperate maritime climate
]


def main():
    """Select top 20 cities and write to new CSV file."""

    # Set up paths
    script_dir = Path(__file__).parent
    data_dir = script_dir.parent
    input_file = data_dir / "worldcities_top500.csv"
    output_file = data_dir / "worldcities_top20.csv"

    # Read all cities from input file
    all_cities = {}
    with open(input_file, 'r', encoding='utf-8') as f:
        reader = csv.DictReader(f)
        for row in reader:
            key = (row['city_ascii'], row['country'])
            all_cities[key] = row

    print(f"Loaded {len(all_cities)} cities from {input_file.name}")

    # Select the top 20 cities
    selected_cities = []
    missing_cities = []

    for city_key in TOP_20_CITIES:
        if city_key in all_cities:
            selected_cities.append(all_cities[city_key])
            print(f"✓ Found: {city_key[0]}, {city_key[1]}")
        else:
            missing_cities.append(city_key)
            print(f"✗ Missing: {city_key[0]}, {city_key[1]}")

    # Report results
    print(f"\nSelected {len(selected_cities)} cities")

    if missing_cities:
        print(f"\nWarning: {len(missing_cities)} cities not found in dataset:")
        for city, country in missing_cities:
            print(f"  - {city}, {country}")

    # Write selected cities to output file
    if selected_cities:
        with open(output_file, 'w', encoding='utf-8', newline='') as f:
            # Use the same field names as input
            fieldnames = list(selected_cities[0].keys())
            writer = csv.DictWriter(f, fieldnames=fieldnames)
            writer.writeheader()
            writer.writerows(selected_cities)

        print(f"\n✓ Wrote {len(selected_cities)} cities to {output_file.name}")

        # Print some stats
        continents = {}
        for city in selected_cities:
            # Simple continent mapping by country (not perfect but good enough)
            country = city['country']
            if country in ['Japan', 'Thailand', 'Singapore', 'United Arab Emirates', 'India', 'Korea, South']:
                continent = 'Asia'
            elif country in ['France', 'United Kingdom', 'Spain', 'Italy', 'Netherlands']:
                continent = 'Europe'
            elif country in ['United States', 'Mexico', 'Brazil', 'Argentina', 'Canada']:
                continent = 'Americas'
            elif country in ['South Africa', 'Morocco']:
                continent = 'Africa'
            elif country in ['Australia', 'New Zealand']:
                continent = 'Oceania'
            else:
                continent = 'Other'

            continents[continent] = continents.get(continent, 0) + 1

        print("\nDistribution by continent:")
        for continent, count in sorted(continents.items(), key=lambda x: x[1], reverse=True):
            print(f"  {continent}: {count} cities")

    else:
        print("\n✗ No cities selected - cannot write output file")
        return 1

    return 0


if __name__ == "__main__":
    exit(main())
