"use client";

import { useState } from "react";

type Place = { name: string; lat: number; lng: number };

type NominatimResult = { display_name: string; lat: string; lon: string };

// OpenStreetMap's free geocoder. Its usage policy allows ~1 request per second and
// no search-as-you-type, so we only search when the user submits.
const ENDPOINT = "https://nominatim.openstreetmap.org/search";
const CALIFORNIA_BOX = "-124.6,42.1,-114.0,32.3"; // left, top, right, bottom

export default function PlaceSearch({ onPick }: { onPick: (place: Place) => void }) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<Place[] | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function search(e: React.FormEvent) {
    e.preventDefault();
    const q = query.trim();
    if (q.length < 2 || loading) return;

    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams({
        q,
        format: "json",
        limit: "5",
        countrycodes: "us",
        viewbox: CALIFORNIA_BOX,
        bounded: "1",
      });
      const res = await fetch(`${ENDPOINT}?${params}`, { headers: { "Accept-Language": "en" } });
      if (!res.ok) throw new Error();
      const data: NominatimResult[] = await res.json();
      setResults(
        data.map((r) => ({
          name: r.display_name.split(", ").slice(0, 3).join(", "),
          lat: +Number(r.lat).toFixed(2),
          lng: +Number(r.lon).toFixed(2),
        })),
      );
    } catch {
      setError("Search is unavailable right now. You can still click the map.");
      setResults(null);
    } finally {
      setLoading(false);
    }
  }

  function pick(place: Place) {
    onPick(place);
    setQuery(place.name.split(",")[0]);
    setResults(null);
  }

  return (
    <div className="relative">
      <form onSubmit={search} className="flex border border-line bg-white focus-within:border-gold">
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search a California city or neighbourhood"
          aria-label="Search for a place in California"
          className="min-w-0 flex-1 bg-transparent px-4 py-3 text-sm outline-none placeholder:text-taupe/70"
        />
        <button
          type="submit"
          disabled={loading || query.trim().length < 2}
          className="px-4 text-[11px] uppercase tracking-[0.2em] text-gold transition-colors hover:text-gold-deep disabled:text-taupe/50"
        >
          {loading ? "…" : "Search"}
        </button>
      </form>

      {error && <p className="mt-2 text-xs text-rose-700">{error}</p>}

      {results && (
        <ul className="absolute inset-x-0 top-full z-10 border border-t-0 border-line bg-white shadow-lg">
          {results.length === 0 && <li className="px-4 py-3 text-sm text-taupe">No places found in California.</li>}
          {results.map((r) => (
            <li key={`${r.lat},${r.lng},${r.name}`}>
              <button
                onClick={() => pick(r)}
                className="flex w-full items-baseline justify-between gap-4 px-4 py-3 text-left text-sm transition-colors hover:bg-ivory"
              >
                <span className="truncate">{r.name}</span>
                <span className="shrink-0 text-xs text-taupe">
                  {r.lat}, {r.lng}
                </span>
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
