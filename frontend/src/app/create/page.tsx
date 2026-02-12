"use client";

import { useState } from "react";
import PageHeader from "@/components/ui/PageHeader";
import CategoryFilterBar from "@/components/cloud/CategoryFilterBar";
import CloudContainer from "@/components/cloud/CloudContainer";
import CloudLoadingSkeleton from "@/components/cloud/CloudLoadingSkeleton";
import TableView from "@/components/cloud/TableView";
import SponsorModal from "@/components/cloud/SponsorModal";
import { useMarketCloud } from "@/hooks/useMarketCloud";
import type { MarketPotential } from "@/types/cloud";

type ViewMode = "cloud" | "table";

export default function CreateMarketPage() {
  const {
    loading,
    error,
    activeCategory,
    setActiveCategory,
    filteredPotentials,
    categoryCounts,
  } = useMarketCloud();

  console.log("[CreateMarketPage] Render:", {
    loading,
    error,
    activeCategory,
    filteredCount: filteredPotentials.length,
    categoryCounts,
  });

  const [selectedPotential, setSelectedPotential] =
    useState<MarketPotential | null>(null);
  const [viewMode, setViewMode] = useState<ViewMode>("cloud");

  return (
    <div className="flex flex-col" style={{ height: "calc(100vh - 140px)" }}>
      <div className="relative">
        <PageHeader
          title="Market Cloud"
          subtitle="Live economic indicators generating market potentials. Sponsor one to make it tradeable."
        />

        {/* View toggle button */}
        <div className="absolute top-6 right-6 flex items-center gap-1 bg-white border border-fred-gray-200 rounded-[5px] p-1 shadow-sm">
          <button
            onClick={() => setViewMode("cloud")}
            className={`px-3 py-1.5 rounded text-xs font-medium transition-colors ${
              viewMode === "cloud"
                ? "bg-fred-navy text-white"
                : "text-fred-gray-600 hover:text-fred-gray-800"
            }`}
          >
            <svg
              className="w-4 h-4 inline-block mr-1"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M3 15a4 4 0 004 4h9a5 5 0 10-.1-9.999 5.002 5.002 0 10-9.78 2.096A4.001 4.001 0 003 15z"
              />
            </svg>
            Cloud
          </button>
          <button
            onClick={() => setViewMode("table")}
            className={`px-3 py-1.5 rounded text-xs font-medium transition-colors ${
              viewMode === "table"
                ? "bg-fred-navy text-white"
                : "text-fred-gray-600 hover:text-fred-gray-800"
            }`}
          >
            <svg
              className="w-4 h-4 inline-block mr-1"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M3 10h18M3 14h18m-9-4v8m-7 0h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z"
              />
            </svg>
            Table
          </button>
        </div>
      </div>

      <CategoryFilterBar
        active={activeCategory}
        onChange={setActiveCategory}
        counts={categoryCounts}
      />

      {loading ? (
        <CloudLoadingSkeleton />
      ) : error ? (
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <p className="text-fred-gray-600 mb-2">Failed to load market data</p>
            <p className="text-sm text-fred-gray-600">{error}</p>
          </div>
        </div>
      ) : filteredPotentials.length === 0 ? (
        <div className="flex-1 flex items-center justify-center">
          <p className="text-fred-gray-600">No market potentials available for this category.</p>
        </div>
      ) : viewMode === "cloud" ? (
        <CloudContainer
          potentials={filteredPotentials}
          onSelect={setSelectedPotential}
        />
      ) : (
        <TableView
          potentials={filteredPotentials}
          onSelect={setSelectedPotential}
        />
      )}

      {selectedPotential && (
        <SponsorModal
          potential={selectedPotential}
          onClose={() => setSelectedPotential(null)}
        />
      )}
    </div>
  );
}
