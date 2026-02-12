"use client";

import { useFredObservations } from "@/hooks/useFredObservations";
import FredSparkline from "./FredSparkline";
import FredLoadingSkeleton from "./FredLoadingSkeleton";

const INDICATORS = [
  { seriesId: "CPIAUCSL", label: "CPI All Items", category: "Inflation" },
  { seriesId: "CPILFESL", label: "Core CPI", category: "Inflation" },
  { seriesId: "PAYEMS", label: "Nonfarm Payrolls", category: "Employment" },
  { seriesId: "UNRATE", label: "Unemployment Rate", category: "Employment" },
  { seriesId: "GDPC1", label: "Real GDP", category: "GDP" },
  { seriesId: "DFEDTARU", label: "Fed Funds Rate", category: "Fed Policy" },
];

function IndicatorCard({
  seriesId,
  label,
  category,
}: {
  seriesId: string;
  label: string;
  category: string;
}) {
  const { observations, loading, error } = useFredObservations(seriesId, 12);

  if (loading) {
    return (
      <div className="bg-fred-white rounded-[5px] border border-fred-gray-200 shadow-sm p-4">
        <FredLoadingSkeleton variant="card" />
      </div>
    );
  }

  if (error || observations.length === 0) {
    return (
      <div className="bg-fred-white rounded-[5px] border border-fred-gray-200 shadow-sm p-4">
        <p className="text-xs text-fred-gray-600 font-medium">{category}</p>
        <p className="text-sm font-semibold text-fred-navy">{label}</p>
        <p className="text-xs text-fred-gray-600 mt-2">
          {error ? "Unable to load" : "No data"}
        </p>
      </div>
    );
  }

  const latest = parseFloat(observations[observations.length - 1].value);
  const previous =
    observations.length >= 2
      ? parseFloat(observations[observations.length - 2].value)
      : null;

  let arrow = "";
  let changeColor = "text-fred-gray-600";
  if (previous !== null) {
    if (latest > previous) {
      arrow = "\u25B2";
      changeColor = "text-green-600";
    } else if (latest < previous) {
      arrow = "\u25BC";
      changeColor = "text-red-600";
    }
  }

  const formatted = latest.toLocaleString(undefined, {
    minimumFractionDigits: 1,
    maximumFractionDigits: 2,
  });

  return (
    <div className="bg-fred-white rounded-[5px] border border-fred-gray-200 shadow-sm hover:shadow-md transition-shadow p-4">
      <p className="text-xs text-fred-gray-600 font-medium">{category}</p>
      <div className="flex items-baseline justify-between mt-0.5 mb-2">
        <span className="text-sm font-semibold text-fred-navy">{label}</span>
        <span
          className={`inline-flex items-center gap-1 text-xs font-medium ${changeColor}`}
        >
          {arrow && <span className="text-[10px]">{arrow}</span>}
          {formatted}
        </span>
      </div>
      <FredSparkline observations={observations} height={36} />
      <p className="text-[10px] font-mono text-fred-gray-600 mt-1.5">
        {seriesId}
      </p>
    </div>
  );
}

export default function EconomicDashboard() {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
      {INDICATORS.map((ind) => (
        <IndicatorCard key={ind.seriesId} {...ind} />
      ))}
    </div>
  );
}
