/**
 * Oracle Relay Service
 *
 * Monitors FRED economic data releases and resolves FREDmarkets prediction
 * markets on-chain. Runs as an embedded cron inside the Express server.
 *
 * Lifecycle per market:
 *   1. close_market  — transition Active → Closed once closes_at passes
 *                      (any signer can call; oracle calls proactively)
 *   2. resolve_market — oracle-only; call once resolves_at passes and FRED
 *                       has published the relevant observation
 *
 * Resolution logic (mirrors on-chain ResolutionCondition):
 *   ThresholdAbove / ThresholdBelow / ChangePercent:
 *     Binary market: outcome 0 = YES (condition met), outcome 1 = NO
 *   ExactRange:
 *     Multi-outcome: bucket index = floor((value − rangeLow) / rangeStep),
 *     clamped to [0, numOutcomes−1]
 *
 * FRED values are stored on-chain as i64 scaled by 10 000.
 * E.g. CPI = 3.55 % → resolutionValue = 35 500
 */

import { Connection, Keypair, PublicKey, clusterApiUrl } from "@solana/web3.js";
import * as anchor from "@coral-xyz/anchor";
import axios from "axios";
import { config } from "../config";
import { prisma } from "../lib/prisma";
import { FRED_MARKETS_IDL } from "../lib/fredMarketsIdl";

// ─── Public Result Types ──────────────────────────────────────────────────────

export interface OracleCloseResult {
  marketId: string;
  tx: string;
}

export interface OracleResolveResult {
  marketId: string;
  fredSeriesId: string;
  fredValue: number;
  winningOutcome: number;
  tx: string;
}

export interface OracleError {
  type: string;
  marketId?: string;
  error: string;
}

export interface OracleCycleResult {
  skipped?: boolean;
  reason?: string;
  closedMarkets: OracleCloseResult[];
  resolvedMarkets: OracleResolveResult[];
  errors: OracleError[];
  runAt: string;
}

// ─── Internal Condition Type ──────────────────────────────────────────────────

interface ParsedCondition {
  conditionType: "thresholdAbove" | "thresholdBelow" | "exactRange" | "changePercent";
  comparison: "greaterThan" | "greaterThanOrEqual" | "lessThan" | "lessThanOrEqual" | "equal";
  /** Threshold value already scaled by 10 000 */
  thresholdValue: number;
  /** Range lower bound scaled by 10 000 */
  rangeLow: number;
  /** Range upper bound scaled by 10 000 */
  rangeHigh: number;
  /** Step size scaled by 10 000 */
  rangeStep: number;
  /** Unix timestamp of the observation period to use */
  observationDate: number;
}

// ─── Module-Level State ───────────────────────────────────────────────────────

let _program: anchor.Program | null = null;
let _wallet: anchor.Wallet | null = null;
let _lastRunAt: Date | null = null;
let _lastError: string | null = null;
let _isRunning = false;

// ─── Initialization ───────────────────────────────────────────────────────────

/**
 * Initialize the oracle using ORACLE_KEYPAIR env var.
 * Supports two key formats:
 *   - Base64 string:  Buffer.from(key, 'base64') → 64 bytes
 *   - JSON array str: JSON.parse(key) → number[64]
 *
 * Returns true if successfully initialized, false if disabled.
 */
export function initOracle(): boolean {
  const { oracleKeypair, solanaRpcUrl, fredMarketsProgramId } = config;

  if (!oracleKeypair) {
    console.warn(
      "⚠️  Oracle: ORACLE_KEYPAIR not set — oracle relay disabled.\n" +
      "   Set ORACLE_KEYPAIR to a base64-encoded 64-byte secret key or a\n" +
      "   JSON array (output of `solana-keygen new --outfile keypair.json`)."
    );
    return false;
  }

  if (!fredMarketsProgramId) {
    console.warn("⚠️  Oracle: FRED_MARKETS_PROGRAM_ID not set — oracle relay disabled.");
    return false;
  }

  try {
    const secretKey = parseKeypair(oracleKeypair);
    const keypair = Keypair.fromSecretKey(secretKey);

    const rpcUrl = solanaRpcUrl || clusterApiUrl("devnet");
    const connection = new Connection(rpcUrl, "confirmed");

    _wallet = new anchor.Wallet(keypair);
    const provider = new anchor.AnchorProvider(connection, _wallet, {
      commitment: "confirmed",
      preflightCommitment: "confirmed",
    });

    const programId = new PublicKey(fredMarketsProgramId);
    _program = new anchor.Program(
      FRED_MARKETS_IDL as unknown as anchor.Idl,
      programId,
      provider
    );

    console.log(
      `✅ Oracle relay initialized\n` +
      `   Authority : ${keypair.publicKey.toBase58()}\n` +
      `   Program   : ${programId.toBase58()}\n` +
      `   RPC       : ${rpcUrl}`
    );
    return true;
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    _lastError = `Init failed: ${message}`;
    console.error("❌ Oracle init failed:", message);
    return false;
  }
}

