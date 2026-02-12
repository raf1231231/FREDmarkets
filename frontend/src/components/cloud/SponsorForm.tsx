"use client";

import { useState, useCallback, useMemo } from "react";
import type { MarketPotential, SponsorFormState, GeneratedOutcome } from "@/types/cloud";
import { extractBoundaries, boundariesToOutcomes } from "@/lib/outcomeGenerator";
import OddsSlider from "./OddsSlider";

interface SponsorFormProps {
  potential: MarketPotential;
  onSubmit: (state: SponsorFormState) => void;
}

const MIN_BPS_PER_OUTCOME = 100; // 1% minimum per outcome
const MIN_OUTCOMES = 2;
const MAX_OUTCOMES = 8;

const OUTCOME_COLORS = [
  "#3b82f6", "#ef4444", "#10b981", "#f59e0b",
  "#8b5cf6", "#ec4899", "#14b8a6", "#6366f1",
];

function makeEqualOdds(count: number): number[] {
  const odds = Array.from({ length: count }, () => Math.floor(10000 / count));
  odds[0] += 10000 - odds.reduce((a, b) => a + b, 0);
  return odds;
}

export default function SponsorForm({ potential, onSubmit }: SponsorFormProps) {
  const { entry, outcomes: autoOutcomes } = potential;
  const isDirection = entry.questionStyle === "direction";
  const units = entry.units;

  // Extract boundaries from auto-generated outcomes as the initial state
  const autoBoundaries = useMemo(
    () => extractBoundaries(autoOutcomes),
    [autoOutcomes]
  );

  const [boundaries, setBoundaries] = useState<number[]>(autoBoundaries);
  const [stakeAmount, setStakeAmount] = useState(100);

  // Derive outcomes from boundaries (or use fixed outcomes for direction style)
  const customOutcomes: GeneratedOutcome[] = useMemo(() => {
    if (isDirection) return autoOutcomes;
    return boundariesToOutcomes(boundaries, units);
  }, [boundaries, units, isDirection, autoOutcomes]);

  const numOutcomes = customOutcomes.length;
  const [odds, setOdds] = useState<number[]>(() => makeEqualOdds(autoOutcomes.length));

  // Keep odds array in sync when outcome count changes
  const syncedOdds = useMemo(() => {
    if (odds.length === numOutcomes) return odds;
    return makeEqualOdds(numOutcomes);
  }, [odds, numOutcomes]);

  // When outcome count changes, reset odds to equal
  const currentOdds = syncedOdds.length === numOutcomes ? syncedOdds : makeEqualOdds(numOutcomes);

  // ── Boundary editing ───────────────────────────────

  const handleBoundaryChange = useCallback(
    (index: number, value: number) => {
      setBoundaries((prev) => {
        const next = [...prev];
        next[index] = value;
        return next;
      });
    },
    []
  );

  // Validation: boundaries must be strictly ascending
  const boundariesValid = useMemo(() => {
    for (let i = 1; i < boundaries.length; i++) {
      if (boundaries[i] <= boundaries[i - 1]) return false;
    }
    return true;
  }, [boundaries]);

  const handleAddOutcome = useCallback(() => {
    setBoundaries((prev) => {
      if (prev.length + 2 >= MAX_OUTCOMES) return prev; // +2 because outcomes = boundaries + 1, and we're adding 1 boundary
      if (prev.length === 0) {
        // No inner brackets yet — add one at the current metric
        return [potential.derivedMetric];
      }
      // Find the largest gap and split it
      let maxGap = 0;
      let maxIdx = 0;
      for (let i = 0; i < prev.length - 1; i++) {
        const gap = prev[i + 1] - prev[i];
        if (gap > maxGap) {
          maxGap = gap;
          maxIdx = i;
        }
      }
      const midpoint = (prev[maxIdx] + prev[maxIdx + 1]) / 2;
      // Round to bracketSize for clean number
      const rounded =
        Math.round(midpoint / entry.bracketSize) * entry.bracketSize;
      const newBound =
        rounded > prev[maxIdx] && rounded < prev[maxIdx + 1]
          ? rounded
          : midpoint;

      const next = [...prev];
      next.splice(maxIdx + 1, 0, newBound);
      return next;
    });
    // Reset odds to equal when outcomes change
    setOdds((prev) => makeEqualOdds(prev.length + 1));
  }, [potential.derivedMetric, entry.bracketSize]);

  const handleRemoveOutcome = useCallback(
    (boundaryIndex: number) => {
      setBoundaries((prev) => {
        if (prev.length + 1 <= MIN_OUTCOMES) return prev; // outcomes = boundaries.length + 1
        const next = [...prev];
        next.splice(boundaryIndex, 1);
        return next;
      });
      setOdds((prev) => makeEqualOdds(prev.length - 1));
    },
    []
  );

  const handleReset = useCallback(() => {
    setBoundaries(autoBoundaries);
    setOdds(makeEqualOdds(autoBoundaries.length + 1));
  }, [autoBoundaries]);

  // ── Odds update (no redistribution) ────────────────

  const handleOddsChange = useCallback(
    (index: number, newValue: number) => {
      setOdds((prev) => {
        const next = [...prev];
        next[index] = newValue;
        return next;
      });
    },
    []
  );

  // ── Validation ─────────────────────────────────────

  const totalOdds = currentOdds.reduce((a, b) => a + b, 0);
  const isValid =
    stakeAmount >= 10 &&
    totalOdds === 10000 &&
    (isDirection || boundariesValid) &&
    numOutcomes >= MIN_OUTCOMES &&
    numOutcomes <= MAX_OUTCOMES;

  const closesAt = new Date();
  closesAt.setDate(closesAt.getDate() + entry.closesAtOffsetDays);
  const resolvesAt = new Date();
  resolvesAt.setDate(resolvesAt.getDate() + entry.resolvesAtOffsetDays);

  // Step size for boundary inputs
  const step = entry.bracketSize <= 0.1 ? 0.05 : entry.bracketSize / 2;

  return (
    <div className="space-y-3">
      {/* ── Outcome Ranges ────────────────────── */}
      {!isDirection && (
        <div>
          <div className="flex items-center justify-between mb-1.5">
            <label className="block text-xs font-medium text-fred-gray-800">
              Outcome Ranges
            </label>
            <button
              onClick={handleReset}
              className="text-[11px] text-fred-link hover:text-fred-link-hover"
            >
              Reset to suggested
            </button>
          </div>

          <div className="space-y-1">
            {boundaries.map((b, i) => (
              <div key={i} className="flex items-center gap-1.5">
                <input
                  type="number"
                  step={step}
                  value={b}
                  onChange={(e) =>
                    handleBoundaryChange(i, parseFloat(e.target.value) || 0)
                  }
                  className="w-20 border border-fred-gray-200 rounded px-2 py-1 text-sm text-center font-mono focus:outline-none focus:border-fred-link"
                />
                <span className="text-xs text-fred-gray-600">{units}</span>
                {boundaries.length + 1 > MIN_OUTCOMES && (
                  <button
                    onClick={() => handleRemoveOutcome(i)}
                    className="text-fred-gray-400 hover:text-red-500 text-sm leading-none ml-1"
                    title="Remove this boundary"
                  >
                    &times;
                  </button>
                )}
              </div>
            ))}
          </div>

          {!boundariesValid && (
            <p className="text-xs text-red-500 mt-1">
              Boundaries must be in ascending order
            </p>
          )}

          <div className="mt-2 flex gap-2">
            {numOutcomes < MAX_OUTCOMES && (
              <button
                onClick={handleAddOutcome}
                className="text-xs text-fred-link hover:text-fred-link-hover font-medium"
              >
                + Add outcome
              </button>
            )}
          </div>

          {/* Preview chips */}
          <div className="flex flex-wrap gap-1 mt-2">
            {customOutcomes.map((o, i) => (
              <span
                key={i}
                className="text-[11px] px-1.5 py-0.5 rounded-full border border-fred-gray-200 text-fred-gray-700 bg-fred-gray-50"
              >
                {o.label}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* ── Stake Amount ──────────────────────── */}
      <div>
        <label className="block text-xs font-medium text-fred-gray-800 mb-1">
          Stake Amount
        </label>
        <div className="flex items-center gap-2">
          <input
            type="number"
            min={10}
            step={10}
            value={stakeAmount}
            onChange={(e) =>
              setStakeAmount(Math.max(0, parseInt(e.target.value, 10) || 0))
            }
            className="w-full border border-fred-gray-200 rounded-[5px] px-2.5 py-1.5 text-sm focus:outline-none focus:border-fred-link"
          />
          <span className="text-xs text-fred-gray-600 shrink-0">USDC</span>
        </div>
        <p className="text-[10px] text-fred-gray-600 mt-0.5">
          You receive shares proportional to odds set
        </p>
      </div>

      {/* ── Initial Odds ──────────────────────── */}
      <div>
        <label className="block text-xs font-medium text-fred-gray-800 mb-1.5">
          Initial Odds
        </label>
        <div className="space-y-2">
          {customOutcomes.map((outcome, i) => (
            <div key={`${i}-${outcome.label}`} className="space-y-0.5">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-xs text-fred-gray-800 font-medium">{outcome.label}</span>
                  <span className="text-[10px] text-fred-gray-600">
                    (→ {Math.floor(stakeAmount * (currentOdds[i] ?? 0) / 10000)} shares)
                  </span>
                </div>
                <div className="flex items-center gap-1">
                  <input
                    type="number"
                    min={Math.ceil(MIN_BPS_PER_OUTCOME / 100)}
                    max={Math.floor((10000 - MIN_BPS_PER_OUTCOME * (numOutcomes - 1)) / 100)}
                    step={1}
                    value={Math.round((currentOdds[i] ?? 0) / 100)}
                    onChange={(e) => {
                      const percent = parseInt(e.target.value, 10);
                      if (!isNaN(percent) && percent >= Math.ceil(MIN_BPS_PER_OUTCOME / 100) && percent <= 100) {
                        handleOddsChange(i, percent * 100);
                      }
                    }}
                    className="w-14 border border-fred-gray-200 rounded px-1.5 py-1 text-xs text-right font-mono focus:outline-none focus:border-fred-link"
                  />
                  <span className="text-xs text-fred-gray-600">%</span>
                </div>
              </div>
              <OddsSlider
                label=""
                value={currentOdds[i] ?? Math.floor(10000 / numOutcomes)}
                onChange={(v) => handleOddsChange(i, v)}
                color={OUTCOME_COLORS[i % OUTCOME_COLORS.length]}
                hidePercentage={true}
              />
            </div>
          ))}
        </div>
        {totalOdds !== 10000 && (
          <p className="text-[10px] text-red-500 mt-0.5">
            Odds must sum to 100% (currently {Math.round(totalOdds / 100)}%)
          </p>
        )}
      </div>

      {/* ── Resolve Date ────────────── */}
      <div className="border border-fred-link rounded-[5px] p-2 bg-blue-50">
        <div className="flex items-center justify-between gap-2">
          <div>
            <p className="text-[10px] text-fred-gray-600">Resolves</p>
            <p className="text-sm font-bold text-fred-navy">
              {resolvesAt.toLocaleDateString("en-US", {
                month: "short",
                day: "numeric",
              })}
            </p>
          </div>
          <div className="text-right">
            <p className="text-[10px] text-fred-gray-600">Closes</p>
            <p className="text-xs font-semibold text-fred-gray-800">
              {closesAt.toLocaleDateString("en-US", {
                month: "short",
                day: "numeric",
              })}
            </p>
          </div>
          <div className="text-right">
            <p className="text-[10px] text-fred-gray-600">Your fee</p>
            <p className="text-xs font-semibold text-fred-gray-800">60%</p>
          </div>
        </div>
      </div>

      {/* ── Submit ─────────────────────────────── */}
      <button
        disabled={!isValid}
        onClick={() =>
          onSubmit({
            stakeAmount,
            odds: currentOdds,
            potential,
            customOutcomes,
          })
        }
        className="w-full py-2 rounded-[5px] text-sm font-semibold text-white bg-fred-blue hover:bg-fred-link-hover disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
      >
        Sponsor This Market
      </button>
      <p className="text-[10px] text-fred-gray-600 text-center -mt-1">
        Requires {stakeAmount} USDC + SOL for fees
      </p>
    </div>
  );
}
