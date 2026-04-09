import json

with open('/home/ram/projects/72somewhere/data/location_index.json') as f:
    locations = json.load(f)

lines = [
    "-- Add region/sub_region columns to seventy_two.climate",
    "ALTER TABLE seventy_two.climate ADD COLUMN IF NOT EXISTS region TEXT;",
    "ALTER TABLE seventy_two.climate ADD COLUMN IF NOT EXISTS sub_region TEXT;",
    "",
    "UPDATE seventy_two.climate AS c",
    "SET region = v.region, sub_region = v.sub_region",
    "FROM (VALUES",
]

def esc(s):
    return s.replace("'", "''") if s else ''

rows = []
for loc in locations:
    city_id = esc(loc.get('cityId', ''))
    region = esc(loc.get('region', ''))
    sub_region = esc(loc.get('subRegion', ''))
    rows.append(f"  ('{city_id}', '{region}', '{sub_region}')")

lines.append(',\n'.join(rows))
lines += [
    ") AS v(city_id, region, sub_region)",
    "WHERE c.city_id = v.city_id;",
    "",
    "SELECT 'region update done' AS status, COUNT(*) AS updated FROM seventy_two.climate WHERE region IS NOT NULL;",
]

output = '\n'.join(lines)
with open('/home/ram/projects/ClueChain/assets/sql/add-region-to-climate.sql', 'w') as f:
    f.write(output)

print("Generated: /home/ram/projects/ClueChain/assets/sql/add-region-to-climate.sql")
