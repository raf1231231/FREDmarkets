# FREDmarkets

A decentralized prediction market platform built on Solana, enabling users to trade on Federal Reserve Economic Data (FRED) indicators.

## Deployment Status

**Current Phase**: Infrastructure Deployment

- Frontend: Vercel (configuration in progress)
- Backend: Ready to deploy to Railway
- Database: Ready to deploy to Neon PostgreSQL
- Smart Contract: Phase 0+1 complete (5 of 15 instructions)

**Quick Links**:
- [Deployment Guide](RAILWAY_DEPLOYMENT.md) - Complete Railway + Neon setup
- [Deployment Checklist](DEPLOY_CHECKLIST.md) - Quick reference
- [Project Status](PROJECT_STATUS.md) - Detailed status and metrics

## Overview

FREDmarkets transforms economic data from the Federal Reserve Economic Data (FRED) database into tradable prediction markets. Users can create markets on upcoming economic releases, sponsor market potentials with initial liquidity, and trade conditional outcome tokens based on what they believe future economic indicators will reveal.

The platform operates entirely on-chain using the Solana blockchain, with an order book mechanism for price discovery and conditional tokens representing each possible outcome. Markets resolve automatically based on official FRED data releases.

## Key Features

### Market Cloud

The Market Cloud interface displays 100 live economic indicators across 11 categories, automatically generating market potentials from real-time FRED data. Each potential includes:

- Intelligently generated outcome brackets based on historical volatility
- Competitive odds calculated from statistical distributions
- Automated resolution conditions tied to official data releases
- Customizable parameters before sponsorship

### Categories

Markets span essential economic indicators:

- Inflation (CPI, PCE, PPI)
- Employment (Payrolls, Unemployment Rate, Jobless Claims)
- Consumer Spending (Retail Sales, Consumer Sentiment)
- Interest Rates (Treasury Yields, Fed Funds Rate)
- Housing (Home Prices, Mortgage Rates, Housing Starts)
- Production (Industrial Output, Capacity Utilization)
- GDP (Growth Rates, Components)
- Fed Policy (FOMC Decisions, Rate Changes)
- Commodities (Oil, Gold, Agricultural Prices)
- Credit and Debt (Consumer Credit, Delinquencies)
- Trade (Balance, Imports, Exports)

### On-Chain Order Book

Unlike automated market makers, FREDmarkets uses an on-chain order book for each outcome token, providing:

- Transparent price discovery
- No impermanent loss for liquidity providers
- Traditional limit order functionality
- Capital efficiency through direct matching

### Conditional Tokens

Each market generates a complete set of outcome tokens. Users can:

- Mint complete sets by depositing collateral
- Trade individual outcome tokens on the order book
- Redeem winning tokens after market resolution
- Reclaim collateral from complete sets at any time

## Architecture

### Smart Contract

The Anchor program implements core market logic:

- Market lifecycle management (Pending, Active, Closed, Resolved)
- Complete set minting and redemption
- Order book operations (place, cancel, fill orders)
- Automated resolution through oracle integration
- Fee distribution to market creators

### Backend

The Express API server provides:

- FRED data proxy with intelligent caching
- Batch observation endpoints for efficient data retrieval
- PostgreSQL storage via Prisma ORM
- Market metadata and historical data

### Frontend

The Next.js application delivers:

- Interactive Market Cloud visualization
- Real-time market browsing and filtering
- Wallet integration via Solana wallet adapter
- Responsive design optimized for desktop and mobile

## Getting Started

### Prerequisites

- Node.js 18 or higher
- PostgreSQL database (or Supabase account)
- Solana CLI tools (for local development)
- FRED API key (obtain free from https://fred.stlouisfed.org/docs/api/api_key.html)

### Installation

Clone the repository:

```bash
git clone https://github.com/yourusername/beta-FREDmarkets.git
cd beta-FREDmarkets
```

### Backend Setup

Navigate to the backend directory and install dependencies:

```bash
cd backend
npm install
```

Create a `.env` file based on `.env.example` and configure:

```
PORT=3001
DATABASE_URL=your_postgresql_connection_string
DIRECT_URL=your_postgresql_direct_connection
FRED_API_KEY=your_fred_api_key
FRONTEND_URL=http://localhost:3000
NODE_ENV=development
```

Run database migrations:

```bash
npx prisma migrate dev
```

Start the development server:

```bash
npm run dev
```

### Frontend Setup

Navigate to the frontend directory and install dependencies:

```bash
cd frontend
npm install
```

Create a `.env.local` file:

```
NEXT_PUBLIC_API_BASE_URL=http://localhost:3001/api
```

Start the development server:

```bash
npm run dev
```

The application will be available at http://localhost:3000.

### Smart Contract Setup

Navigate to the Anchor workspace:

```bash
cd fred_markets
```

Build the program:

```bash
anchor build
```

Deploy to localnet:

```bash
anchor deploy
```

## Project Structure

```
beta-FREDmarkets/
├── fred_markets/          # Anchor smart contract
│   ├── programs/          # Rust program code
│   ├── target/            # Build artifacts and IDL
│   └── tests/             # Integration tests
├── frontend/              # Next.js application
│   ├── src/
│   │   ├── app/           # Page routes
│   │   ├── components/    # React components
│   │   ├── hooks/         # Custom hooks
│   │   ├── lib/           # Utilities
│   │   ├── data/          # Static data and configuration
│   │   └── types/         # TypeScript definitions
│   └── public/            # Static assets
├── backend/               # Express API server
│   ├── src/
│   │   ├── routes/        # API endpoints
│   │   ├── services/      # Business logic
│   │   └── lib/           # Shared utilities
│   └── prisma/            # Database schema and migrations
└── documentation/         # Technical specifications
```

## Usage

### Creating a Market

1. Navigate to the Create page to view the Market Cloud
2. Filter by category or search for specific indicators
3. Click on a market potential to review generated outcomes
4. Adjust stake amount and initial odds if desired
5. Confirm sponsorship transaction to deploy the market on-chain

### Trading

1. Browse active markets on the Markets page
2. View market details including current odds and volume
3. Connect your Solana wallet
4. Mint complete sets or trade individual outcome tokens
5. Place limit orders or take existing orders from the book

### Resolution

Markets resolve automatically when FRED publishes the relevant data release. Winners can redeem their outcome tokens for the collateral at a 1:1 ratio.

## Data Sources

All market resolutions are based on official data from the Federal Reserve Economic Data (FRED) database, maintained by the Federal Reserve Bank of St. Louis. FRED provides comprehensive economic time series data from 100+ sources.

## Security Considerations

The platform is currently in beta testing. Key security measures include:

- All smart contract code is open source and auditable
- Markets use standard SPL token accounts
- Collateral is held in program-controlled vaults
- Resolution requires cryptographic proof from oracle
- No admin keys control user funds

Users should only trade with funds they can afford to lose and verify all market parameters before participation.

## Contributing

Contributions are welcome. Please review the documentation in the `/documentation` directory for technical specifications and implementation details.

## License

This project is licensed under the MIT License.

## Disclaimer

This platform is for informational and educational purposes. Prediction markets may be subject to regulatory restrictions in certain jurisdictions. Users are responsible for ensuring compliance with applicable laws.

The information provided does not constitute financial advice. Past economic data does not guarantee future performance.
