---
title: FREDmarkets
status: complete
created: 2026-01-15
agents: [colin]
---

Decentralized prediction market platform using FRED economic data as oracle. Users bet on real-world economic outcomes (CPI, unemployment, etc.) via Solana smart contracts.

## Goals

### Frontend
- [x] Market Cloud visualization (100-node force-directed graph)
- [x] MarketCard, MarketCalendar, and outcome bracket display
- [x] Category filters and responsive frontend design
- [x] Anchor provider setup and program client skeleton

### Backend
- [x] FRED API proxy with all endpoints
- [x] Batch series endpoint
- [x] Neon PostgreSQL database with Prisma schema
- [x] Rate limiting (100 req/15min)
- [x] Health check endpoint

### Smart Contract Phase 0-1
- [x] initialize_platform (Phase 0)
- [x] propose_market, claim_market, initialize_outcome_mint, initialize_order_book (Phase 1)

### Smart Contract Phase 2-3
- [x] mint_complete_set (Phase 2)
- [x] redeem_complete_set (Phase 2)
- [x] place_order with auto-fill (Phase 3)
- [x] cancel_order (Phase 3)

### Smart Contract Phase 4-5
- [x] close_market and resolve_market (Phase 4)
- [x] claim_winnings with fee logic (Phase 4)
- [x] claim_creator_fees (Phase 4)
- [x] clear_order_book cranker (Phase 5)

### Infrastructure
- [x] Oracle relay service (FRED data to on-chain resolution)
- [x] Infrastructure deployment (Neon + Railway + Vercel)
- [x] Frontend wired to live smart contract


---


# FREDmarkets — Technical Specification
> **For Colin Code (Minimax 2.5):** This document is your implementation guide. Work top-down. All paths are relative to `~/.openclaw/projects/FREDmarkets/`. Always read existing files before modifying them. The smart contract has strict build constraints — do not deviate from them (Section 7.3).

**Last Updated:** 2026-03-02
**Status:** 100% complete — full-stack live: frontend wired to on-chain program, oracle relay active, infrastructure deployed.
**Type:** Decentralized prediction market platform using FRED economic data as oracle

---

## 1. What Is This?

FREDmarkets is a **decentralized prediction market platform** where users bet on real-world economic outcomes published by the **Federal Reserve Bank of St. Louis (FRED)**. Examples:

- "Will US CPI exceed 3.5% in Q2 2026?" → YES/NO market
- "Where will unemployment land in March 2026?" → 3.5%–3.7% / 3.8%–4.0% / 4.1%+ brackets

The platform uses:
- **FRED API** as the data oracle (official economic releases)
- **Solana / Anchor smart contract** for trustless conditional token markets
- **Next.js + Express** for the product experience

### Key Innovation
Markets are auto-created from 100 curated FRED economic indicators. The platform generates statistically-appropriate outcome brackets using historical volatility — no manual market creation needed.

---

## 2. Technology Stack

| Layer | Technology | Notes |
|-------|-----------|-------|
| Frontend | Next.js 16, React 19, Tailwind CSS v4 | Vercel deployment |
| Backend | Express + Prisma, Node.js | Railway deployment |
| Database | Neon PostgreSQL (serverless) | Market metadata + FRED cache |
| Smart Contract | Anchor 0.29.0, Rust 1.75.0 | Solana devnet → mainnet |
| Token Standard | SPL (Solana Program Library) | One mint per outcome |
| Collateral | USDC (SPL) | Full collateralisation |
| Oracle | FRED API (official data releases) | Vintage-pinned resolution |

---

## 3. Repository Layout

