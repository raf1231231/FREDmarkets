"use client";

import { useState, useCallback } from "react";
import { SystemProgram } from "@solana/web3.js";
import BN from "bn.js";
import { useAnchorProgram } from "@/providers/AnchorProvider";
import { useWallet } from "@solana/wallet-adapter-react";
import {
  getPlatformConfigPda,
  getMarketPda,
  getVaultPda,
  getCreatorConfigPda,
  getOutcomeMintPda,
  getOrderBookPda,
} from "@/lib/program";
import { getAssociatedTokenAddress, buildResolutionCondition } from "@/lib/solana";
import { USDC_MINT, TOKEN_PROGRAM_ID, USDC_DECIMALS } from "@/lib/constants";
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
  marketPda: string | null;
  reset: () => void;
}

/**
 * Executes the full 4-step market creation sequence on-chain:
 *
 *   1. propose_market        — creates Market PDA with Pending status
 *   2. claim_market          — funds vault with USDC stake, sets Active
 *   3. initialize_outcome_mint × N  — one SPL mint per outcome
 *   4. initialize_order_book  × N  — one order book per outcome
 *
 * Requires a connected wallet with USDC ≥ stakeAmount and SOL for rent.
 */
export function useSponsorMarket(): UseSponsorMarketResult {
  const { program } = useAnchorProgram();
  const wallet = useWallet();

  const [status, setStatus] = useState<SponsorStatus>("idle");
  const [error, setError] = useState<string | null>(null);
  const [txSignatures, setTxSignatures] = useState<string[]>([]);
  const [marketPda, setMarketPda] = useState<string | null>(null);

  const reset = useCallback(() => {
    setStatus("idle");
    setError(null);
    setTxSignatures([]);
    setMarketPda(null);
  }, []);

  const sponsor = useCallback(
    async (state: SponsorFormState) => {
      if (!program) throw new Error("Anchor program not initialized — connect wallet");
      if (!wallet.publicKey) throw new Error("Wallet not connected");

      const addTx = (sig: string) =>
        setTxSignatures((prev) => [...prev, sig]);

      try {
        setStatus("proposing");
        setError(null);
        setTxSignatures([]);
        setMarketPda(null);

        const { potential, customOutcomes, stakeAmount, odds } = state;
        const { entry } = potential;

        // ── Fetch PlatformConfig: get treasury address + next market ID ──────
        const [platformConfigPda] = getPlatformConfigPda();
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const platformConfig = await (program.account as any).platformConfig.fetch(
          platformConfigPda
        );
        const currentMarketCount: BN = platformConfig.totalMarketsCreated;
        const treasury = platformConfig.treasury;

        // ── Derive Market PDA using current total_markets_created ─────────────
        const [marketPdaKey] = getMarketPda(currentMarketCount);
        setMarketPda(marketPdaKey.toBase58());

        // ── Build timestamps ──────────────────────────────────────────────────
        const nowSec = Math.floor(Date.now() / 1000);
        const closesAt = new BN(nowSec + entry.closesAtOffsetDays * 86400);
        const resolvesAt = new BN(nowSec + entry.resolvesAtOffsetDays * 86400);

        const numOutcomes = customOutcomes.length;
        const marketType =
          numOutcomes === 2 && entry.questionStyle === "direction"
            ? { binary: {} }
            : { multiOutcome: {} };

        const resolutionCondition = buildResolutionCondition(potential, customOutcomes);

        // ══ Step 1: propose_market ════════════════════════════════════════════
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const proposeTx = await (program.methods as any)
          .proposeMarket({
            fredSeriesId: entry.seriesId,
            title: potential.question,
            description: `Track ${entry.name} using FRED economic data. Creator earns 60% of redemption fees.`,
            marketType,
            numOutcomes,
            outcomeLabels: customOutcomes.map((o) => o.label),
            resolutionCondition,
            resolutionSourceUrl: `https://fred.stlouisfed.org/series/${entry.seriesId}`,
            closesAt,
            resolvesAt,
            tokenMint: USDC_MINT,
          })
          .accounts({
            proposer: wallet.publicKey,
            platformConfig: platformConfigPda,
            market: marketPdaKey,
            treasury,
            systemProgram: SystemProgram.programId,
          })
          .rpc({ commitment: "confirmed" });

        addTx(proposeTx);

        // ══ Step 2: claim_market ══════════════════════════════════════════════
        setStatus("claiming");

        const creatorUsdcAccount = getAssociatedTokenAddress(USDC_MINT, wallet.publicKey);
        const [vaultPda] = getVaultPda(marketPdaKey);
        const [creatorConfigPda] = getCreatorConfigPda(marketPdaKey);

        // Anchor expects u16[8] — pad unused slots with 0
        const paddedOdds: number[] = [
          ...odds.slice(0, 8),
          ...Array(Math.max(0, 8 - odds.length)).fill(0),
        ];

        const stakeAmountBn = new BN(
          Math.round(stakeAmount * Math.pow(10, USDC_DECIMALS))
        );

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const claimTx = await (program.methods as any)
          .claimMarket({
            stakeAmount: stakeAmountBn,
            initialOdds: paddedOdds,
          })
          .accounts({
            creator: wallet.publicKey,
            platformConfig: platformConfigPda,
            market: marketPdaKey,
            tokenMint: USDC_MINT,
            creatorUsdcAccount,
            vault: vaultPda,
            creatorConfig: creatorConfigPda,
            tokenProgram: TOKEN_PROGRAM_ID,
            systemProgram: SystemProgram.programId,
          })
          .rpc({ commitment: "confirmed" });

        addTx(claimTx);

        // ══ Step 3: initialize_outcome_mint × N ═══════════════════════════════
        setStatus("initMints");

        for (let i = 0; i < numOutcomes; i++) {
          const [outcomeMintPda] = getOutcomeMintPda(marketPdaKey, i);
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const mintTx = await (program.methods as any)
            .initializeOutcomeMint(i)
            .accounts({
              payer: wallet.publicKey,
              market: marketPdaKey,
              outcomeMint: outcomeMintPda,
              tokenProgram: TOKEN_PROGRAM_ID,
              systemProgram: SystemProgram.programId,
            })
            .rpc({ commitment: "confirmed" });
          addTx(mintTx);
        }

        // ══ Step 4: initialize_order_book × N ═════════════════════════════════
        setStatus("initOrderBooks");

        for (let i = 0; i < numOutcomes; i++) {
          const [orderBookPda] = getOrderBookPda(marketPdaKey, i);
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const bookTx = await (program.methods as any)
            .initializeOrderBook(i)
            .accounts({
              payer: wallet.publicKey,
              market: marketPdaKey,
              orderBook: orderBookPda,
              systemProgram: SystemProgram.programId,
            })
            .rpc({ commitment: "confirmed" });
          addTx(bookTx);
        }

        setStatus("complete");
      } catch (err) {
        const msg = err instanceof Error ? err.message : "Transaction failed";
        setError(msg);
        setStatus("error");
        throw err;
      }
    },
    [program, wallet]
  );

  return { sponsor, status, error, txSignatures, marketPda, reset };
}
