import type { SeriesCatalogEntry } from "@/data/seriesCatalog";
import type { GeneratedOutcome, MarketPotential } from "@/types/cloud";

interface Observation {
  date: string;
  value: string;
}

function parseValue(obs: Observation): number | null {
  if (!obs || obs.value === ".") return null;
  const v = parseFloat(obs.value);
  return isNaN(v) ? null : v;
}

// Find latest valid observation
function latestValid(observations: Observation[]): { value: number; date: string } | null {
  for (const obs of observations) {
    const v = parseValue(obs);
    if (v !== null) return { value: v, date: obs.date };
  }
  return null;
}

// ────────────────────────────────────────────────────
// Metric computation (latest value only)
// ────────────────────────────────────────────────────

function computeYoYPercent(observations: Observation[]): number | null {
  const valid = observations.filter((o) => o.value !== ".");
  if (valid.length < 2) return null;

  const current = parseValue(valid[0]);
  if (current === null) return null;

  const currentDate = new Date(valid[0].date);
  const targetDate = new Date(currentDate);
  targetDate.setFullYear(targetDate.getFullYear() - 1);

  let closest: { value: number; diff: number } | null = null;
  for (let i = 1; i < valid.length; i++) {
    const v = parseValue(valid[i]);
    if (v === null) continue;
    const d = new Date(valid[i].date);
    const diff = Math.abs(d.getTime() - targetDate.getTime());
    if (!closest || diff < closest.diff) {
      closest = { value: v, diff };
    }
  }

  if (!closest || closest.value === 0) return null;
  return ((current / closest.value) - 1) * 100;
}

function computeMoMAbsolute(observations: Observation[], divisor: number): number | null {
  const valid = observations.filter((o) => o.value !== ".");
  if (valid.length < 2) return null;
  const current = parseValue(valid[0]);
  const previous = parseValue(valid[1]);
  if (current === null || previous === null) return null;
  return (current - previous) / divisor;
}

function computeMoMPercent(observations: Observation[]): number | null {
  const valid = observations.filter((o) => o.value !== ".");
  if (valid.length < 2) return null;
  const current = parseValue(valid[0]);
  const previous = parseValue(valid[1]);
  if (current === null || previous === null || previous === 0) return null;
  return ((current - previous) / Math.abs(previous)) * 100;
}

function computeQoQAnnualized(observations: Observation[]): number | null {
  const valid = observations.filter((o) => o.value !== ".");
  if (valid.length < 2) return null;
  const current = parseValue(valid[0]);
  const previous = parseValue(valid[1]);
  if (current === null || previous === null || previous === 0) return null;
  return (Math.pow(current / previous, 4) - 1) * 100;
}

// ────────────────────────────────────────────────────
// Metric HISTORY: compute a series of historical metric values
// Used to derive volatility for competitive bracket sizing
// ────────────────────────────────────────────────────

function computeMetricHistory(
  entry: SeriesCatalogEntry,
  observations: Observation[]
): number[] {
  const valid = observations.filter((o) => o.value !== ".");
  const divisor = entry.displayDivisor ?? 1;

  switch (entry.questionStyle) {
    case "yoyPercent": {
      // For each observation, find the one ~12 months earlier → YoY%
      const metrics: number[] = [];
      for (let i = 0; i < valid.length; i++) {
        const curr = parseValue(valid[i]);
        if (curr === null) continue;
        const currDate = new Date(valid[i].date);
        const target = new Date(currDate);
        target.setFullYear(target.getFullYear() - 1);

        let best: { value: number; diff: number } | null = null;
        for (let j = i + 1; j < valid.length; j++) {
          const v = parseValue(valid[j]);
          if (v === null) continue;
          const d = new Date(valid[j].date);
          const diff = Math.abs(d.getTime() - target.getTime());
          if (!best || diff < best.diff) best = { value: v, diff };
        }
        // Accept if match is within 45 days of target
        if (best && best.value !== 0 && best.diff < 45 * 86400000) {
          metrics.push(((curr / best.value) - 1) * 100);
        }
      }
      return metrics;
    }

    case "momAbsolute": {
      const metrics: number[] = [];
      for (let i = 0; i < valid.length - 1; i++) {
        const curr = parseValue(valid[i]);
        const prev = parseValue(valid[i + 1]);
        if (curr !== null && prev !== null) {
          metrics.push((curr - prev) / divisor);
        }
      }
      return metrics;
    }

    case "momPercent": {
      const metrics: number[] = [];
      for (let i = 0; i < valid.length - 1; i++) {
        const curr = parseValue(valid[i]);
        const prev = parseValue(valid[i + 1]);
        if (curr !== null && prev !== null && prev !== 0) {
          metrics.push(((curr - prev) / Math.abs(prev)) * 100);
        }
      }
      return metrics;
    }

    case "level": {
      // For levels, use the raw values (with divisor applied)
      return valid
        .map((o) => {
          const v = parseValue(o);
          return v !== null ? v / divisor : NaN;
        })
        .filter((v) => !isNaN(v));
    }

    case "qoqAnnualized": {
      const metrics: number[] = [];
      for (let i = 0; i < valid.length - 1; i++) {
        const curr = parseValue(valid[i]);
        const prev = parseValue(valid[i + 1]);
        if (curr !== null && prev !== null && prev !== 0) {
          metrics.push((Math.pow(curr / prev, 4) - 1) * 100);
        }
      }
      return metrics;
    }

    default:
      return [];
  }
}

