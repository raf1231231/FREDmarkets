"use client";

import { useState, useEffect, useMemo, useCallback } from "react";
import {
  SERIES_CATALOG,
  type CloudCategory,
} from "@/data/seriesCatalog";
import { generateMarketPotential } from "@/lib/outcomeGenerator";
import { fetchBatchObservations } from "@/lib/api";
import type { MarketPotential } from "@/types/cloud";

const ALL_SERIES_IDS = SERIES_CATALOG.map((s) => s.seriesId);
const REFRESH_INTERVAL_MS = 5 * 60 * 1000; // 5 min, matches backend cache

export interface UseMarketCloudResult {
  potentials: MarketPotential[];
  loading: boolean;
  error: string | null;
  activeCategory: CloudCategory | "all";
  setActiveCategory: (cat: CloudCategory | "all") => void;
  filteredPotentials: MarketPotential[];
  categoryCounts: Record<CloudCategory | "all", number>;
  refresh: () => void;
}

export function useMarketCloud(): UseMarketCloudResult {
  const [potentials, setPotentials] = useState<MarketPotential[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeCategory, setActiveCategory] = useState<CloudCategory | "all">("all");

  const fetchAll = useCallback(async () => {
    try {
      console.log("[MarketCloud] Starting fetchAll...");
      console.log("[MarketCloud] Total series to fetch:", ALL_SERIES_IDS.length);
      setLoading(true);
      setError(null);

      // Build frequency map for cache optimization
      const frequencyMap: Record<string, string> = {};
      for (const entry of SERIES_CATALOG) {
        frequencyMap[entry.seriesId] = entry.frequency;
      }

      const batchData = await fetchBatchObservations(ALL_SERIES_IDS, 25, frequencyMap);
      console.log("[MarketCloud] Batch data received:", Object.keys(batchData).length, "series");

      const generated: MarketPotential[] = [];
      for (const entry of SERIES_CATALOG) {
        const seriesData = batchData[entry.seriesId];
        if (!seriesData?.observations) {
          console.log("[MarketCloud] No data for:", entry.seriesId);
          continue;
        }

        const potential = generateMarketPotential(entry, seriesData.observations);
        if (potential) {
          generated.push(potential);
        } else {
          console.log("[MarketCloud] Failed to generate potential for:", entry.seriesId);
        }
      }

      console.log("[MarketCloud] Generated potentials:", generated.length);
      setPotentials(generated);
    } catch (err) {
      console.error("[MarketCloud] Error:", err);
      setError(err instanceof Error ? err.message : "Failed to load market data");
    } finally {
      setLoading(false);
      console.log("[MarketCloud] fetchAll complete");
    }
  }, []);

  useEffect(() => {
    fetchAll();
    const interval = setInterval(fetchAll, REFRESH_INTERVAL_MS);
    return () => clearInterval(interval);
  }, [fetchAll]);

  const filteredPotentials = useMemo(() => {
    if (activeCategory === "all") return potentials;
    return potentials.filter((p) => p.entry.category === activeCategory);
  }, [potentials, activeCategory]);

  const categoryCounts = useMemo(() => {
    const counts: Record<string, number> = { all: potentials.length };
    for (const p of potentials) {
      counts[p.entry.category] = (counts[p.entry.category] || 0) + 1;
    }
    return counts as Record<CloudCategory | "all", number>;
  }, [potentials]);

  return {
    potentials,
    loading,
    error,
    activeCategory,
    setActiveCategory,
    filteredPotentials,
    categoryCounts,
    refresh: fetchAll,
  };
}
