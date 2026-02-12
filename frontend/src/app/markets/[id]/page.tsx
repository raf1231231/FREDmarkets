"use client";

import { use } from "react";
import PageHeader from "@/components/ui/PageHeader";
import Card from "@/components/ui/Card";
import MarketStatusBadge from "@/components/market/MarketStatusBadge";
import OutcomeBar from "@/components/market/OutcomeBar";
import { shortenAddress } from "@/lib/utils";
import FredSeriesCard from "@/components/fred/FredSeriesCard";
import FredObservationTable from "@/components/fred/FredObservationTable";

export default function MarketDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);

  // TODO: Extract fredSeriesId from on-chain market data once available
  const fredSeriesId = "CPIAUCSL";

  return (
    <div>
      <PageHeader
        title="Market Detail"
        subtitle={`PDA: ${shortenAddress(id, 8)}`}
      />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main info */}
        <div className="lg:col-span-2 space-y-6">
          <Card title="Market Information">
            <div className="space-y-3 text-sm">
              <div className="flex justify-between">
                <span className="text-fred-gray-600">Status</span>
                <MarketStatusBadge status="active" />
              </div>
              <div className="flex justify-between">
                <span className="text-fred-gray-600">FRED Series</span>
                <span className="font-mono">CPIAUCSL</span>
              </div>
              <div className="flex justify-between">
                <span className="text-fred-gray-600">Type</span>
                <span>Binary</span>
              </div>
              <div className="flex justify-between">
                <span className="text-fred-gray-600">Proposer</span>
                <span className="font-mono">{shortenAddress(id)}</span>
              </div>
              <p className="text-fred-gray-600 pt-2 border-t border-fred-gray-200">
                Market description will appear here once loaded from on-chain data.
              </p>
            </div>
          </Card>

          <Card title="Outcomes">
            <div className="space-y-3">
              <OutcomeBar label="Yes" probability={62.5} />
              <OutcomeBar label="No" probability={37.5} />
            </div>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          <Card title="Order Book">
            <p className="text-sm text-fred-gray-600 text-center py-6">
              Trading interface coming soon.
            </p>
          </Card>

          <FredSeriesCard seriesId={fredSeriesId} />
          <FredObservationTable seriesId={fredSeriesId} limit={8} />
        </div>
      </div>
    </div>
  );
}
