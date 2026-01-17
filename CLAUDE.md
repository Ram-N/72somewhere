# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**72 Somewhere** is a mobile-first web application that helps users discover travel destinations based on preferred weather conditions during a chosen date range. The app reverses traditional travel planning by starting with weather preferences rather than destination.

**Status:** Early planning phase - specifications only
**Planned Tech Stack:** React frontend, Supabase backend

## Python Environment

This project uses **uv** for Python package management. Always use `uv` commands for installing dependencies and managing virtual environments.

## Current Structure

- `docs/PRD.md` - Complete product requirements document
- `docs/data-acquisition.md` - Data sourcing strategy and recommendations
- `data/` - Empty directory for climate/city datasets

## Product Concept

### Core User Flow
1. User selects date range (start/end dates)
2. User sets temperature preference (default 68°F-75°F)
3. User clicks "Find places" or "Surprise me"
4. App returns 5-10 destinations with matching weather

### Key Features
- Anonymous usage (no login required)
- Weather-first destination discovery
- Historical climate data (not real-time weather)
- Simple ranking algorithm based on temperature match

### Target Users
- Flexible travelers with open destinations
- Weather-sensitive travelers
- Retirees or slow travelers
- Remote workers

## Data Architecture (Planned)

### City Dataset
Required fields: `city_id`, `city_name`, `country`, `latitude`, `longitude`, `region`

### Climate Dataset
Monthly historical averages with fields: `city_id`, `month`, `avg_high_temp_c`, `avg_low_temp_c`, `avg_precip_mm`

### Recommended Data Source
Kaggle World Weather Repository (daily data to be aggregated into monthly averages) or Open-Meteo Historical Weather API for generating seed CSV data.

## Backend Logic (Planned)

1. Convert date range to months
2. Aggregate climate data for those months
3. Filter cities by temperature range
4. Rank by closeness to target temperature
5. Return top 5-10 results

No machine learning. No real-time weather APIs.

## Non-Goals

- No booking integration
- No pricing information
- No reviews or ratings
- No maps in MVP
- No adventure travel features

## Success Criteria

- Results returned in under 10 seconds
- Functional with limited initial dataset
- Clear weather-first value proposition
