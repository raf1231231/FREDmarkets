//! Close market instruction - transitions market from Active to Closed

use anchor_lang::prelude::*;
use crate::errors::FredMarketsError;
use crate::state::{Market, MarketStatus};

pub fn handler(ctx: Context<CloseMarket>) -> Result<()> {
    let market = &mut ctx.accounts.market;

    // Verify market is Active
    require!(
        market.status == MarketStatus::Active,
        FredMarketsError::MarketNotActive
    );

    // Verify current time has passed closes_at
    let clock = Clock::get()?;
    require!(
        clock.unix_timestamp >= market.closes_at,
        FredMarketsError::BettingClosed
    );

    // Update status to Closed
    market.status = MarketStatus::Closed;

    emit!(crate::events::MarketClosed {
        market_id: market.market_id,
    });

    Ok(())
}

#[derive(Accounts)]
pub struct CloseMarket<'info> {
    /// Market account to close
    #[account(
        mut,
        seeds = ["market", market.market_id.to_le_bytes().as_ref()],
        bump = market.bump
    )]
    pub market: Box<Account<'info, Market>>,
    
    /// Caller (can be anyone after closes_at)
    pub caller: Signer<'info>,
}

pub type CloseMarketParams = ();
