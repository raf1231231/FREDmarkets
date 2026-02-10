# STATUS.md — FREDmarkets Implementation Progress

Last updated: 2026-02-10

---

## Overall Project Status

```
beta-FREDmarkets/
├── fred_markets/    # Anchor smart contract — Phase 0+1 DONE, builds clean
├── frontend/        # Next.js 16 app — DONE (barebones, FRED-themed)
├── backend/         # Express + Prisma + PostgreSQL — DONE (barebones, hostable)
└── documentation/   # Specs & docs
```

---

## Smart Contract Build Status: GREEN

`anchor build` succeeds — BPF binary, IDL JSON, and TypeScript types all generate cleanly.

| Artifact | Path | Size |
|----------|------|------|
| BPF binary | `fred_markets/target/deploy/fred_markets.so` | 398 KB |
| IDL | `fred_markets/target/idl/fred_markets.json` | 18 KB (2084 lines) |
| TS types | `fred_markets/target/types/fred_markets.ts` | 18 KB |

---

## Smart Contract Phase Completion

| Phase | Name | Status | Instructions |
|-------|------|--------|-------------|
| 0 | Scaffold & State | DONE | Project structure, all 5 account types, errors, events, constants |
| 1 | Market Lifecycle | DONE | `initialize_platform`, `propose_market`, `claim_market`, `initialize_outcome_mint`, `initialize_order_book` |
| 2 | Token Operations | TODO | `mint_complete_set`, `redeem_complete_set` |
| 3 | Order Book | TODO | `place_order`, `cancel_order` |
| 4 | Lifecycle | TODO | `close_market`, `resolve_market`, `claim_winnings`, `claim_creator_fees` |
| 5 | Safety | TODO | `cancel_market`, `expire_market`, `clear_order_book` |
| — | Tests | TODO | All instructions need TypeScript tests |

---

## Frontend Status: DONE (Barebones)

Next.js 16 with Tailwind v4, FRED-inspired design, Solana wallet integration.

**Start:** `cd frontend && npm run dev` → http://localhost:3000

| Page | Route | Status |
|------|-------|--------|
| Landing | `/` | DONE — Hero, "How It Works" cards, featured markets placeholder |
| Markets List | `/markets` | DONE — Status filter tabs, MarketCard grid (mock data) |
| Market Detail | `/markets/[id]` | DONE — Info card, outcome bars, order book/chart placeholders |
| Create Market | `/create` | DONE — Template grid (6 templates, 4 categories) → pre-filled review form |
| Portfolio | `/portfolio` | DONE — Wallet-gated, placeholder sections |

**Key tech decisions:**
- Tailwind v4 CSS-first config (`@theme inline` in globals.css, not a JS config file)
- `turbopack: {}` required in next.config.ts alongside webpack config (Next.js 16 default)
- Buffer polyfill for Solana web3.js (`window.Buffer = Buffer` in AppProviders.tsx)
- `@types/bn.js` required as devDep
- Anchor 0.30.x: `new Program(idl, provider)` — no programId arg, reads from IDL `address` field
- IDL copied from `fred_markets/target/idl/fred_markets.json` to `frontend/src/idl/`
- Wallet adapter dynamic-imported to avoid SSR issues

**File structure:**
```
frontend/src/
├── app/                    # Next.js App Router pages
│   ├── layout.tsx          # Root layout (providers + header + footer)
│   ├── AppProviders.tsx    # Client boundary: Solana + Anchor providers + Buffer polyfill
│   ├── page.tsx            # Landing page
│   ├── globals.css         # Tailwind v4 @theme with FRED design tokens
│   ├── markets/page.tsx    # Markets list
│   ├── markets/[id]/page.tsx # Market detail
│   ├── create/page.tsx     # Create market (template grid → pre-filled form)
│   └── portfolio/page.tsx  # User portfolio
├── components/
│   ├── create/             # TemplateCard, TemplateGrid, CreateMarketForm
│   ├── layout/             # Header, Footer, NavLink
│   ├── market/             # MarketCard, MarketStatusBadge, OutcomeBar
│   ├── wallet/             # WalletButton (dynamic import, SSR-safe)
│   └── ui/                 # Card, Button, PageHeader
├── data/                   # marketTemplates.ts (6 templates, category metadata)
├── providers/              # SolanaProvider, AnchorProvider (context + hook)
├── lib/                    # constants, utils, api client, PDA derivation helpers
├── types/                  # market.ts, template.ts (on-chain type mirrors)
└── idl/                    # fred_markets.json (copied from contract build)
```

