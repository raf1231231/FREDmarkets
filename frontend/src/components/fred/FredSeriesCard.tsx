"use client";

import { useFredSeries } from "@/hooks/useFredSeries";
import { useFredObservations } from "@/hooks/useFredObservations";
import Card from "@/components/ui/Card";
import InteractiveSparkline from "./InteractiveSparkline";
import FredLoadingSkeleton from "./FredLoadingSkeleton";

interface FredSeriesCardProps {
  seriesId: string;
  className?: string;
}

export default function FredSeriesCard({
  seriesId,
  className = "",
}: FredSeriesCardProps) {
  const { series, loading: seriesLoading, error: seriesError } = useFredSeries(seriesId);
  const { observations, loading: obsLoading, error: obsError } = useFredObservations(seriesId, 24);

  const loading = seriesLoading || obsLoading;
  const error = seriesError || obsError;

  if (loading) {
    return (
      <Card title="FRED Data" className={className}>
        <FredLoadingSkeleton variant="card" />
      </Card>
    );
  }

  if (error) {
    return (
      <Card title="FRED Data" className={className}>
        <p className="text-sm text-red-600 py-4">
          Unable to load data for {seriesId}.
        </p>
      </Card>
    );
  }

  const latest =
    observations.length > 0
      ? parseFloat(observations[observations.length - 1].value)
      : null;
  const previous =
    observations.length >= 2
      ? parseFloat(observations[observations.length - 2].value)
      : null;

  let changeText = "";
  let changeColor = "text-fred-gray-600";
  if (latest !== null && previous !== null && previous !== 0) {
    const pctChange = ((latest - previous) / Math.abs(previous)) * 100;
    const sign = pctChange >= 0 ? "+" : "";
    changeText = `${sign}${pctChange.toFixed(2)}%`;
    changeColor =
      pctChange > 0
        ? "text-green-600"
        : pctChange < 0
          ? "text-red-600"
          : "text-fred-gray-600";
  }

  const title = series?.title || seriesId;
  const lastUpdated = series?.last_updated
    ? new Date(series.last_updated).toLocaleDateString("en-US", {
        year: "numeric",
        month: "short",
        day: "numeric",
      })
    : null;

  return (
    <Card title="FRED Data" className={className}>
      <div className="space-y-3">
        <div>
          <div className="flex items-baseline gap-2">
            {latest !== null && (
              <span className="text-xl font-semibold text-fred-navy">
                {latest.toLocaleString(undefined, {
                  minimumFractionDigits: 1,
                  maximumFractionDigits: 3,
                })}
              </span>
            )}
            {changeText && (
              <span className={`text-sm font-medium ${changeColor}`}>
                {changeText}
              </span>
            )}
          </div>
          <p className="text-xs text-fred-gray-600 mt-0.5">
            {series?.units_short || series?.units || ""}{" "}
            {series?.frequency ? `\u00B7 ${series.frequency}` : ""}
          </p>
        </div>

        {observations.length >= 2 && (
          <div className="border border-fred-gray-200 rounded-[5px] p-2 bg-fred-gray-50">
            <InteractiveSparkline
              observations={observations}
              width={280}
              height={160}
            />
          </div>
        )}

        <div className="flex items-center justify-between text-xs text-fred-gray-600 pt-2 border-t border-fred-gray-200">
          <span className="truncate max-w-[200px]" title={title}>
            {title}
          </span>
          {lastUpdated && <span>Updated {lastUpdated}</span>}
        </div>

        <a
          href={`https://fred.stlouisfed.org/series/${seriesId}`}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-block text-xs text-fred-link hover:text-fred-link-hover"
        >
          View on FRED &rarr;
        </a>
      </div>
    </Card>
  );
}
