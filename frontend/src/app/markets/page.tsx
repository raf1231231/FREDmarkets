"use client";

import { useState } from "react";
import Link from "next/link";
import PageHeader from "@/components/ui/PageHeader";
import Button from "@/components/ui/Button";
import MarketCard from "@/components/market/MarketCard";
import MarketCalendar from "@/components/market/MarketCalendar";
import { MarketStatus, MarketSummary } from "@/types/market";

type ViewMode = "list" | "calendar";
type CalendarDateField = "closesAt" | "resolvesAt";

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
  const [viewMode, setViewMode] = useState<ViewMode>("list");
  const [calendarDateField, setCalendarDateField] = useState<CalendarDateField>("closesAt");

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

      {/* View controls */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-4">
        {/* Status filter tabs */}
        <div className="flex gap-1 overflow-x-auto">
          {STATUS_TABS.map((tab) => (
            <button
              key={tab.value}
              onClick={() => setActiveTab(tab.value)}
              className={`px-4 py-2 text-sm font-medium rounded-md transition-colors whitespace-nowrap ${
                activeTab === tab.value
                  ? "bg-fred-blue text-white"
                  : "text-fred-gray-600 hover:text-fred-gray-800 hover:bg-fred-gray-100"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* View mode toggle */}
        <div className="flex items-center gap-2">
          {viewMode === "calendar" && (
            <select
              value={calendarDateField}
              onChange={(e) => setCalendarDateField(e.target.value as CalendarDateField)}
              className="text-sm px-3 py-2 border border-fred-gray-300 rounded-md text-fred-gray-700 focus:outline-none focus:ring-2 focus:ring-fred-blue"
            >
              <option value="closesAt">By Close Date</option>
              <option value="resolvesAt">By Resolution Date</option>
            </select>
          )}
          <div className="flex rounded-md border border-fred-gray-300 overflow-hidden">
            <button
              onClick={() => setViewMode("list")}
              className={`px-3 py-2 text-sm font-medium flex items-center gap-2 transition-colors ${
                viewMode === "list"
                  ? "bg-fred-blue text-white"
                  : "bg-white text-fred-gray-600 hover:bg-fred-gray-50"
              }`}
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 10h16M4 14h16M4 18h16" />
              </svg>
              List
            </button>
            <button
              onClick={() => setViewMode("calendar")}
              className={`px-3 py-2 text-sm font-medium flex items-center gap-2 transition-colors border-l border-fred-gray-300 ${
                viewMode === "calendar"
                  ? "bg-fred-blue text-white"
                  : "bg-white text-fred-gray-600 hover:bg-fred-gray-50"
              }`}
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              Calendar
            </button>
          </div>
        </div>
      </div>

      {/* Content */}
      {filtered.length === 0 ? (
        <div className="text-center text-sm text-fred-gray-600 py-16 border border-dashed border-fred-gray-300 rounded-[5px] bg-white">
          No markets found for this filter.
        </div>
      ) : viewMode === "calendar" ? (
        <MarketCalendar markets={filtered} dateField={calendarDateField} />
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