// ─── Main Cycle ───────────────────────────────────────────────────────────────

/**
 * Run one oracle cycle:
 *   1. Close all Active markets whose closes_at has passed.
 *   2. Resolve all Closed markets whose resolves_at has passed and for which
 *      FRED has published the relevant observation.
 */
export async function runOracleCycle(): Promise<OracleCycleResult> {
  const now = new Date().toISOString();

  if (_isRunning) {
    return {
      skipped: true,
      reason: "previous cycle still running",
      closedMarkets: [],
      resolvedMarkets: [],
      errors: [],
      runAt: now,
    };
  }

  if (!_program || !_wallet) {
    return {
      skipped: true,
      reason: "oracle not initialized — check ORACLE_KEYPAIR env var",
      closedMarkets: [],
      resolvedMarkets: [],
      errors: [],
      runAt: now,
    };
  }

  _isRunning = true;
  const result: OracleCycleResult = {
    closedMarkets: [],
    resolvedMarkets: [],
    errors: [],
    runAt: now,
  };

  console.log(`🔄 Oracle cycle — ${now}`);

  try {
    await closeExpiredMarkets(result);
    await resolveReadyMarkets(result);
    _lastRunAt = new Date();
    _lastError = null;
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    _lastError = message;
    result.errors.push({ type: "cycle_fatal", error: message });
    console.error("❌ Oracle cycle fatal:", message);
  } finally {
    _isRunning = false;
  }

  console.log(
    `   Done — closed: ${result.closedMarkets.length}, ` +
    `resolved: ${result.resolvedMarkets.length}, ` +
    `errors: ${result.errors.length}`
  );

  return result;
}

// ─── Step 1: Close Expired Markets ───────────────────────────────────────────

async function closeExpiredMarkets(result: OracleCycleResult): Promise<void> {
  const markets = await prisma.market.findMany({
    where: { status: "active", closesAt: { lte: new Date() } },
    take: 25,
    orderBy: { closesAt: "asc" },
  });

  if (markets.length === 0) return;
  console.log(`  📋 Closing ${markets.length} expired market(s)`);

  for (const market of markets) {
    try {
      const marketPda = new PublicKey(market.id);

      // Validate PDA before sending tx
      const marketIdBytes = bigintToLeBytes(market.marketId);
      const [expectedPda] = PublicKey.findProgramAddressSync(
        [Buffer.from("market"), marketIdBytes],
        _program!.programId
      );
      if (!expectedPda.equals(marketPda)) {
        const msg = `PDA mismatch: DB=${market.id} expected=${expectedPda.toBase58()}`;
        result.errors.push({ type: "pda_mismatch", marketId: market.id, error: msg });
        console.warn(`  ⚠️  ${msg}`);
        continue;
      }

      const tx = await _program!.methods
        .closeMarket()
        .accounts({ market: marketPda, caller: _wallet!.publicKey })
        .rpc();

      await prisma.market.update({
        where: { id: market.id },
        data: { status: "closed", updatedAt: new Date() },
      });

      console.log(`  ✅ Closed ${short(market.id)} | tx: ${tx}`);
      result.closedMarkets.push({ marketId: market.id, tx });
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : String(err);
      // If the market is already not-Active on-chain, sync DB and move on
      if (isStateError(err as any, "MarketNotActive", 6003)) {
        await syncMarketStatus(market.id).catch(() => {});
        console.log(`  ℹ️  ${short(market.id)} already past Active on-chain — DB synced`);
      } else {
        console.error(`  ❌ close_market ${short(market.id)}: ${message}`);
        result.errors.push({ type: "close_market", marketId: market.id, error: message });
      }
    }
  }
}

