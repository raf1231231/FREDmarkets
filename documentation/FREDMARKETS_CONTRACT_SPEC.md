# FREDmarkets — Smart Contract Specification

## 1. Overview

FREDmarkets is a prediction market platform on Solana where users trade on future values of U.S. economic indicators from the FRED API. Markets use a **conditional token framework** with an **on-chain order book** for trading. There is no AMM — all liquidity comes from participants.

### Core Model

- Each market has N outcomes (2 for binary, 3–8 for multi-outcome)
- Each outcome has its own SPL token mint
- Users mint **complete sets**: deposit 1 USDC → receive 1 token of every outcome
- Users trade individual outcome tokens on an order book at prices between 0.01 and 0.99 USDC
- On resolution: winning tokens redeem at 1 USDC each, losing tokens are worthless
- The complete set constraint guarantees outcome prices sum to ~1.0 via arbitrage

### Market Creator Model

Anyone can propose a market. A separate user (or the proposer themselves) can **claim** a pending market by depositing a USDC stake and setting initial odds. The creator's stake is converted into outcome tokens that seed initial liquidity. The creator earns a share of all trading fees generated in that market.

---

## 2. Token Economics & Share Supply

This section defines exactly how tokens are created, how many exist, and how they flow.

### 2.1 Complete Set Minting

A "complete set" for an N-outcome market consists of 1 token from each outcome. The minting exchange rate is always:

```
1 complete set = 1 USDC deposited = 1 token of outcome_0 + 1 token of outcome_1 + ... + 1 token of outcome_(N-1)
```

All token amounts use USDC decimals (6 decimal places). 1 USDC = 1,000,000 base units. 1 complete set = 1,000,000 base units of each outcome token.

**There is no fixed cap on token supply.** Any user can mint complete sets at any time while the market is Active (before closes_at). This is critical — it means:

- Supply grows with demand. If more people want exposure, they mint more sets.
- The vault always holds exactly enough USDC to cover all outstanding sets: `vault_balance = total_sets_minted` (in USDC base units).
- Redeeming a complete set (returning 1 of each outcome token) always returns exactly 1 USDC from the vault. Supply shrinks.

### 2.2 Market Creator Initial Supply

When a creator claims a market with a stake of S USDC:

1. S USDC transfers from creator to vault
2. S complete sets are minted — creator receives S tokens of each outcome
3. `total_sets_minted = S`

**Example: 3-outcome market, creator stakes 500 USDC**
- Creator receives: 500 A tokens, 500 B tokens, 500 C tokens
- Vault holds: 500 USDC
- Total sets minted: 500

The creator then places these tokens as limit orders on the order book at their chosen odds to seed initial liquidity.

### 2.3 How Trading Creates Adequate Supply

Concern: "Are there enough shares?" — Yes, because supply is elastic:

**Scenario:** Creator seeded 500 sets. A trader wants to buy 1000 A tokens but only 500 exist on the ask side.

The trader (or any arbitrageur) can:
1. Mint 500 new complete sets (costs 500 USDC) → gets 500 A + 500 B + 500 C
2. Keep the 500 A tokens they wanted
3. Sell the 500 B and 500 C tokens on the order book

This is the fundamental liquidity mechanism. Minting and splitting complete sets is how new supply enters the market. The order book never "runs out" of tokens because anyone can create more.

### 2.4 Arbitrage & Price Bounds

If outcome prices on the order book sum to more than 1.0: a trader mints a complete set for 1 USDC and sells each outcome token individually for a combined profit > 1 USDC.

If outcome prices sum to less than 1.0: a trader buys 1 of each outcome token for a combined cost < 1 USDC, then redeems the complete set for exactly 1 USDC.

These two arbitrage loops keep prices bounded and summing to approximately 1.0.

### 2.5 Resolution Payout

On resolution, winning outcome is declared. Then:

- **Winning tokens:** Redeem at 1 USDC each (burn token, receive 1 USDC from vault)
- **Losing tokens:** Worth 0. Can be burned but return nothing.
- **Fee:** Taken on redemption. If fee_bps = 200 (2%), redeeming 100 winning tokens pays out 98 USDC to the user, 2 USDC split among creator/treasury/reserve.

**Vault solvency proof:** Vault holds `total_sets_minted` USDC. The maximum number of winning tokens that can exist equals `total_sets_minted` (since each set minted exactly 1 winning token). Therefore the vault always has enough to pay all winners. Fees make it more than sufficient.

### 2.6 Refund on Cancellation / Expiry

If a market is cancelled or expires without resolution:

