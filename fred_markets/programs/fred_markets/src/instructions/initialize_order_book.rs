use anchor_lang::prelude::*;
use crate::constants::*;
use crate::errors::FredMarketsError;
use crate::state::{Market, MarketStatus, OrderBook};

#[derive(Accounts)]
#[instruction(outcome_index: u8)]
pub struct InitializeOrderBook<'info> {
    #[account(mut)]
    pub payer: Signer<'info>,

    #[account(
        mut,
        seeds = [MARKET_SEED, &market.market_id.to_le_bytes()],
        bump = market.bump,
        constraint = market.status == MarketStatus::Active @ FredMarketsError::MarketNotActive,
    )]
    pub market: Box<Account<'info, Market>>,

    #[account(
        init,
        payer = payer,
        space = OrderBook::LEN,
        seeds = [ORDERBOOK_SEED, market.key().as_ref(), &[outcome_index]],
        bump,
    )]
    pub order_book: AccountLoader<'info, OrderBook>,

    pub system_program: Program<'info, System>,
}

pub fn handler(ctx: Context<InitializeOrderBook>, outcome_index: u8) -> Result<()> {
    let market = &mut ctx.accounts.market;

    // Validate outcome index
    require!(outcome_index < market.num_outcomes, FredMarketsError::InvalidOutcome);

    // Initialize order book fields
    let mut order_book = ctx.accounts.order_book.load_init()?;
    order_book.market = market.key();
    order_book.outcome_index = outcome_index;
    order_book.bump = ctx.bumps.order_book;
    // All other fields (bids, asks, counts, next_order_id) are zeroed by default

    // Increment initialized counter
    market.initialized_outcomes = market.initialized_outcomes
        .checked_add(1)
        .ok_or(FredMarketsError::MathOverflow)?;

    Ok(())
}