// ─── Step 2: Resolve Ready Markets ───────────────────────────────────────────

async function resolveReadyMarkets(result: OracleCycleResult): Promise<void> {
  const markets = await prisma.market.findMany({
    where: { status: "closed", resolvesAt: { lte: new Date() } },
    take: 25,
    orderBy: { resolvesAt: "asc" },
  });

  if (markets.length === 0) return;
  console.log(`  📋 Resolving ${markets.length} market(s)`);

  const [platformConfigPda] = PublicKey.findProgramAddressSync(
    [Buffer.from("platform_config")],
    _program!.programId
  );

  for (const market of markets) {
    try {
      const marketPda = new PublicKey(market.id);

      // Fetch on-chain account — resolution condition lives there, not in DB
      const onChain = (await _program!.account["market"].fetch(marketPda)) as any;

      const fredSeriesId = bufferToUtf8(onChain.fredSeriesId);
      const numOutcomes: number = onChain.numOutcomes;
      const condition = parseResolutionCondition(onChain.resolutionCondition);

      // Vintage-pin: observe on the target date as published by resolves_at
      const observationDate = unixToDate(condition.observationDate);
      const vintageDate     = unixToDate(Math.floor(market.resolvesAt.getTime() / 1000));

      console.log(
        `  🔍 ${short(market.id)} | ${fredSeriesId} obs=${observationDate} vintage=${vintageDate}`
      );

      const fredValue = await fetchFredObservation(fredSeriesId, observationDate, vintageDate);

      if (fredValue === null) {
        const msg = `${fredSeriesId} observation not yet published for ${observationDate}`;
        console.warn(`  ⏳ ${msg} — will retry next cycle`);
        result.errors.push({ type: "no_fred_data", marketId: market.id, error: msg });
        continue;
      }

      // Scale to on-chain representation (integer × 10 000)
      const resolutionValueScaled = Math.round(fredValue * 10_000);
      const winningOutcome = determineWinningOutcome(condition, resolutionValueScaled, numOutcomes);
      const observationTimestamp = Math.floor(
        new Date(observationDate + "T00:00:00Z").getTime() / 1000
      );

      console.log(
        `  📈 ${fredSeriesId}=${fredValue} (${resolutionValueScaled}×10⁴) ` +
        `→ outcome ${winningOutcome}/${numOutcomes - 1}`
      );

      const tx = await _program!.methods
        .resolveMarket(
          winningOutcome,
          new anchor.BN(resolutionValueScaled),
          new anchor.BN(observationTimestamp)
        )
        .accounts({
          market: marketPda,
          platformConfig: platformConfigPda,
          oracleAuthority: _wallet!.publicKey,
        })
        .rpc();

      await prisma.market.update({
        where: { id: market.id },
        data: {
          status: "resolved",
          winningOutcome,
          resolvedAt: new Date(),
          updatedAt: new Date(),
        },
      });

      console.log(`  ✅ Resolved ${short(market.id)} → outcome ${winningOutcome} | tx: ${tx}`);
      result.resolvedMarkets.push({
        marketId: market.id,
        fredSeriesId,
        fredValue,
        winningOutcome,
        tx,
      });
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : String(err);
      // Market may already be resolved on-chain (e.g. resolved by another party)
      if (isStateError(err as any, "MarketNotClosed", 6004) || isStateError(err as any, "MarketAlreadyResolved", 6007)) {
        await syncMarketStatus(market.id).catch(() => {});
        console.log(`  ℹ️  ${short(market.id)} already resolved on-chain — DB synced`);
      } else {
        console.error(`  ❌ resolve_market ${short(market.id)}: ${message}`);
        result.errors.push({ type: "resolve_market", marketId: market.id, error: message });
      }
    }
  }
}

// ─── FRED Data Fetching ───────────────────────────────────────────────────────

