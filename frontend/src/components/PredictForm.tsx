"use client";

import dynamic from "next/dynamic";
import { useState } from "react";
import { predict, type HouseInput, type Prediction } from "@/lib/api";
import { PHOTOS, tierFor } from "@/lib/photos";
import type { Focus } from "./LocationPicker";
import Photo from "./Photo";
import PlaceSearch from "./PlaceSearch";

const LocationPicker = dynamic(() => import("./LocationPicker"), {
  ssr: false,
  loading: () => <div className="h-80 animate-pulse bg-bone" />,
});

type Field = { key: keyof HouseInput; label: string; hint: string; min: number; max: number; step: number };

const FIELDS: Field[] = [
  { key: "MedInc", label: "Median income", hint: "× $10,000", min: 0.5, max: 15, step: 0.1 },
  { key: "HouseAge", label: "House age", hint: "years", min: 1, max: 52, step: 1 },
  { key: "AveRooms", label: "Rooms", hint: "avg per home", min: 1, max: 15, step: 0.1 },
  { key: "AveBedrms", label: "Bedrooms", hint: "avg per home", min: 0.5, max: 5, step: 0.1 },
  { key: "Population", label: "Population", hint: "in block", min: 10, max: 10000, step: 10 },
  { key: "AveOccup", label: "Occupancy", hint: "people per home", min: 1, max: 10, step: 0.1 },
];

const PRESETS: { name: string; values: HouseInput }[] = [
  { name: "Berkeley Hills", values: { MedInc: 8.3, HouseAge: 41, AveRooms: 7, AveBedrms: 1, Population: 322, AveOccup: 2.6, Latitude: 37.88, Longitude: -122.23 } },
  { name: "Downtown LA", values: { MedInc: 2.5, HouseAge: 30, AveRooms: 4.5, AveBedrms: 1.1, Population: 1500, AveOccup: 3.2, Latitude: 34.05, Longitude: -118.24 } },
  { name: "Fresno", values: { MedInc: 3, HouseAge: 20, AveRooms: 5.5, AveBedrms: 1.1, Population: 1200, AveOccup: 3, Latitude: 36.74, Longitude: -119.79 } },
];

const usd = new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 });

export default function PredictForm() {
  const [input, setInput] = useState<HouseInput>(PRESETS[0].values);
  const [result, setResult] = useState<Prediction | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [focus, setFocus] = useState<Focus | null>(null);

  const update = (patch: Partial<HouseInput>) => setInput((prev) => ({ ...prev, ...patch }));

  async function onPredict() {
    setLoading(true);
    setError(null);
    try {
      setResult(await predict(input));
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setLoading(false);
    }
  }

  const tier = result ? tierFor(result.predicted_price_usd) : null;

  return (
    <div className="grid gap-px border border-line bg-line lg:grid-cols-[1fr_1fr]">
      {/* Inputs */}
      <div className="space-y-10 bg-ivory p-6 sm:p-10">
        <div>
          <p className="eyebrow">The neighbourhood</p>
          <div className="mt-4 flex flex-wrap gap-2">
            {PRESETS.map((p) => (
              <button
                key={p.name}
                onClick={() => setInput(p.values)}
                className="border border-line px-3 py-1.5 text-xs tracking-wide text-taupe transition-colors hover:border-gold hover:text-ink"
              >
                {p.name}
              </button>
            ))}
          </div>
        </div>

        <div className="space-y-7">
          {FIELDS.map((f) => (
            <div key={f.key}>
              <div className="mb-3 flex items-baseline justify-between">
                <label htmlFor={f.key} className="text-sm text-ink">
                  {f.label} <span className="text-taupe">· {f.hint}</span>
                </label>
                <span className="font-display text-xl text-ink">{input[f.key]}</span>
              </div>
              <input
                id={f.key}
                type="range"
                min={f.min}
                max={f.max}
                step={f.step}
                value={input[f.key]}
                onChange={(e) => update({ [f.key]: Number(e.target.value) })}
                className="slider"
              />
            </div>
          ))}
        </div>

        <div>
          <div className="mb-3 flex items-baseline justify-between">
            <p className="eyebrow">Location</p>
            <span className="text-xs tracking-wide text-taupe">
              {input.Latitude}° N, {Math.abs(input.Longitude)}° W
            </span>
          </div>
          <div className="mb-3">
            <PlaceSearch
              onPick={(p) => {
                update({ Latitude: p.lat, Longitude: p.lng });
                setFocus({ lat: p.lat, lng: p.lng, id: Date.now() });
              }}
            />
          </div>
          <LocationPicker
            lat={input.Latitude}
            lng={input.Longitude}
            focus={focus}
            onChange={(Latitude, Longitude) => update({ Latitude, Longitude })}
          />
          <p className="mt-2 text-xs text-taupe">Search for a place, or select any point on the map.</p>
        </div>
      </div>

      {/* Result */}
      <div className="flex flex-col bg-white">
        <Photo
          photo={tier?.photo ?? PHOTOS.interior}
          sizes="(min-width: 1024px) 560px, 100vw"
          className="aspect-[4/3] w-full lg:aspect-auto lg:flex-1"
        />
        <div className="space-y-6 p-6 sm:p-10">
          <div>
            <p className="eyebrow">{tier ? tier.name : "Your valuation"}</p>
            <p className="mt-3 font-display text-5xl font-medium leading-none tracking-tight sm:text-6xl">
              {result ? usd.format(result.predicted_price_usd) : "—"}
            </p>
            <p className="mt-3 text-sm text-taupe">
              {result
                ? `Estimated range ${usd.format(result.range_low_usd)} – ${usd.format(result.range_high_usd)}`
                : "Describe the neighbourhood, then request a valuation."}
            </p>
            {tier && <p className="mt-1 font-display text-lg italic text-taupe">{tier.note}</p>}
          </div>
          {error && <p className="border-l-2 border-rose-400 bg-rose-50 px-3 py-2 text-sm text-rose-800">{error}</p>}
          <button onClick={onPredict} disabled={loading} className="btn-gold w-full">
            {loading ? "Valuing…" : "Request valuation"}
          </button>
        </div>
      </div>
    </div>
  );
}
