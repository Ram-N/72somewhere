"use client";

import { useState, useEffect, useMemo } from "react";
import CityCard from "./components/CityCard";

type DurationOption = "1week" | "2weeks" | "3weeks" | "4weeks" | "1month";
type StartOption = "m1" | "m2" | "m3" | "m4" | "custom";

export default function Home() {
  const [startDate, setStartDate] = useState("");
  const [startOffset, setStartOffset] = useState<StartOption>("m1");
  const [duration, setDuration] = useState<DurationOption>("2weeks");
  const [minTemp, setMinTemp] = useState(70);
  const [maxTemp, setMaxTemp] = useState(75);
  const [tempUnit, setTempUnit] = useState<"C" | "F">("F");
  const [results, setResults] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [viewMode, setViewMode] = useState<"all" | "one">("all");
  const [currentCardIndex, setCurrentCardIndex] = useState(0);

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
    } else {
      setMinTemp(fahrenheitToCelsius(minTemp));
      setMaxTemp(fahrenheitToCelsius(maxTemp));
    }
    setTempUnit(newUnit);
  };

  const handleSearch = async () => {
    setLoading(true);
    try {
      const response = await fetch("/api/search", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          startDate,
          endDate,
          minTemp: toCelsius(minTemp),
          maxTemp: toCelsius(maxTemp),
        }),
      });
      const data = await response.json();
      setResults(data.destinations || []);
    } catch (error) {
      console.error("Search failed:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSurpriseMe = async () => {
    let randomMin: number;
    let randomMax: number;
    if (tempUnit === "F") {
      randomMin = Math.floor(Math.random() * 50) + 50;
      randomMax = randomMin + 10;
    } else {
      randomMin = Math.floor(Math.random() * 20) + 10;
      randomMax = randomMin + 5;
    }
    setMinTemp(randomMin);
    setMaxTemp(randomMax);

    const today = new Date();
    const randomDays = Math.floor(Math.random() * 180);
    const start = new Date(today.getTime() + randomDays * 24 * 60 * 60 * 1000);
    const startStr = start.toISOString().split("T")[0];
    setStartDate(startStr);
    setStartOffset("custom");
    setDuration("2weeks");

    setLoading(true);
    try {
      const calculatedEndDate = getEndDate(startStr, "2weeks");
      const response = await fetch("/api/search", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          startDate: startStr,
          endDate: calculatedEndDate,
          minTemp: toCelsius(randomMin),
          maxTemp: toCelsius(randomMax),
        }),
      });
      const data = await response.json();
      setResults(data.destinations || []);
    } catch (error) {
      console.error("Search failed:", error);
    } finally {
      setLoading(false);
    }
  };

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
      <main className="container mx-auto px-4 py-6 max-w-3xl">
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

            {/* Action Buttons */}
            <div className="flex gap-3">
              <button
                onClick={handleSearch}
                disabled={!startDate || loading}
                className="flex-1 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white font-semibold py-2 px-4 rounded-md transition-colors"
              >
                {loading ? "Searching..." : "Find Places"}
              </button>
              <button
                onClick={handleSurpriseMe}
                disabled={loading}
                className="flex-1 bg-purple-600 hover:bg-purple-700 disabled:bg-gray-400 text-white font-semibold py-2 px-4 rounded-md transition-colors"
              >
                Surprise Me
              </button>
            </div>
          </div>
        </div>

        {/* Results */}
        {results.length > 0 && (
          <div className="bg-white rounded-lg shadow-lg p-5">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-base font-bold text-gray-900">
                {startDate && endDate
                  ? `${startDate} → ${endDate}`
                  : "Date range"}{" "}
                · {minTemp}°{tempUnit}–{maxTemp}°{tempUnit}
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
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                {results.map((destination, index) => (
                  <CityCard
                    key={destination.city_id || index}
                    destination={destination}
                    tempUnit={tempUnit}
                    userMinTemp={minTemp}
                    userMaxTemp={maxTemp}
                    searchMonths={searchMonths}
                    size="compact"
                  />
                ))}
              </div>
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

        {results.length === 0 && !loading && (
          <div className="text-center text-gray-500 py-8">
            <p>Select your dates and temperature preference to find destinations</p>
          </div>
        )}
      </main>
    </div>
  );
}
