# PRD: 72 Somewhere

## 1. Product Overview

**Product Name:** 72 Somewhere  
**Platform:** Mobile-first web application  
**Tech Direction:** React frontend, Supabase backend  
**Primary Goal:** Help users discover travel destinations with comfortable weather during a chosen date range.

---

## 2. Problem Statement

Most travel planning starts with a destination and then checks weather.  
This app reverses the flow: users start with **preferred weather**, then discover **destinations** that match.

---

## 3. Target Users

- Flexible travelers with open destinations
- Weather-sensitive travelers
- Retirees or slow travelers
- Remote workers

**Out of scope:** adventure travelers, fixed-destination planners.

---

## 4. Core User Flow (MVP)

1. User opens app (no login required).
2. User selects:
   - Start date
   - End date
   - Preferred temperature range (default centered on 72°F).
3. User taps **Find places** or **Surprise me**.
4. App displays a ranked list of destinations with matching weather.

---

## 5. Functional Requirements

### 5.1 Inputs

#### Date Range
- Two date pickers:
  - `start_date`
  - `end_date`
- Default:
  - `start_date = today`
  - `end_date = today + 7 days`

#### Temperature Preference
- Slider input:
  - `min_temp`
  - `max_temp`
- Default:
  - 68°F – 75°F
- Unit toggle:
  - Fahrenheit (default)
  - Celsius

---

### 5.2 Core Actions

#### Find Places
- Triggers weather-based search
- Returns ranked destination list

#### Surprise Me
- Same logic as Find Places
- Randomizes result order within top matches

---

### 5.3 Output (Results List)

Each result must display:

- `city`
- `country`
- `avg_high_temp`
- `avg_low_temp` (optional)
- `precipitation_label` (`Dry`, `Mixed`, `Rainy`)
- `match_score` (internal only)

**Result Limit:**  
- Minimum: 5  
- Maximum: 10  

Sorted by closeness to target temperature.

---

## 6. Data Requirements

### 6.1 City Dataset

Required fields:
- `city_id`
- `city_name`
- `country`
- `latitude`
- `longitude`
- `region` (optional)

---

### 6.2 Climate Dataset

- Historical monthly averages

Required fields:
- `city_id`
- `month` (1–12)
- `avg_high_temp_c`
- `avg_low_temp_c`
- `avg_precip_mm`

---

## 7. Backend Logic

1. Convert date range → months
2. Aggregate climate data
3. Filter by temperature range
4. Rank by closeness to target
5. Return top N results

No real-time weather. No ML.

---

## 8. Authentication

- Anonymous usage supported
- Optional Google OAuth (Supabase)

---

## 9. Non-Goals

- No bookings
- No pricing
- No reviews
- No maps (MVP)

---

## 10. Success Criteria

- Results in under 10 seconds
- Useful with limited dataset
- Clear weather-first value proposition
