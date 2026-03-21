"use client";

import { useState, useEffect } from "react";
import {
  ComposedChart,
  Area,
  Line,
  Bar,
  Cell,
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
  score_temp: number;
  score_rain: number;
}

interface CityCardProps {
  destination: Destination;
  tempUnit: "C" | "F";
  userMinTemp: number;
  userMaxTemp: number;
  searchMonths: number[];
  size?: "compact" | "large";
  matchesTemp?: boolean;
}

const DAYS_IN_MONTH = [31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];
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
        return m.avg_high_temp_c >= minC && m.avg_low_temp_c <= maxC;
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
    return m.avg_high_temp_c >= minC && m.avg_low_temp_c <= maxC;
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
  matchesTemp,
}: CityCardProps) {
  const [isFlipped, setIsFlipped] = useState(false);
  const [yearData, setYearData] = useState<MonthRecord[] | null>(null);
  const [showPrecip, setShowPrecip] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [hasFlipped, setHasFlipped] = useState(false);
  const [hoveredMatch, setHoveredMatch] = useState<{ index: number; x: number } | null>(null);

  // Convert user temps to Celsius for internal comparisons
  const userMinC = tempUnit === "F" ? (userMinTemp - 32) * (5 / 9) : userMinTemp;
  const userMaxC = tempUnit === "F" ? (userMaxTemp - 32) * (5 / 9) : userMaxTemp;

  // Load year data on mount so graph is ready immediately
  useEffect(() => {
    const load = async () => {
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
    };
    load();
  }, [destination.city_id]);

  const handleFlip = () => {
    setIsFlipped((prev) => !prev);
    if (!hasFlipped) setHasFlipped(true);
  };

  const badge = getMatchBadge(yearData, userMinC, userMaxC);

  // Build chart data (all 12 months)
  const chartData =
    yearData?.map((m) => {
      const highTemp = convertTemp(m.avg_high_temp_c, tempUnit);
      const lowTemp = convertTemp(m.avg_low_temp_c, tempUnit);
      const avgTemp = (highTemp + lowTemp) / 2;
      return {
        label: MONTH_LABELS[m.month - 1],
        month: m.month,
        high: highTemp,
        low: lowTemp,
        avg: avgTemp,
        precip: Math.round(m.avg_precip_mm * DAYS_IN_MONTH[m.month - 1]),
        bandLow: lowTemp,
        bandRange: highTemp - lowTemp,
        inSearch: searchMonths.includes(m.month),
        isMatch: highTemp >= userMinTemp && lowTemp <= userMaxTemp,
      };
    }) ?? [];

  const userMinDisplay = userMinTemp;
  const userMaxDisplay = userMaxTemp;

  const bestMonths = yearData ? getBestMonths(yearData, userMinC, userMaxC) : "";

  const containerHeight = size === "large" ? 340 : 185;
  const chartHeight = size === "large" ? 200 : 95;

  return (
    <div
      className={`flip-card cursor-pointer w-full ${isFlipped ? "flipped" : ""}`}
      style={{ height: containerHeight }}
      onClick={handleFlip}
    >
      <div className="flip-card-inner">
        {/* FRONT FACE — graph (default view) */}
        <div className={`flip-card-front border border-gray-200 rounded-lg ${size === "compact" ? "p-3" : "p-4"} bg-white hover:shadow-md transition-shadow flex flex-col ${matchesTemp === false ? "opacity-80" : ""}`}>
          {/* Header row */}
          <div className="flex justify-between items-start mb-1">
            <div>
              <h3 className={`font-semibold text-gray-900 ${size === "large" ? "text-2xl" : "text-base"}`}>
                {destination.city_name}
              </h3>
              <p className="text-xs text-gray-500">{destination.country}</p>
            </div>
            <div className="flex flex-col items-end gap-1">
              <span className={`text-xs px-2 py-1 rounded-full font-semibold ${
                destination.score >= 80 ? "bg-green-100 text-green-700"
                : destination.score >= 55 ? "bg-yellow-100 text-yellow-700"
                : "bg-orange-100 text-orange-700"
              }`}>
                {destination.score}% match
              </span>
              {matchesTemp === false && (
                <span className="text-xs px-2 py-1 rounded-full font-medium bg-orange-100 text-orange-700">
                  Outside range
                </span>
              )}
              <button
                className="text-xs px-2 py-1 rounded bg-blue-50 text-blue-600 hover:bg-blue-100"
                onClick={(e) => { e.stopPropagation(); setShowPrecip((p) => !p); }}
              >
                {showPrecip ? "☔ Rain ✓" : "☔ Rain"}
              </button>
            </div>
          </div>

          {/* Graph */}
          {isLoading ? (
            <div className="flex-1 flex items-center justify-center text-gray-400 text-sm">Loading…</div>
          ) : yearData && yearData.length > 0 ? (
            <div className="relative flex-1">
              {hoveredMatch !== null && (() => {
                const d = chartData[hoveredMatch.index];
                if (!d) return null;
                const monthName = MONTH_NAMES[hoveredMatch.index];
                return (
                  <div
                    className="absolute z-20 bg-gray-900 text-white text-xs rounded-md px-2 py-1.5 pointer-events-none shadow-lg whitespace-nowrap"
                    style={{ left: hoveredMatch.x, bottom: 20, transform: "translateX(-50%)" }}
                  >
                    <div className="font-semibold text-green-400 mb-0.5">✓ {monthName} matches your range</div>
                    <div>High: {d.high}° / Low: {d.low}°{tempUnit}</div>
                    <div>Rain: {d.precip} mm/month</div>
                    <div className="absolute left-1/2 -bottom-1.5 -translate-x-1/2 w-0 h-0 border-l-4 border-r-4 border-t-4 border-l-transparent border-r-transparent border-t-gray-900" />
                  </div>
                );
              })()}
              <ResponsiveContainer width="100%" height={chartHeight}>
                <ComposedChart data={chartData} margin={{ top: 8, right: showPrecip ? 8 : 8, left: 4, bottom: 4 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" vertical={false} />
                  <XAxis
                    dataKey="month"
                    axisLine={{ stroke: "#e5e7eb" }}
                    tickLine={false}
                    interval={0}
                    height={22}
                    tick={(tickProps: any) => {
                      const { x, y, payload, index } = tickProps;
                      const match = chartData[index]?.isMatch;
                      return (
                        <g key={index} transform={`translate(${x},${y})`}>
                          {match && <rect x={-7} y={0} width={14} height={14} rx={3} fill="#16a34a" fillOpacity={0.15} />}
                          <text x={0} y={11} textAnchor="middle" fontSize={match ? 10 : 9} fontWeight={match ? "700" : "400"} fill={match ? "#16a34a" : "#9ca3af"}>
                            {MONTH_LABELS[payload.value - 1]}
                          </text>
                          {match && (
                            <rect x={-10} y={-2} width={20} height={18} fill="transparent" style={{ cursor: "default" }}
                              onMouseEnter={() => setHoveredMatch({ index, x })}
                              onMouseLeave={() => setHoveredMatch(null)}
                            />
                          )}
                        </g>
                      );
                    }}
                  />
                  <YAxis yAxisId="temp" width={34} tick={{ fontSize: 10, fill: "#6b7280" }} axisLine={false} tickLine={false} domain={["auto", "auto"]} tickFormatter={(v) => `${v}°`} />
                  {showPrecip && (
                    <YAxis yAxisId="precip" orientation="right" width={28} tick={{ fontSize: 9, fill: "#6b7280" }} axisLine={false} tickLine={false} domain={[0, 300]} tickCount={4} tickFormatter={(v) => `${v}`} />
                  )}
                  <Tooltip
                    contentStyle={{ fontSize: 11, padding: "4px 8px", borderRadius: 6 }}
                    formatter={(value, name) => {
                      if (name === "bandLow" || name === "bandRange") return null;
                      if (name === "precip") return [`${value} mm/month`, "Precip"];
                      return [`${value}°${tempUnit}`, name === "high" ? "High" : name === "low" ? "Low" : "Avg"];
                    }}
                  />
                  <ReferenceArea yAxisId="temp" y1={userMinDisplay} y2={userMaxDisplay} fill="#4ade80" fillOpacity={0.25} stroke="#16a34a" strokeOpacity={0.5} strokeDasharray="4 3" />
                  <Area yAxisId="temp" type="monotone" dataKey="bandLow" stackId="band" stroke="none" fill="transparent" legendType="none" />
                  <Area yAxisId="temp" type="monotone" dataKey="bandRange" stackId="band" stroke="none" fill="#fbbf24" fillOpacity={0.22} legendType="none" />
                  <Line yAxisId="temp" type="monotone" dataKey="high" stroke="#f97316" strokeWidth={2}
                    dot={(dotProps: any) => {
                      const { cx, cy, index } = dotProps;
                      if (!chartData[index]?.isMatch) return <g key={index} />;
                      return <circle key={index} cx={cx} cy={cy} r={4} fill="#f97316" stroke="white" strokeWidth={1.5} />;
                    }} name="high" />
                  <Line yAxisId="temp" type="monotone" dataKey="low" stroke="#3b82f6" strokeWidth={2}
                    dot={(dotProps: any) => {
                      const { cx, cy, index } = dotProps;
                      if (!chartData[index]?.isMatch) return <g key={index} />;
                      return <circle key={index} cx={cx} cy={cy} r={4} fill="#3b82f6" stroke="white" strokeWidth={1.5} />;
                    }} name="low" />
                  {showPrecip && (
                    <Bar yAxisId="precip" dataKey="precip" name="precip">
                      {chartData.map((entry, index) => (
                        <Cell
                          key={index}
                          fill={
                            entry.precip <= 30 ? "#bfdbfe"
                            : entry.precip <= 60 ? "#99f6e4"
                            : entry.precip <= 120 ? "#f59e0b"
                            : "#e11d48"
                          }
                          fillOpacity={0.65}
                        />
                      ))}
                    </Bar>
                  )}
                </ComposedChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <div className="flex-1 flex items-center justify-center text-gray-400 text-sm">No data available</div>
          )}

          {/* Legend */}
          <div className="flex gap-3 mt-1 text-xs text-gray-500">
            <span className="flex items-center gap-1"><span className="w-3 h-0.5 bg-orange-400 inline-block" /> High</span>
            <span className="flex items-center gap-1"><span className="w-3 h-0.5 bg-blue-500 inline-block" /> Low</span>
            <span className="flex items-center gap-1"><span className="w-3 h-2 bg-green-300 border border-green-600 border-dashed inline-block rounded-sm" /> Your range</span>
            {!hasFlipped && <span className="ml-auto text-blue-400">↻ details</span>}
          </div>
        </div>

        {/* BACK FACE — stats */}
        <div
          className={`flip-card-back border border-gray-200 rounded-lg ${size === "compact" ? "p-3" : "p-4"} bg-white flex flex-col`}
        >
          {/* Stats header */}
          <div className="flex justify-between items-start mb-2">
            <div>
              <h3 className={`font-semibold text-gray-900 ${size === "large" ? "text-2xl" : "text-base"}`}>
                {destination.city_name}
              </h3>
              <p className="text-sm text-gray-600">{destination.country}</p>
              {bestMonths && <p className="text-xs text-gray-400">Best: {bestMonths}</p>}
            </div>
            <div className="flex flex-col items-end gap-1">
              {yearData && (
                <span className={`text-xs px-2 py-1 rounded-full font-medium ${badge.color}`}>
                  {badge.count}/12 months
                </span>
              )}
              <button
                className="text-xs px-2 py-1 rounded bg-gray-100 text-gray-600 hover:bg-gray-200"
                onClick={(e) => { e.stopPropagation(); setIsFlipped(false); }}
              >
                ↩ graph
              </button>
            </div>
          </div>

          {/* Temp stats */}
          <div className={`${size === "compact" ? "text-xs space-y-0.5" : "text-sm space-y-1"} flex-1`}>
            <p className="text-gray-700">
              🌡️{" "}{tempUnit === "F" ? `${toF(destination.avg_temp)}°F` : `${destination.avg_temp}°C`}
            </p>
            <p className="text-gray-700">
              ☀️ High:{" "}{tempUnit === "F" ? toF(destination.avg_high) : destination.avg_high}°{tempUnit}
              {" "}/ Low:{" "}{tempUnit === "F" ? toF(destination.avg_low) : destination.avg_low}°{tempUnit}
            </p>
            <p className="text-gray-700">🌧️ Precip: {destination.avg_precip?.toFixed(1)} mm/month</p>
            <div className="mt-1.5 pt-1.5 border-t border-gray-100">
              <p className="text-gray-500">Match score: 🌡️ {destination.score_temp}/70 · 🌧️ {destination.score_rain}/30 = <span className="font-semibold text-gray-700">{destination.score}%</span></p>
            </div>
          </div>

          {/* Sparkline */}
          {yearData && yearData.length > 0 && (
            <div className="mt-2 opacity-60">
              <LineChart width={200} height={40} data={chartData}>
                <Line type="monotone" dataKey="avg" stroke="#6b7280" strokeWidth={1.5} dot={false} />
              </LineChart>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