- Any user holding a complete set (1 of each outcome) can redeem it for 1 USDC (no fee)
- Users holding incomplete sets (e.g., they sold some outcomes) can either: acquire the missing tokens on the order book to form complete sets, or accept the loss on tokens they sold

This is a known tradeoff vs. the old parimutuel model where everyone got their deposit back. In the conditional token model, users who traded may have gains or losses regardless of cancellation. The vault is always solvent because `vault_balance == total_sets_minted`.

---

## 3. Account Structures

### 3.1 PlatformConfig (Singleton PDA)

**Seeds:** `["platform_config"]`

| Field | Type | Description |
|-------|------|-------------|
| authority | Pubkey | Platform admin |
| oracle_authority | Pubkey | Authorized oracle signer |
| treasury | Pubkey | Platform fee wallet |
| reserve | Pubkey | Oracle/insurance reserve wallet |
| fee_bps | u16 | Total fee in basis points (e.g., 200 = 2%) |
| creator_fee_share_bps | u16 | Creator's share of fee (default 6000 = 60%) |
| treasury_fee_share_bps | u16 | Treasury share (default 3000 = 30%) |
| reserve_fee_share_bps | u16 | Reserve share (default 1000 = 10%) |
| min_stake_amount | u64 | Minimum USDC to claim a market |
| creator_lock_period | i64 | Seconds creator positions are locked |
| min_order_amount | u64 | Minimum token amount per order |
| market_creation_fee | u64 | SOL lamports to propose a market (anti-spam) |
| paused | bool | Emergency pause |
| total_markets_created | u64 | Counter for market_id generation |
| bump | u8 | PDA bump |

### 3.2 Market (PDA per market)

**Seeds:** `["market", market_id.to_le_bytes()]`

| Field | Type | Description |
|-------|------|-------------|
| market_id | u64 | Unique sequential ID |
| proposer | Pubkey | Who proposed the market |
| fred_series_id | [u8; 32] | FRED series ID, padded |
| title | [u8; 128] | Human-readable title |
| description | [u8; 512] | Description |
| market_type | MarketType | Binary or MultiOutcome |
| num_outcomes | u8 | 2 for binary, 3–8 for multi |
| outcome_labels | [[u8; 32]; 8] | Label per outcome |
| outcome_mints | [Pubkey; 8] | SPL token mint per outcome (Pubkey::default() for unused) |
| resolution_condition | ResolutionCondition | Machine-readable condition |
| resolution_source_url | [u8; 128] | FRED URL for verification |
| token_mint | Pubkey | USDC mint |
| vault | Pubkey | PDA-owned USDC token account |
| total_sets_minted | u64 | Complete sets in circulation |
| status | MarketStatus | Pending, Active, Closed, Resolved, Cancelled, Expired |
| winning_outcome | Option\<u8\> | Set on resolution |
| resolution_value | Option\<i64\> | FRED value × 10000 |
| resolution_timestamp | Option\<i64\> | When data was observed |
| created_at | i64 | Unix timestamp |
| closes_at | i64 | Trading cutoff |
| resolves_at | i64 | Expected resolution date |
| resolved_at | Option\<i64\> | Actual resolution timestamp |
| bump | u8 | PDA bump |

**Enums:**

```rust
enum MarketType { Binary, MultiOutcome }

enum MarketStatus { Pending, Active, Closed, Resolved, Cancelled, Expired }

struct ResolutionCondition {
    condition_type: ConditionType,
    threshold_value: i64,          // value × 10000
    comparison: Comparison,
    range_low: i64,
    range_high: i64,
    range_step: i64,
    observation_date: i64,
}

enum ConditionType { ThresholdAbove, ThresholdBelow, ExactRange, ChangePercent }
enum Comparison { GreaterThan, GreaterThanOrEqual, LessThan, LessThanOrEqual, Equal }
```

### 3.3 MarketCreatorConfig (PDA per market)

**Seeds:** `["creator_config", market.key()]`

| Field | Type | Description |
|-------|------|-------------|
| market | Pubkey | Associated market |
| creator | Pubkey | Creator wallet |
| stake_amount | u64 | USDC deposited when claiming |
| initial_odds | [u16; 8] | Odds in basis points (sum to 10000 for active outcomes) |
| fee_share_bps | u16 | Creator's fee share (copied from platform config at claim time) |
| accumulated_fees | u64 | Unclaimed fee revenue |
| locked_until | i64 | Creator can't sell positions before this timestamp |
| bump | u8 | PDA bump |

### 3.4 OrderBook (PDA per outcome per market)

**Seeds:** `["orderbook", market.key(), outcome_index.to_le_bytes()]`