// ────────────────────────────────────────────────────
// Statistical helpers
// ────────────────────────────────────────────────────

function stdDev(values: number[]): number {
  if (values.length < 2) return 0;
  const mean = values.reduce((s, v) => s + v, 0) / values.length;
  const variance = values.reduce((s, v) => s + (v - mean) ** 2, 0) / (values.length - 1);
  return Math.sqrt(variance);
}

// Normal distribution z-scores for equal-probability quantiles.
// For N total outcomes, boundaries sit at percentiles 1/N, 2/N, ..., (N-1)/N.
// These z-scores come from the inverse normal CDF.
const QUANTILE_Z: Record<number, number[]> = {
  3: [-0.4307, 0.4307],                              // 33.3%, 66.7%
  4: [-0.6745, 0, 0.6745],                            // 25%, 50%, 75%
  5: [-0.8416, -0.2533, 0.2533, 0.8416],              // 20%, 40%, 60%, 80%
  6: [-0.9674, -0.4307, 0, 0.4307, 0.9674],           // 16.7% .. 83.3%
  7: [-1.0676, -0.5659, -0.1800, 0.1800, 0.5659, 1.0676],
};

// ────────────────────────────────────────────────────
// Formatting
// ────────────────────────────────────────────────────

function roundToBracket(value: number, bracketSize: number): number {
  return Math.round(value / bracketSize) * bracketSize;
}

export function fmt(n: number, decimals = 1): string {
  if (Math.abs(n) >= 10000) {
    return Math.round(n).toLocaleString("en-US");
  }
  return parseFloat(n.toFixed(decimals)).toString();
}

// ────────────────────────────────────────────────────
// Competitive bracket generation
// ────────────────────────────────────────────────────

/**
 * Generate brackets using historical volatility so each outcome has
 * roughly equal probability (~1/N for N outcomes).
 *
 * Approach:
 *   1. Compute σ (std dev) of the metric's recent history
 *   2. Place boundaries at z-score quantile points: μ + z·σ
 *   3. Round boundaries to bracketSize for clean labels
 *   4. Ensure no two boundaries collapse to the same value
 */
function generateCompetitiveBrackets(
  currentMetric: number,
  metricHistory: number[],
  bracketSize: number,
  bracketCount: number,
  units: string
): GeneratedOutcome[] {
  const totalOutcomes = bracketCount + 2; // inner brackets + 2 tails
  const zScores = QUANTILE_Z[totalOutcomes];

  // Fall back to fixed brackets if we lack z-scores or enough history
  if (!zScores || metricHistory.length < 4) {
    return generateFixedBrackets(currentMetric, bracketSize, bracketCount, units);
  }

  const sigma = stdDev(metricHistory);

  // If volatility is negligibly small, fall back to fixed brackets
  if (sigma < bracketSize * 0.1) {
    return generateFixedBrackets(currentMetric, bracketSize, bracketCount, units);
  }

  // Use at least bracketSize as the effective std dev to prevent overly tight bands
  const effectiveSigma = Math.max(sigma, bracketSize);

  // Raw quantile boundaries: center ± z·σ
  const rawBoundaries = zScores.map((z) => currentMetric + z * effectiveSigma);

  // Round to bracketSize for clean labels, then ensure uniqueness
  const rounded = rawBoundaries.map((b) => roundToBracket(b, bracketSize));
  const boundaries = ensureUniqueBoundaries(rounded, bracketSize);

  return boundariesToOutcomes(boundaries, units);
}

/**
 * After rounding, consecutive boundaries can collapse to the same value.
 * Walk forward and bump any collision up by bracketSize.
 */
function ensureUniqueBoundaries(sorted: number[], bracketSize: number): number[] {
  const result = [sorted[0]];
  for (let i = 1; i < sorted.length; i++) {
    const prev = result[result.length - 1];
    if (sorted[i] <= prev) {
      result.push(prev + bracketSize);
    } else {
      result.push(sorted[i]);
    }
  }
  return result;
}

/**
 * Extract the boundary fence-post values from a GeneratedOutcome array.
 * E.g. [<2.5%, 2.5-3%, 3-3.5%, >3.5%] → [2.5, 3, 3.5]
 */
export function extractBoundaries(outcomes: GeneratedOutcome[]): number[] {
  return outcomes
    .slice(0, -1)
    .map((o) => o.bracketHigh)
    .filter((v): v is number => v !== null);
}

/**
 * Convert an ordered array of boundary values into GeneratedOutcome[].
 * Produces: lower tail, N-1 inner brackets, upper tail.
 */
