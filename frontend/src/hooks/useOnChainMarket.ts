"use client";

import { useEffect, useState, useCallback } from "react";
import { PublicKey } from "@solana/web3.js";
import { useAnchorProgram } from "@/providers/AnchorProvider";
import { getMarketPda } from "@/lib/program";
import { decodeMarketDetail } from "@/lib/solana";
import type { MarketDetail } from "@/types/market";

interface UseOnChainMarketResult {
  market: MarketDetail | null;
  loading: boolean;
  error: string | null;
  refetch: () => void;
}

/**
 * Fetches a single Market account by its public key (base58 address).
 * The `id` parameter should be the market's on-chain PDA address.
 *
 * Also accepts a numeric market ID string (e.g. "0", "1", ...) — in this case
 * the hook derives the PDA automatically using getMarketPda.
 */
export function useOnChainMarket(id: string): UseOnChainMarketResult {
  // Use readonlyProgram so market detail loads without a wallet
  const { readonlyProgram } = useAnchorProgram();

  const [market, setMarket] = useState<MarketDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [tick, setTick] = useState(0);

  const refetch = useCallback(() => setTick((t) => t + 1), []);

  useEffect(() => {
    let cancelled = false;

    async function fetchMarket() {
      setLoading(true);
      setError(null);

      try {
        if (!id) {
          setMarket(null);
          setLoading(false);
          return;
        }

        // Resolve address: accept PDA base58 or numeric ID
        let marketPubkey: PublicKey;
        const numeric = Number(id);
        if (!isNaN(numeric) && Number.isInteger(numeric) && String(numeric) === id) {
          // Numeric ID → derive PDA
          const BN = (await import("bn.js")).default;
          const [pda] = getMarketPda(new BN(numeric));
          marketPubkey = pda;
        } else {
          marketPubkey = new PublicKey(id);
        }

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const rawAccount = await (readonlyProgram.account as any).market.fetch(marketPubkey);

        if (cancelled) return;

        const decoded = decodeMarketDetail(marketPubkey, rawAccount);
        setMarket(decoded);
      } catch (err) {
        if (cancelled) return;
        const msg = err instanceof Error ? err.message : "Failed to fetch market";
        setError(msg);
        console.error("[useOnChainMarket]", err);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    fetchMarket();
    return () => {
      cancelled = true;
    };
  }, [readonlyProgram, id, tick]);

  return { market, loading, error, refetch };
}
