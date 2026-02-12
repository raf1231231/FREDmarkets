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

// Test markets for demonstration - spread across different dates
const now = Math.floor(Date.now() / 1000);
const day = 86400;

const MOCK_MARKETS: MarketSummary[] = [
  // Active markets - This week
  {
    publicKey: "market_cpi_feb",
    marketId: "1",
    title: "Will CPI YoY exceed 2.8% in February 2026?",
    fredSeriesId: "CPIAUCSL",
    status: "active",
    marketType: "binary",
    numOutcomes: 2,
    outcomeLabels: ["Yes", "No"],
    closesAt: now + day * 3,
    resolvesAt: now + day * 18,
    totalSetsMinted: "2500000000",
  },
  {
    publicKey: "market_jobs_feb",
    marketId: "2",
    title: "February 2026 Nonfarm Payrolls Change",
    fredSeriesId: "PAYEMS",
    status: "active",
    marketType: "multiOutcome",
    numOutcomes: 4,
    outcomeLabels: ["<100K", "100K-200K", "200K-300K", ">300K"],
    closesAt: now + day * 5,
    resolvesAt: now + day * 20,
    totalSetsMinted: "1800000000",
  },
  {
    publicKey: "market_unrate_feb",
    marketId: "3",
    title: "Unemployment Rate February 2026",
    fredSeriesId: "UNRATE",
    status: "active",
    marketType: "multiOutcome",
    numOutcomes: 3,
    outcomeLabels: ["<4.0%", "4.0%-4.2%", ">4.2%"],
    closesAt: now + day * 5,
    resolvesAt: now + day * 20,
    totalSetsMinted: "1200000000",
  },

  // Active markets - Next week
  {
    publicKey: "market_pce_jan",
    marketId: "4",
    title: "PCE Inflation YoY January 2026",
    fredSeriesId: "PCEPI",
    status: "active",
    marketType: "multiOutcome",
    numOutcomes: 4,
    outcomeLabels: ["<2.2%", "2.2%-2.5%", "2.5%-2.8%", ">2.8%"],
    closesAt: now + day * 10,
    resolvesAt: now + day * 25,
    totalSetsMinted: "3200000000",
  },
  {
    publicKey: "market_retail_jan",
    marketId: "5",
    title: "Retail Sales MoM% January 2026",
    fredSeriesId: "RSAFS",
    status: "active",
    marketType: "multiOutcome",
    numOutcomes: 3,
    outcomeLabels: ["Negative", "0-0.5%", ">0.5%"],
    closesAt: now + day * 12,
    resolvesAt: now + day * 27,
    totalSetsMinted: "950000000",
  },

  // Active markets - This month
  {
    publicKey: "market_gdp_q4",
    marketId: "6",
    title: "Q4 2025 GDP Growth (Annualized)",
    fredSeriesId: "GDPC1",
    status: "active",
    marketType: "multiOutcome",
    numOutcomes: 4,
    outcomeLabels: ["<1.5%", "1.5%-2.5%", "2.5%-3.5%", ">3.5%"],
    closesAt: now + day * 15,
    resolvesAt: now + day * 30,
    totalSetsMinted: "4100000000",
  },
  {
    publicKey: "market_housing_jan",
    marketId: "7",
    title: "Housing Starts January 2026",
    fredSeriesId: "HOUST",
    status: "active",
    marketType: "multiOutcome",
    numOutcomes: 3,
    outcomeLabels: ["<1.3M", "1.3M-1.5M", ">1.5M"],
    closesAt: now + day * 18,
    resolvesAt: now + day * 33,
    totalSetsMinted: "720000000",
  },
  {
    publicKey: "market_fed_march",
    marketId: "8",
    title: "Fed Funds Rate After March 2026 FOMC",
    fredSeriesId: "DFEDTARU",
    status: "active",
    marketType: "multiOutcome",
    numOutcomes: 3,
    outcomeLabels: ["Cut 25bp", "Hold", "Hike 25bp"],
    closesAt: now + day * 35,
    resolvesAt: now + day * 36,
    totalSetsMinted: "5800000000",
  },

  // Pending markets - Future
  {
    publicKey: "market_cpi_march",
    marketId: "9",
    title: "Will Core CPI YoY fall below 3.0% in March?",
    fredSeriesId: "CPILFESL",
    status: "pending",
    marketType: "binary",
    numOutcomes: 2,
    outcomeLabels: ["Yes", "No"],
    closesAt: now + day * 45,
    resolvesAt: now + day * 60,
    totalSetsMinted: "0",
  },
  {
    publicKey: "market_jobs_march",
    marketId: "10",
    title: "March 2026 Nonfarm Payrolls Change",
    fredSeriesId: "PAYEMS",
    status: "pending",
    marketType: "multiOutcome",
    numOutcomes: 4,
    outcomeLabels: ["<100K", "100K-200K", "200K-300K", ">300K"],
    closesAt: now + day * 50,
    resolvesAt: now + day * 65,
    totalSetsMinted: "0",
  },
  {
    publicKey: "market_sentiment_march",
    marketId: "11",
    title: "Consumer Sentiment March 2026",
    fredSeriesId: "UMCSENT",
    status: "pending",
    marketType: "multiOutcome",
    numOutcomes: 3,
    outcomeLabels: ["<70", "70-80", ">80"],
    closesAt: now + day * 55,
    resolvesAt: now + day * 70,
    totalSetsMinted: "0",
  },
  {
    publicKey: "market_oil_q1",
    marketId: "12",
    title: "WTI Crude Oil Average Q1 2026",
    fredSeriesId: "DCOILWTICO",
    status: "pending",
    marketType: "multiOutcome",
    numOutcomes: 4,
    outcomeLabels: ["<$65", "$65-$75", "$75-$85", ">$85"],
    closesAt: now + day * 60,
    resolvesAt: now + day * 75,
    totalSetsMinted: "0",
  },

  // Closed markets
  {
    publicKey: "market_cpi_jan_closed",
    marketId: "13",
    title: "CPI YoY January 2026",
    fredSeriesId: "CPIAUCSL",
    status: "closed",
    marketType: "multiOutcome",
    numOutcomes: 4,
    outcomeLabels: ["<2.5%", "2.5%-2.8%", "2.8%-3.1%", ">3.1%"],
    closesAt: now - day * 2,
    resolvesAt: now + day * 13,
    totalSetsMinted: "3400000000",
  },
  {
    publicKey: "market_jobs_jan_closed",
    marketId: "14",
    title: "January 2026 Job Openings (JOLTS)",
    fredSeriesId: "JTSJOL",
    status: "closed",
    marketType: "multiOutcome",
    numOutcomes: 3,
    outcomeLabels: ["<7.5M", "7.5M-8.5M", ">8.5M"],
    closesAt: now - day * 5,
    resolvesAt: now + day * 10,
    totalSetsMinted: "1600000000",
  },

  // Resolved markets
  {
    publicKey: "market_unrate_dec_resolved",
    marketId: "15",
    title: "Unemployment Rate December 2025",
    fredSeriesId: "UNRATE",
    status: "resolved",
    marketType: "multiOutcome",
    numOutcomes: 3,
    outcomeLabels: ["<4.0%", "4.0%-4.2%", ">4.2%"],
    closesAt: now - day * 45,
    resolvesAt: now - day * 30,
    totalSetsMinted: "2100000000",
  },
  {
    publicKey: "market_retail_dec_resolved",
    marketId: "16",
    title: "Retail Sales MoM% December 2025",
    fredSeriesId: "RSAFS",
    status: "resolved",
    marketType: "binary",
    numOutcomes: 2,
    outcomeLabels: ["Positive", "Negative"],
    closesAt: now - day * 50,
    resolvesAt: now - day * 35,
    totalSetsMinted: "1850000000",
  },
  {
    publicKey: "market_fed_jan_resolved",
    marketId: "17",
    title: "Fed Decision January 2026",
    fredSeriesId: "DFEDTARU",
    status: "resolved",
    marketType: "multiOutcome",
    numOutcomes: 3,
    outcomeLabels: ["Cut", "Hold", "Hike"],
    closesAt: now - day * 15,
    resolvesAt: now - day * 14,
    totalSetsMinted: "6200000000",
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