```
FREDmarkets/
├── frontend/                         # Next.js 16 app
│   └── src/
│       ├── app/
│       │   ├── page.tsx              # Homepage / market cloud
│       │   ├── create/page.tsx       # Market Cloud sponsor UI
│       │   ├── markets/[id]/         # Market detail
│       │   └── portfolio/            # User positions
│       ├── components/
│       │   ├── cloud/                # Market Cloud (100-node D3 viz)
│       │   ├── market/               # MarketCard, MarketCalendar
│       │   ├── layout/               # Header, nav
│       │   └── ui/                   # Shared primitives
│       ├── data/
│       │   ├── fred-series.ts        # 100 FRED indicators catalog
│       │   └── marketTemplates.ts    # Outcome bracket templates
│       ├── hooks/
│       │   ├── useFredData.ts
│       │   ├── useFredObservations.ts
│       │   ├── useMarketCloud.ts
│       │   └── useSponsorMarket.ts
│       ├── lib/
│       │   ├── api.ts                # Backend REST client
│       │   ├── anchor.ts             # Anchor provider setup
│       │   ├── outcomeGenerator.ts   # Statistical bracket generation
│       │   └── program.ts            # On-chain program client
│       └── types/
│           ├── cloud.ts
│           ├── fred.ts
│           ├── market.ts
│           └── template.ts
├── backend/                          # Express + Prisma API
│   └── src/
│       ├── index.ts                  # Express setup, port 3001
│       ├── config.ts                 # Env validation
│       ├── routes/
│       │   ├── fred.ts               # FRED API proxy + cache
│       │   ├── markets.ts            # Market CRUD
│       │   ├── health.ts
│       │   └── index.ts
│       ├── services/
│       │   ├── fred.ts               # FRED API client + caching
│       │   └── market.ts             # Market operations
│       ├── lib/
│       │   └── prisma.ts             # Prisma singleton
│       ├── middleware/
│       │   └── error.ts
│       └── config/
│           └── seriesCatalog.ts      # 100-series catalog
├── fred_markets/                     # Anchor smart contract (Rust)
│   ├── programs/fred_markets/
│   │   └── src/
│   │       ├── lib.rs                # Program entry + instruction dispatch
│   │       ├── state/                # Account structs
│   │       │   ├── platform_config.rs
│   │       │   ├── market.rs
│   │       │   ├── order_book.rs
│   │       │   └── user_account.rs
│   │       ├── instructions/         # One file per instruction
│   │       │   ├── initialize_platform.rs
│   │       │   ├── propose_market.rs
│   │       │   ├── claim_market.rs
│   │       │   ├── initialize_outcome_mint.rs
│   │       │   └── initialize_order_book.rs
│   │       └── errors.rs
│   ├── Anchor.toml
│   ├── Cargo.toml
│   └── Cargo.lock
├── documentation/
│   ├── BUILD_NOTES.md                # ⚠️ READ THIS BEFORE TOUCHING CONTRACT
│   └── ERRATA.md                     # Known issues + workarounds
├── PROJECT_STATUS.md                 # Implementation checklist
└── spec.md                           # This file
```

---

## 4. Frontend Architecture

### 4.1 Market Cloud

The homepage renders a **100-node force-directed graph** where each node = one FRED indicator. Nodes are sized by market volume and coloured by category. Clicking a node navigates to that market.

**Key component:** `components/cloud/MarketCloud.tsx`
**Data hook:** `useMarketCloud.ts` — fetches market list, computes node positions

### 4.2 FRED Data Integration

100 indicators across 11 categories:
- GDP & Growth, Inflation & Prices, Employment, Housing, Manufacturing
- Trade & International, Financial Markets, Banking, Consumer, Government, Energy

Each indicator has:
- `seriesId` (e.g., `CPIAUCSL`, `UNRATE`, `FEDFUNDS`)
- `title`, `frequency`, `units`, `category`
- Historical volatility → used to generate outcome brackets

### 4.3 Outcome Bracket Generation (`lib/outcomeGenerator.ts`)

```typescript
// For binary markets: YES / NO
// For multi-outcome: statistically-derived ranges based on std dev
function generateBrackets(series: FredSeries, observations: number[]): Outcome[] {
  const mean   = observations.reduce((a, b) => a + b) / observations.length;
  const stdDev = Math.sqrt(observations.map(x => (x - mean) ** 2)
                            .reduce((a, b) => a + b) / observations.length);
  // Generate 3–5 brackets around ±1σ, ±2σ
  return buildRangeBrackets(mean, stdDev, series.units);
}
```

### 4.4 Market Resolution (Oracle Flow)

```
FRED releases data (e.g., CPI for Feb 2026)
    ↓
Backend fetches via vintage-pinned observation:
  GET /api/fred/observations?series_id=CPIAUCSL
      &realtime_start=2026-03-01&realtime_end=2026-03-01
    ↓
Oracle relay service (not yet built) calls smart contract:
  resolve_market(market_id, winning_outcome_index)
    ↓
Users claim winnings: claim_winnings(market_id, shares)
```

---

## 5. Backend Architecture

