"use client";

import { useFredObservations } from "@/hooks/useFredObservations";
import FredLoadingSkeleton from "./FredLoadingSkeleton";

interface FredLatestValueProps {
  seriesId: string;
  className?: string;
}

export default function FredLatestValue({
  seriesId,
  className = "",
}: FredLatestValueProps) {
  const { observations, loading, error } = useFredObservations(seriesId, 2);

  if (loading) return <FredLoadingSkeleton variant="value" />;
  if (error || observations.length === 0) return null;

  const latest = parseFloat(observations[observations.length - 1].value);
  const previous =
    observations.length >= 2
      ? parseFloat(observations[observations.length - 2].value)
      : null;

  const formatted = latest.toLocaleString(undefined, {
    minimumFractionDigits: 1,
    maximumFractionDigits: 2,
  });

  let arrow = "";
  let colorClass = "text-fred-gray-600";

  if (previous !== null) {
    if (latest > previous) {
      arrow = "\u25B2";
      colorClass = "text-green-600";
    } else if (latest < previous) {
      arrow = "\u25BC";
      colorClass = "text-red-600";
    }
  }

  return (
    <span
      className={`inline-flex items-center gap-1 text-xs font-medium ${colorClass} ${className}`}
    >
      {arrow && <span className="text-[10px]">{arrow}</span>}
      <span>{formatted}</span>
    </span>
  );
}
