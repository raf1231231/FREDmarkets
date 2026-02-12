"use client";

import { CLOUD_CATEGORIES } from "@/data/seriesCatalog";
import type { MarketPotential } from "@/types/cloud";

interface FloatingCardProps {
  potential: MarketPotential;
  index: number;
  onClick: () => void;
}

// Stable pseudo-random from index (deterministic across renders)
function seededRandom(seed: number): number {
  const x = Math.sin(seed * 9301 + 49297) * 49297;
  return x - Math.floor(x);
}

export default function FloatingCard({
  potential,
  index,
  onClick,
}: FloatingCardProps) {
  const { entry, derivedMetricLabel, outcomes } = potential;
  const categoryMeta = CLOUD_CATEGORIES[entry.category];

  const frequencyLabel: Record<string, string> = {
    daily: "Daily",
    weekly: "Weekly",
    monthly: "Monthly",
    quarterly: "Quarterly",
    perFomc: "FOMC",
  };

  return (
    <button
      onClick={onClick}
      className="w-full cursor-pointer text-left rounded-[5px] bg-white border border-fred-gray-200 shadow-sm hover:shadow-md hover:border-fred-navy transition-all p-2.5"
      style={
        {
          borderLeftColor: categoryMeta.color,
          borderLeftWidth: "3px",
        } as React.CSSProperties
      }
    >
      {/* Header row: tier badge + frequency */}
      <div className="flex items-center justify-between mb-1">
        <span
          className="text-[10px] font-semibold px-1.5 py-0.5 rounded"
          style={{
            backgroundColor: categoryMeta.color + "15",
            color: categoryMeta.color,
          }}
        >
          {categoryMeta.label}
        </span>
        <div className="flex items-center gap-1">
          {entry.tier === 1 && (
            <span className="text-[9px] font-bold text-fred-link bg-blue-50 px-1 rounded">
              T1
            </span>
          )}
          <span className="text-[9px] text-fred-gray-600">
            {frequencyLabel[entry.frequency]}
          </span>
        </div>
      </div>

      {/* Series name */}
      <h3 className="text-xs font-semibold text-fred-gray-800 leading-tight mb-1 line-clamp-2">
        {entry.name}
      </h3>

      {/* Derived metric — the big number */}
      <div className="text-base font-bold text-fred-navy leading-none mb-2">
        {derivedMetricLabel}
      </div>

      {/* Outcome count */}
      <div className="flex items-center gap-1">
        <span className="text-[10px] text-fred-gray-600">
          {outcomes.length} outcomes
        </span>
        <span className="text-[10px] text-fred-gray-600">·</span>
        <span className="text-[10px] font-mono text-fred-gray-600">
          {entry.seriesId}
        </span>
      </div>
    </button>
  );
}
