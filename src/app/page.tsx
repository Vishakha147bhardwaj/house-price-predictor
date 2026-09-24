"use client";

import { useCallback, useState } from "react";
import ApiStatus from "@/components/ApiStatus";
import BatchUpload from "@/components/BatchUpload";
import Photo from "@/components/Photo";
import PredictForm from "@/components/PredictForm";
import { API_URL, type Health } from "@/lib/api";
import { PHOTOS } from "@/lib/photos";

const GITHUB_URL = "https://github.com/Vishakha147bhardwaj/house-price-predictor";

const usd = new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 });

const GALLERY = [
  { photo: PHOTOS.coastal, title: "Coastal Modern", place: "Pacific shoreline" },
  { photo: PHOTOS.golden, title: "Golden Hour Retreat", place: "Inland valleys" },
  { photo: PHOTOS.hillside, title: "Hillside Residence", place: "Bay Area hills" },
];

function SectionHeading({ index, title, children }: { index: string; title: string; children?: React.ReactNode }) {
  return (
    <div className="mb-10 grid gap-4 sm:grid-cols-[auto_1fr] sm:items-end sm:gap-10">
      <p className="font-display text-6xl leading-none text-sand sm:text-7xl">{index}</p>
      <div>
        <h2 className="font-display text-4xl font-medium tracking-tight sm:text-5xl">{title}</h2>
        {children && <p className="mt-3 max-w-2xl text-taupe">{children}</p>}
      </div>
    </div>
  );
}

