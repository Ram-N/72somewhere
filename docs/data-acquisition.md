Here are the best data sources for your **72 Somewhere** MVP, focusing on CSV formats and historical averages as requested.

### 1. The "MVP" Pick: Kaggle World Weather Repository

This is the closest to a "download and go" solution for your React/Supabase setup. It contains daily data which you can easily aggregate into the monthly averages your PRD requires.

* **Dataset:** [World Weather Repository (Daily Updating)](https://www.kaggle.com/datasets/nelgiriyewithana/global-weather-repository)
* **Why it fits:**
* **Format:** CSV.
* **Data:** Includes `location_name` (City), `country`, `latitude`, `longitude`, `temperature_celsius`, and `condition_text`.
* **Suitability Data:** Includes `air_quality`, `humidity`, and `visibility`, which covers your "broader travel suitability" need.


* **Work required:** You will need to write a simple script to group these daily records by month to create your `Climate Dataset` (Section 6.2 of your PRD).

### 2. The "Scientific" Pick: Berkeley Earth (GitHub)

If you want pre-calculated monthly averages without doing the math yourself, this is the cleanest source, though it lacks the broader "suitability" metrics like humidity.

* **Dataset:** [Global Monthly Average Temperature Data](https://github.com/compgeolab/temperature-data)
* **Why it fits:**
* **Format:** CSV (zipped).
* **Data:** Strictly monthly average temperatures for countries and major regions.
* **Pros:** Scientific grade; no aggregation needed.
* **Cons:** Might be *too* high-level (country vs. city level) for specific travel destinations.



### 3. The "Smart" Alternative: Open-Meteo (Historical API)

Even though your PRD says "No real-time," I highly recommend using the **Open-Meteo Historical Weather API** to *generate* your seed CSV. It is free, requires no API key, and lets you download a CSV directly for any coordinate.

* **Source:** [Open-Meteo Historical Weather](https://open-meteo.com/en/docs/historical-weather-api)
* **Why it fits:**
* **Customizable:** You can request exactly `temperature_2m_mean`, `precipitation_sum`, and `sunshine_duration` (great for suitability) for the last 10 years.
* **Output:** You can click "Download CSV" on their dashboard to get the exact file you need for your Supabase import.



### 4. Broader Suitability Data (Tourism Index)

For the "travel suitability" aspect (Section 6.2), you generally won't find a single CSV labeled "suitability." You usually calculate a **Tourism Climate Index (TCI)** using raw data.

* **Formula:** `TCI = 2 * (Max Temp) + (Min Temp) + (Sunshine Hours) - (Precipitation)`
* **Data Source:** The Kaggle dataset in #1 provides the raw numbers (Temp, Precip, Humidity) to calculate this score for your `match_score` logic.

### Recommendation for Your Tech Stack

Since you are using **Supabase**, I recommend:

1. Download the **Kaggle World Weather Repository** CSV.
2. Write a quick Node.js script to:
* Read the CSV.
* Group by `city` and `month`.
* Calculate averages for Temp and Precip.
* Output a clean `climate_data.csv` that matches your PRD Section 6.2 schema.


3. Import that clean CSV directly into your Supabase `climate_data` table.


## NOAA
You are spot on. GlobalLandTemperaturesByMajorCity.csv (and the standard Berkeley Earth dataset it comes from) usually only provides TAVG (Average Temperature), which flattens the "travel feel" of a destination. A city averaging 72°F could be a perfect 72°F all day, or a miserable swing between 40°F and 100°F.

For your app, you specifically need TMAX (Average Daily High) and TMIN (Average Daily Low).

Here are the three best sources that explicitly include High/Low columns in CSV format:

1. The "Official" CSV: NOAA Global Summary of the Month (GSOM)
This is the standard dataset used by climatologists. It is a "roll-up" derived from the daily GHCN data you found, pre-calculated into monthly averages so you don't have to do it.

Dataset: NOAA GSOM (Global Summary of the Month)

Format: Simple CSV files (one per station).

Key Columns: DATE, TMAX (Avg Monthly High), TMIN (Avg Monthly Low), PRCP (Total Precip).

The Catch: It is organized by Station ID, not City Name.

How to use it:

Download the station metadata file (isd-history.csv or ghcnd-stations.txt) to map City → Station ID.

Download the GSOM data for those specific IDs.



# Notebook
This notebook has a methodology that is completely usable:
https://github.com/Jonas1312/cities-with-nice-weather/blob/main/README.ipynb