### 5.1 FRED API Proxy (`routes/fred.ts`)

The backend proxies FRED API requests to avoid exposing API keys to the browser and adds caching.

```typescript
// GET /api/fred/series?id=CPIAUCSL
// GET /api/fred/observations?series_id=CPIAUCSL&limit=50
// GET /api/fred/batch?ids=CPIAUCSL,UNRATE,FEDFUNDS
```

**Cache:** `FredCache` table in Neon PostgreSQL. TTL varies by series frequency:
- Daily series: 24h cache
- Monthly series: 7d cache
- Quarterly series: 30d cache

### 5.2 Prisma Schema

```prisma
model Market {
  id              String    @id
  seriesId        String
  title           String
  status          String    // "pending" | "active" | "closed" | "resolved"
  onChainAddress  String?   // populated after on-chain creation
  createdAt       DateTime  @default(now())
  updatedAt       DateTime  @updatedAt
}

model FredCache {
  seriesId        String    @id
  data            Json
  cachedAt        DateTime  @default(now())
  expiresAt       DateTime
}
```

### 5.3 Environment Variables

```bash
# Backend (.env)
DATABASE_URL=postgresql://...@ep-xxx.neon.tech/neondb?sslmode=require
FRED_API_KEY=your_fred_api_key
PORT=3001
CORS_ORIGIN=https://fredmarkets.vercel.app

# Frontend (.env.local)
NEXT_PUBLIC_API_URL=https://your-backend.railway.app
NEXT_PUBLIC_SOLANA_NETWORK=devnet  # → mainnet-beta for production
```

---

## 6. Smart Contract Architecture

**Program ID:** `GaK745UiF6FMZt5hXbCrKQrhmdcmRx8SYi3AdfFshMBo`
**Network:** Solana devnet (→ mainnet after audit)

### 6.1 Economic Model (Conditional Tokens)

- Each market has N outcomes (2 = binary, 3–8 = multi)
- Each outcome has its own SPL token mint (mint_authority = market PDA)
- **1 USDC = 1 complete set** = 1 token of each outcome (always sums to $1)
- Vault holds exactly `total_sets_minted` USDC → provably solvent
- Winning outcome tokens redeem 1:1 for USDC; losers = worthless
- Fee: 2% on `claim_winnings` (60% creator / 30% treasury / 10% reserve)

### 6.2 PDAs (Program Derived Addresses)

| Account | Seeds | Size | Purpose |
|---------|-------|------|---------|
| `PlatformConfig` | `["platform_config"]` | — | Singleton platform state |
| `Market` | `["market", market_id_le_bytes]` | 1543 B | Per-market state |
| `MarketCreatorConfig` | `["creator_config", market.key()]` | — | Creator fee tracking |
| `OutcomeMint` | `["outcome_mint", market_id, outcome_index]` | SPL Mint | One per outcome |
| `OrderBook` | `["order_book", market_id, outcome_index]` | 6952 B | Per-outcome order book (zero_copy) |
| `OrderEntry` | `["order", market_id, outcome_index, order_index]` | — | Individual order |
| `Vault` | `["vault", market_id]` | SPL TokenAccount | USDC escrow |
| `UserAccount` | `["user_account", user.key()]` | — | Lifetime user stats |

### 6.3 Instructions (15 total — 5 complete)

#### Phase 0+1 Complete ✅ (5 instructions)

| # | Instruction | Status | Description |
|---|-------------|--------|-------------|
| 1 | `initialize_platform` | ✅ | Bootstrap `PlatformConfig` — one-time |
| 2 | `propose_market` | ✅ | Any user creates a `Pending` market |
| 3 | `claim_market` | ✅ | Creator claims market + funds vault |
| 4 | `initialize_outcome_mint` | ✅ | Create SPL mint for one outcome |
| 5 | `initialize_order_book` | ✅ | Create zero_copy order book for outcome |

#### Phase 2 — Token Operations ⏳

| # | Instruction | Description |
|---|-------------|-------------|
| 6 | `mint_complete_set` | Deposit USDC → mint 1 token of each outcome |
| 7 | `redeem_complete_set` | Burn 1 of each outcome → return USDC |

#### Phase 3 — Order Book ⏳

| # | Instruction | Description |
|---|-------------|-------------|
| 8 | `place_order` | Limit bid/ask with auto-fill against book |
| 9 | `cancel_order` | Cancel caller's own resting order |

