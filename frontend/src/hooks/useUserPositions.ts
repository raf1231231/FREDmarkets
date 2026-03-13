"use client";

import { useEffect, useState, useCallback } from "react";
import { PublicKey } from "@solana/web3.js";
import { useConnection, useWallet } from "@solana/wallet-adapter-react";
import { TOKEN_PROGRAM_ID } from "@/lib/constants";
import type { MarketSummary } from "@/types/market";

export interface OutcomePosition {
  marketPublicKey: string;
  marketTitle: string;
  fredSeriesId: string;
  outcomeIndex: number;
  outcomeLabel: string;
  mintAddress: string;
  balance: number; // in token base units
  balanceFormatted: string; // human-readable (base units = shares directly, no decimals)
  marketStatus: string;
}

interface UseUserPositionsResult {
  positions: OutcomePosition[];
  creatorMarkets: MarketSummary[];
  loading: boolean;
  error: string | null;
  refetch: () => void;
}

/**
 * Fetches the connected wallet's outcome token positions across all FREDmarkets.
 *
 * Strategy:
 *   1. Fetch all SPL token accounts owned by the wallet.
 *   2. Cross-reference their mint addresses against known outcome mints
 *      from the provided on-chain market list.
 *   3. Return positions with non-zero balances.
 *
 * Also filters `markets` to find markets where the wallet is the proposer.
 */
export function useUserPositions(
  markets: MarketSummary[]
): UseUserPositionsResult {
  const { connection } = useConnection();
  const { publicKey } = useWallet();

  const [positions, setPositions] = useState<OutcomePosition[]>([]);
  const [creatorMarkets, setCreatorMarkets] = useState<MarketSummary[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [tick, setTick] = useState(0);

  const refetch = useCallback(() => setTick((t) => t + 1), []);

  useEffect(() => {
    let cancelled = false;

    async function fetchPositions() {
      if (!publicKey || markets.length === 0) {
        setPositions([]);
        setCreatorMarkets([]);
        setLoading(false);
        return;
      }

      setLoading(true);
      setError(null);

      try {
        // Build a map of outcome_mint_address → { market, outcomeIndex, label }
        // We need the actual MarketDetail with outcomeMints populated.
        // Since MarketSummary doesn't include outcomeMints, we fetch them lazily.
        // For now, we use getProgramAccounts to get all token accounts by owner.

        const tokenAccounts = await connection.getParsedTokenAccountsByOwner(
          publicKey,
          { programId: TOKEN_PROGRAM_ID }
        );

        if (cancelled) return;

        // We need to match mints to outcomes. Load MarketDetail for each market
        // that has outcomeMints. For now, check the on-chain market account list.
        // This requires the useOnChainMarkets + useOnChainMarket hooks to provide
        // outcomeMints. For MarketSummary we don't have outcomeMints directly.
        //
        // Workaround: derive outcome mint PDAs from each market PDA and check
        // if the wallet holds any of them.
        const { getOutcomeMintPda } = await import("@/lib/program");
        const BN = (await import("bn.js")).default;

        const positionsFound: OutcomePosition[] = [];

        // Build a set of token mint addresses the wallet holds
        const walletMints = new Map<string, number>();
        for (const ta of tokenAccounts.value) {
          const info = ta.account.data.parsed?.info;
          if (info) {
            walletMints.set(info.mint, Number(info.tokenAmount.amount));
          }
        }

        // For each market, check each outcome mint
        for (const market of markets) {
          const marketPubkey = new PublicKey(market.publicKey);

          for (let i = 0; i < market.numOutcomes; i++) {
            const [outcomeMintPda] = getOutcomeMintPda(marketPubkey, i);
            const mintAddress = outcomeMintPda.toBase58();
            const balance = walletMints.get(mintAddress);

            if (balance !== undefined && balance > 0) {
              positionsFound.push({
                marketPublicKey: market.publicKey,
                marketTitle: market.title,
                fredSeriesId: market.fredSeriesId,
                outcomeIndex: i,
                outcomeLabel: market.outcomeLabels[i] ?? `Outcome ${i}`,
                mintAddress,
                balance,
                balanceFormatted: balance.toLocaleString(),
                marketStatus: market.status,
              });
            }
          }
        }

        // Filter for creator markets using proposer field from MarketSummary
        const creatorMarketsFiltered = markets.filter(
          (m) => m.proposer === publicKey?.toBase58()
        );

        if (!cancelled) {
          setPositions(positionsFound);
          setCreatorMarkets(creatorMarketsFiltered);
        }
      } catch (err) {
        if (cancelled) return;
        const msg = err instanceof Error ? err.message : "Failed to fetch positions";
        setError(msg);
        console.error("[useUserPositions]", err);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    fetchPositions();
    return () => {
      cancelled = true;
    };
  }, [publicKey, connection, markets, tick]);

  return { positions, creatorMarkets, loading, error, refetch };
}
