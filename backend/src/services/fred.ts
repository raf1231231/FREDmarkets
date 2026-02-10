import axios from "axios";
import { config } from "../config";

interface CacheEntry {
  data: any;
  expiresAt: number;
}

const cache = new Map<string, CacheEntry>();
const CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutes

function getCached(key: string): any | null {
  const entry = cache.get(key);
  if (!entry) return null;
  if (Date.now() > entry.expiresAt) {
    cache.delete(key);
    return null;
  }
  return entry.data;
}

function setCache(key: string, data: any) {
  cache.set(key, { data, expiresAt: Date.now() + CACHE_TTL_MS });
}

async function fredGet(endpoint: string, params: Record<string, string> = {}) {
  const queryParams = {
    api_key: config.fredApiKey,
    file_type: "json",
    ...params,
  };

  const cacheKey = `${endpoint}:${JSON.stringify(queryParams)}`;
  const cached = getCached(cacheKey);
  if (cached) return cached;

  const response = await axios.get(`${config.fredBaseUrl}/${endpoint}`, {
    params: queryParams,
  });

  setCache(cacheKey, response.data);
  return response.data;
}

export async function searchSeries(query: string, limit = 20) {
  return fredGet("series/search", {
    search_text: query,
    limit: String(limit),
  });
}

export async function getSeries(seriesId: string) {
  return fredGet("series", { series_id: seriesId });
}

export async function getObservations(
  seriesId: string,
  opts: { limit?: string; sort_order?: string } = {}
) {
  return fredGet("series/observations", {
    series_id: seriesId,
    sort_order: opts.sort_order || "desc",
    limit: opts.limit || "100",
  });
}