#### Phase 4 — Lifecycle ⏳

| # | Instruction | Description |
|---|-------------|-------------|
| 10 | `close_market` | Active → Closed at `closes_at` timestamp |
| 11 | `resolve_market` | Oracle sets winning outcome index |
| 12 | `claim_winnings` | Redeem winning tokens for USDC (−2% fee) |
| 13 | `claim_creator_fees` | Creator withdraws 60% fee share |

#### Phase 5 — Safety ⏳

| # | Instruction | Description |
|---|-------------|-------------|
| 14 | `clear_order_book` | Cranker cancels all resting orders (emergency) |

---

## 7. Build Constraints (CRITICAL — READ BEFORE TOUCHING CONTRACT)

> **Colin Code: These constraints are non-negotiable. Deviating from them will break the build.**

### 7.1 Pinned Versions

```toml
# Anchor.toml
[toolchain]
anchor_version = "0.29.0"   # NOT 0.30.x — has source_file() breaking bug

# Cargo.toml
[dependencies]
anchor-lang  = "0.29.0"
blake3       = "=1.5.5"     # Exact pin — fixes edition2024 parse error

# Rust toolchain
rustup override set 1.75.0  # NOT newer — Anchor 0.29.0 has compat issues
```

### 7.2 Stack Size Constraints (BPF 4096-byte limit)

Use `Box<Account<...>>` for any account larger than ~200 bytes:

```rust
// ✅ Correct
pub market: Box<Account<'info, Market>>,

// ❌ Will exceed BPF stack limit
pub market: Account<'info, Market>,
```

### 7.3 Sysvar Rent

Anchor 0.29.0 handles `Rent` implicitly. Do NOT add it to account structs:

```rust
// ❌ Do not add
// pub rent: Sysvar<'info, Rent>,

// ✅ Anchor handles it
```

### 7.4 Lockfile Version

`Cargo.lock` must stay at lockfile version 3. Don't run `cargo update` without checking.

### 7.5 Build Commands

```bash
# From fred_markets/ directory:
anchor build                     # Build contract
anchor deploy --provider.cluster devnet  # Deploy to devnet
anchor test                      # Run tests against localnet

# If blake3 errors appear:
cargo clean && anchor build
```

---

## 8. Implementation Status

### ✅ Complete
- Frontend: Market Cloud visualization (100 nodes, force-directed)
- Frontend: MarketCard, MarketCalendar, outcome bracket display
- Frontend: Category filters, responsive design
- Frontend: Anchor provider setup + program client skeleton
- Backend: FRED API proxy (all endpoints)
- Backend: Batch series endpoint
- Backend: Neon PostgreSQL + Prisma schema
- Backend: Rate limiting (100 req/15min)
- Backend: Health check endpoint
- Smart Contract: `initialize_platform` (Phase 0)
- Smart Contract: `propose_market`, `claim_market`, `initialize_outcome_mint`, `initialize_order_book` (Phase 1)

### ⏳ Not Yet Built (priority order)

| # | Task | Complexity | Phase |
|---|------|-----------|-------|
| **1** | Oracle relay service | High | Off-chain |
| **2** | Frontend wired to contract (beyond skeleton) | High | Integration |

---

## 9. PRIORITY TASK: Phase 2 — Token Operations

> **Colin Code — implement these two instructions next.**

### 9.1 `mint_complete_set`

**Logic:** User deposits N USDC → receives 1 token of each outcome (N outcomes total).

```rust
// Context: accounts needed
pub struct MintCompleteSet<'info> {
    #[account(mut)]
    pub user: Signer<'info>,
    #[account(mut, seeds = ["market", market.market_id.to_le_bytes()], bump)]
    pub market: Box<Account<'info, Market>>,
    #[account(mut, seeds = ["vault", market.market_id.to_le_bytes()], bump)]
    pub vault: Box<Account<'info, TokenAccount>>,
    #[account(mut)] // user's USDC account
    pub user_usdc: Box<Account<'info, TokenAccount>>,
    // Per outcome: user_outcome_account[i], outcome_mint[i]
    // Use remaining_accounts for variable-length outcomes
    pub token_program: Program<'info, Token>,
}

// Implementation:
// 1. transfer(user_usdc → vault, sets_count * decimals)
// 2. for each outcome_mint[i]: mint_to(user_outcome_account[i], sets_count)
// 3. market.total_sets_minted += sets_count
```