| Field | Type | Description |
|-------|------|-------------|
| market | Pubkey | Associated market |
| outcome_index | u8 | Which outcome |
| bids | [Order; 32] | Buy orders sorted by price descending |
| asks | [Order; 32] | Sell orders sorted by price ascending |
| bid_count | u8 | Active bids |
| ask_count | u8 | Active asks |
| bump | u8 | PDA bump |

```rust
struct Order {
    maker: Pubkey,
    price_bps: u16,       // 1–9999 (0.0001–0.9999 USDC)
    amount: u64,           // outcome tokens
    filled_amount: u64,    // tokens already filled
    order_id: u64,         // unique ID
    created_at: i64,
    active: bool,
}
```

Price is in basis points of 1 USDC: `price_bps = 5000` means 0.50 USDC per token. A buyer placing a bid at 5000 is saying "I will pay 0.50 USDC for each outcome token." A seller placing an ask at 5000 is saying "I will sell each outcome token for 0.50 USDC."

### 3.5 UserAccount (PDA per user)

**Seeds:** `["user_account", user.key()]`

| Field | Type | Description |
|-------|------|-------------|
| user | Pubkey | User wallet |
| total_markets_participated | u64 | Markets traded in |
| total_deposited | u64 | Lifetime USDC deposited |
| total_winnings | u64 | Lifetime USDC claimed |
| total_markets_won | u64 | Markets with winning positions |
| total_sets_minted | u64 | Lifetime complete sets minted |
| total_orders_placed | u64 | Lifetime orders placed |
| created_at | i64 | Unix timestamp |
| bump | u8 | PDA bump |

### 3.6 Outcome Token Mints

**Seeds per mint:** `["outcome_mint", market.key(), outcome_index.to_le_bytes()]`

Each outcome mint is a standard SPL token mint with:
- `mint_authority` = market PDA (only the program can mint via `mint_complete_set`)
- `freeze_authority` = None
- `decimals` = 6 (matches USDC)
- `supply` = tracks total tokens of this outcome in circulation

Users hold outcome tokens in standard Associated Token Accounts (ATAs). Token balances ARE the user's position — no separate Position account needed.

### 3.7 Vault Token Account

**Seeds:** `["vault", market.key()]`

Standard SPL token account (USDC) owned by the market PDA. Holds all deposited USDC. Balance always equals `total_sets_minted` in base units (before fees are withdrawn).

### 3.8 Escrow Token Accounts

**Seeds:** `["escrow", market.key(), user.key(), outcome_index.to_le_bytes()]` (for outcome token escrow)
**Seeds:** `["usdc_escrow", market.key(), user.key()]` (for USDC escrow on bids)

When a user places a limit order:
- **Ask (selling outcome tokens):** Outcome tokens transfer from user's ATA to the outcome escrow PDA
- **Bid (buying outcome tokens):** USDC transfers from user's ATA to the USDC escrow PDA

On fill, tokens/USDC transfer from escrow to the counterparty. On cancel, tokens/USDC return from escrow to the user.

### 3.9 PDA Map

```
PlatformConfig
  seeds: ["platform_config"]

Market
  seeds: ["market", market_id (u64 LE bytes)]
  ├── Vault (USDC Token Account)
  │     seeds: ["vault", market.key()]
  ├── OutcomeMint × N
  │     seeds: ["outcome_mint", market.key(), outcome_index (u8 LE bytes)]
  ├── OrderBook × N
  │     seeds: ["orderbook", market.key(), outcome_index (u8 LE bytes)]
  └── MarketCreatorConfig
        seeds: ["creator_config", market.key()]

Per-User Escrows (created on first order):
  ├── OutcomeEscrow
  │     seeds: ["escrow", market.key(), user.key(), outcome_index (u8 LE bytes)]
  └── UsdcEscrow
        seeds: ["usdc_escrow", market.key(), user.key()]

UserAccount
  seeds: ["user_account", user.key()]
```

---

## 4. Instructions

### 4.1 `initialize_platform`

- **Signer:** Platform deployer (becomes authority)
- **Creates:** PlatformConfig PDA
- **Args:** oracle_authority, treasury, reserve, fee_bps, creator_fee_share_bps, treasury_fee_share_bps, reserve_fee_share_bps, min_stake_amount, creator_lock_period, min_order_amount, market_creation_fee
- **Validation:** Fee shares must sum to 10000
- **Access:** One-time initialization

### 4.2 `propose_market`

