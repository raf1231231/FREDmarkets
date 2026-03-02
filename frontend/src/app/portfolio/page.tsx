"use client";

import Link from "next/link";
import { useWallet } from "@solana/wallet-adapter-react";
import PageHeader from "@/components/ui/PageHeader";
import Card from "@/components/ui/Card";
import WalletButton from "@/components/wallet/WalletButton";
import MarketStatusBadge from "@/components/market/MarketStatusBadge";
import { useOnChainMarkets } from "@/hooks/useOnChainMarkets";
import { useUserPositions } from "@/hooks/useUserPositions";
import { explorerUrl } from "@/lib/constants";
import { shortenAddress } from "@/lib/utils";

function PositionRow({
  marketTitle,
  outcomeLabel,
  balance,
  status,
  marketPublicKey,
}: {
  marketTitle: string;
  outcomeLabel: string;
  balance: string;
  status: string;
  marketPublicKey: string;
}) {
  return (
    <div className="flex items-center justify-between py-3 border-b border-fred-gray-100 last:border-0">
      <div className="flex-1 min-w-0">
        <Link
          href={`/markets/${marketPublicKey}`}
          className="text-sm font-medium text-fred-navy hover:text-fred-link truncate block"
        >
          {marketTitle}
        </Link>
        <p className="text-xs text-fred-gray-600 mt-0.5">
          {outcomeLabel}
        </p>
      </div>
      <div className="ml-4 text-right shrink-0">
        <p className="text-sm font-mono font-semibold text-fred-navy">
          {balance} shares
        </p>
        <div className="mt-0.5">
          <MarketStatusBadge status={status as Parameters<typeof MarketStatusBadge>[0]["status"]} />
        </div>
      </div>
    </div>
  );
}

export default function PortfolioPage() {
  const { connected, publicKey } = useWallet();
  const { markets, loading: marketsLoading } = useOnChainMarkets();
  const { positions, loading: posLoading, error } = useUserPositions(markets);

  if (!connected) {
    return (
      <div>
        <PageHeader
          title="Portfolio"
          subtitle="Your positions and market activity"
        />
        <Card>
          <div className="text-center py-12">
            <p className="text-sm text-fred-gray-600 mb-4">
              Connect your wallet to view your portfolio.
            </p>
            <WalletButton />
          </div>
        </Card>
      </div>
    );
  }

  const loading = marketsLoading || posLoading;

  // Partition positions by market status
  const activePositions = positions.filter(
    (p) => p.marketStatus === "active" || p.marketStatus === "closed"
  );
  const resolvedPositions = positions.filter(
    (p) => p.marketStatus === "resolved"
  );

  return (
    <div>
      <PageHeader
        title="Portfolio"
        subtitle="Your positions and market activity"
      />

      {error && (
        <div className="mb-4 px-4 py-3 rounded-[5px] bg-red-50 border border-red-200 text-sm text-red-700">
          Error loading positions: {error}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* ── Active Positions ──────────────────────────────────── */}
        <Card title="Your Positions">
          {loading ? (
            <div className="space-y-3 py-2">
              {[1, 2, 3].map((i) => (
                <div
                  key={i}
                  className="h-14 bg-fred-gray-100 animate-pulse rounded"
                />
              ))}
            </div>
          ) : activePositions.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-sm text-fred-gray-600 mb-3">
                No positions yet.
              </p>
              <Link
                href="/markets"
                className="text-sm text-fred-link underline hover:no-underline"
              >
                Browse active markets →
              </Link>
            </div>
          ) : (
            <div>
              {activePositions.map((pos, i) => (
                <PositionRow
                  key={`${pos.marketPublicKey}-${pos.outcomeIndex}-${i}`}
                  marketTitle={pos.marketTitle}
                  outcomeLabel={pos.outcomeLabel}
                  balance={pos.balanceFormatted}
                  status={pos.marketStatus}
                  marketPublicKey={pos.marketPublicKey}
                />
              ))}
            </div>
          )}
        </Card>

        {/* ── Open Orders — placeholder (Phase 3 order book) ────── */}
        <Card title="Open Orders">
          <p className="text-sm text-fred-gray-600 text-center py-8">
            Order book coming in Phase 3.
          </p>
        </Card>

        {/* ── Resolved / Claimable ──────────────────────────────── */}
        <Card title="Claimable Winnings">
          {loading ? (
            <div className="h-14 bg-fred-gray-100 animate-pulse rounded" />
          ) : resolvedPositions.length === 0 ? (
            <p className="text-sm text-fred-gray-600 text-center py-8">
              No resolved markets to claim.
            </p>
          ) : (
            <div>
              {resolvedPositions.map((pos, i) => (
                <PositionRow
                  key={`${pos.marketPublicKey}-${pos.outcomeIndex}-${i}`}
                  marketTitle={pos.marketTitle}
                  outcomeLabel={pos.outcomeLabel}
                  balance={pos.balanceFormatted}
                  status={pos.marketStatus}
                  marketPublicKey={pos.marketPublicKey}
                />
              ))}
              <p className="text-xs text-fred-gray-500 mt-3">
                Claim winnings via the market page (Phase 4 tx coming soon).
              </p>
            </div>
          )}
        </Card>

        {/* ── Wallet Info ───────────────────────────────────────── */}
        <Card title="Wallet">
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-fred-gray-600">Address</span>
              <a
                href={explorerUrl(publicKey!.toBase58(), "address")}
                target="_blank"
                rel="noopener noreferrer"
                className="font-mono text-fred-link hover:underline"
              >
                {shortenAddress(publicKey!.toBase58())}
              </a>
            </div>
            <div className="flex justify-between">
              <span className="text-fred-gray-600">Total positions</span>
              <span>{loading ? "…" : positions.length}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-fred-gray-600">On-chain markets</span>
              <span>{loading ? "…" : markets.length}</span>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}
