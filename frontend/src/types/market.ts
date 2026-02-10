export type MarketStatus =
  | "pending"
  | "active"
  | "closed"
  | "resolved"
  | "cancelled"
  | "expired";

export type MarketType = "binary" | "multiOutcome";

export interface MarketSummary {
  publicKey: string;
  marketId: string;
  title: string;
  fredSeriesId: string;
  status: MarketStatus;
  marketType: MarketType;
  numOutcomes: number;
  outcomeLabels: string[];
  closesAt: number;   // unix timestamp
  resolvesAt: number;
  totalSetsMinted: string;
}

export interface MarketDetail extends MarketSummary {
  proposer: string;
  description: string;
  outcomeMints: string[];
  resolutionSourceUrl: string;
  tokenMint: string;
  vault: string;
  winningOutcome: number | null;
  createdAt: number;
  resolvedAt: number | null;
  initializedOutcomes: number;
}
