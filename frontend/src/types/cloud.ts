import type { SeriesCatalogEntry, CloudCategory } from "@/data/seriesCatalog";

export interface GeneratedOutcome {
  label: string;
  bracketLow: number | null;
  bracketHigh: number | null;
}

export interface MarketPotential {
  entry: SeriesCatalogEntry;
  question: string;
  outcomes: GeneratedOutcome[];
  latestValue: number;
  latestDate: string;
  derivedMetric: number;
  derivedMetricLabel: string;
  observations: Array<{ date: string; value: string }>;
}

export interface SponsorFormState {
  stakeAmount: number; // USDC (user-facing, not base units)
  odds: number[]; // basis points per outcome, sum to 10000
  potential: MarketPotential;
  customOutcomes: GeneratedOutcome[]; // user-modified outcome ranges
}
