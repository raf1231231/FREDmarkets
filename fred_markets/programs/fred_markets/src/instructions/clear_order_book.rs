//! clear_order_book.rs — Emergency cranker (Phase 5)
//!
//! Cancels ALL resting orders in one outcome's order book and returns USDC
//! collateral to bid makers. Called by the platform authority after a market
//! is Closed, Resolved, Cancelled, or Expired.
//!
//! # Collateral model
//!
//!   BIDS — Maker deposited `unfilled_tokens × price_bps / 10000` USDC into the
//!   vault as collateral when placing the order. That USDC is refunded here.
//!
//!   ASKS — Outcome tokens were never escrowed into the vault; they remain in
//!   the maker's wallet. The order entry is simply deactivated — no transfer.
//!
//! # remaining_accounts
//!
//! Provide **one writable SPL token account (USDC) per active bid**, ordered
//! by bid-slot index (0 → 31), skipping inactive slots. Each account's SPL
//! authority field must equal the corresponding bid maker's pubkey. Accounts
//! for bids whose computed refund is zero still must be provided (they are
//! validated but no transfer is issued).

use anchor_lang::prelude::*;
use anchor_spl::token::{Token, TokenAccount, Transfer};

use crate::constants::*;
use crate::errors::FredMarketsError;
use crate::events::OrderBookCleared;
use crate::state::{Market, MarketStatus, OrderBook, PlatformConfig};

// ── Accounts ─────────────────────────────────────────────────────────────────

#[derive(Accounts)]
#[instruction(outcome_index: u8)]
pub struct ClearOrderBook<'info> {
    /// Platform authority — only the admin may invoke this emergency cranker.
    pub authority: Signer<'info>,

    /// Platform config — verifies the signer is the registered authority.
    #[account(
        seeds = [PLATFORM_CONFIG_SEED],
        bump = platform_config.bump,
        has_one = authority @ FredMarketsError::Unauthorized,
    )]
    pub platform_config: Account<'info, PlatformConfig>,

    /// Market must be in a post-trading state (Closed / Resolved / Cancelled / Expired).
    #[account(
        seeds = [MARKET_SEED, &market.market_id.to_le_bytes()],
        bump = market.bump,
    )]
    pub market: Box<Account<'info, Market>>,

    /// Zero-copy order book for `outcome_index`.
    #[account(
        mut,
        seeds = [ORDERBOOK_SEED, market.key().as_ref(), &[outcome_index]],
        bump,
    )]
    pub order_book: AccountLoader<'info, OrderBook>,

    /// USDC vault — source of bid-collateral refunds.
    #[account(
        mut,
        seeds = [VAULT_SEED, &market.market_id.to_le_bytes()],
        bump,
    )]
    pub vault: Box<Account<'info, TokenAccount>>,

    pub token_program: Program<'info, Token>,
}

// ── Handler ───────────────────────────────────────────────────────────────────