- **Signer:** Proposer (any user)
- **Creates:** Market PDA with `status = Pending`
- **Args:** fred_series_id, title, description, market_type, num_outcomes, outcome_labels, resolution_condition, resolution_source_url, closes_at, resolves_at, token_mint
- **Validation:**
  - num_outcomes = 2 for Binary, 3–8 for MultiOutcome
  - closes_at < resolves_at, both in the future
  - Platform not paused
- **Logic:**
  1. Transfer market_creation_fee (SOL lamports) from proposer to treasury
  2. Initialize Market PDA with status = Pending
  3. Outcome mints, vault, order books are NOT created yet (saves rent until claimed)
  4. Increment total_markets_created on PlatformConfig
  5. Emit `MarketProposed` event

### 4.3 `claim_market`

- **Signer:** Creator (any user, including the original proposer)
- **Creates:** MarketCreatorConfig PDA, vault token account, N outcome mints, N order book PDAs
- **Accounts:** Market (must be Pending), PlatformConfig, creator's USDC ATA
- **Args:** stake_amount (u64), initial_odds ([u16; 8], basis points summing to 10000 for active outcomes)
- **Validation:**
  - Market status == Pending
  - stake_amount >= platform_config.min_stake_amount
  - initial_odds has num_outcomes non-zero entries that sum to 10000
  - Platform not paused
- **Logic:**
  1. Create vault USDC token account (PDA-owned by market)
  2. Create N outcome SPL token mints (authority = market PDA, decimals = 6)
  3. Create N order book PDAs (empty)
  4. Transfer stake_amount USDC from creator to vault
  5. Mint stake_amount of each outcome token to creator's ATAs (this IS the complete set mint)
  6. Set `total_sets_minted = stake_amount`
  7. Initialize MarketCreatorConfig with stake, odds, fee share, locked_until = now + creator_lock_period
  8. Set market status = Active
  9. Emit `MarketClaimed` event

After this instruction, the creator holds tokens and should place limit orders to seed the book. This is done via `place_order` in subsequent transactions.

### 4.4 `create_market` (Convenience combo)

- **Signer:** Creator who is also the proposer
- **Logic:** Executes `propose_market` + `claim_market` atomically in a single transaction
- **Use case:** When the proposer wants to immediately fund and activate their own market

### 4.5 `mint_complete_set`

- **Signer:** Any user
- **Accounts:** Market (Active), vault, all N outcome mints, user's USDC ATA, user's N outcome ATAs (init_if_needed)
- **Args:** num_sets (u64, in USDC base units — e.g., 1_000_000 = 1 set = 1 USDC)
- **Validation:**
  - Market status == Active
  - Current time < closes_at
  - num_sets > 0
- **Logic:**
  1. Transfer num_sets USDC from user to vault
  2. For each outcome 0..N-1: mint num_sets tokens to user's ATA (market PDA signs as mint authority)
  3. Increment market.total_sets_minted by num_sets
  4. Update UserAccount stats (init_if_needed)
  5. Emit `SetsMinted` event

### 4.6 `redeem_complete_set`

- **Signer:** Any user
- **Accounts:** Market, vault, all N outcome mints, user's USDC ATA, user's N outcome ATAs
- **Args:** num_sets (u64)
- **Validation:**
  - Market status == Active or Closed (allow pre-resolution redemption)
  - Market is NOT Resolved (use claim_winnings instead)
  - User holds >= num_sets of EVERY outcome token
- **Logic:**
  1. For each outcome 0..N-1: burn num_sets tokens from user's ATA
  2. Transfer num_sets USDC from vault to user
  3. Decrement market.total_sets_minted by num_sets
  4. Emit `SetsRedeemed` event

### 4.7 `place_order`

- **Signer:** Maker (any user)
- **Accounts:** Market, OrderBook for target outcome, maker's relevant ATAs, escrow accounts (init_if_needed), MarketCreatorConfig, treasury, reserve
- **Args:** outcome (u8), side (Bid or Ask), price_bps (u16), amount (u64)
- **Validation:**
  - Market status == Active
  - Current time < closes_at
  - price_bps >= 1 and <= 9999
  - amount >= platform_config.min_order_amount
  - Bid: maker has sufficient USDC (price_bps × amount / 10000)
  - Ask: maker has sufficient outcome tokens (amount). If maker is creator and current time < locked_until, reject.
