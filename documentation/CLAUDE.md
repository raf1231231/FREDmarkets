# CLAUDE.md — Agent Instructions for FREDmarkets Development

You are building FREDmarkets, a prediction market platform on Solana. Read this file first on every task. It defines how you work.

---

## 1. Project Files — Read Order

Before writing any code, read these files in order:

1. **CLAUDE.md** (this file) — How to work
2. **ERRATA.md** — Corrections that override the spec and toolchain docs
3. **STATUS.md** — Current implementation progress, build workarounds, architecture decisions
4. **FREDMARKETS_CONTRACT_SPEC.md** — What to build (accounts, instructions, user flows, token economics)
5. **TOOLCHAIN.md** — Version pinning, build configs, known issues, code patterns
6. **BUILD_NOTES.md** — Real-world build lessons (some outdated — see STATUS.md for current workarounds)

The contract spec is the source of truth for all smart contract logic. TOOLCHAIN.md is the source of truth for all version and dependency decisions. **ERRATA.md overrides both.** STATUS.md documents what is already built, architecture decisions made during implementation, and active build workarounds. If you encounter a conflict between these files and your training data, these files win.

---

## 2. Architecture Awareness

This is a **conditional token framework with an on-chain order book**. There is NO AMM. Do not generate CPMM or LMSR code. Do not create `math/` modules for pricing curves. Prices are emergent from the order book.

Key architectural facts you must internalize:
- Each market outcome has its own SPL token mint
- Users mint complete sets (1 USDC → 1 token of each outcome)
- Users trade individual outcome tokens on an order book at prices 0.01–0.99
- Winning tokens redeem at 1 USDC. Losers are worthless.
- Market creators stake USDC, set initial odds, earn trading fees
- The platform takes zero financial risk. All liquidity is participant-sourced.

---

## 3. Implementation Approach

### Work incrementally
Build one instruction at a time. After each instruction:
1. Write the Rust code
2. Verify it compiles with `anchor build`
3. Write a test for it
4. Verify the test passes with `anchor test`
5. Only then move to the next instruction

Do NOT write all instructions at once and then try to compile. You will drown in errors.

### Implementation order
Follow this sequence — each step depends on the previous:

**Phase 1: Foundation — DONE**
1. `initialize_platform` — PlatformConfig singleton
2. `propose_market` — Market PDA with Pending status
3. `claim_market` — vault + creator config, sets Active (split pattern)
4. `initialize_outcome_mint` — one SPL mint per outcome
5. `initialize_order_book` — one zero_copy OrderBook per outcome

