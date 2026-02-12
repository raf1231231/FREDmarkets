"use client";

import { useEffect } from "react";
import { CLOUD_CATEGORIES } from "@/data/seriesCatalog";
import type { MarketPotential, SponsorFormState } from "@/types/cloud";
import InteractiveSparkline from "@/components/fred/InteractiveSparkline";
import SponsorForm from "./SponsorForm";

interface SponsorModalProps {
  potential: MarketPotential;
  onClose: () => void;
}

export default function SponsorModal({ potential, onClose }: SponsorModalProps) {
  const { entry, question, outcomes, derivedMetricLabel, latestValue, latestDate, observations } =
    potential;
  const categoryMeta = CLOUD_CATEGORIES[entry.category];

  // Close on Escape
  useEffect(() => {
    function handleKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    document.addEventListener("keydown", handleKey);
    return () => document.removeEventListener("keydown", handleKey);
  }, [onClose]);

  // Lock body scroll
  useEffect(() => {
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = "";
    };
  }, []);

  // Compute historical derived metrics for chart display
  // For YoY%, MoM%, etc., we show the calculated metric, not raw values
  const sparklineObs = (() => {
    const valid = observations.filter((o) => o.value !== ".");
    const divisor = entry.displayDivisor ?? 1;

    switch (entry.questionStyle) {
      case "yoyPercent": {
        // Calculate YoY% for each observation
        const metrics: Array<{ date: string; value: string }> = [];
        for (let i = 0; i < valid.length; i++) {
          const curr = parseFloat(valid[i].value);
          if (isNaN(curr)) continue;

          const currDate = new Date(valid[i].date);
          const target = new Date(currDate);
          target.setFullYear(target.getFullYear() - 1);

          // Find closest observation ~12 months ago
          let best: { value: number; diff: number } | null = null;
          for (let j = i + 1; j < valid.length; j++) {
            const v = parseFloat(valid[j].value);
            if (isNaN(v)) continue;
            const d = new Date(valid[j].date);
            const diff = Math.abs(d.getTime() - target.getTime());
            if (!best || diff < best.diff) best = { value: v, diff };
          }

          if (best && best.value !== 0 && best.diff < 45 * 86400000) {
            const yoy = ((curr / best.value) - 1) * 100;
            metrics.push({ date: valid[i].date, value: yoy.toFixed(2) });
          }
        }
        return metrics.reverse();
      }

      case "momAbsolute": {
        // MoM absolute change
        const metrics: Array<{ date: string; value: string }> = [];
        for (let i = 0; i < valid.length - 1; i++) {
          const curr = parseFloat(valid[i].value);
          const prev = parseFloat(valid[i + 1].value);
          if (!isNaN(curr) && !isNaN(prev)) {
            const change = (curr - prev) / divisor;
            metrics.push({ date: valid[i].date, value: change.toFixed(1) });
          }
        }
        return metrics.reverse();
      }

      case "momPercent": {
        // MoM percent change
        const metrics: Array<{ date: string; value: string }> = [];
        for (let i = 0; i < valid.length - 1; i++) {
          const curr = parseFloat(valid[i].value);
          const prev = parseFloat(valid[i + 1].value);
          if (!isNaN(curr) && !isNaN(prev) && prev !== 0) {
            const pct = ((curr - prev) / Math.abs(prev)) * 100;
            metrics.push({ date: valid[i].date, value: pct.toFixed(2) });
          }
        }
        return metrics.reverse();
      }

      case "qoqAnnualized": {
        // QoQ annualized %
        const metrics: Array<{ date: string; value: string }> = [];
        for (let i = 0; i < valid.length - 1; i++) {
          const curr = parseFloat(valid[i].value);
          const prev = parseFloat(valid[i + 1].value);
          if (!isNaN(curr) && !isNaN(prev) && prev !== 0) {
            const ann = (Math.pow(curr / prev, 4) - 1) * 100;
            metrics.push({ date: valid[i].date, value: ann.toFixed(2) });
          }
        }
        return metrics.reverse();
      }

      case "level":
      case "direction":
      default:
        // For level/direction, show raw values (with divisor applied)
        return valid.reverse().map((o) => ({
          date: o.date,
          value: (parseFloat(o.value) / divisor).toFixed(2),
        }));
    }
  })();

  function handleSubmit(state: SponsorFormState) {
    // TODO: Wire to useSponsorMarket hook for on-chain transaction
    console.log("Sponsor submitted:", state);
    onClose();
  }

  const frequencyLabels: Record<string, string> = {
    daily: "Daily",
    weekly: "Weekly",
    monthly: "Monthly",
    quarterly: "Quarterly",
    perFomc: "Per FOMC meeting",
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="relative bg-white rounded-[5px] shadow-2xl max-w-3xl w-full mx-4 max-h-[90vh] overflow-y-auto">
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-3 right-3 text-fred-gray-600 hover:text-fred-gray-800 z-10 text-xl leading-none"
        >
          &times;
        </button>

        {/* Header bar */}
        <div
          className="px-6 py-4 border-b border-fred-gray-200"
          style={{ borderTopColor: categoryMeta.color, borderTopWidth: "3px" }}
        >
          <div className="flex items-center gap-2 mb-1">
            <span
              className="text-xs font-semibold px-2 py-0.5 rounded"
              style={{
                backgroundColor: categoryMeta.color + "15",
                color: categoryMeta.color,
              }}
            >
              {categoryMeta.label}
            </span>
            {entry.tier === 1 && (
              <span className="text-xs font-bold text-fred-link bg-blue-50 px-1.5 rounded">
                Tier 1
              </span>
            )}
            <span className="text-xs text-fred-gray-600">
              {frequencyLabels[entry.frequency]}
            </span>
          </div>
          <h2 className="text-lg font-bold text-fred-navy">{entry.name}</h2>
          <p className="text-xs font-mono text-fred-gray-600">{entry.seriesId}</p>
        </div>

        {/* Two-column body */}
        <div className="flex flex-col md:flex-row">
          {/* Left: Market preview */}
          <div className="md:w-1/2 px-6 py-5 space-y-4 border-b md:border-b-0 md:border-r border-fred-gray-200">
            {/* Current value + metric */}
            <div>
              <p className="text-sm text-fred-gray-600 mb-1">Current reading</p>
              <div className="flex items-baseline gap-2">
                <span className="text-2xl font-bold text-fred-navy">
                  {derivedMetricLabel}
                </span>
              </div>
              <p className="text-xs text-fred-gray-600 mt-0.5">
                Latest: {latestValue} · {latestDate}
              </p>
            </div>

            {/* Interactive Chart */}
            {sparklineObs.length > 2 && (
              <div className="border border-fred-gray-200 rounded-[5px] p-3 bg-fred-gray-50">
                <p className="text-sm font-medium text-fred-gray-800 mb-3">
                  Historical Data
                </p>
                <InteractiveSparkline
                  observations={sparklineObs}
                  width={340}
                  height={180}
                />
              </div>
            )}

            {/* Question */}
            <div>
              <p className="text-sm text-fred-gray-600 mb-1">Market question</p>
              <p className="text-sm font-medium text-fred-gray-800">{question}</p>
            </div>

            {/* Description */}
            <div>
              <p className="text-sm text-fred-gray-600 mb-1">Market description</p>
              <p className="text-sm text-fred-gray-800 leading-relaxed">
                Track {frequencyLabels[entry.frequency].toLowerCase()} changes in {entry.name}.
                Sponsored markets earn 60% of redemption fees from all trading activity.
              </p>
            </div>

            {/* FRED attribution */}
            <p className="text-[10px] text-fred-gray-600 leading-relaxed">
              Data from{" "}
              <a
                href={`https://fred.stlouisfed.org/series/${entry.seriesId}`}
                target="_blank"
                rel="noopener noreferrer"
                className="underline"
              >
                FRED
              </a>
              . This product uses the FRED&reg; API but is not endorsed or
              certified by the Federal Reserve Bank of St. Louis.
            </p>
          </div>

          {/* Right: Sponsor form */}
          <div className="md:w-1/2 px-6 py-5">
            <h3 className="text-sm font-semibold text-fred-gray-800 mb-4">
              Sponsor this market
            </h3>
            <SponsorForm potential={potential} onSubmit={handleSubmit} />
          </div>
        </div>
      </div>
    </div>
  );
}
