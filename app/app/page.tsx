"use client";

import { useState, useEffect } from "react";

type DurationOption = "1week" | "2weeks" | "3weeks" | "1month";

export default function Home() {
  // Initialize startDate to today (using useEffect to avoid hydration mismatch)
  const [startDate, setStartDate] = useState("");
  const [duration, setDuration] = useState<DurationOption>("2weeks");
  const [minTemp, setMinTemp] = useState(20);
  const [maxTemp, setMaxTemp] = useState(25);
  const [tempUnit, setTempUnit] = useState<"C" | "F">("C");
  const [results, setResults] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [viewMode, setViewMode] = useState<"all" | "one">("all");
  const [currentCardIndex, setCurrentCardIndex] = useState(0);

  // Set start date to today on client mount to avoid hydration mismatch
  useEffect(() => {
    const today = new Date();
    setStartDate(today.toISOString().split('T')[0]);
  }, []);

  // Calculate end date based on start date and duration
  const getEndDate = (start: string, dur: DurationOption): string => {
    if (!start) return "";
    const startDateObj = new Date(start);
    let daysToAdd = 0;

    switch (dur) {
      case "1week":
        daysToAdd = 7;
        break;
      case "2weeks":
        daysToAdd = 14;
        break;
      case "3weeks":
        daysToAdd = 21;
        break;
      case "1month":
        daysToAdd = 30;
        break;
    }

    const endDateObj = new Date(startDateObj.getTime() + daysToAdd * 24 * 60 * 60 * 1000);
    return endDateObj.toISOString().split('T')[0];
  };

  const endDate = getEndDate(startDate, duration);

  // Temperature conversion helpers
  const celsiusToFahrenheit = (c: number): number => Math.round((c * 9/5) + 32);
  const fahrenheitToCelsius = (f: number): number => Math.round((f - 32) * 5/9);

  const displayTemp = (temp: number): number => {
    return tempUnit === "F" ? celsiusToFahrenheit(temp) : temp;
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
          minTemp,
          maxTemp,
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
    // Random temperature range
    const randomMin = Math.floor(Math.random() * 20) + 10; // 10-30°C
    const randomMax = randomMin + 5;

    setMinTemp(randomMin);
    setMaxTemp(randomMax);

    // Random 2-week period in next 6 months
    const today = new Date();
    const randomDays = Math.floor(Math.random() * 180);
    const start = new Date(today.getTime() + randomDays * 24 * 60 * 60 * 1000);

    const startStr = start.toISOString().split('T')[0];

    setStartDate(startStr);
    setDuration("2weeks");

    // Trigger search with the calculated values
    setLoading(true);
    try {
      const calculatedEndDate = getEndDate(startStr, "2weeks");
      const response = await fetch("/api/search", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          startDate: startStr,
          endDate: calculatedEndDate,
          minTemp: randomMin,
          maxTemp: randomMax,
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

  const handlePrevCard = () => {
    setCurrentCardIndex((prev) => (prev > 0 ? prev - 1 : results.length - 1));
  };

  const handleNextCard = () => {
    setCurrentCardIndex((prev) => (prev < results.length - 1 ? prev + 1 : 0));
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white">
      <main className="container mx-auto px-4 py-12 max-w-4xl">
        <header className="text-center mb-12">
          <h1 className="text-5xl font-bold text-gray-900 mb-4">
            72 Somewhere
          </h1>
          <p className="text-xl text-gray-600">
            Find your perfect destination based on weather
          </p>
        </header>

        <div className="bg-white rounded-lg shadow-lg p-8 mb-8">
          <div className="space-y-6">
            {/* Date Selection */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Start Date
              </label>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900"
              />
            </div>

            {/* Duration Buttons */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Trip Duration
              </label>
              <div className="grid grid-cols-4 gap-2">
                <button
                  onClick={() => setDuration("1week")}
                  className={`py-2 px-4 rounded-md font-medium transition-colors ${
                    duration === "1week"
                      ? "bg-blue-600 text-white"
                      : "bg-gray-200 text-gray-700 hover:bg-gray-300"
                  }`}
                >
                  1 Week
                </button>
                <button
                  onClick={() => setDuration("2weeks")}
                  className={`py-2 px-4 rounded-md font-medium transition-colors ${
                    duration === "2weeks"
                      ? "bg-blue-600 text-white"
                      : "bg-gray-200 text-gray-700 hover:bg-gray-300"
                  }`}
                >
                  2 Weeks
                </button>
                <button
                  onClick={() => setDuration("3weeks")}
                  className={`py-2 px-4 rounded-md font-medium transition-colors ${
                    duration === "3weeks"
                      ? "bg-blue-600 text-white"
                      : "bg-gray-200 text-gray-700 hover:bg-gray-300"
                  }`}
                >
                  3 Weeks
                </button>
                <button
                  onClick={() => setDuration("1month")}
                  className={`py-2 px-4 rounded-md font-medium transition-colors ${
                    duration === "1month"
                      ? "bg-blue-600 text-white"
                      : "bg-gray-200 text-gray-700 hover:bg-gray-300"
                  }`}
                >
                  1 Month
                </button>
              </div>
              <p className="text-sm text-gray-600 mt-2">
                End date: {endDate || "Select start date"}
              </p>
            </div>

            {/* Temperature Range with Unit Toggle */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="block text-sm font-medium text-gray-700">
                  Temperature Range: {displayTemp(minTemp)}°{tempUnit} - {displayTemp(maxTemp)}°{tempUnit}
                </label>
                <button
                  onClick={() => setTempUnit(tempUnit === "C" ? "F" : "C")}
                  className="px-3 py-1 text-sm rounded-full bg-gray-200 text-gray-700 hover:bg-gray-300 transition-colors"
                >
                  °{tempUnit} ⇄ °{tempUnit === "C" ? "F" : "C"}
                </button>
              </div>
              <div className="relative pt-6 pb-2">
                <input
                  type="range"
                  min="0"
                  max="40"
                  value={minTemp}
                  onChange={(e) => {
                    const newMin = Number(e.target.value);
                    if (newMin <= maxTemp) {
                      setMinTemp(newMin);
                    }
                  }}
                  className="absolute w-full h-2 bg-transparent appearance-none pointer-events-none"
                  style={{
                    zIndex: minTemp > maxTemp - 2 ? 2 : 1,
                  }}
                />
                <input
                  type="range"
                  min="0"
                  max="40"
                  value={maxTemp}
                  onChange={(e) => {
                    const newMax = Number(e.target.value);
                    if (newMax >= minTemp) {
                      setMaxTemp(newMax);
                    }
                  }}
                  className="absolute w-full h-2 bg-gray-300 rounded-lg appearance-none"
                  style={{
                    background: `linear-gradient(to right, #e5e7eb 0%, #e5e7eb ${(minTemp / 40) * 100}%, #3b82f6 ${(minTemp / 40) * 100}%, #3b82f6 ${(maxTemp / 40) * 100}%, #e5e7eb ${(maxTemp / 40) * 100}%, #e5e7eb 100%)`,
                  }}
                />
              </div>
              <div className="flex justify-between text-sm text-gray-600 mt-1">
                <span>0°{tempUnit === "C" ? "C" : "F"}</span>
                <span>40°{tempUnit === "C" ? "C" : "F"}</span>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-4">
              <button
                onClick={handleSearch}
                disabled={!startDate || loading}
                className="flex-1 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white font-semibold py-3 px-6 rounded-md transition-colors"
              >
                {loading ? "Searching..." : "Find Places"}
              </button>
              <button
                onClick={handleSurpriseMe}
                disabled={loading}
                className="flex-1 bg-purple-600 hover:bg-purple-700 disabled:bg-gray-400 text-white font-semibold py-3 px-6 rounded-md transition-colors"
              >
                Surprise Me
              </button>
            </div>
          </div>
        </div>

        {/* Results */}
        {results.length > 0 && (
          <div className="bg-white rounded-lg shadow-lg p-8">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-gray-900">
                Perfect Destinations for You
              </h2>

              {/* View Mode Toggle */}
              <div className="flex gap-2">
                <button
                  onClick={() => {
                    setViewMode("all");
                    setCurrentCardIndex(0);
                  }}
                  className={`px-4 py-2 rounded-full font-medium transition-colors ${
                    viewMode === "all"
                      ? "bg-blue-600 text-white"
                      : "bg-gray-200 text-gray-700 hover:bg-gray-300"
                  }`}
                >
                  All
                </button>
                <button
                  onClick={() => {
                    setViewMode("one");
                    setCurrentCardIndex(0);
                  }}
                  className={`px-4 py-2 rounded-full font-medium transition-colors ${
                    viewMode === "one"
                      ? "bg-blue-600 text-white"
                      : "bg-gray-200 text-gray-700 hover:bg-gray-300"
                  }`}
                >
                  One at a Time
                </button>
              </div>
            </div>

            {/* All Cards View */}
            {viewMode === "all" && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {results.map((destination, index) => (
                  <div
                    key={index}
                    className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow"
                  >
                    <h3 className="text-lg font-semibold text-gray-900">
                      {destination.city_name}
                    </h3>
                    <p className="text-sm text-gray-600 mb-2">
                      {destination.country}
                    </p>
                    <div className="text-sm space-y-1">
                      <p className="text-gray-700">
                        🌡️ {destination.avg_temp?.toFixed(1)}°C
                      </p>
                      <p className="text-gray-700">
                        ☀️ High: {destination.avg_high}°C / Low: {destination.avg_low}°C
                      </p>
                      <p className="text-gray-700">
                        🌧️ Precipitation: {destination.avg_precip?.toFixed(1)}mm
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Single Card View with Navigation */}
            {viewMode === "one" && results.length > 0 && (
              <div className="relative">
                <div className="flex items-center justify-center gap-4">
                  {/* Previous Button */}
                  <button
                    onClick={handlePrevCard}
                    className="p-3 rounded-full bg-blue-600 text-white hover:bg-blue-700 transition-colors"
                    aria-label="Previous destination"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                    </svg>
                  </button>

                  {/* Card */}
                  <div className="flex-1 max-w-md border border-gray-200 rounded-lg p-6 shadow-md">
                    <div className="text-center mb-2">
                      <span className="text-sm text-gray-500">
                        {currentCardIndex + 1} of {results.length}
                      </span>
                    </div>
                    <h3 className="text-2xl font-semibold text-gray-900 mb-2 text-center">
                      {results[currentCardIndex].city_name}
                    </h3>
                    <p className="text-sm text-gray-600 mb-4 text-center">
                      {results[currentCardIndex].country}
                    </p>
                    <div className="space-y-3">
                      <p className="text-base text-gray-700">
                        🌡️ Average: {results[currentCardIndex].avg_temp?.toFixed(1)}°C
                      </p>
                      <p className="text-base text-gray-700">
                        ☀️ High: {results[currentCardIndex].avg_high}°C / Low: {results[currentCardIndex].avg_low}°C
                      </p>
                      <p className="text-base text-gray-700">
                        🌧️ Precipitation: {results[currentCardIndex].avg_precip?.toFixed(1)}mm
                      </p>
                    </div>
                  </div>

                  {/* Next Button */}
                  <button
                    onClick={handleNextCard}
                    className="p-3 rounded-full bg-blue-600 text-white hover:bg-blue-700 transition-colors"
                    aria-label="Next destination"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {results.length === 0 && !loading && (
          <div className="text-center text-gray-600 py-12">
            <p className="text-lg">
              Select your dates and temperature preference to find destinations
            </p>
          </div>
        )}
      </main>
    </div>
  );
}
