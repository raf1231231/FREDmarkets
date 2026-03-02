"use client";

import { useEffect, useState, useCallback } from "react";
import { useAnchorProgram } from "@/providers/AnchorProvider";
import { decodeMarketSummary } from "@/lib/solana";
import type { MarketSummary } from "@/types/market";

interface UseOnChainMarketsResult {
  markets: MarketSummary[];
  loading: boolean;
  error: string | null;
  refetch: () => void;
}

/**
 * Fetches all Market accounts from the on-chain program using getProgramAccounts.
 * Returns decoded MarketSummary objects sorted by marketId descending (newest first).
 *
 * Falls back to empty array if the program isn't available (no wallet needed for reads).
 */
export function useOnChainMarkets(): UseOnChainMarketsResult {
  // Use readonlyProgram so markets load even without a connected wallet
  const { readonlyProgram } = useAnchorProgram();

  const [markets, setMarkets] = useState<MarketSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [tick, setTick] = useState(0);

  const refetch = useCallback(() => setTick((t) => t + 1), []);

  useEffect(() => {
    let cancelled = false;

    async function fetchMarkets() {
      setLoading(true);
      setError(null);

      try {
        // Fetch all Market accounts — Anchor uses the discriminator to filter
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const rawAccounts = await (readonlyProgram.account as any).market.all();

        if (cancelled) return;

        const decoded: MarketSummary[] = rawAccounts.map(
          (item: { publicKey: { toString(): string; toBase58(): string; toBuffer(): Buffer }, account: Record<string, unknown> }) =>
            decodeMarketSummary(item.publicKey as Parameters<typeof decodeMarketSummary>[0], item.account)
        );

        // Sort by marketId descending (newest first)
        decoded.sort((a, b) => Number(BigInt(b.marketId) - BigInt(a.marketId)));

        setMarkets(decoded);
      } catch (err) {
        if (cancelled) return;
        const msg = err instanceof Error ? err.message : "Failed to fetch markets";
        setError(msg);
        console.error("[useOnChainMarkets]", err);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    fetchMarkets();
    return () => {
      cancelled = true;
    };
  }, [readonlyProgram, tick]);

  return { markets, loading, error, refetch };
}
