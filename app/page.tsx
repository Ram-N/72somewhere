"use client";

import { useState, useEffect, useMemo, useCallback, useRef } from "react";
import CityCard from "./components/CityCard";
import LocationSearch from "./components/LocationSearch";
import AdvancedSearchModal from "./components/AdvancedSearchModal";
import type { LocationFilter } from "@/lib/types";

type DurationOption = "1week" | "2weeks" | "3weeks" | "4weeks" | "1month";
type StartOption = "m1" | "m2" | "m3" | "m4" | "custom";
type SortOption = "score" | "country" | "temp" | "precip";
type PrecipOption = "any" | "dry" | "low" | "some";

const precipOptions: { key: PrecipOption; label: string; mm: number | null; tooltip: string }[] = [
  { key: "any", label: "Any", mm: null, tooltip: "Show all destinations" },
  { key: "dry", label: "Dry", mm: 30, tooltip: "≤ 30mm/month — desert, Mediterranean summer" },
  { key: "low", label: "Low Rain", mm: 60, tooltip: "≤ 60mm/month — occasional showers" },
  { key: "some", label: "Some Rain", mm: 120, tooltip: "≤ 120mm/month — excludes monsoon & tropical wet" },
];

export default function Home() {
  const [startDate, setStartDate] = useState("");
  const [startOffset, setStartOffset] = useState<StartOption>("m1");
  const [duration, setDuration] = useState<DurationOption>("2weeks");
  const [minTemp, setMinTemp] = useState(70);
  const [maxTemp, setMaxTemp] = useState(75);
  const [tempUnit, setTempUnit] = useState<"C" | "F">("F");
  const [locationFilter, setLocationFilter] = useState<LocationFilter | null>(null);
  const [results, setResults] = useState<any[]>([]);
  const [searchMeta, setSearchMeta] = useState<{ totalInArea?: number; matchedInArea?: number } | null>(null);
  const [loading, setLoading] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);
  const [viewMode, setViewMode] = useState<"all" | "one">("all");
  const [currentCardIndex, setCurrentCardIndex] = useState(0);
  const [sortBy, setSortBy] = useState<SortOption>("score");
  const [maxPrecip, setMaxPrecip] = useState<PrecipOption>("low");
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [minLowTemp, setMinLowTemp] = useState<number | null>(null);
  const [maxHighTemp, setMaxHighTemp] = useState<number | null>(null);
  const [advancedMaxPrecip, setAdvancedMaxPrecip] = useState<number | null>(null);

  const hasAdvancedFilters = minLowTemp !== null || maxHighTemp !== null || advancedMaxPrecip !== null;

  // Compute next 4 month options (e.g. Apr, May, Jun, Jul when in March)
  const nextMonths = useMemo(() => {
    const today = new Date();
    return ([1, 2, 3, 4] as const).map((i) => {
      const d = new Date(today.getFullYear(), today.getMonth() + i, 1);
      return {
        key: `m${i}` as StartOption,
        label: d.toLocaleString("default", { month: "short" }),
        date: d.toISOString().split("T")[0],
      };
    });
  }, []);

  // Default to first of next month to avoid hydration mismatch
  useEffect(() => {
    const today = new Date();
    const nextMonth = new Date(today.getFullYear(), today.getMonth() + 1, 1);
    setStartDate(nextMonth.toISOString().split("T")[0]);
  }, []);

  const handleStartOffset = (key: StartOption, date: string) => {
    setStartOffset(key);
    setStartDate(date);
  };

  const getEndDate = (start: string, dur: DurationOption): string => {
    if (!start) return "";
    const daysMap: Record<DurationOption, number> = {
      "1week": 7,
      "2weeks": 14,
      "3weeks": 21,
      "4weeks": 28,
      "1month": 30,
    };
    const endDateObj = new Date(
      new Date(start).getTime() + daysMap[dur] * 24 * 60 * 60 * 1000
    );
    return endDateObj.toISOString().split("T")[0];
  };

  const endDate = getEndDate(startDate, duration);

  const getSearchMonths = (start: string, end: string): number[] => {
    if (!start || !end) return [];
    const months = new Set<number>();
    const current = new Date(start);
    const endObj = new Date(end);
    while (current <= endObj) {
      months.add(current.getMonth() + 1);
      current.setMonth(current.getMonth() + 1);
    }
    return Array.from(months);
  };

  const searchMonths = getSearchMonths(startDate, endDate);

  const sortedResults = useMemo(() => {
    const s = [...results];
    if (sortBy === "country") s.sort((a, b) => a.country.localeCompare(b.country) || a.city_name.localeCompare(b.city_name));
    else if (sortBy === "temp") s.sort((a, b) => b.avg_temp - a.avg_temp);
    else if (sortBy === "precip") s.sort((a, b) => a.avg_precip - b.avg_precip);
    return s;
  }, [results, sortBy]);

  const groupedByCountry = useMemo(() => {
    if (sortBy !== "country") return null;
    return sortedResults.reduce((acc, dest) => {
      (acc[dest.country] = acc[dest.country] || []).push(dest);
      return acc;
    }, {} as Record<string, typeof results>);
  }, [sortedResults, sortBy]);

  const celsiusToFahrenheit = (c: number): number => Math.round((c * 9) / 5 + 32);
  const fahrenheitToCelsius = (f: number): number => Math.round((f - 32) * (5 / 9));

  const sliderMin = tempUnit === "F" ? 0 : -18;
  const sliderMax = tempUnit === "F" ? 120 : 49;

  const toCelsius = (temp: number): number =>
    tempUnit === "F" ? fahrenheitToCelsius(temp) : temp;

  const handleUnitToggle = () => {
    const newUnit = tempUnit === "C" ? "F" : "C";
    if (newUnit === "F") {
      setMinTemp(celsiusToFahrenheit(minTemp));
      setMaxTemp(celsiusToFahrenheit(maxTemp));
      if (minLowTemp !== null) setMinLowTemp(celsiusToFahrenheit(minLowTemp));
      if (maxHighTemp !== null) setMaxHighTemp(celsiusToFahrenheit(maxHighTemp));
    } else {
      setMinTemp(fahrenheitToCelsius(minTemp));
      setMaxTemp(fahrenheitToCelsius(maxTemp));
      if (minLowTemp !== null) setMinLowTemp(fahrenheitToCelsius(minLowTemp));
      if (maxHighTemp !== null) setMaxHighTemp(fahrenheitToCelsius(maxHighTemp));
    }
    setTempUnit(newUnit);
  };

  const runSearch = useCallback(async (
    sd: string, ed: string, minC: number, maxC: number, precip: PrecipOption, loc: LocationFilter | null,
    minLowC: number | null, maxHighC: number | null, advPrecip: number | null
  ) => {
    if (!sd) return;
    setLoading(true);
    try {
      const selectedMm = precipOptions.find((o) => o.key === precip)?.mm ?? null;
      const body: Record<string, unknown> = { startDate: sd, endDate: ed, minTemp: minC, maxTemp: maxC };
      if (selectedMm !== null) body.maxPrecip = selectedMm;
      if (loc) body.locationFilter = loc;
      if (minLowC !== null) body.minLowTemp = minLowC;
      if (maxHighC !== null) body.maxHighTemp = maxHighC;
      if (advPrecip !== null) body.advancedMaxPrecip = advPrecip;

      const response = await fetch("/api/search", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = await response.json();
      setResults(data.destinations || []);
      setHasSearched(true);
      setSearchMeta(loc ? { totalInArea: data.totalInArea, matchedInArea: data.matchedInArea } : null);
    } catch (error) {
      console.error("Search failed:", error);
    } finally {
      setLoading(false);
    }
  }, []);

  // Debounced auto-search — fires 600ms after any filter change
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isFirstRender = useRef(true);

  useEffect(() => {
    // Skip the very first render (startDate initialises async via useEffect)
    if (isFirstRender.current) {
      isFirstRender.current = false;
      return;
    }
    if (!startDate) return;

    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      runSearch(
        startDate, endDate, toCelsius(minTemp), toCelsius(maxTemp), maxPrecip, locationFilter,
        minLowTemp !== null ? toCelsius(minLowTemp) : null,
        maxHighTemp !== null ? toCelsius(maxHighTemp) : null,
        advancedMaxPrecip
      );
    }, 600);

    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [startDate, endDate, minTemp, maxTemp, maxPrecip, locationFilter, minLowTemp, maxHighTemp, advancedMaxPrecip]); // eslint-disable-line react-hooks/exhaustive-deps

  const handlePrevCard = () =>
    setCurrentCardIndex((prev) => (prev > 0 ? prev - 1 : results.length - 1));
  const handleNextCard = () =>
    setCurrentCardIndex((prev) => (prev < results.length - 1 ? prev + 1 : 0));

  const durationOptions: { key: DurationOption; label: string }[] = [
    { key: "1week", label: "1 Wk" },
    { key: "2weeks", label: "2 Wks" },
    { key: "3weeks", label: "3 Wks" },
    { key: "4weeks", label: "4 Wks" },
    { key: "1month", label: "1 Mo" },
  ];

  const pillClass = (active: boolean) =>
    `px-3 py-1 rounded-full text-sm font-medium transition-colors ${
      active
        ? "bg-blue-600 text-white"
        : "bg-gray-200 text-gray-700 hover:bg-gray-300"
    }`;

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white">
      <main className="container mx-auto px-4 py-6 max-w-4xl">
        <header className="text-center mb-5">
          <h1 className="text-4xl font-bold text-gray-900 mb-1">72 Somewhere</h1>
          <p className="text-base text-gray-600">
            Find your perfect destination based on weather
          </p>
        </header>

        <div className="bg-white rounded-lg shadow-lg p-5 mb-5">
          <div className="space-y-4">
            {/* Travel Date: month pills + compact date input */}
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">
                Travel Date
              </label>
              <div className="flex flex-wrap gap-1 items-center">
                {nextMonths.map(({ key, label, date }) => (
                  <button
                    key={key}
                    onClick={() => handleStartOffset(key, date)}
                    className={pillClass(startOffset === key)}
                  >
                    {label}
                  </button>
                ))}
                <input
                  type="date"
                  value={startDate}
                  onChange={(e) => {
                    setStartDate(e.target.value);
                    setStartOffset("custom");
                  }}
                  className="ml-1 px-2 py-1 text-sm border border-gray-300 rounded-md focus:ring-1 focus:ring-blue-500 focus:border-transparent text-gray-900 w-36"
                />
              </div>
            </div>

            {/* Duration */}
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">
                Duration{endDate ? ` · ends ${endDate}` : ""}
              </label>
              <div className="flex flex-wrap gap-1">
                {durationOptions.map(({ key, label }) => (
                  <button
                    key={key}
                    onClick={() => setDuration(key)}
                    className={pillClass(duration === key)}
                  >
                    {label}
                  </button>
                ))}
              </div>
            </div>

            {/* Temperature Range */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-xs font-medium text-gray-500">
                  Temp: {minTemp}°{tempUnit} – {maxTemp}°{tempUnit}
                </label>
                <button
                  onClick={handleUnitToggle}
                  className="px-2 py-0.5 text-xs rounded-full bg-gray-200 text-gray-700 hover:bg-gray-300 transition-colors"
                >
                  °{tempUnit} ⇄ °{tempUnit === "C" ? "F" : "C"}
                </button>
              </div>
              <div className="relative pt-6 pb-2">
                <div
                  className="absolute -top-8 bg-blue-600 text-white px-2 py-1 rounded text-sm font-medium"
                  style={{
                    left: `calc(${((minTemp - sliderMin) / (sliderMax - sliderMin)) * 100}% - 20px)`,
                  }}
                >
                  {minTemp}°{tempUnit}
                </div>
                <div
                  className="absolute -top-8 bg-blue-600 text-white px-2 py-1 rounded text-sm font-medium"
                  style={{
                    left: `calc(${((maxTemp - sliderMin) / (sliderMax - sliderMin)) * 100}% - 20px)`,
                  }}
                >
                  {maxTemp}°{tempUnit}
                </div>
                <input
                  type="range"
                  min={sliderMin}
                  max={sliderMax}
                  value={minTemp}
                  onChange={(e) => {
                    const newMin = Number(e.target.value);
                    if (newMin <= maxTemp) setMinTemp(newMin);
                  }}
                  className="absolute w-full h-2 bg-transparent appearance-none pointer-events-none"
                  style={{ zIndex: minTemp > maxTemp - 2 ? 2 : 1 }}
                />
                <input
                  type="range"
                  min={sliderMin}
                  max={sliderMax}
                  value={maxTemp}
                  onChange={(e) => {
                    const newMax = Number(e.target.value);
                    if (newMax >= minTemp) setMaxTemp(newMax);
                  }}
                  className="absolute w-full h-2 bg-gray-300 rounded-lg appearance-none"
                  style={{
                    background: `linear-gradient(to right, #e5e7eb 0%, #e5e7eb ${((minTemp - sliderMin) / (sliderMax - sliderMin)) * 100}%, #3b82f6 ${((minTemp - sliderMin) / (sliderMax - sliderMin)) * 100}%, #3b82f6 ${((maxTemp - sliderMin) / (sliderMax - sliderMin)) * 100}%, #e5e7eb ${((maxTemp - sliderMin) / (sliderMax - sliderMin)) * 100}%, #e5e7eb 100%)`,
                  }}
                />
              </div>
              <div className="flex justify-between text-xs text-gray-500 mt-1">
                <span>{sliderMin}°{tempUnit}</span>
                <span>{sliderMax}°{tempUnit}</span>
              </div>
            </div>

            {/* Rain Preference */}
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">
                Rain
              </label>
              <div className="flex flex-wrap gap-1">
                {precipOptions.map(({ key, label, tooltip }) => (
                  <button
                    key={key}
                    onClick={() => setMaxPrecip(key)}
                    title={tooltip}
                    className={pillClass(maxPrecip === key)}
                  >
                    {label}
                  </button>
                ))}
              </div>
            </div>

            {/* Location filter */}
            <LocationSearch value={locationFilter} onChange={setLocationFilter} />

            {/* Advanced filters trigger */}
            <div className="flex justify-end pt-1">
              <button
                onClick={() => setShowAdvanced(true)}
                className={`flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium rounded-full transition-colors ${
                  hasAdvancedFilters
                    ? "bg-blue-50 text-blue-700 border border-blue-300 hover:bg-blue-100"
                    : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                }`}
              >
                Advanced
                {hasAdvancedFilters && (
                  <span className="h-2 w-2 rounded-full bg-blue-500" />
                )}
                <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </button>
            </div>
          </div>
        </div>

        <AdvancedSearchModal
          show={showAdvanced}
          onClose={() => setShowAdvanced(false)}
          tempUnit={tempUnit}
          minLowTemp={minLowTemp}
          setMinLowTemp={setMinLowTemp}
          maxHighTemp={maxHighTemp}
          setMaxHighTemp={setMaxHighTemp}
          advancedMaxPrecip={advancedMaxPrecip}
          setAdvancedMaxPrecip={setAdvancedMaxPrecip}
        />

        {/* Results */}
        {results.length > 0 && !loading && (
          <div className="bg-white rounded-lg shadow-lg p-5">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-base font-bold text-gray-900">
                {searchMeta ? (
                  <>
                    {searchMeta.matchedInArea} of {searchMeta.totalInArea} cities in {locationFilter?.label}
                    <span className="font-normal text-gray-500"> match your temp{maxPrecip !== "any" ? " & rain" : ""}</span>
                  </>
                ) : (
                  <>
                    {startDate && endDate ? `${startDate} → ${endDate}` : "Date range"}{" "}
                    · {minTemp}°{tempUnit}–{maxTemp}°{tempUnit}
                  </>
                )}
              </h2>
              <div className="flex gap-1">
                <button
                  onClick={() => {
                    setViewMode("all");
                    setCurrentCardIndex(0);
                  }}
                  className={pillClass(viewMode === "all")}
                >
                  All
                </button>
                <button
                  onClick={() => {
                    setViewMode("one");
                    setCurrentCardIndex(0);
                  }}
                  className={pillClass(viewMode === "one")}
                >
                  One at a Time
                </button>
              </div>
            </div>

            {viewMode === "all" && (
              <>
                {/* Sort controls */}
                <div className="flex items-center gap-2 mb-3 flex-wrap">
                  <span className="text-xs text-gray-500 font-medium">Sort:</span>
                  {([
                    { key: "score", label: "Match % ↓" },
                    { key: "country", label: "Country" },
                    { key: "temp", label: "Temp ↓" },
                    { key: "precip", label: "Rain ↑" },
                  ] as { key: SortOption; label: string }[]).map(({ key, label }) => (
                    <button
                      key={key}
                      onClick={() => setSortBy(key)}
                      className={`px-2 py-0.5 rounded-full text-xs font-medium transition-colors ${
                        sortBy === key
                          ? "bg-blue-600 text-white"
                          : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                      }`}
                    >
                      {label}
                    </button>
                  ))}
                </div>

                {/* Grouped by country */}
                {groupedByCountry ? (
                  <div className="space-y-5">
                    {Object.entries(groupedByCountry as Record<string, any[]>).map(([country, cities]) => (
                      <div key={country}>
                        <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-2 pl-2 border-l-2 border-blue-400">
                          {country}
                        </h3>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                          {cities.map((destination, index) => (
                            <CityCard
                              key={destination.city_id || index}
                              destination={destination}
                              tempUnit={tempUnit}
                              userMinTemp={minTemp}
                              userMaxTemp={maxTemp}
                              searchMonths={searchMonths}
                              size="compact"
                              matchesTemp={searchMeta ? destination.matches_temp : undefined}
                              precipThresholdMm={precipOptions.find(o => o.key === maxPrecip)?.mm ?? null}
                            />
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {sortedResults.map((destination, index) => (
                      <CityCard
                        key={destination.city_id || index}
                        destination={destination}
                        tempUnit={tempUnit}
                        userMinTemp={minTemp}
                        userMaxTemp={maxTemp}
                        searchMonths={searchMonths}
                        size="compact"
                        matchesTemp={searchMeta ? destination.matches_temp : undefined}
                        precipThresholdMm={precipOptions.find(o => o.key === maxPrecip)?.mm ?? null}
                      />
                    ))}
                  </div>
                )}
              </>
            )}

            {viewMode === "one" && results.length > 0 && (
              <div className="flex items-center justify-center gap-4">
                <button
                  onClick={handlePrevCard}
                  className="p-3 rounded-full bg-blue-600 text-white hover:bg-blue-700 transition-colors"
                  aria-label="Previous destination"
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-6 w-6"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M15 19l-7-7 7-7"
                    />
                  </svg>
                </button>
                <div className="flex-1 max-w-md">
                  <div className="text-center mb-2">
                    <span className="text-sm text-gray-500">
                      {currentCardIndex + 1} of {results.length}
                    </span>
                  </div>
                  <CityCard
                    key={results[currentCardIndex].city_id || currentCardIndex}
                    destination={results[currentCardIndex]}
                    tempUnit={tempUnit}
                    userMinTemp={minTemp}
                    userMaxTemp={maxTemp}
                    searchMonths={searchMonths}
                    size="large"
                    matchesTemp={searchMeta ? results[currentCardIndex].matches_temp : undefined}
                    precipThresholdMm={precipOptions.find(o => o.key === maxPrecip)?.mm ?? null}
                  />
                </div>
                <button
                  onClick={handleNextCard}
                  className="p-3 rounded-full bg-blue-600 text-white hover:bg-blue-700 transition-colors"
                  aria-label="Next destination"
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-6 w-6"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9 5l7 7-7 7"
                    />
                  </svg>
                </button>
              </div>
            )}
          </div>
        )}

        {loading && (
          <div className="text-center text-gray-400 py-8">
            <svg className="animate-spin h-6 w-6 mx-auto mb-2 text-blue-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
            </svg>
            <p className="text-sm">Searching…</p>
          </div>
        )}
        {results.length === 0 && !loading && !hasSearched && (
          <div className="text-center text-gray-500 py-8">
            <p>Select your dates and temperature preference to find destinations</p>
          </div>
        )}
        {results.length === 0 && !loading && hasSearched && (
          <div className="text-center py-8">
            <p className="text-lg font-medium text-gray-700 mb-1">No destinations match your filters</p>
            <p className="text-sm text-gray-500">Try widening your temperature range, relaxing the rain limit, or choosing different dates</p>
          </div>
        )}
      </main>
    </div>
  );
}
