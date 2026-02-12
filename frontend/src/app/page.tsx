import Link from "next/link";
import Button from "@/components/ui/Button";
import Card from "@/components/ui/Card";
import EconomicDashboard from "@/components/fred/EconomicDashboard";

export default function Home() {
  return (
    <div>
      {/* Hero */}
      <section className="text-center py-16">
        <h1 className="text-4xl font-bold text-fred-navy mb-3">
          FRED<span className="font-normal text-fred-gray-600">markets</span>
        </h1>
        <p className="text-lg text-fred-gray-600 max-w-xl mx-auto mb-6">
          Prediction markets on Federal Reserve Economic Data.
          Trade on the future values of U.S. economic indicators.
        </p>
        <Link href="/markets">
          <Button size="lg">Browse Markets</Button>
        </Link>
      </section>

      {/* How It Works */}
      <section className="pb-16">
        <h2 className="text-xl font-semibold text-fred-navy text-center mb-8">
          How It Works
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card>
            <div className="text-center">
              <div className="text-3xl mb-3">1</div>
              <h3 className="font-semibold text-fred-navy mb-2">Browse</h3>
              <p className="text-sm text-fred-gray-600">
                Find prediction markets on economic indicators like CPI,
                unemployment, GDP, and more from the FRED database.
              </p>
            </div>
          </Card>
          <Card>
            <div className="text-center">
              <div className="text-3xl mb-3">2</div>
              <h3 className="font-semibold text-fred-navy mb-2">Trade</h3>
              <p className="text-sm text-fred-gray-600">
                Buy and sell outcome tokens on a fully on-chain order book.
                Prices reflect the market&apos;s consensus probability.
              </p>
            </div>
          </Card>
          <Card>
            <div className="text-center">
              <div className="text-3xl mb-3">3</div>
              <h3 className="font-semibold text-fred-navy mb-2">Win</h3>
              <p className="text-sm text-fred-gray-600">
                When FRED publishes the data, winning tokens redeem at $1.00
                USDC each. Collect your winnings on-chain.
              </p>
            </div>
          </Card>
        </div>
      </section>

      {/* Economic Indicators */}
      <section className="pb-16">
        <h2 className="text-xl font-semibold text-fred-navy text-center mb-2">
          Economic Indicators
        </h2>
        <p className="text-sm text-fred-gray-600 text-center mb-8">
          Live data from the Federal Reserve Economic Database
        </p>
        <EconomicDashboard />
      </section>
    </div>
  );
}
