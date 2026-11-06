"""
generate_advisories.py

Reads the newest us_state_department_travel_advisories_*.csv and outputs
data/travel_advisories.json, keyed by the country names used in the app's
climate data, for the CityCard travel advisory chip.

Also outputs data/country_codes.json (country name -> ISO2) for flag emoji.

USAGE:
  cd /home/ram/projects/72somewhere
  uv run data/scripts/generate_advisories.py
"""

import csv
import glob
import json
import os
import re

DATA_DIR = os.path.join(os.path.dirname(__file__), "..")
CLIMATE_PATH = os.path.join(DATA_DIR, "climate_all_500.csv")
OUTPUT_PATH = os.path.join(DATA_DIR, "travel_advisories.json")
CITIES_PATH = os.path.join(DATA_DIR, "worldcities_enriched.csv")
CODES_PATH = os.path.join(DATA_DIR, "country_codes.json")

# App country name -> State Dept destination name, where they differ
ALIASES = {
    "Bahamas, The": "Bahamas",
    "Burma": "Burma (Myanmar)",
    "Congo (Brazzaville)": "Republic of Congo",
    "Congo (Kinshasa)": "Democratic Republic of the Congo (D.R.C.)",
    "Côte d’Ivoire": "Côte d'Ivoire (Ivory Coast)",
    "Eswatini": "Eswatini (Swaziland)",
    "Gambia, The": "The Gambia",
    "Gaza Strip": "Gaza",
    "Guadeloupe": "Guadeloupe, Martinique, Saint Martin, and Saint Barthélemy (French West Indies)",
    "Korea, North": "North Korea (Democratic People's Republic of Korea)",
    "Korea, South": "South Korea",
    "Kyrgyzstan": "The Kyrgyz Republic",
    "Martinique": "Guadeloupe, Martinique, Saint Martin, and Saint Barthélemy (French West Indies)",
    "Micronesia, Federated States of": "Federated States of Micronesia",
    "Saint Barthelemy": "Saint Barthélemy (French West Indies)",
    "Saint Martin": "Saint Martin (French West Indies)",
    "United Kingdom": "United Kingdom of Great Britain and Northern Ireland",
    "Vatican City": "Vatican City (Holy See)",
    "Virgin Islands, British": "British Virgin Islands",
}


def main():
    csv_path = sorted(glob.glob(os.path.join(DATA_DIR, "us_state_department_travel_advisories_*.csv")))[-1]
    print(f"Reading {csv_path}...")

    # utf-8-sig strips the BOM on the first column header
    with open(csv_path, encoding="utf-8-sig") as f:
        advisories = {}
        for row in csv.DictReader(f):
            advisories[row["destination"].strip()] = {
                "level": int(row["advisory_level"]),
                "description": row["advisory_description"],
                # "TERRORISM (T); UNREST (U)" -> ["T", "U"]
                "risks": re.findall(r"\((\w)\)", row["risk_indicators"]),
                "issued": row["date_issued"],
                "snapshot": row["snapshot_date"],
            }

    with open(CLIMATE_PATH, encoding="utf-8") as f:
        app_countries = sorted({row["country"] for row in csv.DictReader(f)})

    output, unmatched = {}, []
    for country in app_countries:
        advisory = advisories.get(ALIASES.get(country, country))
        if advisory:
            output[country] = advisory
        else:
            unmatched.append(country)

    with open(OUTPUT_PATH, "w", encoding="utf-8") as f:
        json.dump(output, f, ensure_ascii=False, indent=2)

    print(f"Wrote {len(output)} of {len(app_countries)} countries to {OUTPUT_PATH}")
    print(f"No advisory for {len(unmatched)}: {', '.join(unmatched)}")

    with open(CITIES_PATH, encoding="utf-8") as f:
        iso2 = {row["country"]: row["iso2"] for row in csv.DictReader(f) if row["iso2"]}
    # Namibia's code "NA" was written as blank (read as a missing value upstream)
    iso2.setdefault("Namibia", "NA")
    codes = {country: iso2[country] for country in app_countries if country in iso2}
    with open(CODES_PATH, "w", encoding="utf-8") as f:
        json.dump(codes, f, ensure_ascii=False, indent=2)

    missing = [c for c in app_countries if c not in codes]
    print(f"Wrote {len(codes)} country codes to {CODES_PATH}; missing: {', '.join(missing) or 'none'}")


if __name__ == "__main__":
    main()
