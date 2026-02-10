"use client";

import { useState } from "react";
import Link from "next/link";
import PageHeader from "@/components/ui/PageHeader";
import Button from "@/components/ui/Button";
import MarketCard from "@/components/market/MarketCard";
import { MarketStatus, MarketSummary } from "@/types/market";

const STATUS_TABS: { label: string; value: MarketStatus | "all" }[] = [
  { label: "All", value: "all" },
  { label: "Pending", value: "pending" },
  { label: "Active", value: "active" },
  { label: "Closed", value: "closed" },
  { label: "Resolved", value: "resolved" },
];

// Placeholder mock data for demonstration
const MOCK_MARKETS: MarketSummary[] = [
  {
    publicKey: "demo1",
    marketId: "0",
    title: "Will CPI exceed 3.5% in March 2026?",
    fredSeriesId: "CPIAUCSL",
    status: "active",
    marketType: "binary",
    numOutcomes: 2,
    outcomeLabels: ["Yes", "No"],
    closesAt: Math.floor(Date.now() / 1000) + 86400 * 30,
    resolvesAt: Math.floor(Date.now() / 1000) + 86400 * 45,
    totalSetsMinted: "500000000",
  },
  {
    publicKey: "demo2",
    marketId: "1",
    title: "Unemployment rate Q2 2026 range",
    fredSeriesId: "UNRATE",
    status: "pending",
    marketType: "multiOutcome",
    numOutcomes: 3,
    outcomeLabels: ["Below 3.5%", "3.5% - 4.0%", "Above 4.0%"],
    closesAt: Math.floor(Date.now() / 1000) + 86400 * 60,
    resolvesAt: Math.floor(Date.now() / 1000) + 86400 * 90,
    totalSetsMinted: "0",
  },
];

export default function MarketsPage() {
  const [activeTab, setActiveTab] = useState<MarketStatus | "all">("all");

  const filtered =
    activeTab === "all"
      ? MOCK_MARKETS
      : MOCK_MARKETS.filter((m) => m.status === activeTab);

  return (
    <div>
      <PageHeader
        title="Markets"
        subtitle="Browse prediction markets on FRED economic data"
        action={
          <Link href="/create">
            <Button>Create Market</Button>
          </Link>
        }
      />

      {/* Status filter tabs */}
      <div className="flex gap-1 mb-6 border-b border-fred-gray-200">
        {STATUS_TABS.map((tab) => (
          <button
            key={tab.value}
            onClick={() => setActiveTab(tab.value)}
            className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors cursor-pointer ${
              activeTab === tab.value
                ? "border-fred-blue text-fred-blue"
                : "border-transparent text-fred-gray-600 hover:text-fred-gray-800"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Market grid */}
      {filtered.length === 0 ? (
        <div className="text-center text-sm text-fred-gray-600 py-16 border border-dashed border-fred-gray-300 rounded-[5px]">
          No markets found for this filter.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((market) => (
            <MarketCard key={market.publicKey} market={market} />
          ))}
        </div>
      )}
    </div>
  );
}