export default function Home() {
  const [health, setHealth] = useState<Health | null>(null);
  const onHealth = useCallback((h: Health) => setHealth(h), []);

  const stats = [
    { label: "Homes studied", value: "20,640" },
    { label: "Model", value: "Random Forest" },
    { label: "Accuracy (R²)", value: health?.r2 != null ? health.r2.toFixed(2) : "—" },
    { label: "Typical error", value: health ? `± ${usd.format(health.mae_usd)}` : "—" },
  ];

  return (
    <>
      {/* Hero */}
      <section className="relative min-h-[88vh] overflow-hidden">
        <div className="absolute inset-0">
          <Photo photo={PHOTOS.hero} sizes="100vw" priority className="h-full w-full" />
        </div>
        <div className="absolute inset-0 bg-gradient-to-r from-ivory from-25% via-ivory/60 via-50% to-transparent" />
        <div className="absolute inset-x-0 bottom-0 h-40 bg-gradient-to-t from-ivory to-transparent" />

        <div className="relative mx-auto flex min-h-[88vh] max-w-7xl flex-col px-5 sm:px-8">
          <nav className="flex items-center justify-between py-7">
            <span className="text-sm uppercase tracking-[0.35em]">
              Estate <span className="font-display text-lg normal-case italic tracking-normal text-gold">Value</span>
            </span>
            <div className="flex items-center gap-7 text-[11px] uppercase tracking-[0.2em] text-taupe">
              <a href="#valuation" className="hidden hover:text-ink md:inline">Valuation</a>
              <a href="#portfolio" className="hidden hover:text-ink md:inline">Portfolio</a>
              <a href={`${API_URL}/docs`} target="_blank" rel="noreferrer" className="hidden hover:text-ink md:inline">API</a>
              <ApiStatus onHealth={onHealth} />
            </div>
          </nav>

          <div className="flex flex-1 flex-col justify-center py-16">
            <p className="eyebrow">California · Machine-learning valuations</p>
            <h1 className="mt-6 max-w-3xl font-display text-5xl font-medium leading-[1.02] tracking-tight sm:text-7xl lg:text-8xl">
              The true value of <em className="font-normal text-gold">California</em> living.
            </h1>
            <p className="mt-7 max-w-lg text-base leading-relaxed text-taupe sm:text-lg">
              An instant, data-driven estimate for any California neighbourhood, from a model trained on
              twenty thousand homes and served in real time by FastAPI.
            </p>
            <div className="mt-10 flex flex-wrap items-center gap-6">
              <a href="#valuation" className="btn-gold">Begin a valuation</a>
              <a href={GITHUB_URL} target="_blank" rel="noreferrer" className="text-xs uppercase tracking-[0.2em] text-ink underline-offset-8 hover:underline">
                View the source →
              </a>
            </div>
          </div>
        </div>
      </section>

      <main className="mx-auto max-w-7xl px-5 sm:px-8">
        {/* Stats */}
        <dl className="grid grid-cols-2 border-y border-line lg:grid-cols-4">
          {stats.map((s, i) => (
            <div key={s.label} className={`px-2 py-7 sm:px-6 ${i > 0 ? "lg:border-l" : ""} ${i % 2 ? "border-l" : ""} ${i > 1 ? "border-t lg:border-t-0" : ""} border-line`}>
              <dt className="eyebrow text-taupe">{s.label}</dt>
              <dd className="mt-2 font-display text-3xl sm:text-4xl">{s.value}</dd>
            </div>
          ))}
        </dl>

        {/* Gallery */}
        <section className="py-24">
          <div className="mb-10 flex flex-wrap items-end justify-between gap-4">
            <h2 className="max-w-xl font-display text-4xl font-medium tracking-tight sm:text-5xl">
              From coastal modern to <em className="font-normal text-gold">hillside</em> estates
            </h2>
            <p className="max-w-sm text-sm text-taupe">
              The model has learned how income, age, space and location shape prices across the state.
            </p>
          </div>
          <div className="grid gap-6 md:grid-cols-3">
            {GALLERY.map((g, i) => (
              <figure key={g.title} className={`group ${i === 1 ? "md:mt-16" : ""}`}>
                <Photo photo={g.photo} sizes="(min-width: 768px) 33vw, 100vw" className="aspect-[3/4]" />
                <figcaption className="mt-4 flex items-baseline justify-between">
                  <span className="font-display text-2xl">{g.title}</span>
                  <span className="text-[11px] uppercase tracking-[0.2em] text-taupe">{g.place}</span>
                </figcaption>
              </figure>
            ))}
          </div>
        </section>

        {/* Valuation */}
        <section id="valuation" className="scroll-mt-8 py-12">
          <SectionHeading index="01" title="Private valuation">
            Shape the neighbourhood with the controls, place it on the map, and receive an estimate in an instant.
          </SectionHeading>
          <PredictForm />
        </section>

        {/* Portfolio */}
        <section id="portfolio" className="scroll-mt-8 py-24">
          <SectionHeading index="02" title="Portfolio valuation">
            Value many properties at once. Upload a spreadsheet and download the results.
          </SectionHeading>
          <BatchUpload />
        </section>
      </main>

      <footer className="border-t border-line bg-bone">
        <div className="mx-auto flex max-w-7xl flex-col gap-8 px-5 py-14 sm:px-8 md:flex-row md:items-end md:justify-between">
          <div>
            <span className="text-sm uppercase tracking-[0.35em]">
              Estate <span className="font-display text-lg normal-case italic tracking-normal text-gold">Value</span>
            </span>
            <p className="mt-3 max-w-sm text-sm text-taupe">
              Built with FastAPI, scikit-learn and Next.js. Data from the 1990 US Census via scikit-learn.
            </p>
          </div>
          <div className="space-y-3 md:text-right">
            <div className="flex gap-6 text-[11px] uppercase tracking-[0.2em] md:justify-end">
              <a href={`${API_URL}/docs`} target="_blank" rel="noreferrer" className="hover:text-gold">API docs</a>
              <a href={GITHUB_URL} target="_blank" rel="noreferrer" className="hover:text-gold">GitHub</a>
            </div>
            <p className="text-xs text-taupe">
              Photography from{" "}
              <a href="https://unsplash.com" target="_blank" rel="noreferrer" className="underline underline-offset-2">Unsplash</a>
              : {Object.values(PHOTOS).map((p) => p.credit).filter((c, i, a) => a.indexOf(c) === i).join(", ")}.
            </p>
          </div>
        </div>
      </footer>
    </>
  );
}