/**
 * Fetch a single FRED observation, vintage-pinned to a specific release date.
 *
 * Vintage pinning (realtime_start/end) ensures the oracle uses the value that
 * was publicly available on the resolution date, making outcomes reproducible.
 *
 * Returns the numeric value, or null if not yet published.
 */
async function fetchFredObservation(
  seriesId: string,
  observationDate: string, // YYYY-MM-DD — the data period
  vintageDate: string      // YYYY-MM-DD — pin to this release vintage
): Promise<number | null> {
  try {
    const { data } = await axios.get(
      "https://api.stlouisfed.org/fred/series/observations",
      {
        params: {
          series_id: seriesId,
          realtime_start: vintageDate,
          realtime_end:   vintageDate,
          observation_start: observationDate,
          observation_end:   observationDate,
          sort_order: "desc",
          api_key: config.fredApiKey,
          file_type: "json",
        },
        timeout: 15_000,
      }
    );

    const observations: Array<{ date: string; value: string }> = data.observations ?? [];

    // Prefer exact date match; accept closest available if not found
    let obs = observations.find(
      (o) => o.date === observationDate && isValidFredValue(o.value)
    );

    if (!obs) {
      const fallback = observations.find((o) => isValidFredValue(o.value));
      if (fallback) {
        console.warn(
          `  ⚠️  Exact date ${observationDate} not found for ${seriesId}; ` +
          `using ${fallback.date} as fallback`
        );
        obs = fallback;
      }
    }

    return obs ? parseFloat(obs.value) : null;
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    const axiosErr = err as { response?: { status?: number } };
    // 404 from FRED API means the series or observation doesn't exist yet
    if (axiosErr.response?.status === 400 || axiosErr.response?.status === 404) {
      return null;
    }
    console.error(`  FRED API error for ${seriesId}:`, message);
    return null;
  }
}

// ─── Resolution Logic ──────────────────────────────────────────────────────────

/**
 * Determine the winning outcome index from the on-chain resolution condition.
 *
 * @param condition     Parsed on-chain ResolutionCondition
 * @param observed      FRED value × 10 000 (integer, same scale as on-chain)
 * @param numOutcomes   Total number of outcomes in this market
 */
function determineWinningOutcome(
  condition: ParsedCondition,
  observed: number,
  numOutcomes: number
): number {
  const { conditionType, comparison, thresholdValue, rangeLow, rangeStep } = condition;

  switch (conditionType) {
    case "thresholdAbove":
    case "thresholdBelow":
    case "changePercent": {
      // Binary: outcome 0 = condition satisfied (YES), outcome 1 = NO
      return satisfiesComparison(observed, thresholdValue, comparison) ? 0 : 1;
    }

    case "exactRange": {
      // Multi-outcome: find which price bucket the observed value falls into.
      // bucket 0 covers [rangeLow, rangeLow + rangeStep)
      // bucket N covers [rangeLow + N*rangeStep, ∞)  (last bucket, open-ended)
      if (rangeStep <= 0) {
        console.warn("  ⚠️  rangeStep <= 0; defaulting to outcome 0");
        return 0;
      }
      const bucket = Math.floor((observed - rangeLow) / rangeStep);
      return Math.max(0, Math.min(numOutcomes - 1, bucket));
    }

    default:
      console.warn(`  ⚠️  Unknown conditionType "${conditionType}"; defaulting to 0`);
      return 0;
  }
}

function satisfiesComparison(
  observed: number,
  threshold: number,
  comparison: ParsedCondition["comparison"]
): boolean {
  switch (comparison) {
    case "greaterThan":         return observed > threshold;
    case "greaterThanOrEqual":  return observed >= threshold;
    case "lessThan":            return observed < threshold;
    case "lessThanOrEqual":     return observed <= threshold;
    case "equal":               return observed === threshold;
    default:                    return false;
  }
}

// ─── On-Chain → DB Sync ───────────────────────────────────────────────────────

/**
 * Fetch the market's current on-chain status and push it to the DB.
 * Used when a tx fails because the market is already in the target state
 * (e.g. another party resolved it before us).
 */
