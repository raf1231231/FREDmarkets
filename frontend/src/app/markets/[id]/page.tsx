"use client";

import { use } from "react";
import Link from "next/link";
import PageHeader from "@/components/ui/PageHeader";
import Card from "@/components/ui/Card";
import MarketStatusBadge from "@/components/market/MarketStatusBadge";
import OutcomeBar from "@/components/market/OutcomeBar";
import { shortenAddress } from "@/lib/utils";
import FredSeriesCard from "@/components/fred/FredSeriesCard";
import FredObservationTable from "@/components/fred/FredObservationTable";
import { useOnChainMarket } from "@/hooks/useOnChainMarket";
import { explorerUrl } from "@/lib/constants";

function formatTimestamp(unixSec: number): string {
  return new Date(unixSec * 1000).toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

function formatUsdcAmount(baseUnits: string): string {
  const n = Number(BigInt(baseUnits));
  return (n / 1_000_000).toLocaleString("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 0,
  });
}

export default function MarketDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const { market, loading, error, refetch } = useOnChainMarket(id);

  // Loading skeleton
  if (loading) {
    return (
      <div>
        <div className="h-16 bg-fred-gray-100 animate-pulse rounded-[5px] mb-6" />
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            <div className="h-48 bg-fred-gray-100 animate-pulse rounded-[5px]" />
            <div className="h-32 bg-fred-gray-100 animate-pulse rounded-[5px]" />
          </div>
          <div className="space-y-6">
            <div className="h-40 bg-fred-gray-100 animate-pulse rounded-[5px]" />
            <div className="h-40 bg-fred-gray-100 animate-pulse rounded-[5px]" />
          </div>
        </div>
      </div>
    );
  }

  // Error / not found
  if (error || !market) {
    return (
      <div>
        <PageHeader
          title="Market Not Found"
          subtitle={`Could not load market: ${shortenAddress(id, 8)}`}
        />
        <Card>
          <div className="text-center py-10">
            <p className="text-fred-gray-600 mb-2">
              {error ?? "This market could not be found on-chain."}
            </p>
            <div className="flex justify-center gap-4 mt-4">
              <button
                onClick={refetch}
                className="text-sm text-fred-link underline hover:no-underline"
              >
                Try again
              </button>
              <Link
                href="/markets"
                className="text-sm text-fred-link underline hover:no-underline"
              >
                Browse markets
              </Link>
            </div>
          </div>
        </Card>
      </div>
    );
  }

  // Compute implied probabilities from totalSetsMinted (equal weight fallback)
  // In a real orderbook, probabilities come from best bid prices.
  const equalProb = Math.round(100 / market.numOutcomes);

  return (
    <div>
      <PageHeader
        title={market.title}
        subtitle={`${market.fredSeriesId} · PDA: ${shortenAddress(id, 8)}`}
      />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* ── Main content ─────────────────────────────────────── */}
        <div className="lg:col-span-2 space-y-6">

          {/* Market Information */}
          <Card title="Market Information">
            <div className="space-y-3 text-sm">
              <div className="flex justify-between">
                <span className="text-fred-gray-600">Status</span>
                <MarketStatusBadge status={market.status} />
              </div>
              <div className="flex justify-between">
                <span className="text-fred-gray-600">FRED Series</span>
                <a
                  href={market.resolutionSourceUrl || `https://fred.stlouisfed.org/series/${market.fredSeriesId}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="font-mono text-fred-link hover:underline"
                >
                  {market.fredSeriesId}
                </a>
              </div>
              <div className="flex justify-between">
                <span className="text-fred-gray-600">Type</span>
                <span className="capitalize">
                  {market.marketType === "binary" ? "Binary" : "Multi-Outcome"}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-fred-gray-600">Outcomes</span>
                <span>{market.numOutcomes}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-fred-gray-600">Closes</span>
                <span>{formatTimestamp(market.closesAt)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-fred-gray-600">Resolves</span>
                <span>{formatTimestamp(market.resolvesAt)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-fred-gray-600">Total Liquidity</span>
                <span className="font-mono">
                  {formatUsdcAmount(market.totalSetsMinted)}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-fred-gray-600">Proposer</span>
                <a
                  href={explorerUrl(market.proposer, "address")}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="font-mono text-fred-link hover:underline"
                >
                  {shortenAddress(market.proposer)}
                </a>
              </div>
              {market.description && (
                <p className="text-fred-gray-600 pt-2 border-t border-fred-gray-200 leading-relaxed">
                  {market.description}
                </p>
              )}
            </div>
          </Card>

          {/* Outcomes */}
          <Card title="Outcomes">
            <div className="space-y-3">
              {market.outcomeLabels.map((label, i) => (
                <OutcomeBar
                  key={i}
                  label={label}
                  probability={equalProb}
                />
              ))}
            </div>
            <p className="text-xs text-fred-gray-600 mt-3">
              Implied probability shown — live prices available once trading begins.
            </p>
          </Card>

          {/* Resolution info (if resolved) */}
          {market.status === "resolved" && market.winningOutcome !== null && (
            <Card title="Resolution">
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-fred-gray-600">Winning Outcome</span>
                  <span className="font-semibold text-green-700">
                    {market.outcomeLabels[market.winningOutcome] ?? `Outcome ${market.winningOutcome}`}
                  </span>
                </div>
                {market.resolvedAt && (
                  <div className="flex justify-between">
                    <span className="text-fred-gray-600">Resolved At</span>
                    <span>{formatTimestamp(market.resolvedAt)}</span>
                  </div>
                )}
              </div>
            </Card>
          )}
        </div>

        {/* ── Sidebar ───────────────────────────────────────────── */}
        <div className="space-y-6">
          {/* Order Book placeholder — trading hooks for Phase 2+ */}
          <Card title="Order Book">
            <div className="text-center py-6">
              <p className="text-sm text-fred-gray-600">
                {market.status === "active"
                  ? "Order book data loading — trading coming soon."
                  : market.status === "pending"
                  ? "Market is pending initialization."
                  : market.status === "resolved"
                  ? "Market resolved. Claim your winnings."
                  : "Trading is closed."}
              </p>
              {market.status === "active" && (
                <p className="text-xs text-fred-gray-500 mt-2">
                  Market ID #{market.marketId}
                </p>
              )}
            </div>
          </Card>

          {/* On-chain links */}
          <Card title="On-Chain">
            <div className="space-y-2 text-sm">
              <a
                href={explorerUrl(id, "address")}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-between text-fred-link hover:underline"
              >
                <span>Market Account</span>
                <span className="text-xs">↗</span>
              </a>
              {market.vault && (
                <a
                  href={explorerUrl(market.vault, "address")}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-between text-fred-link hover:underline"
                >
                  <span>USDC Vault</span>
                  <span className="text-xs">↗</span>
                </a>
              )}
            </div>
          </Card>

          {/* FRED data cards */}
          <FredSeriesCard seriesId={market.fredSeriesId} />
          <FredObservationTable seriesId={market.fredSeriesId} limit={8} />
        </div>
      </div>
    </div>
  );
}
