const API = process.env.NEXT_PUBLIC_API_URL ?? "http://127.0.0.1:8000";

export const API_URL = API;

export type HouseInput = {
  MedInc: number;
  HouseAge: number;
  AveRooms: number;
  AveBedrms: number;
  Population: number;
  AveOccup: number;
  Latitude: number;
  Longitude: number;
};

export type Prediction = {
  predicted_price_usd: number;
  range_low_usd: number;
  range_high_usd: number;
  predicted_price_formatted: string;
};

export type Health = {
  status: string;
  model: string;
  features: string[];
  mae_usd: number;
  r2: number | null;
};

// FastAPI errors: {detail: "text"} for our 400s, {detail: [{msg, loc}]} for 422 validation
async function errorMessage(res: Response): Promise<string> {
  const body = await res.json().catch(() => null);
  const detail = body?.detail;
  if (typeof detail === "string") return detail;
  if (Array.isArray(detail) && detail[0]?.msg) {
    const field = detail[0].loc?.at(-1);
    return field ? `${field}: ${detail[0].msg}` : detail[0].msg;
  }
  return `Request failed (${res.status})`;
}

// Network failures (server asleep, wrong URL, CORS) throw a TypeError with no useful text
async function request(path: string, init?: RequestInit): Promise<Response> {
  try {
    return await fetch(`${API}${path}`, init);
  } catch {
    throw new Error(
      "Can't reach the API. It may still be waking up (try again in ~30s), or this site isn't in ALLOWED_ORIGINS.",
    );
  }
}

export async function getHealth(): Promise<Health | null> {
  try {
    const res = await fetch(`${API}/health`, { cache: "no-store" });
    return res.ok ? await res.json() : null;
  } catch {
    return null;
  }
}

export async function predict(input: HouseInput): Promise<Prediction> {
  const res = await request("/predict", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
  });
  if (!res.ok) throw new Error(await errorMessage(res));
  return res.json();
}

export async function predictFile(file: File): Promise<string> {
  const form = new FormData();
  form.append("file", file);
  const res = await request("/predict-file", { method: "POST", body: form });
  if (!res.ok) throw new Error(await errorMessage(res));
  return res.text();
}