**Phase 2: Token Operations — NEXT**
6. `mint_complete_set` — USDC in, outcome tokens out (gate on initialized_outcomes == num_outcomes * 2). Must also handle creator's pre-deposited stake from claim_market.
7. `redeem_complete_set` — outcome tokens in, USDC out. Accepts Active, Closed, Cancelled, Expired (ERRATA #4).

**Phase 3: Order Book**
8. `place_order` — with matching engine, NO fees (ERRATA #2). Cap fills per tx. Escrow USDC (bids) or tokens (asks).
9. `cancel_order` — return escrowed funds

**Phase 4: Lifecycle**
10. `close_market` — permissionless cranker
11. `resolve_market` — oracle authority only. Sets status, does NOT clear orders (ERRATA #5).
12. `claim_winnings` — burn winning tokens for USDC, fees collected here only (ERRATA #2)
13. `claim_creator_fees` — creator withdraws accumulated_fees from vault (ERRATA #6)

**Phase 5: Safety**
14. `cancel_market` — admin cancellation (handle Pending branch with no orders)
15. `expire_market` — permissionless safety net (resolves_at + 7d grace period)
16. `clear_order_book` — permissionless cranker for post-resolution/cancellation/expiry cleanup

Note: `claim_refund` does not exist (ERRATA #3). Cancelled/expired market users redeem via `redeem_complete_set`.

### Splitting `claim_market` — IMPLEMENTED

`claim_market` is split into 3 instructions to avoid stack overflow:
- `claim_market` — creates vault (USDC token account, PDA-owned by market), MarketCreatorConfig, transfers USDC stake to vault, sets market Active. Does NOT mint outcome tokens (mints don't exist yet).
- `initialize_outcome_mint` — called once per outcome (pass outcome_index as arg). Creates SPL mint with authority = market PDA. Increments `market.initialized_outcomes`.
- `initialize_order_book` — called once per outcome. Creates zero_copy OrderBook PDA. Increments `market.initialized_outcomes`.

The frontend/test calls these in sequence. Phase 2+ instructions gate on `market.initialized_outcomes == market.num_outcomes * 2` (N mints + N order books).

### Creator's initial token minting — DEFERRED TO PHASE 2

Because outcome mints are created AFTER `claim_market`, the creator's initial complete sets cannot be minted during claiming. The creator's USDC stake sits in the vault. After full initialization, the creator calls `mint_complete_set` to receive their outcome tokens. `mint_complete_set` must detect the creator's pre-deposited USDC (vault balance > total_sets_minted * num_outcomes equivalent) and mint without double-charging.

---

## 4. Coding Standards

### Rust / Anchor

- Use `anchor_lang::prelude::*` — do not import `solana_program` directly
- Use `anchor_spl::token` for all SPL token operations — do not use raw CPI to the token program
- Use `anchor_spl::associated_token::AssociatedToken` for ATA creation
- All math on token amounts must use `u64` with checked arithmetic (`checked_add`, `checked_sub`, `checked_mul`, `checked_div`). Return `MathOverflow` error on failure. Do not use unchecked operators on any value derived from user input or account state.
- Store bump seeds in account structs and reuse them. Do not call `find_program_address` at runtime — it's expensive. Use `bump = account.bump` in constraints.
- PDA signer seeds must be constructed as `&[&[..][..]]` — follow the patterns in TOOLCHAIN.md Section 6.
- Every public instruction function should have a clear doc comment explaining what it does and what it requires.
- Use `msg!()` sparingly — only for debugging during development. Remove before deployment. Each `msg!` costs compute units.
- Emit events for every state change. The backend indexer depends on them.
- Error codes must use the `#[error_code]` macro with descriptive names matching those in the contract spec.

### Account Validation

- Always validate market status before operations (e.g., `require!(market.status == MarketStatus::Active, ...)`)
- Always validate timestamps with `Clock::get()?.unix_timestamp`
- Always validate that signers match expected authorities
- Always validate outcome indices: `require!(outcome < market.num_outcomes, ...)`
- Use `has_one` constraints where possible for ownership checks
- Use `constraint` with custom errors for complex validations

### File Organization

```
programs/fred_markets/src/
├── lib.rs                    # Program entrypoint, declare_id!, #[program] mod
├── state/
│   ├── mod.rs                # pub mod for each state file
│   ├── platform_config.rs
│   ├── market.rs             # Market + MarketStatus + MarketType + ResolutionCondition
│   ├── creator_config.rs
│   ├── order_book.rs         # OrderBook (zero_copy) + Order + OrderSide
│   └── user_account.rs
├── instructions/
│   ├── mod.rs                # pub mod + pub use for each instruction
│   ├── initialize_platform.rs    ✅ Phase 1
│   ├── propose_market.rs         ✅ Phase 1
│   ├── claim_market.rs           ✅ Phase 1
│   ├── initialize_outcome_mint.rs ✅ Phase 1
│   ├── initialize_order_book.rs  ✅ Phase 1
│   ├── mint_complete_set.rs      ⬜ Phase 2
│   ├── redeem_complete_set.rs    ⬜ Phase 2
│   ├── place_order.rs            ⬜ Phase 3
│   ├── cancel_order.rs           ⬜ Phase 3
│   ├── close_market.rs           ⬜ Phase 4
│   ├── resolve_market.rs         ⬜ Phase 4
│   ├── claim_winnings.rs         ⬜ Phase 4
│   ├── claim_creator_fees.rs     ⬜ Phase 4
│   ├── cancel_market.rs          ⬜ Phase 5
│   ├── expire_market.rs          ⬜ Phase 5
│   └── clear_order_book.rs       ⬜ Phase 5
├── events.rs
├── errors.rs
└── constants.rs
```

Note: `claim_refund.rs` does not exist (ERRATA #3).

Each instruction file exports:
- A context struct: `pub struct MyInstruction<'info> { ... }`
- A handler function: `pub fn handler(ctx: Context<MyInstruction>, args...) -> Result<()>`

In `lib.rs`, each `#[program]` function delegates to the handler:
```rust
pub fn my_instruction(ctx: Context<MyInstruction>, args...) -> Result<()> {
    instructions::my_instruction::handler(ctx, args...)
}
```

---

## 5. Testing Standards

### One test file per instruction
Place tests in `tests/` directory. Name them `01_initialize_platform.ts`, `02_propose_market.ts`, etc. with numeric prefixes matching implementation order.

### Test structure
```typescript
import * as anchor from "@coral-xyz/anchor";
import { Program } from "@coral-xyz/anchor";
import { FredMarkets } from "../target/types/fred_markets";
import { assert } from "chai";

describe("instruction_name", () => {
  const provider = anchor.AnchorProvider.env();
  anchor.setProvider(provider);
  const program = anchor.workspace.FredMarkets as Program<FredMarkets>;

  it("succeeds with valid inputs", async () => {
    // happy path
  });

  it("fails when [condition]", async () => {
    // each error path
    try {
      await program.methods.myInstruction(...).rpc();
      assert.fail("should have thrown");
    } catch (e) {
      assert.include(e.message, "ExpectedErrorCode");
    }
  });
});
```

### What to test for every instruction
1. **Happy path** — correct inputs produce correct state changes
2. **Authorization** — wrong signer is rejected
3. **State validation** — wrong market status is rejected
4. **Boundary conditions** — min/max amounts, edge timestamps
5. **Account state after** — read the account back and verify every field

### Test helpers
Create a `tests/helpers.ts` with:
- `createMint()` — for creating test USDC mint
- `mintTo()` — for funding test accounts
- `initializePlatform()` — shared setup
- `proposeAndClaimMarket()` — shared setup that creates a fully initialized market
- PDA derivation helpers matching your seeds

---

## 6. Error Handling

### Never panic
Do not use `unwrap()` on any value that comes from accounts, user input, or external data. Use `ok_or(ErrorCode::...)` or the `?` operator with proper error types.

### Error message quality
Every error should tell the caller what went wrong and what was expected:
```rust
require!(
    market.status == MarketStatus::Active,
    FredMarketsError::MarketNotActive
);
```

### Anchor error pattern
```rust
#[error_code]
pub enum FredMarketsError {
    #[msg("Market is not in Active status")]
    MarketNotActive,
    #[msg("Betting is closed — current time is past closes_at")]
    BettingClosed,
    // ... match all errors from contract spec
}
```

---

## 7. Common Mistakes to Avoid

1. **Do NOT create an AMM.** No CPMM. No LMSR. No `math/` module. This is an order book.

2. **Do NOT use `solana-program` as a direct dependency.** Use `anchor_lang::solana_program`.

3. **Do NOT put all `init` constraints in one instruction.** Split `claim_market` as described above.

4. **Do NOT use unchecked math on token amounts.** Always `checked_add`, `checked_sub`, etc.

5. **Do NOT store user positions in a PDA.** Positions are SPL token balances in user ATAs. The program does not track individual positions.

6. **Do NOT use `Pubkey::default()` as a sentinel for "uninitialized".** Use `Option<Pubkey>` or a separate boolean flag.

7. **Do NOT forget to emit events.** The backend indexer cannot function without them.

8. **Do NOT process unlimited order matches in one transaction.** Cap matching iterations in `place_order` (e.g., max 5 fills per call) to stay within compute budget. Return remaining amount as a resting order.

9. **Do NOT let the creator sell tokens before `locked_until`.** Check this in `place_order` when side == Ask and maker == creator.

10. **Do NOT allow `mint_complete_set` or `place_order` until all outcome mints and order books are initialized.** Check `market.initialized_outcomes == market.num_outcomes * 2` (N mints + N order books).

---

## 8. When You're Stuck

- **Build error about versions?** Read TOOLCHAIN.md Section 5 (Known Build Issues) and STATUS.md "Key Build Workarounds".
- **IDL build fails with `source_file` or `lib.rs should exist`?** The anchor-syn registry patches were wiped. Re-apply per STATUS.md instructions.
- **Stack overflow on init?** You have too many `init` constraints. Split the instruction.
- **Account size too large?** Use `Box<Account<'info, T>>` to move to heap, or use `zero_copy`.
- **Compute budget exceeded?** Add `ComputeBudgetInstruction::set_compute_unit_limit()` on the client side, or reduce work per instruction.
- **Token transfer fails?** Check that the PDA signer seeds are correct and the authority matches.
- **Test can't find account?** Make sure prerequisite instructions ran first and accounts are derived with matching seeds.

If a problem persists after two attempts at a fix, stop and describe the exact error before trying another approach. Do not silently change the architecture to work around a build issue.

---

## 9. What NOT to Build (Out of Scope for Smart Contract Phase)

- Frontend (Next.js) — separate phase
- Backend API (Express) — separate phase
- Oracle service — separate phase
- Admin panel — separate phase
- Multi-sig — future enhancement
- Timelock dispute periods — future enhancement
- Token extensions / Token-2022 — use standard SPL Token program

Focus exclusively on the Anchor smart contract, its tests, and deployment scripts.
