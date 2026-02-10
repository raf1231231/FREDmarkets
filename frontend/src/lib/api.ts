import { API_BASE_URL } from "./constants";

async function apiFetch<T>(path: string): Promise<T> {
  const res = await fetch(`${API_BASE_URL}${path}`);
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
  return apiFetch<any>(`/markets${query ? `?${query}` : ""}`);
}

export function fetchMarket(id: string) {
  return apiFetch<any>(`/markets/${id}`);
}

// FRED proxy
export function searchFredSeries(query: string, limit = 20) {
  return apiFetch<any>(`/fred/search?q=${encodeURIComponent(query)}&limit=${limit}`);
}

export function fetchFredSeries(seriesId: string) {
  return apiFetch<any>(`/fred/series/${seriesId}`);
}

export function fetchFredObservations(seriesId: string) {
  return apiFetch<any>(`/fred/observations/${seriesId}`);
}