---

## Backend Status: DONE (Barebones)

Express + TypeScript + Prisma ORM + PostgreSQL. Docker-ready for hosting.

**Start:** `cd backend && npm run dev` → http://localhost:3001

| Endpoint | Method | Description | DB Required |
|----------|--------|-------------|-------------|
| `/api/health` | GET | Health check + uptime | No |
| `/api/markets` | GET | List markets (query: status, page, limit) | Yes |
| `/api/markets/:id` | GET | Single market by PDA pubkey | Yes |
| `/api/fred/search?q=...` | GET | Proxy FRED series search | No |
| `/api/fred/series/:seriesId` | GET | Proxy FRED series metadata | No |
| `/api/fred/observations/:seriesId` | GET | Proxy FRED time series data | No |

**Key tech decisions:**
- TypeScript with `tsx` for dev, `tsc` for production build
- Prisma ORM with PostgreSQL (Market model mirrors on-chain state)
- FRED API service with 5-minute in-memory cache (avoids rate limits)
- Rate limiting on FRED proxy routes (60 req/min per IP)
- Middleware stack: CORS, helmet, morgan, express.json, global error handler
- Docker: multi-stage Dockerfile + docker-compose.yml (app + PostgreSQL 16)

**File structure:**
```
backend/
├── src/
│   ├── index.ts            # Express app entry, middleware, mount routes
│   ├── config.ts           # Env var loading (PORT, DATABASE_URL, FRED_API_KEY, etc.)
│   ├── routes/
│   │   ├── index.ts        # Route aggregator
│   │   ├── health.ts       # GET /api/health
│   │   ├── markets.ts      # GET /api/markets, GET /api/markets/:id
│   │   └── fred.ts         # FRED API proxy routes (rate-limited)
│   ├── services/
│   │   ├── fred.ts         # FRED API client (axios, 5-min cache)
│   │   └── market.ts       # Market DB queries via Prisma
│   ├── middleware/
│   │   └── error.ts        # Global error handler
│   └── lib/
│       └── prisma.ts       # Prisma client singleton
├── prisma/schema.prisma    # Market model (mirrors on-chain Market account)
├── .env.example            # Template env vars
├── Dockerfile              # Multi-stage Node 20 build
└── docker-compose.yml      # App + PostgreSQL 16
```

**Environment variables** (`.env`):
```
PORT=3001
DATABASE_URL=postgresql://fredmarkets:password@localhost:5432/fredmarkets
FRED_API_KEY=<your key>
FRONTEND_URL=http://localhost:3000
NODE_ENV=development
```

**Docker quick start:**
```bash
cd backend
docker compose up        # starts API + PostgreSQL
# OR just the database:
docker compose up db     # then: npm run dev
```

---

## Implemented Smart Contract Instructions (5 of 14)

### 1. `initialize_platform`
- **File:** `instructions/initialize_platform.rs`
- **Accounts:** authority (signer), platform_config (init PDA), system_program
- **Logic:** Creates PlatformConfig singleton. Validates fee shares sum to 10000.
- **Status:** Compiles, IDL generated.

### 2. `propose_market`
- **File:** `instructions/propose_market.rs`
- **Accounts:** proposer (signer), platform_config (mut), market (init PDA), treasury, system_program
- **Logic:** Creates Market PDA with `status = Pending`. Validates num_outcomes, dates, paused state. Transfers SOL market_creation_fee to treasury. Uses variable-length String/Vec params to fit in tx limit, converts to fixed-size arrays in handler.
- **Status:** Compiles, IDL generated.

