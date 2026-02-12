import axios from "axios";
import { config } from "../config";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

interface CacheEntry {
  data: any;
  expiresAt: number;
  frequency?: string;
}

const cache = new Map<string, CacheEntry>();

// Cache TTL based on data frequency:
// - Daily series: 1 hour (data updates once per day)
// - Weekly series: 6 hours
// - Monthly series: 24 hours (data updates once per month)
// - Quarterly series: 7 days
// Default: 24 hours for most economic indicators
const CACHE_TTL_MS = 24 * 60 * 60 * 1000; // 24 hours default

function getCacheTTL(frequency?: string): number {
  switch (frequency?.toLowerCase()) {
    case 'daily':
      return 60 * 60 * 1000; // 1 hour
    case 'weekly':
      return 6 * 60 * 60 * 1000; // 6 hours
    case 'monthly':
      return 24 * 60 * 60 * 1000; // 24 hours
    case 'quarterly':
    case 'annual':
      return 7 * 24 * 60 * 60 * 1000; // 7 days
    default:
      return CACHE_TTL_MS; // 24 hours
  }
}

function getCached(key: string): any | null {
  const entry = cache.get(key);
  if (!entry) return null;
  if (Date.now() > entry.expiresAt) {
    cache.delete(key);
    return null;
  }
  return entry.data;
}

function setCache(key: string, data: any, frequency?: string) {
  const ttl = getCacheTTL(frequency);
  cache.set(key, { data, expiresAt: Date.now() + ttl, frequency });
  console.log(`💾 Cached ${key} for ${Math.round(ttl / 1000 / 60)} minutes`);
}

async function fredGet(endpoint: string, params: Record<string, string> = {}, frequency?: string) {
  const queryParams = {
    api_key: config.fredApiKey,
    file_type: "json",
    ...params,
  };

  const cacheKey = `${endpoint}:${JSON.stringify(queryParams)}`;
  const cached = getCached(cacheKey);
  if (cached) {
    console.log(`✨ Cache hit: ${params.series_id || endpoint}`);
    return cached;
  }

  console.log(`🌐 FRED API call: ${params.series_id || endpoint}`);
  const response = await axios.get(`${config.fredBaseUrl}/${endpoint}`, {
    params: queryParams,
  });

  setCache(cacheKey, response.data, frequency);
  return response.data;
}

export async function searchSeries(query: string, limit = 20) {
  return fredGet("series/search", {
    search_text: query,
    limit: String(limit),
  });
}

export async function getSeries(seriesId: string) {
  // Check if we have cached series info
  const cached = await prisma.fredCache.findUnique({
    where: { seriesId },
    select: { seriesInfo: true, lastFetched: true },
  });

  if (cached?.seriesInfo) {
    const age = Date.now() - cached.lastFetched.getTime();
    const ttl = 7 * 24 * 60 * 60 * 1000; // Series metadata rarely changes, cache for 7 days

    if (age < ttl) {
      console.log(`💾 DB cache hit (series info): ${seriesId}`);
      return { seriess: [cached.seriesInfo] };
    }
  }

  // Fetch from API
  const data = await fredGet("series", { series_id: seriesId });

  // Update series info in database
  if (data.seriess && data.seriess[0]) {
    await prisma.fredCache.upsert({
      where: { seriesId },
      update: {
        seriesInfo: data.seriess[0],
        updatedAt: new Date(),
      },
      create: {
        seriesId,
        seriesInfo: data.seriess[0],
        observations: [],
        lastFetched: new Date(),
      },
    });
    console.log(`💾 Stored series info in DB: ${seriesId}`);
  }

  return data;
}

