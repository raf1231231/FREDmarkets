//! Cancel order instruction - cancel a resting limit order
//!
//! Cancels an active order and returns collateral to the user:
//! - For BIDS: returns unused USDC collateral from vault
//! - For ASKS: returns unused outcome tokens (if not in vault yet)

use anchor_lang::prelude::*;
use anchor_spl::token::{Token, TokenAccount, Transfer};

use crate::errors::FREDMarketsError;
use crate::state::market::Market;
use crate::state::order_book::OrderBook;

#[derive(Accounts)]
#[instruction(outcome_index: u8, order_id: u64)]
pub struct CancelOrder<'info> {
    #[account(mut)]
    pub user: Signer<'info>,
    #[account(
        mut,
        seeds = ["market".as_bytes(), &market.market_id.to_le_bytes()],
        bump = market.bump
    )]
    pub market: Box<Account<'info, Market>>,
    #[account(
        mut,
        seeds = ["order_book".as_bytes(), &market.market_id.to_le_bytes(), &[outcome_index]],
        bump
    )]
    pub order_book: Box<Account<'info, OrderBook>>,
    #[account(
        mut,
        seeds = ["vault".as_bytes(), &market.market_id.to_le_bytes()],
        bump
    )]
    pub vault: Box<Account<'info, TokenAccount>>,
    /// User's USDC account for receiving refund
    #[account(
        mut,
        constraint = user_usdc.owner == user.key() @ FREDMarketsError::Unauthorized
    )]
    pub user_usdc: Box<Account<'info, TokenAccount>>,
    /// User's outcome token account (for ask refunds)
    #[account(
        mut,
        constraint = user_outcome.owner == user.key() @ FREDMarketsError::Unauthorized
    )]
    pub user_outcome: Box<Account<'info, TokenAccount>>,
    pub token_program: Program<'info, Token>,
}

/// Cancel a resting order and return collateral
/// 
/// Returns:
/// - For BIDS: unused USDC from vault → user
/// - For ASKS: outcome tokens are already user-owned, just mark order inactive
pub fn cancel_order(
    ctx: Context<CancelOrder>,
    outcome_index: u8,
    order_id: u64,
) -> Result<u64> {
    let market = &ctx.accounts.market;
    let order_book = &mut ctx.accounts.order_book;
    let vault = &mut ctx.accounts.vault;
    let user_usdc = &mut ctx.accounts.user_usdc;
    let user_outcome = &mut ctx.accounts.user_outcome;
    let user = &ctx.accounts.user;

    // Validate outcome index
    require!(
        outcome_index < market.num_outcomes,
        FREDMarketsError::InvalidOutcomeIndex
    );

    // Find and cancel the order
    let (canceled_amount, is_bid) = cancel_order_from_book(
        order_book,
        user.key(),
        order_id,
    )?;

    // Handle collateral return
    if canceled_amount > 0 {
        let vault_bump = ctx.bumps.vault;
        let vault_seeds = &[
            b"vault",
            &market.market_id.to_le_bytes(),
            &[vault_bump],
        ];
        let signer_seeds = &[&vault_seeds[..]];

        if is_bid {
            // For bids: return USDC collateral from vault
            // Refund = remaining_amount * price / 10000
            // We need to find the order to get the price
            let order = find_order(order_book, order_id)?;
            let refund_amount = order.amount
                .saturating_sub(order.filled_amount)
                .checked_mul(order.price_bps as u64)
                .ok_or(FREDMarketsError::Overflow)?
                .checked_div(10000)
                .ok_or(FREDMarketsError::Overflow)?;

            if refund_amount > 0 {
                let cpi_accounts = Transfer {
                    from: vault.to_account_info(),
                    to: user_usdc.to_account_info(),
                    authority: vault.to_account_info(), // vault is PDA, use signer
                };
                let cpi_ctx = CpiContext::new_with_signer(
                    ctx.accounts.token_program.to_account_info(),
                    cpi_accounts,
                    signer_seeds,
                );
                anchor_spl::token::transfer(cpi_ctx, refund_amount)?;
            }
        }
        // For asks: outcome tokens were never deposited, nothing to return
        // The tokens remain in user's outcome account
    }

    msg!("Cancelled order {}: {} tokens", order_id, canceled_amount);

    Ok(canceled_amount)
}

/// Cancel an order from the order book
fn cancel_order_from_book(
    order_book: &mut OrderBook,
    user: Pubkey,
    order_id: u64,
) -> Result<(u64, bool)> {
    // Check bids first
    for (i, order) in order_book.bids.iter_mut().enumerate() {
        if order.order_id == order_id && order.is_active() && order.maker_pubkey() == user {
            let canceled_amount = order.amount.saturating_sub(order.filled_amount);
            order.active = 0;
            return Ok((canceled_amount, true));
        }
    }

    // Check asks
    for (i, order) in order_book.asks.iter_mut().enumerate() {
        if order.order_id == order_id && order.is_active() && order.maker_pubkey() == user {
            let canceled_amount = order.amount.saturating_sub(order.filled_amount);
            order.active = 0;
            return Ok((canceled_amount, false));
        }
    }

    Err(FREDMarketsError::OrderNotFound.into())
}

/// Find an order by ID (helper)
fn find_order<'a>(
    order_book: &'a OrderBook,
    order_id: u64,
) -> Result<&'a Order> {
    for order in order_book.bids.iter() {
        if order.order_id == order_id {
            return Ok(order);
        }
    }
    for order in order_book.asks.iter() {
        if order.order_id == order_id {
            return Ok(order);
        }
    }
    Err(FREDMarketsError::OrderNotFound.into())
}
