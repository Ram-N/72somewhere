"use client";

import { useState } from "react";
import {
  ComposedChart,
  Area,
  Line,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ReferenceArea,
  ResponsiveContainer,
  LineChart,
} from "recharts";

interface MonthRecord {
  month: number;
  avg_high_temp_c: number;
  avg_low_temp_c: number;
  avg_precip_mm: number;
}

interface Destination {
  city_id: string;
  city_name: string;
  country: string;
  avg_high: number;
  avg_low: number;
  avg_temp: number;
  avg_precip: number;
  score: number;
}

interface CityCardProps {
  destination: Destination;
  tempUnit: "C" | "F";
  userMinTemp: number;
  userMaxTemp: number;
  searchMonths: number[];
  size?: "compact" | "large";
}

const MONTH_LABELS = ["J", "F", "M", "A", "M", "J", "J", "A", "S", "O", "N", "D"];
const MONTH_NAMES = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

function toF(c: number): number {
  return Math.round((c * 9) / 5 + 32);
}

function convertTemp(c: number, unit: "C" | "F"): number {
  return unit === "F" ? toF(c) : Math.round(c * 10) / 10;
}

function getBestMonths(yearData: MonthRecord[], minC: number, maxC: number): string {
  const matching = yearData
    .filter((m) => {
      const avg = (m.avg_high_temp_c + m.avg_low_temp_c) / 2;
      return avg >= minC && avg <= maxC;
    })
    .map((m) => m.month);

  if (matching.length === 0) return "None";
  if (matching.length === 12) return "Year-round";

  // Find consecutive ranges
  const ranges: string[] = [];
  let start = matching[0];
  let end = matching[0];

  for (let i = 1; i < matching.length; i++) {
    if (matching[i] === end + 1) {
      end = matching[i];
    } else {
      ranges.push(
        start === end
          ? MONTH_NAMES[start - 1]
          : `${MONTH_NAMES[start - 1]}–${MONTH_NAMES[end - 1]}`
      );
      start = matching[i];
      end = matching[i];
    }
  }
  ranges.push(
    start === end
      ? MONTH_NAMES[start - 1]
      : `${MONTH_NAMES[start - 1]}–${MONTH_NAMES[end - 1]}`
  );

  return ranges.join(", ");
}

function getMatchBadge(yearData: MonthRecord[] | null, minC: number, maxC: number) {
  if (!yearData) return { count: 0, color: "bg-gray-100 text-gray-500" };

  const count = yearData.filter((m) => {
    const avg = (m.avg_high_temp_c + m.avg_low_temp_c) / 2;
    return avg >= minC && avg <= maxC;
  }).length;

  const color =
    count >= 9
      ? "bg-green-100 text-green-700"
      : count >= 6
      ? "bg-yellow-100 text-yellow-700"
      : "bg-orange-100 text-orange-700";

  return { count, color };
}