/// Emergency cranker: deactivate all resting orders and refund bid collateral.
///
/// Returns `Ok(())` on success.
///
/// # remaining_accounts
/// One writable USDC token account per active bid (bid-slot order, 0–31,
/// skipping inactive slots). `account.owner` (SPL authority) must equal the
/// bid's maker pubkey.
pub fn handler(ctx: Context<ClearOrderBook>, outcome_index: u8) -> Result<()> {
    let market = &ctx.accounts.market;

    // ── Guards ───────────────────────────────────────────────────────────────

    require!(
        matches!(
            market.status,
            MarketStatus::Closed
                | MarketStatus::Resolved
                | MarketStatus::Cancelled
                | MarketStatus::Expired
        ),
        FredMarketsError::MarketNotClosed,
    );

    require!(
        outcome_index < market.num_outcomes,
        FredMarketsError::InvalidOutcomeIndex,
    );

    // ── Capture identifiers before borrowing order book ───────────────────────

    let market_id = market.market_id;
    let vault_bump = ctx.bumps.vault;
    let market_id_bytes = market_id.to_le_bytes();

    // ── Iterate the order book, collect refund data, clear all orders ─────────
    //
    // We use a fixed-size stack array (no heap) to hold per-bid refund info.
    // Each element: (usdc_refund_amount, maker_pubkey_bytes).
    // Max 32 bids × 40 bytes = 1 280 bytes on the stack — well within BPF limits.

    let mut bid_refunds: [(u64, [u8; 32]); 32] = [(0u64, [0u8; 32]); 32];
    let mut num_active_bids: usize = 0;
    let mut bids_cleared: u8 = 0;
    let mut asks_cleared: u8 = 0;

    {
        let mut ob = ctx.accounts.order_book.load_mut()?;

        // Pass 1 — asks: deactivate only; tokens were never held by the vault.
        for slot in 0..MAX_ORDERS_PER_SIDE as usize {
            if ob.asks[slot].is_active() {
                ob.asks[slot].active = 0;
                asks_cleared = asks_cleared.saturating_add(1);
            }
        }
        ob.ask_count = 0;

        // Pass 2 — bids: capture refund info, then deactivate.
        for slot in 0..MAX_ORDERS_PER_SIDE as usize {
            if ob.bids[slot].is_active() {
                // `Order` is `Copy` (bytemuck::Pod); this copies the slot data.
                let order = ob.bids[slot];

                // USDC locked for this order = unfilled_tokens × price_bps / 10 000.
                let unfilled = order.amount.saturating_sub(order.filled_amount);
                let refund = unfilled
                    .checked_mul(order.price_bps as u64)
                    .ok_or(FredMarketsError::MathOverflow)?
                    .checked_div(BPS_DENOMINATOR as u64)
                    .ok_or(FredMarketsError::MathOverflow)?;

                bid_refunds[num_active_bids] = (refund, order.maker);
                num_active_bids += 1;

                ob.bids[slot].active = 0;
                bids_cleared = bids_cleared.saturating_add(1);
            }
        }
        ob.bid_count = 0;

        // `ob` (RefMut<OrderBook>) is dropped here — AccountLoader released.
    }

    // ── Validate remaining_accounts count ─────────────────────────────────────

    require!(
        ctx.remaining_accounts.len() >= num_active_bids,
        FredMarketsError::MissingMakerAccounts,
    );

    // ── Issue USDC refunds — vault PDA signs as its own SPL authority ─────────

    let vault_seeds: [&[u8]; 3] = [VAULT_SEED, &market_id_bytes, &[vault_bump]];
    let signer_seeds: &[&[&[u8]]] = &[&vault_seeds];

    for i in 0..num_active_bids {
        let (refund_amount, maker_bytes) = bid_refunds[i];

        let maker_ata_info = &ctx.remaining_accounts[i];

        // Account must be flagged writable in the transaction.
        require!(maker_ata_info.is_writable, FredMarketsError::Unauthorized);

        // Deserialize and verify SPL authority matches the order's maker.
        let maker_token_account = Account::<TokenAccount>::try_from(maker_ata_info)?;
        let expected_maker = Pubkey::from(maker_bytes);
        require!(
            maker_token_account.owner == expected_maker,
            FredMarketsError::Unauthorized,
        );

        // Skip the transfer if the refund rounds down to zero.
        if refund_amount == 0 {
            continue;
        }

        anchor_spl::token::transfer(
            CpiContext::new_with_signer(
                ctx.accounts.token_program.to_account_info(),
                Transfer {
                    from: ctx.accounts.vault.to_account_info(),
                    to: maker_ata_info.clone(),
                    authority: ctx.accounts.vault.to_account_info(),
                },
                signer_seeds,
            ),
            refund_amount,
        )?;
    }

    // ── Emit event and log ────────────────────────────────────────────────────

    let orders_cleared = bids_cleared.saturating_add(asks_cleared);

    emit!(OrderBookCleared {
        market_id,
        outcome: outcome_index,
        orders_cleared,
    });

    msg!(
        "clear_order_book: market_id={} outcome={} bids_cleared={} asks_cleared={}",
        market_id,
        outcome_index,
        bids_cleared,
        asks_cleared,
    );

    Ok(())
}
