"use client";

import { useState, useEffect } from "react";
import { fetchFredObservations } from "@/lib/api";
import { FredObservation } from "@/types/fred";

interface UseFredObservationsResult {
  observations: FredObservation[];
  loading: boolean;
  error: string | null;
}

export function useFredObservations(
  seriesId: string | null,
  limit = 24
): UseFredObservationsResult {
  const [observations, setObservations] = useState<FredObservation[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!seriesId) return;

    let cancelled = false;
    setLoading(true);
    setError(null);

    fetchFredObservations(seriesId, { limit, sort_order: "desc" })
      .then((data) => {
        if (!cancelled) {
          const valid = (data.observations || [])
            .filter((o) => o.value !== ".")
            .reverse();
          setObservations(valid);
        }
      })
      .catch((err) => {
        if (!cancelled) setError(err.message || "Failed to load observations");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [seriesId, limit]);

  return { observations, loading, error };
}
