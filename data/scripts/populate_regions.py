"""
populate_regions.py

Adds region and sub_region data from worldcities_enriched.csv to the Supabase climate table.

PREREQUISITES:
  1. Run the following SQL in the Supabase SQL Editor to add the columns:
       ALTER TABLE climate ADD COLUMN IF NOT EXISTS region TEXT;
       ALTER TABLE climate ADD COLUMN IF NOT EXISTS sub_region TEXT;

  2. Set SUPABASE_SERVICE_ROLE_KEY environment variable (or paste it below).
     The anon key cannot UPDATE rows. Get the service role key from:
     Supabase Dashboard → Project Settings → API → service_role key

USAGE:
  cd /home/ram/projects/72somewhere
  SUPABASE_SERVICE_ROLE_KEY=your_key uv run data/scripts/populate_regions.py
"""

import os
import sys
import pandas as pd
import requests

SUPABASE_URL = "https://ztnopolzclnwpvzttumh.supabase.co"
SERVICE_KEY = os.environ.get("SUPABASE_SERVICE_ROLE_KEY", "")

if not SERVICE_KEY:
    print("ERROR: SUPABASE_SERVICE_ROLE_KEY environment variable not set.")
    print("Usage: SUPABASE_SERVICE_ROLE_KEY=your_key uv run data/scripts/populate_regions.py")
    sys.exit(1)

HEADERS = {
    "apikey": SERVICE_KEY,
    "Authorization": f"Bearer {SERVICE_KEY}",
    "Content-Type": "application/json",
    "Prefer": "return=minimal",
}

CSV_PATH = os.path.join(os.path.dirname(__file__), "..", "worldcities_enriched.csv")

def main():
    print(f"Reading enriched CSV from {CSV_PATH}...")
    df = pd.read_csv(CSV_PATH)
    # Ensure id is string to match city_id
    df["id"] = df["id"].astype(str).str.replace(r"\.0$", "", regex=True)
    df["region"] = df["region"].fillna("")
    df["sub_region"] = df["sub_region"].fillna("")

    total = len(df)
    print(f"Found {total} cities to update.")

    success = 0
    errors = 0

    for i, row in df.iterrows():
        city_id = str(row["id"])
        region = str(row["region"]) if pd.notna(row["region"]) else ""
        sub_region = str(row["sub_region"]) if pd.notna(row["sub_region"]) else ""

        # PATCH all climate rows for this city_id
        url = f"{SUPABASE_URL}/rest/v1/climate?city_id=eq.{city_id}"
        payload = {"region": region, "sub_region": sub_region}

        resp = requests.patch(url, headers=HEADERS, json=payload)
        if resp.status_code in (200, 204):
            success += 1
        else:
            print(f"  ERROR city_id={city_id}: {resp.status_code} {resp.text[:100]}")
            errors += 1

        if (i + 1) % 50 == 0:
            print(f"  Progress: {i+1}/{total} ({success} ok, {errors} errors)")

    print(f"\nDone! {success} cities updated, {errors} errors.")

if __name__ == "__main__":
    main()
