# ERRATA.md — Corrections to FREDmarkets Spec Files

This file resolves discrepancies between CLAUDE.md, FREDMARKETS_CONTRACT_SPEC.md, and TOOLCHAIN.md. **Where this file conflicts with those documents, this file wins.**

---

## 1. Anchor Version: Use 0.30.1

TOOLCHAIN.md is correct. Use 0.30.1, not 0.29.0. A previous implementation attempt dropped to 0.29.0 due to a `source_file()` compile bug — that bug was in 0.30.0 and is fixed in 0.30.1. Pin Rust to 1.75.0 and ensure `Cargo.lock` uses lockfile version 3 (not 4). If you encounter a lockfile error, delete `Cargo.lock` and rebuild.

## 2. Fees Apply Once — On Redemption Only

FREDMARKETS_CONTRACT_SPEC.md Section 4.7 (`place_order`) describes charging `fee_bps` on every fill during trading. Section 4.10 (`claim_winnings`) charges `fee_bps` again on redemption. This is a mistake — it results in double taxation (~4% at 2% fee_bps).

**Correction:** Remove ALL fee logic from `place_order`. Trading is fee-free. Fees are collected exclusively in `claim_winnings` on redemption of winning tokens. This encourages trading volume and tighter spreads. The creator's fee share, treasury share, and reserve share are all taken from the single redemption fee.

Update `place_order` Section 4.7: on a fill, the full `fill_cost` USDC transfers from bidder escrow to ask maker. No fee deduction. No interaction with `creator_config.accumulated_fees`, treasury, or reserve. Remove MarketCreatorConfig, treasury, and reserve from `place_order` accounts.

## 3. `claim_refund` Does Not Exist

CLAUDE.md Phase 5 lists `claim_refund` as instruction 15. There is no corresponding section in the contract spec.

**Correction:** There is no `claim_refund` instruction. Users on cancelled or expired markets redeem complete sets via `redeem_complete_set`. Remove `claim_refund` from CLAUDE.md's implementation order, the directory structure, and any references. Remove `claim_refund.rs` from the file listing.

## 4. `redeem_complete_set` Accepts All Non-Resolved Statuses

FREDMARKETS_CONTRACT_SPEC.md Section 4.6 validates `Active || Closed`. But Sections 2.6 and 4.14 say users redeem complete sets after cancellation and expiry.

**Correction:** `redeem_complete_set` validation should be:

```
require!(market.status != MarketStatus::Resolved, ...)
require!(market.status != MarketStatus::Pending, ...)
```

This allows redemption on Active, Closed, Cancelled, and Expired markets. On Resolved markets, users must use `claim_winnings` instead. On Pending markets, no tokens exist yet.

## 5. `resolve_market` Does NOT Clear Orders

FREDMARKETS_CONTRACT_SPEC.md Section 4.9 says `resolve_market` should "cancel all open orders on all order books" and then hedges that it might need a separate cranker.

**Correction:** `resolve_market` does exactly two things: (1) set `winning_outcome`, `resolution_value`, `status = Resolved`, `resolved_at`. (2) Emit `MarketResolved` event. That's it. No order cancellation, no escrow returns. All escrow cleanup is handled by `clear_order_book` (Section 4.15), called separately per outcome as a permissionless cranker. Remove the "cancel all open orders" language from Section 4.9.

## 6. Creator Fee USDC Stays in the Vault

FREDMARKETS_CONTRACT_SPEC.md doesn't specify where the creator's fee share physically sits between collection and claim.

**Correction:** On `claim_winnings`, the fee is deducted from the payout before it leaves the vault:

```
User redeems 100 winning tokens, fee_bps = 200 (2%):
  Total fee = 2 USDC
  Creator share (60%): 1.2 USDC  → stays in vault, added to creator_config.accumulated_fees
  Treasury share (30%): 0.6 USDC → transfers from vault to treasury
  Reserve share (10%): 0.2 USDC  → transfers from vault to reserve
  User receives: 98 USDC        → transfers from vault to user

Vault releases: 98 + 0.6 + 0.2 = 98.8 USDC
Vault retains: 1.2 USDC (creator's unclaimed fees)
```

When the creator calls `claim_creator_fees`, the 1.2 USDC transfers from the vault to the creator. The vault balance at any time equals `total_sets_minted - total_winning_tokens_redeemed + unclaimed_creator_fees` (in USDC base units). It is always solvent.

## 7. Add `initialized_outcomes` to Market Account

CLAUDE.md references `initialized_outcomes` as a gating field but FREDMARKETS_CONTRACT_SPEC.md Section 3.2 (Market account) doesn't include it.

**Correction:** Add to Market account struct:

```
initialized_outcomes: u8  — starts at 0, incremented by initialize_outcome_mint and initialize_order_book
```

Each call to `initialize_outcome_mint` increments by 1. Each call to `initialize_order_book` increments by 1. For an N-outcome market, the fully initialized count is `N * 2` (N mints + N order books).

Gate `mint_complete_set` and `place_order` with:

```rust
require!(market.initialized_outcomes == market.num_outcomes * 2, FredMarketsError::MarketNotFullyInitialized)
```

Add `MarketNotFullyInitialized` to the error codes.

## 8. Defer `create_market` Combo Instruction

FREDMARKETS_CONTRACT_SPEC.md Section 4.4 defines `create_market` as a convenience combo of `propose_market` + `claim_market`. CLAUDE.md's implementation order skips it.

**Correction:** Do not build `create_market` during initial implementation. It is convenience sugar with no new logic. Remove `create_market.rs` from the directory structure and implementation order. If needed later, it can be added as a thin wrapper. Focus on `propose_market` and `claim_market` as separate instructions.
