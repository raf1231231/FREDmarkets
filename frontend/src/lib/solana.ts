/**
 * Solana utility helpers for FREDmarkets frontend.
 * Covers: ATA derivation, on-chain account decoding, resolution condition building.
 */

import { PublicKey, SystemProgram } from "@solana/web3.js";
import BN from "bn.js";
import {
  TOKEN_PROGRAM_ID,
  ASSOCIATED_TOKEN_PROGRAM_ID,
} from "./constants";
import type { MarketSummary, MarketDetail, MarketStatus, MarketType } from "@/types/market";
import type { MarketPotential, GeneratedOutcome } from "@/types/cloud";

// ─── Associated Token Account ────────────────────────────────────────────────

/**
 * Derives the Associated Token Account (ATA) address for a given wallet + mint.
 * Pure computation — does NOT check if the account exists on-chain.
 */
export function getAssociatedTokenAddress(
  mint: PublicKey,
  owner: PublicKey
): PublicKey {
  const [address] = PublicKey.findProgramAddressSync(
    [owner.toBuffer(), TOKEN_PROGRAM_ID.toBuffer(), mint.toBuffer()],
    ASSOCIATED_TOKEN_PROGRAM_ID
  );
  return address;
}

// ─── Byte Array Decoding ──────────────────────────────────────────────────────

/** Convert a fixed-width Anchor byte array to a trimmed UTF-8 string. */
export function decodeBytes(arr: number[] | Uint8Array): string {
  return Buffer.from(arr).toString("utf8").replace(/\0/g, "").trim();
}

// ─── Market Account Decoding ──────────────────────────────────────────────────

/** Convert the raw Anchor-decoded Market account into a MarketSummary. */
export function decodeMarketSummary(
  pubkey: PublicKey,
  account: Record<string, unknown>
): MarketSummary {
  // Anchor enums: { pending: {} } / { active: {} } etc.
  const statusKey = Object.keys(account.status as object)[0].toLowerCase();
  const typeKey = Object.keys(account.marketType as object)[0].toLowerCase();
  const numOutcomes = account.numOutcomes as number;
  const outcomeLabelsRaw = account.outcomeLabels as number[][];

  const statusMap: Record<string, MarketStatus> = {
    pending: "pending",
    active: "active",
    closed: "closed",
    resolved: "resolved",
    cancelled: "cancelled",
    expired: "expired",
  };

  return {
    publicKey: pubkey.toBase58(),
    marketId: (account.marketId as BN).toString(),
    title: decodeBytes(account.title as number[]),
    fredSeriesId: decodeBytes(account.fredSeriesId as number[]),
    status: (statusMap[statusKey] ?? "pending") as MarketStatus,
    marketType: (typeKey === "binary" ? "binary" : "multiOutcome") as MarketType,
    numOutcomes,
    outcomeLabels: outcomeLabelsRaw
      .slice(0, numOutcomes)
      .map((label) => decodeBytes(label)),
    closesAt: (account.closesAt as BN).toNumber(),
    resolvesAt: (account.resolvesAt as BN).toNumber(),
    totalSetsMinted: (account.totalSetsMinted as BN).toString(),
  };
}

/** Convert the raw Anchor-decoded Market account into a MarketDetail. */
export function decodeMarketDetail(
  pubkey: PublicKey,
  account: Record<string, unknown>
): MarketDetail {
  const summary = decodeMarketSummary(pubkey, account);
  const numOutcomes = account.numOutcomes as number;
  const outcomeMints = (account.outcomeMints as Array<{ toBase58(): string } | string>)
    .slice(0, numOutcomes)
    .map((pk) => (typeof pk === "string" ? pk : pk.toBase58()));

  // Anchor 0.30.x serializes Rust Option<T> as: null (None) or the value directly (Some)
  const winningOutcome = account.winningOutcome as number | null;
  const resolvedAt = account.resolvedAt as BN | null;
  const initializedOutcomes = account.initializedOutcomes as number;

  return {
    ...summary,
    proposer: (account.proposer as { toBase58(): string }).toBase58(),
    description: decodeBytes(account.description as number[]),
    outcomeMints,
    resolutionSourceUrl: decodeBytes(account.resolutionSourceUrl as number[]),
    tokenMint: (account.tokenMint as { toBase58(): string }).toBase58(),
    vault: (account.vault as { toBase58(): string }).toBase58(),
    winningOutcome: winningOutcome ?? null,
    createdAt: (account.createdAt as BN).toNumber(),
    resolvedAt: resolvedAt ? resolvedAt.toNumber() : null,
    initializedOutcomes,
  };
}

// ─── Resolution Condition Builder ────────────────────────────────────────────

/**
 * Build the on-chain ResolutionCondition from a MarketPotential + custom outcomes.
 *
 * Multi-outcome range markets → ExactRange condition
 * Binary/direction markets → ThresholdAbove with current metric as threshold
 */
export function buildResolutionCondition(
  potential: MarketPotential,
  customOutcomes: GeneratedOutcome[]
): {
  conditionType: Record<string, object>;
  thresholdValue: BN;
  comparison: Record<string, object>;
  rangeLow: BN;
  rangeHigh: BN;
  rangeStep: BN;
  observationDate: BN;
} {
  const { entry, derivedMetric } = potential;
  const observationDate = new BN(
    Math.floor(Date.now() / 1000) + entry.resolvesAtOffsetDays * 86400
  );

  const hasRanges = customOutcomes.some(
    (o) => o.bracketLow !== null || o.bracketHigh !== null
  );

  if (hasRanges) {
    // Multi-outcome range market
    const lows = customOutcomes
      .map((o) => o.bracketLow)
      .filter((v): v is number => v !== null);
    const highs = customOutcomes
      .map((o) => o.bracketHigh)
      .filter((v): v is number => v !== null);

    const rangeLow = lows.length > 0 ? Math.min(...lows) : 0;
    const rangeHigh = highs.length > 0 ? Math.max(...highs) : 0;
    const rangeStep = entry.bracketSize;

    return {
      conditionType: { exactRange: {} },
      thresholdValue: new BN(0),
      comparison: { equal: {} },
      rangeLow: new BN(Math.round(rangeLow * 10000)),
      rangeHigh: new BN(Math.round(rangeHigh * 10000)),
      rangeStep: new BN(Math.round(rangeStep * 10000)),
      observationDate,
    };
  } else {
    // Binary / direction market — threshold at current derived metric
    return {
      conditionType: { thresholdAbove: {} },
      thresholdValue: new BN(Math.round(derivedMetric * 10000)),
      comparison: { greaterThan: {} },
      rangeLow: new BN(0),
      rangeHigh: new BN(0),
      rangeStep: new BN(0),
      observationDate,
    };
  }
}

// ─── Re-exports for convenience ───────────────────────────────────────────────

export { SystemProgram };
