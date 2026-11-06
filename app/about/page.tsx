import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "About - 72 Somewhere",
  description: "About 72 Somewhere and the people whose ideas shaped it",
};

// Add new idea contributors here
const CONTRIBUTORS = [
  { name: "Rupal A", idea: "Suggested the core idea for the app" },
  { name: "Kshitij", idea: "Suggested incorporating the US Dept of State Travel Advisory into the database" },
];

const DATA_SOURCES = [
  { name: "Open-Meteo", url: "https://open-meteo.com/", use: "Historical weather data (CC BY 4.0)" },
  { name: "SimpleMaps World Cities", url: "https://simplemaps.com/data/world-cities", use: "City locations (CC BY 4.0)" },
  {
    name: "U.S. Department of State",
    url: "https://travel.state.gov/en/international-travel/travel-advisories.html",
    use: "Country-level travel advisories",
  },
];

export default function AboutPage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white">
      <main className="container mx-auto px-4 py-6 max-w-2xl">
        <Link href="/" className="text-sm text-blue-600 hover:underline">
          ← Back to search
        </Link>

        <header className="text-center my-5">
          <h1 className="text-4xl font-bold text-gray-900 mb-1">About 72 Somewhere</h1>
          <p className="text-base text-gray-600">Pick the weather first, then find where it is.</p>
        </header>

        <section className="bg-white rounded-lg shadow-lg p-5 mb-5">
          <h2 className="text-base font-bold text-gray-900 mb-2">What it does</h2>
          <p className="text-sm text-gray-700">
            Choose your travel dates and a temperature range, and 72 Somewhere suggests cities whose
            historical weather matches. Results are based on long-term monthly averages, not live forecasts.
          </p>
        </section>

        <section className="bg-white rounded-lg shadow-lg p-5 mb-5">
          <h2 className="text-base font-bold text-gray-900 mb-1">Thank you 🙏</h2>
          <p className="text-sm text-gray-500 mb-3">The people whose ideas shaped this app.</p>
          <ul className="space-y-3">
            {CONTRIBUTORS.map(({ name, idea }) => (
              <li key={name} className="flex gap-3">
                <span className="flex-shrink-0 h-8 w-8 rounded-full bg-blue-100 text-blue-700 font-semibold text-sm flex items-center justify-center">
                  {name[0]}
                </span>
                <div>
                  <p className="text-sm font-semibold text-gray-900">{name}</p>
                  <p className="text-sm text-gray-600">{idea}</p>
                </div>
              </li>
            ))}
          </ul>
        </section>

        <section className="bg-white rounded-lg shadow-lg p-5">
          <h2 className="text-base font-bold text-gray-900 mb-2">Data sources</h2>
          <ul className="space-y-1 text-sm">
            {DATA_SOURCES.map(({ name, url, use }) => (
              <li key={name} className="text-gray-700">
                <a href={url} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">
                  {name}
                </a>{" "}
                <span className="text-gray-500">· {use}</span>
              </li>
            ))}
          </ul>
        </section>
      </main>
    </div>
  );
}