export async function getObservations(
  seriesId: string,
  opts: { limit?: string; sort_order?: string; frequency?: string } = {}
) {
  // Check database cache first
  const cached = await prisma.fredCache.findUnique({
    where: { seriesId },
  });

  if (cached) {
    const ttl = getCacheTTL(opts.frequency);
    const age = Date.now() - cached.lastFetched.getTime();

    if (age < ttl) {
      console.log(`💾 DB cache hit: ${seriesId} (age: ${Math.round(age / 1000 / 60)}min)`);
      return { observations: cached.observations };
    } else {
      console.log(`⏰ DB cache expired: ${seriesId} (age: ${Math.round(age / 1000 / 60)}min, ttl: ${Math.round(ttl / 1000 / 60)}min)`);
    }
  }

  // Fetch from API
  const data = await fredGet("series/observations", {
    series_id: seriesId,
    sort_order: opts.sort_order || "desc",
    limit: opts.limit || "100",
  }, opts.frequency);

  // Store in database
  await prisma.fredCache.upsert({
    where: { seriesId },
    update: {
      observations: data.observations,
      lastFetched: new Date(),
      updatedAt: new Date(),
    },
    create: {
      seriesId,
      observations: data.observations,
      lastFetched: new Date(),
    },
  });
  console.log(`💾 Stored in DB cache: ${seriesId}`);

  return data;
}

function chunk<T>(arr: T[], size: number): T[][] {
  const chunks: T[][] = [];
  for (let i = 0; i < arr.length; i += size) {
    chunks.push(arr.slice(i, i + size));
  }
  return chunks;
}

// Helper to delay execution
function delay(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

export async function getBatchObservations(
  seriesIds: string[],
  limit = "13",
  frequencyMap?: Record<string, string>,
  delayBetweenBatches = 0
): Promise<Record<string, { observations: any[] }>> {
  console.log(`🔄 getBatchObservations: Fetching ${seriesIds.length} series with limit ${limit}`);
  const results: Record<string, { observations: any[] }> = {};
  const batches = chunk(seriesIds, 10);
  console.log(`📦 Processing ${batches.length} batches of max 10 series each`);

  for (let i = 0; i < batches.length; i++) {
    const batch = batches[i];

    // Add delay between batches to avoid rate limiting (except for first batch)
    if (i > 0 && delayBetweenBatches > 0) {
      await delay(delayBetweenBatches);
    }

    const settled = await Promise.allSettled(
      batch.map(async (id) => {
        const frequency = frequencyMap?.[id];
        const data = await getObservations(id, { limit, sort_order: "desc", frequency });
        return { id, data };
      })
    );
    let successCount = 0;
    let failCount = 0;
    for (const result of settled) {
      if (result.status === "fulfilled") {
        results[result.value.id] = {
          observations: result.value.data.observations || [],
        };
        successCount++;
      } else {
        failCount++;
        console.error(`❌ Failed to fetch series:`, result.reason?.message || result.reason);
      }
    }
    console.log(`  Batch ${i + 1}/${batches.length} complete: ${successCount} success, ${failCount} failed`);
  }

  console.log(`✅ getBatchObservations complete: ${Object.keys(results).length} series returned`);
  return results;
}

// Cache warming: pre-load all series on server startup
// FRED API limit: 120 requests per minute
// With 100 series in 10 batches, we need ~500ms delay between batches to stay under limit
export async function warmCache(seriesIds: string[], frequencyMap?: Record<string, string>) {
  console.log(`🔥 Warming cache for ${seriesIds.length} series (with rate limiting)...`);
  const startTime = Date.now();

  try {
    // 600ms delay between batches = ~100 requests per minute (safe margin under 120/min limit)
    await getBatchObservations(seriesIds, "25", frequencyMap, 600);
    const duration = ((Date.now() - startTime) / 1000).toFixed(2);
    const successCount = cache.size;
    console.log(`✅ Cache warming complete in ${duration}s - ${successCount} series cached`);
  } catch (err) {
    console.error(`❌ Cache warming failed:`, err);
  }
}

// Get cache stats for monitoring
export function getCacheStats() {
  const stats = {
    totalEntries: cache.size,
    entries: [] as Array<{ key: string; expiresIn: number; frequency?: string }>,
  };

  const now = Date.now();
  for (const [key, entry] of cache.entries()) {
    const expiresIn = Math.max(0, entry.expiresAt - now);
    stats.entries.push({
      key: key.split(':')[0], // Just the endpoint, not full params
      expiresIn: Math.round(expiresIn / 1000 / 60), // minutes
      frequency: entry.frequency,
    });
  }

  return stats;
}