- **Logic:**

  **For a Bid (buying outcome tokens):**
  1. Calculate USDC cost: `usdc_required = amount * price_bps / 10000` (round up)
  2. Transfer usdc_required from maker's USDC ATA to maker's USDC escrow PDA
  3. Attempt to match against existing asks on this outcome's order book (lowest ask first):
     - For each matching ask where `ask.price_bps <= price_bps`:
       - Determine fill amount: `min(remaining_bid_amount, ask.amount - ask.filled_amount)`
       - Execute fill at the ask price (price improvement for the bidder):
         - Transfer fill_amount outcome tokens from ask maker's escrow to bid maker's ATA
         - Calculate fill cost: `fill_amount * ask.price_bps / 10000`
         - Transfer fill_cost USDC from bid maker's escrow to ask maker's USDC ATA
         - Calculate fee: `fill_cost * fee_bps / 10000`
         - Split fee: creator share → creator_config.accumulated_fees, treasury share → treasury, reserve share → reserve
         - Update ask.filled_amount. If fully filled, mark ask inactive.
       - Reduce remaining bid amount
     - If bid fully filled, return any excess escrowed USDC to maker
     - If partially filled or unfilled, remaining amount rests on the book as a new bid entry
  4. Emit `OrderPlaced` event. For each fill, emit `OrderFilled` event.

  **For an Ask (selling outcome tokens):**
  1. Transfer amount outcome tokens from maker's ATA to maker's outcome escrow PDA
  2. Attempt to match against existing bids (highest bid first):
     - Same matching logic as above, reversed
  3. Unfilled portion rests on the book as a new ask entry
  4. Emit events

### 4.8 `cancel_order`

- **Signer:** Original maker
- **Accounts:** Market, OrderBook, maker's ATAs, escrow accounts
- **Args:** outcome (u8), side (Bid or Ask), order_id (u64)
- **Validation:**
  - Order exists and is active
  - Signer == order.maker
- **Logic:**
  1. Calculate unfilled amount: `amount - filled_amount`
  2. Bid: return escrowed USDC for unfilled portion to maker
  3. Ask: return escrowed outcome tokens for unfilled portion to maker
  4. Mark order inactive
  5. Emit `OrderCancelled` event

### 4.9 `resolve_market`

- **Signer:** Oracle authority
- **Accounts:** Market, PlatformConfig
- **Args:** winning_outcome (u8), resolution_value (i64)
- **Validation:**
  - Signer == platform_config.oracle_authority
  - Market status == Active or Closed
  - Current time >= resolves_at
  - winning_outcome < num_outcomes
- **Logic:**
  1. Set market.winning_outcome, resolution_value, status = Resolved, resolved_at = now
  2. Cancel all open orders on all order books (return escrowed funds/tokens to makers)
  3. Emit `MarketResolved` event

Note: Cancelling all open orders on resolution ensures no funds are stuck in escrow. This may need to be a separate cranked instruction (`clear_order_books`) if the compute is too large for one transaction.

### 4.10 `claim_winnings`

- **Signer:** Any user holding winning outcome tokens
- **Accounts:** Market (Resolved), winning outcome mint, user's winning token ATA, user's USDC ATA, vault, MarketCreatorConfig, treasury, reserve
- **Args:** amount (u64) — number of winning tokens to redeem
- **Validation:**
  - Market status == Resolved
  - User holds >= amount of the winning outcome token
- **Logic:**
  1. Burn amount winning tokens from user's ATA
  2. Calculate fee: `amount * fee_bps / 10000`
  3. Split fee:
     - Creator: `fee * creator_fee_share_bps / 10000` → add to creator_config.accumulated_fees
     - Treasury: `fee * treasury_fee_share_bps / 10000` → transfer to treasury
     - Reserve: `fee * reserve_fee_share_bps / 10000` → transfer to reserve
  4. Transfer `amount - fee` USDC from vault to user
  5. Update UserAccount stats
  6. Emit `WinningsClaimed` event

Users can call this multiple times for partial redemptions.

### 4.11 `claim_creator_fees`

- **Signer:** Market creator
- **Accounts:** MarketCreatorConfig, creator's USDC ATA, vault
- **Validation:** Signer == creator_config.creator, accumulated_fees > 0
- **Logic:**
  1. Transfer accumulated_fees USDC from vault to creator
  2. Reset accumulated_fees to 0
  3. Emit `CreatorFeesClaimed` event

