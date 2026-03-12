import { API_BASE_URL } from "./constants";
import { FredSeriesResponse, FredObservationsResponse } from "@/types/fred";

async function apiFetch<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${API_BASE_URL}${path}`, init);
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.message || `API error: ${res.status}`);
  }
  return res.json();
}

// Markets
export function fetchMarkets(params?: { status?: string; page?: number; limit?: number }) {
  const qs = new URLSearchParams();
  if (params?.status) qs.set("status", params.status);
  if (params?.page) qs.set("page", String(params.page));
  if (params?.limit) qs.set("limit", String(params.limit));
  const query = qs.toString();
  return apiFetch<unknown>(`/markets${query ? `?${query}` : ""}`);
}

export function fetchMarket(id: string) {
  return apiFetch<unknown>(`/markets/${id}`);
}

// FRED proxy
export function searchFredSeries(query: string, limit = 20) {
  return apiFetch<unknown>(`/fred/search?q=${encodeURIComponent(query)}&limit=${limit}`);
}

export function fetchFredSeries(seriesId: string) {
  return apiFetch<FredSeriesResponse>(`/fred/series/${seriesId}`);
}

export function fetchFredObservations(
  seriesId: string,
  opts?: { limit?: number; sort_order?: "asc" | "desc" }
) {
  const qs = new URLSearchParams();
  if (opts?.limit) qs.set("limit", String(opts.limit));
  if (opts?.sort_order) qs.set("sort_order", opts.sort_order);
  const query = qs.toString();
  return apiFetch<FredObservationsResponse>(
    `/fred/observations/${seriesId}${query ? `?${query}` : ""}`
  );
}

// Batch fetch observations for multiple series in one call
export function fetchBatchObservations(
  seriesIds: string[],
  limit = 13,
  frequencyMap?: Record<string, string>
): Promise<Record<string, { observations: Array<{ date: string; value: string }> }>> {
  console.log("[API] Fetching batch observations:", seriesIds.length, "series, limit:", limit);
  return apiFetch<Record<string, { observations: Array<{ date: string; value: string }> }>>(`/fred/batch-observations`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ seriesIds, limit, frequencyMap }),
  }).then(data => {
    console.log("[API] Batch response received, type:", typeof data);
    console.log("[API] Response keys:", Object.keys(data || {}).length, "series");
    console.log("[API] First few keys:", Object.keys(data || {}).slice(0, 5));
    return data;
  }).catch(err => {
    console.error("[API] Batch fetch error:", err);
    throw err;
  });
}
