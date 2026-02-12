"use client";

import { useState, useCallback } from "react";
import type { SponsorFormState } from "@/types/cloud";

export type SponsorStatus =
  | "idle"
  | "proposing"
  | "claiming"
  | "initMints"
  | "initOrderBooks"
  | "complete"
  | "error";

export interface UseSponsorMarketResult {
  sponsor: (state: SponsorFormState) => Promise<void>;
  status: SponsorStatus;
  error: string | null;
  txSignatures: string[];
}

/**
 * Scaffold for the on-chain sponsor transaction sequence.
 *
 * Full implementation will:
 * 1. propose_market — creates Market PDA (Pending)
 * 2. claim_market — vault + creator config, USDC stake, sets Active
 * 3. initialize_outcome_mint × N — one SPL mint per outcome
 * 4. initialize_order_book × N — one order book per outcome
 *
 * Params mapping from SponsorFormState:
 * - fred_series_id: state.potential.entry.seriesId
 * - title: auto from state.potential.question
 * - description: auto from entry.questionTemplate
 * - market_type: MultiOutcome (all cloud markets)
 * - num_outcomes: state.potential.outcomes.length
 * - outcome_labels: state.potential.outcomes.map(o => o.label)
 * - resolution_condition: derived from entry.questionStyle + bracket values
 * - resolution_source_url: https://fred.stlouisfed.org/series/{seriesId}
 * - closes_at: now + entry.closesAtOffsetDays
 * - resolves_at: now + entry.resolvesAtOffsetDays
 * - token_mint: USDC mint address
 * - stake_amount: state.stakeAmount * 1_000_000 (USDC base units)
 * - initial_odds: state.odds as u16[8] (pad unused with 0)
 */
export function useSponsorMarket(): UseSponsorMarketResult {
  const [status, setStatus] = useState<SponsorStatus>("idle");
  const [error, setError] = useState<string | null>(null);
  const [txSignatures, setTxSignatures] = useState<string[]>([]);

  const sponsor = useCallback(async (state: SponsorFormState) => {
    try {
      setStatus("proposing");
      setError(null);
      setTxSignatures([]);

      // TODO: Get Anchor program from provider
      // const program = useAnchorProgram();

      // Step 1: propose_market
      // const proposeTx = await program.methods.proposeMarket({...}).rpc();
      // setTxSignatures(prev => [...prev, proposeTx]);

      setStatus("claiming");
      // Step 2: claim_market
      // const claimTx = await program.methods.claimMarket({...}).rpc();
      // setTxSignatures(prev => [...prev, claimTx]);

      setStatus("initMints");
      // Step 3: initialize_outcome_mint × N
      // for (let i = 0; i < numOutcomes; i++) { ... }

      setStatus("initOrderBooks");
      // Step 4: initialize_order_book × N
      // for (let i = 0; i < numOutcomes; i++) { ... }

      setStatus("complete");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Transaction failed");
      setStatus("error");
    }
  }, []);

  return { sponsor, status, error, txSignatures };
}
