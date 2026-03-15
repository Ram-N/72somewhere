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



# Commit Message Guidelines

## Commit Message Format

### Structure

* Follow the Conventional Commits


[optional body]

[optional footer(s)]

### Types

- **feat**: A new feature
- **fix**: A bug fix
- **docs**: Documentation only changes
- **style**: Changes that do not affect the meaning of the code (white-space, formatting, missing semi-colons, etc)
- **refactor**: A code change that neither fixes a bug nor adds a feature
- **perf**: A code change that improves performance
- **test**: Adding missing tests or correcting existing tests
- **build**: Changes that affect the build system or external dependencies
- **ci**: Changes to CI configuration files and scripts
- **chore**: Other changes that don't modify src or test files
- **revert**: Reverts a previous commit

### Examples

feat(auth): add OAuth2 authentication
fix(api): resolve null pointer exception in user service
docs: update installation instructions
refactor(utils): simplify date formatting function
test(auth): add unit tests for login validation

### Subject Line (First Line)

- **Length**: Keep under 50 characters
- **Capitalization**: Use lowercase for type and description
- **Tense**: Use imperative mood ("add" not "added" or "adds")
- **Punctuation**: No period at the end
- **Clarity**: Be specific and descriptive

### Body (Optional)

- **Length**: Wrap at 72 characters
- **Content**: Explain what and why, not how
- **Separation**: Leave a blank line between subject and body

### Footer (Optional)

- **Breaking Changes**: Start with "BREAKING CHANGE:"
- **Issue References**: "Closes #123" or "Fixes #456"
- **Co-authors**: "Co-authored-by: Name <email@example.com>"