Note: Creator fees are sourced from the vault. Since fees are collected on top of the 1:1 USDC-to-set ratio (fees come from the losing side's tokens that will never be redeemed), the vault remains solvent.

### 4.12 `cancel_market`

- **Signer:** Platform authority or oracle authority
- **Accounts:** Market, PlatformConfig
- **Validation:** Market status is Pending, Active, or Closed (not Resolved)
- **Logic:**
  1. Cancel all open orders on all order books (return escrowed funds/tokens)
  2. Set status = Cancelled
  3. Emit `MarketCancelled` event

### 4.13 `close_market` (permissionless cranker)

- **Signer:** Anyone
- **Validation:** Market is Active, current time >= closes_at
- **Logic:** Set status = Closed. Emit `MarketClosed`. No new orders accepted. Existing orders remain (users can still cancel).

### 4.14 `expire_market` (safety net, permissionless)

- **Signer:** Anyone
- **Validation:** Market is Closed, current time > resolves_at + 7 days
- **Logic:**
  1. Cancel all open orders on all order books
  2. Set status = Expired
  3. Emit `MarketExpired`

After expiry, users redeem complete sets via `redeem_complete_set` (which works on Expired markets). Users with incomplete holdings accept the loss.

### 4.15 `clear_order_book` (permissionless cranker)

- **Signer:** Anyone
- **Accounts:** Market (Resolved, Cancelled, or Expired), OrderBook for one outcome
- **Args:** outcome (u8), max_orders (u8) — process up to this many orders per call
- **Logic:** Iterates through active orders on the book, returns escrowed funds/tokens to each maker, marks orders inactive. May need multiple calls per outcome if many orders exist.

This is needed because cancelling all orders across all outcomes may exceed Solana's compute budget in a single transaction.

---

## 5. User Flows

### 5.1 Proposing a Market

```
User navigates to /create
  → Selects FRED series (searchable dropdown)
  → Defines condition:
     Binary: "Will [series] be [above/below] [threshold] on [date]?"
     Multi: "What range will [series] fall in?" → configure buckets
  → Sets close date and resolution date
  → Writes title and description (auto-generated suggestion provided)
  → Pays small SOL anti-spam fee
  → Market appears in Pending pool on /markets?status=pending
  → No USDC required at this stage
```

### 5.2 Claiming a Market (Becoming the Creator)

```
User browses /markets?status=pending
  → Sees proposed markets awaiting a creator
  → Clicks "Claim This Market" on one they understand
  → Modal appears:
     - Stake amount input (minimum shown, e.g., "Min: 100 USDC")
     - Odds sliders for each outcome (must sum to 100%)
       Example for 3-outcome: A=50%, B=30%, C=20%
     - Shows: "You will receive [stake] tokens of each outcome"
     - Shows: "Your fee share: 60% of all trading fees"
     - Shows: "Position lock: 48 hours (you can't sell tokens until [date])"
  → Confirms → wallet signs → USDC transfers, tokens minted
  → Market status changes to Active
  → Creator should now place limit orders to seed the book (next flow)
```

### 5.3 Seeding Initial Liquidity (Creator's Next Step)

```
After claiming, creator holds S tokens of each outcome and wants to
offer them at their stated odds. For a 3-outcome market with odds
A=50%, B=30%, C=20% and stake=500:

Creator places ask orders:
  → Sell 500 A tokens at 0.50 USDC each (price_bps = 5000)
  → Sell 500 B tokens at 0.30 USDC each (price_bps = 3000)
  → Sell 500 C tokens at 0.20 USDC each (price_bps = 2000)

These asks sit on the order book. Now anyone can buy outcome tokens
at the creator's prices. As tokens sell, the creator receives USDC.

The creator's risk: if they set bad odds, sophisticated traders buy
the underpriced outcomes. The creator profits if their odds are
accurate (tokens sell, and losing-outcome revenue offsets
winning-outcome payouts) plus they earn trading fees on all volume.
```

### 5.4 Trading (Buying Outcome Tokens)

```
User navigates to /markets/[id]
  → Sees: outcome probability bars, order book depth, price chart, FRED data
  → TradePanel (right sidebar):

  OPTION A — Market buy via order book:
    → Selects outcome (e.g., "YES — CPI above 3.5%")
    → Enters USDC amount to spend
    → Frontend previews: shares received, effective price, worst fill price
    → Clicks "Buy" → wallet signs place_order (bid at best available ask price)
    → Immediate fills against resting asks
    → User now holds outcome tokens in their wallet

  OPTION B — Limit order:
    → Selects outcome and side (Buy or Sell)
    → Sets price (0.01–0.99) and amount
    → Clicks "Place Order" → tokens or USDC escrowed
    → Order rests on book until filled or cancelled

  OPTION C — Mint + split strategy:
    → User wants cheap exposure to an outcome with thin asks
    → Clicks "Mint Complete Set" → deposits USDC, gets all outcome tokens
    → Sells unwanted outcomes on the order book
    → Net cost = 1 USDC minus proceeds from selling other outcomes
```

### 5.5 Selling / Exiting a Position

```
User holds outcome tokens and wants to exit before resolution:

  OPTION A — Sell on order book:
    → Goes to TradePanel → Sell tab
    → Places ask order for their outcome tokens
    → Gets filled by buyers (immediately or when a matching bid arrives)

  OPTION B — Redeem complete set:
    → If user holds tokens of every outcome (e.g., bought some of each),
      they can redeem complete sets for 1 USDC each
    → Useful for arbitrageurs and for cleaning up positions

  OPTION C — Combine and redeem:
    → User holds mostly A tokens. Buys B and C tokens on the book.
    → Redeems complete sets for guaranteed 1 USDC each.
```

### 5.6 Resolution

```
FRED publishes economic data on the scheduled release date
  → Oracle service detects new data (polling every 5 min on release days)
  → Oracle fetches observation, determines winning outcome
  → Oracle submits resolve_market transaction
  → On-chain: market status → Resolved, winning_outcome set
  → clear_order_book cranked for each outcome (returns escrowed funds)
  → Backend indexer picks up MarketResolved event
  → WebSocket broadcast → frontend shows "Resolved: [outcome] won!"
  → Claim buttons appear for users holding winning tokens
```

### 5.7 Claiming Winnings

```
User sees "Claimable" badge on their portfolio or market detail
  → Shows: "You hold X winning tokens → claim Y USDC (after 2% fee)"
  → Clicks "Claim Winnings"
  → Wallet signs claim_winnings transaction
  → Winning tokens burned, USDC transferred to user (minus fee)
  → Fee split: 60% to creator, 30% to treasury, 10% to reserve
  → Portfolio updates with realized P&L
```

### 5.8 Creator Fee Collection

```
Creator navigates to their Creator Dashboard (/portfolio → Creator tab)
  → Sees per-market stats: volume, fees earned, position P&L
  → "Claim Fees" button per market (or "Claim All")
  → Wallet signs claim_creator_fees transaction
  → Accumulated fees transferred from vault to creator
```

### 5.9 Market Cancellation / Expiry

```
Cancellation (by platform authority):
  → All open orders cancelled, escrowed funds returned
  → Users with complete sets redeem for 1 USDC each
  → Users with incomplete sets must trade to form complete sets or accept losses

Expiry (7 days past resolves_at with no resolution):
  → Anyone can call expire_market
  → Same process as cancellation
  → Frontend shows "Expired — FRED data unavailable. Redeem complete sets for refund."
```

---

## 6. Events

```rust
MarketProposed     { market_id, proposer, fred_series_id, market_type, num_outcomes, closes_at, resolves_at }
MarketClaimed      { market_id, creator, stake_amount, initial_odds: [u16; 8] }
SetsMinted         { market_id, user, num_sets }
SetsRedeemed       { market_id, user, num_sets }
OrderPlaced        { market_id, user, outcome, side, price_bps, amount, order_id }
OrderFilled        { market_id, maker, taker, outcome, price_bps, fill_amount, fee }
OrderCancelled     { market_id, user, outcome, order_id }
MarketClosed       { market_id }
MarketResolved     { market_id, winning_outcome, resolution_value }
WinningsClaimed    { market_id, user, amount, fee }
CreatorFeesClaimed { market_id, creator, amount }
MarketCancelled    { market_id }
MarketExpired      { market_id }
OrderBookCleared   { market_id, outcome, orders_cleared }
```

---

## 7. Error Codes

```rust
// Platform
PlatformPaused
FeeSharesMustSumTo10000

// Market lifecycle
MarketNotPending
MarketNotActive
MarketNotClosed
MarketNotResolved
MarketAlreadyClaimed
MarketAlreadyResolved
BettingClosed                 // current time >= closes_at
ResolutionTooEarly            // current time < resolves_at
GracePeriodNotExpired         // < 7 days past resolves_at
InvalidNumOutcomes            // must be 2 (binary) or 3–8
InvalidDates                  // closes_at must be < resolves_at and both in future

// Creator
InsufficientStake             // below min_stake_amount
InvalidOdds                   // don't sum to 10000 or have zero entries
CreatorPositionsLocked        // can't sell before locked_until
NoFeesToClaim

// Trading
InvalidOrderPrice             // price_bps must be 1–9999
InsufficientAmount            // below min_order_amount
InsufficientBalance           // not enough tokens or USDC
OrderBookFull                 // max open orders reached
OrderNotFound
UnauthorizedCancellation      // only maker can cancel
IncompleteSet                 // need 1 of each outcome to redeem

// Oracle
UnauthorizedOracle
InvalidWinningOutcome         // >= num_outcomes

// Math
MathOverflow
```

---

## 8. Constants

```rust
pub const MAX_OUTCOMES: u8 = 8;
pub const MAX_ORDERS_PER_SIDE: u8 = 32;
pub const GRACE_PERIOD_SECONDS: i64 = 7 * 24 * 60 * 60; // 7 days
pub const PRICE_BPS_MIN: u16 = 1;
pub const PRICE_BPS_MAX: u16 = 9999;
pub const BPS_DENOMINATOR: u16 = 10000;
pub const USDC_DECIMALS: u8 = 6;
```

---

## 9. Directory Structure

```
contracts/
├── Anchor.toml
├── Cargo.toml
├── src/
│   ├── lib.rs
│   ├── state/
│   │   ├── mod.rs
│   │   ├── platform_config.rs
│   │   ├── market.rs
│   │   ├── creator_config.rs
│   │   ├── order_book.rs
│   │   └── user_account.rs
│   ├── instructions/
│   │   ├── mod.rs
│   │   ├── initialize_platform.rs
│   │   ├── propose_market.rs
│   │   ├── claim_market.rs
│   │   ├── create_market.rs         # combo: propose + claim
│   │   ├── mint_complete_set.rs
│   │   ├── redeem_complete_set.rs
│   │   ├── place_order.rs
│   │   ├── cancel_order.rs
│   │   ├── resolve_market.rs
│   │   ├── claim_winnings.rs
│   │   ├── claim_creator_fees.rs
│   │   ├── cancel_market.rs
│   │   ├── close_market.rs
│   │   ├── expire_market.rs
│   │   └── clear_order_book.rs
│   ├── events.rs
│   ├── errors.rs
│   └── constants.rs
├── tests/
│   ├── fred_markets.test.ts
│   └── helpers.ts
└── scripts/
    ├── deploy.ts
    └── initialize_platform.ts
```

---

## 10. Worked Example: Full Market Lifecycle

### Setup
- 3-outcome market: "Unemployment rate Q1 2026" → A: <3.5%, B: 3.5–4.0%, C: >4.0%
- Creator Alice stakes 1000 USDC, sets odds A=20%, B=50%, C=30%

### Step 1: Propose
Bob proposes the market. Status = Pending. No money involved.

### Step 2: Claim
Alice claims. 1000 USDC → vault. Alice receives 1000 A + 1000 B + 1000 C tokens. `total_sets_minted = 1000`.

### Step 3: Seed Liquidity
Alice places asks:
- Sell 1000 A at 0.20 (price_bps=2000)
- Sell 1000 B at 0.50 (price_bps=5000)
- Sell 1000 C at 0.30 (price_bps=3000)

### Step 4: Trading
**Trader Dave** thinks B is likely. He buys 200 B tokens from Alice's ask at 0.50:
- Dave pays 100 USDC (200 × 0.50), minus goes to Alice after fee
- Fee (2%): 2 USDC → split: 1.20 to Alice (creator), 0.60 to treasury, 0.20 to reserve
- Dave now holds 200 B tokens. Alice's B ask reduced to 800 remaining.

**Trader Eve** thinks A is underpriced at 0.20. She mints 500 complete sets:
- Eve deposits 500 USDC → receives 500 A + 500 B + 500 C
- `total_sets_minted` = 1500, vault = 1500 USDC
- Eve sells 500 B at 0.48 (undercutting Alice) and 500 C at 0.28
- Eve keeps 500 A tokens, effectively buying A at 1.00 - 0.48 - 0.28 = 0.24 each

**More trading occurs...** Total volume = 5000 USDC. Alice accumulates ~60 USDC in creator fees.

### Step 5: Resolution
FRED publishes unemployment at 3.8%. Oracle resolves: outcome B wins (3.5–4.0% range).

### Step 6: Claims
- Dave holds 200 B tokens → claims 200 USDC minus 2% fee = 196 USDC. Profit: 196 - 100 = 96 USDC.
- Eve holds 500 A tokens → worthless. Loss: ~120 USDC net (her cost of acquiring A exposure).
- Alice: received USDC from selling tokens + accumulated fees. Her P&L depends on how many winning B tokens she still held vs. sold.

### Step 7: Creator Fees
Alice claims her accumulated trading fees: ~60 USDC transferred from vault.

### Vault Solvency Check
- total_sets_minted = 1500
- Vault started with 1500 USDC
- Maximum winning B tokens = 1500 (one per set)
- Fees collected on redemption make vault more than sufficient
- ✓ Solvent
