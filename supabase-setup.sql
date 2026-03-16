-- 72somewhere Database Schema
-- Run this in your Supabase SQL Editor

-- Create cities table (matching worldcities_top20.csv structure)
CREATE TABLE IF NOT EXISTS cities (
  id TEXT PRIMARY KEY,
  city TEXT NOT NULL,
  city_ascii TEXT NOT NULL,
  lat REAL NOT NULL,
  lng REAL NOT NULL,
  country TEXT NOT NULL,
  iso2 TEXT,
  iso3 TEXT,
  admin_name TEXT,
  capital TEXT,
  population NUMERIC
);

-- Create climate table (matching climate_data_top20.csv structure)
CREATE TABLE IF NOT EXISTS climate (
  city_id TEXT NOT NULL,
  city_name TEXT NOT NULL,
  country TEXT NOT NULL,
  month INTEGER NOT NULL CHECK (month >= 1 AND month <= 12),
  avg_high_temp_c REAL NOT NULL,
  avg_low_temp_c REAL NOT NULL,
  avg_precip_mm REAL NOT NULL,
  PRIMARY KEY (city_id, month),
  FOREIGN KEY (city_id) REFERENCES cities(id) ON DELETE CASCADE
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_climate_month ON climate(month);
CREATE INDEX IF NOT EXISTS idx_climate_temp_range ON climate(avg_high_temp_c, avg_low_temp_c);
CREATE INDEX IF NOT EXISTS idx_cities_country ON cities(country);
CREATE INDEX IF NOT EXISTS idx_cities_city ON cities(city);

-- Enable Row Level Security (RLS)
ALTER TABLE cities ENABLE ROW LEVEL SECURITY;
ALTER TABLE climate ENABLE ROW LEVEL SECURITY;

-- Create policies to allow public read access
CREATE POLICY "Allow public read access to cities" ON cities
  FOR SELECT USING (true);

CREATE POLICY "Allow public read access to climate" ON climate
  FOR SELECT USING (true);

-- Verify tables were created
SELECT 'Cities table created' as status, COUNT(*) as row_count FROM cities;
SELECT 'Climate table created' as status, COUNT(*) as row_count FROM climate;