async function syncMarketStatus(marketId: string): Promise<void> {
  const marketPda = new PublicKey(marketId);
  const onChain = (await _program!.account["market"].fetch(marketPda)) as any;

  // Anchor returns enums as { variantName: {} }; extract the key
  const statusKey = (Object.keys(onChain.status)[0] as string).toLowerCase();

  const update: Record<string, unknown> = { status: statusKey, updatedAt: new Date() };

  if (statusKey === "resolved") {
    update.winningOutcome =
      onChain.winningOutcome != null ? Number(onChain.winningOutcome) : null;
    update.resolvedAt = onChain.resolvedAt
      ? new Date(Number(onChain.resolvedAt.toString()) * 1000)
      : new Date();
  }

  await prisma.market.update({ where: { id: marketId }, data: update });
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

/** Parse oracle keypair from env — supports base64 string or JSON array. */
function parseKeypair(raw: string): Uint8Array {
  const trimmed = raw.trim();
  if (trimmed.startsWith("[")) {
    // JSON number array: output of `solana-keygen new --outfile keypair.json`
    return new Uint8Array(JSON.parse(trimmed) as number[]);
  }
  // Base64-encoded 64-byte secret key
  return new Uint8Array(Buffer.from(trimmed, "base64"));
}

/** Parse Anchor-deserialized ResolutionCondition into a typed flat object. */
function parseResolutionCondition(raw: any): ParsedCondition {
  const conditionType = (
    Object.keys(raw.conditionType)[0]
  ) as ParsedCondition["conditionType"];
  const comparison = (
    Object.keys(raw.comparison)[0]
  ) as ParsedCondition["comparison"];

  return {
    conditionType,
    comparison,
    thresholdValue:  Number(raw.thresholdValue.toString()),
    rangeLow:        Number(raw.rangeLow.toString()),
    rangeHigh:       Number(raw.rangeHigh.toString()),
    rangeStep:       Number(raw.rangeStep.toString()),
    observationDate: Number(raw.observationDate.toString()),
  };
}

/** Convert a BigInt market ID to a little-endian 8-byte Buffer for PDA seeds. */
function bigintToLeBytes(value: bigint): Buffer {
  const buf = Buffer.allocUnsafe(8);
  buf.writeBigUInt64LE(value);
  return buf;
}

/** Decode a fixed-size UTF-8 byte array from Anchor, stripping null padding. */
function bufferToUtf8(bytes: number[] | Uint8Array): string {
  return Buffer.from(bytes).toString("utf8").replace(/\0/g, "").trim();
}

/** Convert a Unix timestamp to a YYYY-MM-DD string (UTC). */
function unixToDate(unix: number): string {
  return new Date(unix * 1000).toISOString().split("T")[0];
}

/** Shorten a base58 address for readable log output. */
function short(addr: string): string {
  return `${addr.slice(0, 6)}…${addr.slice(-4)}`;
}

/** Check whether a FRED observation value is usable (not missing). */
function isValidFredValue(v: string): boolean {
  return v !== "." && v !== "" && v != null;
}

/**
 * Check if an Anchor/Solana error matches a specific FREDmarkets error.
 * Matches by name (in error message) or by decimal error code.
 *
 * Anchor error codes start at 6000.  The hex representation appears in
 * the raw Solana instruction error message.
 */
function isStateError(err: any, name: string, code: number): boolean {
  const msg: string = err?.message ?? "";
  const hex = `0x${code.toString(16)}`;
  return msg.includes(name) || msg.includes(hex) || msg.includes(String(code));
}

// ─── Status ───────────────────────────────────────────────────────────────────

export interface OracleStatus {
  initialized: boolean;
  oracleAuthority: string | null;
  programId: string | null;
  solanaRpcUrl: string | null;
  lastRunAt: string | null;
  lastError: string | null;
  isRunning: boolean;
}

export function getOracleStatus(): OracleStatus {
  return {
    initialized:     _program !== null,
    oracleAuthority: _wallet?.publicKey.toBase58() ?? null,
    programId:       _program?.programId.toBase58() ?? null,
    solanaRpcUrl:    config.solanaRpcUrl ?? null,
    lastRunAt:       _lastRunAt?.toISOString() ?? null,
    lastError:       _lastError,
    isRunning:       _isRunning,
  };
}
