"use client";

/* eslint-disable react-hooks/set-state-in-effect */
import { useState, useEffect } from "react";
import { fetchFredSeries } from "@/lib/api";
import { FredSeries } from "@/types/fred";

interface UseFredSeriesResult {
  series: FredSeries | null;
  loading: boolean;
  error: string | null;
}

export function useFredSeries(seriesId: string | null): UseFredSeriesResult {
  const [series, setSeries] = useState<FredSeries | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!seriesId) return;

    let cancelled = false;
    setLoading(true);
    setError(null);

    fetchFredSeries(seriesId)
      .then((data) => {
        if (!cancelled && data.seriess?.[0]) {
          setSeries(data.seriess[0]);
        }
      })
      .catch((err) => {
        if (!cancelled) setError(err.message || "Failed to load series");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [seriesId]);

  return { series, loading, error };
}