### 9.2 `redeem_complete_set`

**Logic:** User burns 1 of each outcome token → receives N USDC back.

```rust
// 1. for each outcome_mint[i]: burn(user_outcome_account[i], sets_count)
// 2. transfer(vault → user_usdc, sets_count * decimals) via PDA signer
// 3. market.total_sets_minted -= sets_count
```

### 9.3 PDA Signer Pattern for Vault Transfer

```rust
// The vault is owned by a PDA — use seeds to sign:
let seeds = &[
    b"vault",
    market.market_id.to_le_bytes().as_ref(),
    &[vault_bump],
];
let signer_seeds = &[&seeds[..]];

token::transfer(
    CpiContext::new_with_signer(
        ctx.accounts.token_program.to_account_info(),
        Transfer { from: vault, to: user_usdc, authority: vault_pda },
        signer_seeds,
    ),
    amount,
)?;
```

---

## 10. Oracle Relay Service (Not Yet Built)

**Purpose:** Monitor FRED releases, then call `resolve_market` on-chain when data drops.

**Architecture:**

```
Cron job (Railway) runs at FRED release times
    ↓
Fetch latest observation from FRED API (vintage-pinned)
    ↓
Determine winning outcome bracket
    ↓
Call resolve_market(market_id, winning_outcome_index)
    via @solana/web3.js + oracle keypair
```

**File:** `backend/src/services/oracle.ts` (to be created)

---

## 11. Infrastructure Setup (Not Yet Deployed)

| Service | Provider | Notes |
|---------|---------|-------|
| Frontend | Vercel | Connect GitHub → auto-deploy |
| Backend | Railway | Dockerfile or Node buildpack |
| Database | Neon | Free tier: 0.5 GB, autoscale |
| Contract | Solana devnet | Already deployed at program ID above |

**Neon setup:**
```bash
# 1. Create project at neon.tech
# 2. Copy DATABASE_URL
# 3. Run migrations:
cd backend && npx prisma migrate deploy
```

**Railway setup:**
```bash
# 1. railway login && railway new
# 2. railway add --service backend
# 3. Set env vars in Railway dashboard
# 4. railway up
```

---

## 12. FRED API Reference

Base URL: `https://api.stlouisfed.org/fred`

```bash
# Get series metadata
GET /series?series_id=CPIAUCSL&api_key=...&file_type=json

# Get observations (vintage-pinned for oracle resolution)
GET /series/observations?series_id=CPIAUCSL
    &realtime_start=2026-03-01&realtime_end=2026-03-01
    &api_key=...&file_type=json

# Example 100 tracked series:
CPIAUCSL   # CPI All Items (inflation)
UNRATE     # Unemployment Rate
FEDFUNDS   # Federal Funds Rate
GDP        # Gross Domestic Product
MORTGAGE30US # 30-Year Fixed Mortgage Rate
CSUSHPISA  # Case-Shiller Home Price Index
# ... 94 more in data/fred-series.ts
```

---

## 13. Colin Code — Implementation Order

### Smart Contract (do in order — each builds on previous):

```
Step 1: Read fred_markets/programs/fred_markets/src/lib.rs
Step 2: Read fred_markets/programs/fred_markets/src/state/market.rs
Step 3: Read documentation/BUILD_NOTES.md (DO NOT SKIP)
Step 4: Create instructions/mint_complete_set.rs
Step 5: Create instructions/redeem_complete_set.rs
Step 6: Register both instructions in lib.rs
Step 7: anchor build (fix any compile errors)
Step 8: Write tests in fred_markets/tests/
Step 9: anchor test
Step 10: Proceed to Phase 3 (place_order — most complex, plan carefully)
```

### Backend / Infrastructure:

```
Step A: Set up Neon PostgreSQL → run prisma migrate
Step B: Deploy backend to Railway with env vars
Step C: Deploy frontend to Vercel with env vars
Step D: Create backend/src/services/oracle.ts (oracle relay)
Step E: Wire oracle into Railway cron
```

### Critical reminders:
- Anchor version = 0.29.0 (never upgrade without explicit instruction)
- Rust toolchain = 1.75.0
- blake3 = "=1.5.5" (exact pin)
- Use `Box<Account<...>>` for all large accounts
- Never add Sysvar Rent to account contexts
