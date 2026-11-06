"use client";

import { useState } from "react";
import CityCard, { type Destination } from "./CityCard";
import { ADVISORY_LEVELS, getFlag, type Advisory } from "@/lib/advisories";

export interface CountrySummary {
  country: string;
  advisory: Advisory | null;
  total_cities: number;
  matched_cities: number;
  best_score: number;
  cities: (Destination & { matches_temp: boolean })[]; // matched first, then by score
}

interface CountryCardProps {
  summary: CountrySummary;
  tempUnit: "C" | "F";
  userMinTemp: number;
  userMaxTemp: number;
  searchMonths: number[];
  precipThresholdMm: number | null;
  showMatchesOnly: boolean;
}

const MAX_PILLS = 4;

export default function CountryCard({
  summary,
  tempUnit,
  userMinTemp,
  userMaxTemp,
  searchMonths,
  precipThresholdMm,
  showMatchesOnly,
}: CountryCardProps) {
  const [expanded, setExpanded] = useState(false);
  const { country, advisory, total_cities, matched_cities, best_score, cities } = summary;

  const matchedCities = cities.filter((c) => c.matches_temp);
  // Countries with no matches still preview their closest cities
  const pillCities = (matchedCities.length > 0 ? matchedCities : cities).slice(0, MAX_PILLS);
  const extra = (matchedCities.length > 0 ? matchedCities.length : cities.length) - pillCities.length;
  const shownCities = showMatchesOnly ? matchedCities : cities;

  const formatHigh = (c: number) => (tempUnit === "F" ? Math.round((c * 9) / 5 + 32) : Math.round(c));

  return (
    <div className={`border border-gray-200 rounded-lg bg-white ${matched_cities === 0 ? "opacity-80" : ""}`}>
      <button
        onClick={() => setExpanded((e) => !e)}
        className="w-full text-left p-3 hover:bg-gray-50 rounded-lg transition-colors"
        aria-expanded={expanded}
      >
        <div className="flex justify-between items-start gap-2">
          <div className="min-w-0">
            <h3 className="font-semibold text-gray-900 text-base">
              <span className="text-gray-400 text-sm mr-1">{expanded ? "▾" : "▸"}</span>
              {getFlag(country)} {country}
            </h3>
            <p className="text-xs text-gray-500 flex flex-wrap items-center gap-x-1.5">
              {matched_cities} of {total_cities} {total_cities === 1 ? "city matches" : "cities match"}
              {advisory && advisory.level >= 2 && (
                <span
                  className={`px-1.5 rounded-full font-medium ${ADVISORY_LEVELS[advisory.level].color}`}
                  title="US State Dept travel advisory (country-level)"
                >
                  ⚠ L{advisory.level} · {ADVISORY_LEVELS[advisory.level].short}
                </span>
              )}
            </p>
          </div>
          <span className={`flex-shrink-0 text-xs px-2 py-1 rounded-full font-semibold ${
            best_score >= 80 ? "bg-green-100 text-green-700"
            : best_score >= 55 ? "bg-yellow-100 text-yellow-700"
            : "bg-orange-100 text-orange-700"
          }`}>
            Best {best_score}
          </span>
        </div>

        <div className="flex flex-wrap gap-1.5 mt-2">
          {pillCities.map((c) => (
            <span
              key={c.city_id}
              title="Average high for your trip"
              className={`text-xs px-2 py-0.5 rounded-full ${
                c.matches_temp ? "bg-blue-50 text-blue-700" : "bg-gray-100 text-gray-500"
              }`}
            >
              {c.city_name} {formatHigh(c.avg_high)}°
            </span>
          ))}
          {extra > 0 && <span className="text-xs px-2 py-0.5 text-gray-500">+{extra}</span>}
        </div>
      </button>

      {expanded && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-2 pt-0 sm:p-3 sm:pt-0">
          {shownCities.map((destination) => (
            <CityCard
              key={destination.city_id}
              destination={destination}
              tempUnit={tempUnit}
              userMinTemp={userMinTemp}
              userMaxTemp={userMaxTemp}
              searchMonths={searchMonths}
              size="compact"
              matchesTemp={destination.matches_temp}
              precipThresholdMm={precipThresholdMm}
              showCountry={false}
            />
          ))}
        </div>
      )}
    </div>
  );
}
