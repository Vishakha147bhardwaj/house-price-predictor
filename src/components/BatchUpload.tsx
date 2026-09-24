"use client";

import { useState } from "react";
import { predictFile } from "@/lib/api";

const usd = new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 });

function parseCsv(text: string) {
  const [header, ...lines] = text.trim().split(/\r?\n/);
  return { columns: header.split(","), rows: lines.map((l) => l.split(",")) };
}

export default function BatchUpload() {
  const [file, setFile] = useState<File | null>(null);
  const [dragging, setDragging] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [resultCsv, setResultCsv] = useState<string | null>(null);

  function choose(f: File | null) {
    setFile(f);
    setResultCsv(null);
    setError(null);
  }

  async function onSubmit() {
    if (!file) return;
    setLoading(true);
    setError(null);
    try {
      setResultCsv(await predictFile(file));
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setLoading(false);
    }
  }

  function download() {
    if (!resultCsv) return;
    const url = URL.createObjectURL(new Blob([resultCsv], { type: "text/csv" }));
    const a = document.createElement("a");
    a.href = url;
    a.download = "predictions.csv";
    a.click();
    URL.revokeObjectURL(url);
  }

  const parsed = resultCsv ? parseCsv(resultCsv) : null;
  const priceIdx = parsed?.columns.indexOf("predicted_price_usd") ?? -1;
  const prices = parsed && priceIdx >= 0 ? parsed.rows.map((r) => Number(r[priceIdx])) : [];
  const avg = prices.length ? prices.reduce((a, b) => a + b, 0) / prices.length : 0;

  return (
    <div className="border border-line bg-white p-6 sm:p-10">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <p className="max-w-xl text-sm text-taupe">
          Upload a CSV with the eight feature columns (up to 5 MB or 10,000 rows) and receive a valuation for
          every property.
        </p>
        <a href="/sample.csv" download className="text-xs uppercase tracking-[0.2em] text-gold underline-offset-4 hover:underline">
          Sample CSV ↓
        </a>
      </div>

      <label
        onDragOver={(e) => {
          e.preventDefault();
          setDragging(true);
        }}
        onDragLeave={() => setDragging(false)}
        onDrop={(e) => {
          e.preventDefault();
          setDragging(false);
          choose(e.dataTransfer.files[0] ?? null);
        }}
        className={`mt-6 flex h-44 cursor-pointer flex-col items-center justify-center gap-2 border border-dashed transition-colors ${
          dragging ? "border-gold bg-bone" : "border-sand bg-ivory hover:border-gold"
        }`}
      >
        <input type="file" accept=".csv" hidden onChange={(e) => choose(e.target.files?.[0] ?? null)} />
        <p className="font-display text-2xl">{file ? file.name : "Drop your CSV here"}</p>
        <p className="text-xs uppercase tracking-[0.2em] text-taupe">
          {file ? `${(file.size / 1024).toFixed(1)} KB` : "or click to browse"}
        </p>
      </label>

      {error && <p className="mt-4 border-l-2 border-rose-400 bg-rose-50 px-3 py-2 text-sm text-rose-800">{error}</p>}

      <button onClick={onSubmit} disabled={!file || loading} className="btn-gold mt-6 w-full">
        {loading ? "Valuing portfolio…" : "Value portfolio"}
      </button>

      {parsed && (
        <div className="mt-10 space-y-5">
          <div className="flex flex-wrap items-end justify-between gap-4 border-b border-line pb-5">
            <div className="flex gap-10">
              <div>
                <p className="eyebrow">Properties</p>
                <p className="mt-1 font-display text-3xl">{parsed.rows.length.toLocaleString()}</p>
              </div>
              <div>
                <p className="eyebrow">Average value</p>
                <p className="mt-1 font-display text-3xl">{usd.format(avg)}</p>
              </div>
            </div>
            <button
              onClick={download}
              className="border border-ink px-5 py-2.5 text-xs uppercase tracking-[0.2em] transition-colors hover:bg-ink hover:text-ivory"
            >
              Download results
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="text-[11px] uppercase tracking-[0.15em] text-taupe">
                <tr>
                  {parsed.columns.map((c) => (
                    <th key={c} className="whitespace-nowrap px-3 py-2 font-normal">
                      {c === "predicted_price_usd" ? "Valuation" : c}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {parsed.rows.slice(0, 10).map((row, i) => (
                  <tr key={i} className="border-t border-line">
                    {row.map((cell, j) => (
                      <td
                        key={j}
                        className={`whitespace-nowrap px-3 py-2.5 ${j === priceIdx ? "font-display text-base text-gold-deep" : "text-taupe"}`}
                      >
                        {j === priceIdx ? usd.format(Number(cell)) : cell}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {parsed.rows.length > 10 && (
            <p className="text-xs text-taupe">Showing the first 10 properties. Download the file for the full list.</p>
          )}
        </div>
      )}
    </div>
  );
}