### 3. `claim_market`
- **File:** `instructions/claim_market.rs`
- **Accounts:** creator (signer), platform_config, market (mut), token_mint, creator_usdc_account, vault (init PDA token account), creator_config (init PDA), token_program, system_program
- **Logic:** Creates vault (USDC token account, PDA-owned by market). Transfers stake_amount USDC from creator to vault. Creates MarketCreatorConfig with fee share, lock period. Sets market to Active. Does NOT mint outcome tokens (mints don't exist yet — deferred to Phase 2 `mint_complete_set`).
- **Status:** Compiles, IDL generated.

### 4. `initialize_outcome_mint`
- **File:** `instructions/initialize_outcome_mint.rs`
- **Accounts:** payer (signer), market (mut), outcome_mint (init PDA mint), token_program, system_program
- **Logic:** Creates SPL token mint for one outcome. Mint authority = market PDA. Decimals = 6 (matches USDC). Stores mint pubkey in `market.outcome_mints[i]`. Increments `market.initialized_outcomes`.
- **Status:** Compiles, IDL generated.

### 5. `initialize_order_book`
- **File:** `instructions/initialize_order_book.rs`
- **Accounts:** payer (signer), market (mut), order_book (init zero_copy PDA), system_program
- **Logic:** Creates zero_copy OrderBook PDA for one outcome. Initializes with zeroed bids/asks arrays. Increments `market.initialized_outcomes`.
- **Status:** Compiles, IDL generated.

---

## Key Build Workarounds Applied

### 1. anchor-syn 0.30.1 `source_file()` Bug
The `#[account]` proc macro calls `source_file()` which requires an unstable nightly feature. Patched both registry copies of `anchor-syn-0.30.1/src/idl/defined.rs` to replace the `#[cfg(procmacro2_semver_exempt)]` block with a no-op. Skips type alias/external type resolution for IDL — safe because all our types are in-crate.

**Patched files:**
- `~/.cargo/registry/src/index.crates.io-6f17d22bba15001f/anchor-syn-0.30.1/src/idl/defined.rs`
- `~/.cargo/registry/src/index.crates.io-1949cf8c6b5b557f/anchor-syn-0.30.1/src/idl/defined.rs`

**WARNING:** `cargo update` or registry cache clearing wipes these patches. Re-apply by replacing the `#[cfg(procmacro2_semver_exempt)]` block (around line 492) with:
```rust
#[cfg(procmacro2_semver_exempt)]
{
    // Intentionally empty — source_file() not available
}
```

### 2. Lockfile Version
Must use `cargo +1.79.0` for all lockfile operations. Rust 1.88 generates v4; BPF toolchain needs v3.

### 3. Dependency Pins
BPF toolchain's rustc 1.75.0-dev requires older crate versions:
- `proc-macro-crate` 3.2.0 (not 3.4.0)
- `borsh` 1.5.3 (not 1.6.0)
- `indexmap` 2.7.0 (not 2.13.0)
- `blake3` pinned to `=1.5.5` in workspace Cargo.toml

### 4. OrderBook zero_copy
OrderBook (6952 bytes) exceeds BPF's 4096-byte stack frame limit. Uses `#[account(zero_copy)]` with `#[repr(C)]` and bytemuck derives. Nested `Order` struct also needs `AnchorSerialize`/`AnchorDeserialize` for IDL generation.

---

## Architecture Decisions & Design Notes

### claim_market Does NOT Mint Tokens
The spec says claim_market mints initial complete sets, but since outcome mints are created in separate `initialize_outcome_mint` calls (split pattern), minting is deferred. The creator's USDC stake sits in the vault. After all mints and order books are initialized (`initialized_outcomes == num_outcomes * 2`), the creator calls `mint_complete_set` (Phase 2) to get their initial outcome tokens.

### propose_market Uses Variable-Length Params
Market account has ~1148 bytes of field data (title, description, outcome_labels, etc.). Fixed-size arrays would exceed Solana's 1232-byte tx limit. The params struct uses `String` and `Vec<String>`, converted to `[u8; N]` arrays in the handler via `string_to_fixed<N>()`.

### No Fees on Trading (ERRATA #2)
Fees are collected exclusively in `claim_winnings`. `place_order` is fee-free. This simplifies the order matching engine and encourages tighter spreads.

### initialized_outcomes Gating (ERRATA #7)
`market.initialized_outcomes` starts at 0, incremented by each `initialize_outcome_mint` and `initialize_order_book` call. Phase 2+ instructions must check `initialized_outcomes == num_outcomes * 2` before allowing minting or trading.

---

## Remaining Smart Contract Instructions (9 of 14)

| # | Instruction | Phase | Key Complexity |
|---|-------------|-------|---------------|
| 6 | `mint_complete_set` | 2 | USDC → vault, mint N outcome tokens. Handle creator's pre-deposited stake. |
| 7 | `redeem_complete_set` | 2 | Burn N outcome tokens, vault → USDC. Validate non-Resolved/non-Pending status. |
| 8 | `place_order` | 3 | Matching engine (cap fills per tx), escrow USDC/tokens, fill events. Most complex instruction. |
| 9 | `cancel_order` | 3 | Return escrowed funds, update order book. |
| 10 | `close_market` | 4 | Permissionless cranker: if current_time > closes_at, set Closed. |
| 11 | `resolve_market` | 4 | Oracle-only: set winning_outcome, resolution_value, Resolved. No order clearing. |
| 12 | `claim_winnings` | 4 | Burn winning tokens, payout minus fee. Split fee to creator/treasury/reserve. |
| 13 | `claim_creator_fees` | 4 | Creator withdraws accumulated_fees from vault. |
| 14 | `cancel_market` | 5 | Admin cancellation. Pending → Cancelled (no orders). Active/Closed → Cancelled. |
| 15 | `expire_market` | 5 | Permissionless: if resolves_at + 7d passed without resolution, set Expired. |
| 16 | `clear_order_book` | 5 | Permissionless cranker: return escrowed funds from resolved/cancelled/expired market. |

---

## Next Steps (Recommended Order)

### 1. Smart Contract — Phase 2: Token Operations
**Priority: HIGH** — Everything downstream depends on minting/redeeming tokens.

- `mint_complete_set` — Deposit USDC to vault, mint 1 of each outcome token to user. Must check `initialized_outcomes == num_outcomes * 2`. Handle creator's pre-deposited stake from `claim_market`.
- `redeem_complete_set` — Burn 1 of each outcome token, return USDC from vault. Block in `Pending` or `Resolved` status.

### 2. Smart Contract — Phase 3: Order Book
**Priority: HIGH** — Core trading functionality.

- `place_order` — Most complex instruction. Matching engine with capped fills per tx, USDC/token escrow, fill events. Needs careful compute budget management.
- `cancel_order` — Return escrowed funds, clear slot in order book array.

### 3. Smart Contract — Phase 4: Market Lifecycle
**Priority: MEDIUM** — Resolution and payout flow.

- `close_market` — Permissionless cranker, time-based.
- `resolve_market` — Oracle sets winning outcome.
- `claim_winnings` — Burn winning tokens, payout minus fee split (60% creator, 30% treasury, 10% reserve).
- `claim_creator_fees` — Creator withdraws accumulated fees from vault.

### 4. Smart Contract — Phase 5: Safety
**Priority: MEDIUM** — Edge cases and cleanup.

- `cancel_market`, `expire_market`, `clear_order_book`

### 5. TypeScript Tests
**Priority: HIGH (parallel with Phases 2-5)** — Write tests for each instruction as it's built. Use `anchor test` with local validator.

### 6. Frontend — Wire to On-Chain
**Priority: AFTER Phase 2+3** — Once minting and trading work:

- Wire Create Market form to `propose_market` instruction (template → tx)
- Wire Markets list to on-chain `program.account.market.all()` or backend indexer
- Wire Market Detail to real order book data
- Wire Portfolio to user's token balances and open orders

### 7. Backend — On-Chain Indexer
**Priority: AFTER Phase 3** — Sync on-chain state to PostgreSQL:

- Listener/poller for market account changes
- Index order book state for faster queries
- Historical trade data for charts

### 8. Deployment & DevOps
**Priority: LAST**

- Deploy contract to devnet
- Host backend (Docker on VPS or Railway/Render)
- Host frontend (Vercel)
- CI/CD pipeline
