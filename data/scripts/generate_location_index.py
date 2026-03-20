"""
generate_location_index.py

Reads worldcities_enriched.csv and outputs data/location_index.json
for client-side autocomplete in the LocationSearch component.

USAGE:
  cd /home/ram/projects/72somewhere
  uv run data/scripts/generate_location_index.py
"""

import os
import json
import pandas as pd

CSV_PATH = os.path.join(os.path.dirname(__file__), "..", "worldcities_enriched.csv")
OUTPUT_PATH = os.path.join(os.path.dirname(__file__), "..", "location_index.json")

def main():
    print(f"Reading {CSV_PATH}...")
    df = pd.read_csv(CSV_PATH)

    # Normalize id to string (drop .0 suffix)
    df["id"] = df["id"].astype(str).str.replace(r"\.0$", "", regex=True)

    records = []
    for _, row in df.iterrows():
        records.append({
            "cityId": str(row["id"]),
            "city": str(row["city"]) if pd.notna(row["city"]) else "",
            "country": str(row["country"]) if pd.notna(row["country"]) else "",
            "region": str(row["region"]) if pd.notna(row["region"]) else "",
            "subRegion": str(row["sub_region"]) if pd.notna(row["sub_region"]) else "",
        })

    with open(OUTPUT_PATH, "w", encoding="utf-8") as f:
        json.dump(records, f, ensure_ascii=False, indent=2)

    print(f"Written {len(records)} entries to {OUTPUT_PATH}")

if __name__ == "__main__":
    main()