export function boundariesToOutcomes(boundaries: number[], units: string): GeneratedOutcome[] {
  const outcomes: GeneratedOutcome[] = [];

  // Lower tail
  outcomes.push({
    label: `<${fmt(boundaries[0])}${units}`,
    bracketLow: null,
    bracketHigh: boundaries[0],
  });

  // Inner brackets
  for (let i = 0; i < boundaries.length - 1; i++) {
    outcomes.push({
      label: `${fmt(boundaries[i])}-${fmt(boundaries[i + 1])}${units}`,
      bracketLow: boundaries[i],
      bracketHigh: boundaries[i + 1],
    });
  }

  // Upper tail
  outcomes.push({
    label: `>${fmt(boundaries[boundaries.length - 1])}${units}`,
    bracketLow: boundaries[boundaries.length - 1],
    bracketHigh: null,
  });

  return outcomes;
}

// ────────────────────────────────────────────────────
// Fixed-width fallback (original approach)
// ────────────────────────────────────────────────────

function generateFixedBrackets(
  metric: number,
  bracketSize: number,
  bracketCount: number,
  units: string
): GeneratedOutcome[] {
  const center = roundToBracket(metric, bracketSize);
  const halfCount = Math.floor(bracketCount / 2);
  const lowStart = center - halfCount * bracketSize;

  const boundaries: number[] = [];
  for (let i = 0; i <= bracketCount; i++) {
    boundaries.push(lowStart + i * bracketSize);
  }

  return boundariesToOutcomes(boundaries, units);
}

// Direction outcomes for FOMC — inherently competitive, no change needed
function generateDirectionOutcomes(): GeneratedOutcome[] {
  return [
    { label: "Cut", bracketLow: null, bracketHigh: 0 },
    { label: "Hold", bracketLow: 0, bracketHigh: 0 },
    { label: "Hike", bracketLow: 0, bracketHigh: null },
  ];
}

// ────────────────────────────────────────────────────
// Main entry point
// ────────────────────────────────────────────────────

export function generateMarketPotential(
  entry: SeriesCatalogEntry,
  observations: Observation[]
): MarketPotential | null {
  if (!observations || observations.length === 0) return null;

  const latest = latestValid(observations);
  if (!latest) return null;

  const divisor = entry.displayDivisor ?? 1;
  const displayValue = latest.value / divisor;

  // Compute the full metric history for volatility estimation
  const metricHistory = computeMetricHistory(entry, observations);

  let derivedMetric: number | null = null;
  let derivedMetricLabel = "";
  let outcomes: GeneratedOutcome[] = [];

  switch (entry.questionStyle) {
    case "yoyPercent": {
      derivedMetric = computeYoYPercent(observations);
      if (derivedMetric === null) return null;
      derivedMetricLabel = `${fmt(derivedMetric)}% YoY`;
      outcomes = generateCompetitiveBrackets(
        derivedMetric, metricHistory, entry.bracketSize, entry.bracketCount, entry.units
      );
      break;
    }

    case "momAbsolute": {
      derivedMetric = computeMoMAbsolute(observations, divisor);
      if (derivedMetric === null) return null;
      derivedMetricLabel = `${derivedMetric >= 0 ? "+" : ""}${fmt(derivedMetric, 0)}${entry.units} MoM`;
      outcomes = generateCompetitiveBrackets(
        derivedMetric, metricHistory, entry.bracketSize, entry.bracketCount, entry.units
      );
      break;
    }

    case "level": {
      derivedMetric = displayValue;
      derivedMetricLabel = `${fmt(derivedMetric)}${entry.units}`;
      outcomes = generateCompetitiveBrackets(
        derivedMetric, metricHistory, entry.bracketSize, entry.bracketCount, entry.units
      );
      break;
    }

    case "direction": {
      derivedMetric = displayValue;
      derivedMetricLabel = `${fmt(derivedMetric, 2)}${entry.units}`;
      outcomes = generateDirectionOutcomes();
      break;
    }

    case "momPercent": {
      derivedMetric = computeMoMPercent(observations);
      if (derivedMetric === null) return null;
      derivedMetricLabel = `${derivedMetric >= 0 ? "+" : ""}${fmt(derivedMetric)}% MoM`;
      outcomes = generateCompetitiveBrackets(
        derivedMetric, metricHistory, entry.bracketSize, entry.bracketCount, entry.units
      );
      break;
    }

    case "qoqAnnualized": {
      derivedMetric = computeQoQAnnualized(observations);
      if (derivedMetric === null) return null;
      derivedMetricLabel = `${derivedMetric >= 0 ? "+" : ""}${fmt(derivedMetric)}% QoQ ann.`;
      outcomes = generateCompetitiveBrackets(
        derivedMetric, metricHistory, entry.bracketSize, entry.bracketCount, entry.units
      );
      break;
    }

    default:
      return null;
  }

  return {
    entry,
    question: entry.questionTemplate,
    outcomes,
    latestValue: displayValue,
    latestDate: latest.date,
    derivedMetric,
    derivedMetricLabel,
    observations,
  };
}