export default function CityCard({
  destination,
  tempUnit,
  userMinTemp,
  userMaxTemp,
  searchMonths,
  size = "compact",
}: CityCardProps) {
  const [isFlipped, setIsFlipped] = useState(false);
  const [yearData, setYearData] = useState<MonthRecord[] | null>(null);
  const [showPrecip, setShowPrecip] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [hasFlipped, setHasFlipped] = useState(false);

  // Convert user temps to Celsius for internal comparisons
  const userMinC = tempUnit === "F" ? (userMinTemp - 32) * (5 / 9) : userMinTemp;
  const userMaxC = tempUnit === "F" ? (userMaxTemp - 32) * (5 / 9) : userMaxTemp;

  const handleFlip = async () => {
    const newFlipped = !isFlipped;
    setIsFlipped(newFlipped);
    if (!hasFlipped) setHasFlipped(true);

    if (newFlipped && !yearData) {
      setIsLoading(true);
      try {
        const res = await fetch(`/api/city/${destination.city_id}`);
        const json = await res.json();
        setYearData(json.months || []);
      } catch {
        setYearData([]);
      } finally {
        setIsLoading(false);
      }
    }
  };

  const badge = getMatchBadge(yearData, userMinC, userMaxC);

  // Build chart data (all 12 months)
  const chartData =
    yearData?.map((m) => {
      const highTemp = convertTemp(m.avg_high_temp_c, tempUnit);
      const lowTemp = convertTemp(m.avg_low_temp_c, tempUnit);
      return {
        label: MONTH_LABELS[m.month - 1],
        high: highTemp,
        low: lowTemp,
        avg: convertTemp((m.avg_high_temp_c + m.avg_low_temp_c) / 2, tempUnit),
        precip: m.avg_precip_mm,
        bandLow: lowTemp,
        bandRange: highTemp - lowTemp,
        inSearch: searchMonths.includes(m.month),
      };
    }) ?? [];

  const userMinDisplay = userMinTemp;
  const userMaxDisplay = userMaxTemp;

  const bestMonths = yearData ? getBestMonths(yearData, userMinC, userMaxC) : "";

  const containerHeight = size === "large" ? 340 : 148;
  const chartHeight = size === "large" ? 200 : 65;

  return (
    <div
      className={`flip-card cursor-pointer w-full ${isFlipped ? "flipped" : ""}`}
      style={{ height: containerHeight }}
      onClick={handleFlip}
    >
      <div className="flip-card-inner">
        {/* FRONT FACE */}
        <div className={`flip-card-front border border-gray-200 rounded-lg ${size === "compact" ? "p-3" : "p-4"} bg-white hover:shadow-md transition-shadow flex flex-col`}>
          {/* Header row */}
          <div className="flex justify-between items-start mb-1">
            <div>
              <h3 className={`font-semibold text-gray-900 ${size === "large" ? "text-2xl" : "text-base"}`}>
                {destination.city_name}
              </h3>
              <p className="text-sm text-gray-600">{destination.country}</p>
            </div>
            {/* Match badge */}
            {yearData && (
              <span className={`text-xs px-2 py-1 rounded-full font-medium ${badge.color}`}>
                {badge.count}/12 months
              </span>
            )}
          </div>

          {/* Temp stats */}
          <div className={`${size === "compact" ? "text-xs space-y-0.5 mt-1" : "text-sm space-y-1 mt-2"} flex-1`}>
            <p className="text-gray-700">
              🌡️{" "}
              {tempUnit === "F"
                ? `${toF(destination.avg_temp)}°F`
                : `${destination.avg_temp}°C`}
            </p>
            <p className="text-gray-700">
              ☀️ High:{" "}
              {tempUnit === "F" ? toF(destination.avg_high) : destination.avg_high}°{tempUnit} / Low:{" "}
              {tempUnit === "F" ? toF(destination.avg_low) : destination.avg_low}°{tempUnit}
            </p>
            <p className="text-gray-700">
              🌧️ Precip: {destination.avg_precip?.toFixed(1)} mm
            </p>
          </div>

          {/* Sparkline */}
          {yearData && yearData.length > 0 && (
            <div className="mt-3 opacity-60">
              <LineChart width={200} height={40} data={chartData}>
                <Line
                  type="monotone"
                  dataKey="avg"
                  stroke="#6b7280"
                  strokeWidth={1.5}
                  dot={false}
                />
              </LineChart>
            </div>
          )}

          {/* Flip hint */}
          {!hasFlipped && (
            <p className="text-xs text-blue-500 mt-1 text-center">↻ See year graph</p>
          )}
        </div>

        {/* BACK FACE */}
        <div
          className={`flip-card-back border border-gray-200 rounded-lg ${size === "compact" ? "p-3" : "p-4"} bg-white flex flex-col`}
          onClick={(e) => e.stopPropagation()}
        >
          {/* Back header */}
          <div className="flex justify-between items-center mb-2">
            <div>
              <h3 className="font-semibold text-gray-900">{destination.city_name}</h3>
              {bestMonths && (
                <p className="text-xs text-gray-500">Best: {bestMonths}</p>
              )}
            </div>
            <div className="flex gap-2 items-center">
              <button
                className="text-xs px-2 py-1 rounded bg-blue-50 text-blue-600 hover:bg-blue-100"
                onClick={(e) => {
                  e.stopPropagation();
                  setShowPrecip((p) => !p);
                }}
              >
                {showPrecip ? "☔ Rain ✓" : "☔ Rain"}
              </button>
              <button
                className="text-xs px-2 py-1 rounded bg-gray-100 text-gray-600 hover:bg-gray-200"
                onClick={(e) => {
                  e.stopPropagation();
                  setIsFlipped(false);
                }}
              >
                ↩ back
              </button>
            </div>
          </div>

          {/* Graph */}
          {isLoading ? (
            <div className="flex-1 flex items-center justify-center text-gray-400 text-sm">
              Loading…
            </div>
          ) : yearData && yearData.length > 0 ? (
            <ResponsiveContainer width="100%" height={chartHeight}>
              <ComposedChart
                data={chartData}
                margin={{ top: 8, right: showPrecip ? 50 : 16, left: 4, bottom: 4 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" vertical={false} />
                <XAxis
                  dataKey="label"
                  tick={{ fontSize: 10, fill: "#6b7280" }}
                  axisLine={{ stroke: "#e5e7eb" }}
                  tickLine={false}
                />
                <YAxis
                  yAxisId="temp"
                  width={34}
                  tick={{ fontSize: 10, fill: "#6b7280" }}
                  axisLine={false}
                  tickLine={false}
                  domain={["auto", "auto"]}
                  tickFormatter={(v) => `${v}°`}
                />
                {showPrecip && (
                  <YAxis
                    yAxisId="precip"
                    orientation="right"
                    width={40}
                    tick={{ fontSize: 10, fill: "#6b7280" }}
                    axisLine={false}
                    tickLine={false}
                    tickFormatter={(v) => `${v}mm`}
                  />
                )}
                <Tooltip
                  contentStyle={{ fontSize: 11, padding: "4px 8px", borderRadius: 6 }}
                  formatter={(value, name) => {
                    if (name === "bandLow" || name === "bandRange") return null;
                    if (name === "precip") return [`${value} mm`, "Precip"];
                    return [
                      `${value}°${tempUnit}`,
                      name === "high" ? "High" : name === "low" ? "Low" : "Avg",
                    ];
                  }}
                />

                {/* User preference band */}
                <ReferenceArea
                  yAxisId="temp"
                  y1={userMinDisplay}
                  y2={userMaxDisplay}
                  fill="#86efac"
                  fillOpacity={0.3}
                  strokeOpacity={0}
                />

                {/* High-low band using stackId (avoids white-fill covering axes) */}
                <Area
                  yAxisId="temp"
                  type="monotone"
                  dataKey="bandLow"
                  stackId="band"
                  stroke="none"
                  fill="transparent"
                  legendType="none"
                />
                <Area
                  yAxisId="temp"
                  type="monotone"
                  dataKey="bandRange"
                  stackId="band"
                  stroke="none"
                  fill="#fbbf24"
                  fillOpacity={0.22}
                  legendType="none"
                />

                {/* Temp lines */}
                <Line
                  yAxisId="temp"
                  type="monotone"
                  dataKey="high"
                  stroke="#f97316"
                  strokeWidth={2}
                  dot={false}
                  name="high"
                />
                <Line
                  yAxisId="temp"
                  type="monotone"
                  dataKey="low"
                  stroke="#3b82f6"
                  strokeWidth={2}
                  dot={false}
                  name="low"
                />

                {/* Precipitation bars */}
                {showPrecip && (
                  <Bar
                    yAxisId="precip"
                    dataKey="precip"
                    fill="#93c5fd"
                    fillOpacity={0.65}
                    name="precip"
                  />
                )}
              </ComposedChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex-1 flex items-center justify-center text-gray-400 text-sm">
              No data available
            </div>
          )}

          {/* Legend */}
          <div className="flex gap-3 mt-2 text-xs text-gray-500">
            <span className="flex items-center gap-1">
              <span className="w-3 h-0.5 bg-orange-400 inline-block" /> High
            </span>
            <span className="flex items-center gap-1">
              <span className="w-3 h-0.5 bg-blue-500 inline-block" /> Low
            </span>
            <span className="flex items-center gap-1">
              <span className="w-3 h-2 bg-green-200 inline-block rounded-sm" /> Your range
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
