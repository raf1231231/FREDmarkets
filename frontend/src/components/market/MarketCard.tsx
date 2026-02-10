import Link from "next/link";
import { MarketSummary } from "@/types/market";
import MarketStatusBadge from "./MarketStatusBadge";
import { formatTimestamp } from "@/lib/utils";

export default function MarketCard({ market }: { market: MarketSummary }) {
  return (
    <Link
      href={`/markets/${market.publicKey}`}
      className="block bg-fred-white rounded-[5px] border border-fred-gray-200 shadow-sm hover:shadow-md transition-shadow no-underline"
    >
      <div className="p-4">
        {/* Title + status */}
        <div className="flex items-start justify-between gap-2 mb-2">
          <h3 className="text-sm font-semibold text-fred-navy leading-snug line-clamp-2">
            {market.title}
          </h3>
          <MarketStatusBadge status={market.status} />
        </div>

        {/* Series ID */}
        <p className="text-xs font-mono text-fred-gray-600 mb-3">
          {market.fredSeriesId}
        </p>

        {/* Outcome labels */}
        <div className="flex flex-wrap gap-1 mb-3">
          {market.outcomeLabels.map((label, i) => (
            <span
              key={i}
              className="inline-block px-2 py-0.5 bg-fred-gray-100 text-fred-gray-800 text-xs rounded"
            >
              {label}
            </span>
          ))}
        </div>

        {/* Dates */}
        <div className="flex items-center justify-between text-xs text-fred-gray-600">
          <span>Closes: {formatTimestamp(market.closesAt)}</span>
          <span>Resolves: {formatTimestamp(market.resolvesAt)}</span>
        </div>
      </div>
    </Link>
  );
}
