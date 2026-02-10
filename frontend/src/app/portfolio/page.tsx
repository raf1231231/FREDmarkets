"use client";

import { useWallet } from "@solana/wallet-adapter-react";
import PageHeader from "@/components/ui/PageHeader";
import Card from "@/components/ui/Card";
import WalletButton from "@/components/wallet/WalletButton";

export default function PortfolioPage() {
  const { connected } = useWallet();

  if (!connected) {
    return (
      <div>
        <PageHeader title="Portfolio" subtitle="Your positions and market activity" />
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

  return (
    <div>
      <PageHeader title="Portfolio" subtitle="Your positions and market activity" />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card title="Your Positions">
          <p className="text-sm text-fred-gray-600 text-center py-8">
            No positions yet. Buy outcome tokens on a market to get started.
          </p>
        </Card>

        <Card title="Open Orders">
          <p className="text-sm text-fred-gray-600 text-center py-8">
            No open orders.
          </p>
        </Card>

        <Card title="Market History">
          <p className="text-sm text-fred-gray-600 text-center py-8">
            No resolved markets to show.
          </p>
        </Card>

        <Card title="Creator Dashboard">
          <p className="text-sm text-fred-gray-600 text-center py-8">
            You haven&apos;t created any markets yet.
          </p>
        </Card>
      </div>
    </div>
  );
}
