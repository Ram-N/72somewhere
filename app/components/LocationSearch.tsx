"use client";

import { useState, useRef, useEffect, useMemo } from "react";
import type { LocationFilter } from "@/lib/types";
import locationData from "@/data/location_index.json";

interface LocationEntry {
  cityId: string;
  city: string;
  country: string;
  region: string;
  subRegion: string;
}

const entries = locationData as LocationEntry[];

interface Suggestion {
  type: LocationFilter["type"];
  label: string;
  filterField: string;
  filterValue: string;
  secondary?: string;
}

function buildSuggestions(input: string): Suggestion[] {
  if (!input.trim()) return [];
  const q = input.toLowerCase();

  const suggestions: Suggestion[] = [];

  // Regions (deduplicated)
  const seenRegions = new Set<string>();
  for (const e of entries) {
    if (e.region && !seenRegions.has(e.region) && e.region.toLowerCase().includes(q)) {
      seenRegions.add(e.region);
      suggestions.push({ type: "region", label: e.region, filterField: "region", filterValue: e.region });
    }
  }

  // Sub-regions
  const seenSubRegions = new Set<string>();
  for (const e of entries) {
    if (e.subRegion && !seenSubRegions.has(e.subRegion) && e.subRegion.toLowerCase().includes(q)) {
      seenSubRegions.add(e.subRegion);
      suggestions.push({ type: "subRegion", label: e.subRegion, filterField: "sub_region", filterValue: e.subRegion, secondary: e.region });
    }
  }

  // Countries
  const seenCountries = new Set<string>();
  for (const e of entries) {
    if (e.country && !seenCountries.has(e.country) && e.country.toLowerCase().includes(q)) {
      seenCountries.add(e.country);
      suggestions.push({ type: "country", label: e.country, filterField: "country", filterValue: e.country, secondary: e.region });
    }
  }

  // Cities (capped at 5 so dropdown doesn't overwhelm)
  let cityCount = 0;
  for (const e of entries) {
    if (cityCount >= 5) break;
    if (e.city && e.city.toLowerCase().includes(q)) {
      suggestions.push({ type: "city", label: `${e.city}, ${e.country}`, filterField: "city_id", filterValue: e.cityId, secondary: e.subRegion || e.region });
      cityCount++;
    }
  }

  return suggestions.slice(0, 8);
}

const TYPE_LABELS: Record<LocationFilter["type"], string> = {
  region: "Region",
  subRegion: "Sub-region",
  country: "Country",
  city: "City",
};

const TYPE_COLORS: Record<LocationFilter["type"], string> = {
  region: "bg-blue-100 text-blue-700",
  subRegion: "bg-indigo-100 text-indigo-700",
  country: "bg-green-100 text-green-700",
  city: "bg-orange-100 text-orange-700",
};

interface LocationSearchProps {
  value: LocationFilter | null;
  onChange: (loc: LocationFilter | null) => void;
}

export default function LocationSearch({ value, onChange }: LocationSearchProps) {
  const [inputValue, setInputValue] = useState("");
  const [showDropdown, setShowDropdown] = useState(false);
  const [highlightedIndex, setHighlightedIndex] = useState(-1);
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const suggestions = useMemo(() => buildSuggestions(inputValue), [inputValue]);

  // Close dropdown on outside click
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setShowDropdown(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleSelect = (suggestion: Suggestion) => {
    const filter: LocationFilter = {
      type: suggestion.type,
      label: suggestion.label,
      filterField: suggestion.filterField,
      filterValue: suggestion.filterValue,
    };
    onChange(filter);
    setInputValue(suggestion.label);
    setShowDropdown(false);
    setHighlightedIndex(-1);
  };

  const handleClear = () => {
    onChange(null);
    setInputValue("");
    setShowDropdown(false);
    setHighlightedIndex(-1);
    inputRef.current?.focus();
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!showDropdown || suggestions.length === 0) return;
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setHighlightedIndex((i) => (i < suggestions.length - 1 ? i + 1 : 0));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setHighlightedIndex((i) => (i > 0 ? i - 1 : suggestions.length - 1));
    } else if (e.key === "Enter" && highlightedIndex >= 0) {
      e.preventDefault();
      handleSelect(suggestions[highlightedIndex]);
    } else if (e.key === "Escape") {
      setShowDropdown(false);
      setHighlightedIndex(-1);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setInputValue(val);
    if (value) onChange(null); // clear selection when user types
    setShowDropdown(true);
    setHighlightedIndex(-1);
  };

  const isSelected = value !== null;

  return (
    <div ref={containerRef} className="relative flex-1">
      <div className={`flex items-center border rounded-md overflow-hidden transition-colors ${isSelected ? "border-blue-400 bg-blue-50" : "border-gray-300 bg-white"} focus-within:ring-1 focus-within:ring-blue-500`}>
        <span className="pl-2 text-gray-400 text-sm">📍</span>
        <input
          ref={inputRef}
          type="text"
          value={inputValue}
          onChange={handleInputChange}
          onFocus={() => { if (inputValue) setShowDropdown(true); }}
          onKeyDown={handleKeyDown}
          placeholder="Filter by region, country, or city…"
          className="flex-1 px-2 py-2 text-sm bg-transparent outline-none text-gray-900 placeholder-gray-400 min-w-0"
        />
        {(inputValue || value) && (
          <button
            type="button"
            onClick={handleClear}
            className="px-2 text-gray-400 hover:text-gray-600 text-lg leading-none"
            aria-label="Clear location"
          >
            ×
          </button>
        )}
      </div>

      {showDropdown && suggestions.length > 0 && (
        <ul className="absolute z-50 left-0 right-0 mt-1 bg-white border border-gray-200 rounded-md shadow-lg max-h-64 overflow-y-auto">
          {suggestions.map((s, i) => (
            <li
              key={`${s.type}-${s.filterValue}`}
              className={`flex items-center gap-2 px-3 py-2 cursor-pointer text-sm transition-colors ${i === highlightedIndex ? "bg-blue-50" : "hover:bg-gray-50"}`}
              onMouseDown={(e) => { e.preventDefault(); handleSelect(s); }}
              onMouseEnter={() => setHighlightedIndex(i)}
            >
              <span className={`text-xs px-1.5 py-0.5 rounded-full font-medium flex-shrink-0 ${TYPE_COLORS[s.type]}`}>
                {TYPE_LABELS[s.type]}
              </span>
              <span className="font-medium text-gray-900 truncate">{s.label}</span>
              {s.secondary && (
                <span className="text-gray-400 text-xs truncate ml-auto flex-shrink-0">{s.secondary}</span>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
