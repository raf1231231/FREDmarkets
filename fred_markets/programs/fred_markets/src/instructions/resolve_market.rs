//! Resolve market instruction - sets the winning outcome

use anchor_lang::prelude::*;
use crate::errors::FredMarketsError;
use crate::state::{Market, MarketStatus};

pub fn handler(
    ctx: Context<ResolveMarket>,
    outcome_index: u8,
    resolution_value: i64,
    resolution_timestamp: i64,
) -> Result<()> {
    let market = &mut ctx.accounts.market;

    // Verify market is Closed (trading has ended)
    require!(
        market.status == MarketStatus::Closed,
        FredMarketsError::MarketNotClosed
    );

    // Verify resolution time has passed
    let clock = Clock::get()?;
    require!(
        clock.unix_timestamp >= market.resolves_at,
        FredMarketsError::ResolutionTooEarly
    );

    // Verify winning outcome index is valid
    require!(
        outcome_index < market.num_outcomes,
        FredMarketsError::InvalidWinningOutcome
    );

    // Update market state
    market.status = MarketStatus::Resolved;
    market.winning_outcome = Some(outcome_index);
    market.resolution_value = Some(resolution_value);
    market.resolution_timestamp = Some(resolution_timestamp);
    market.resolved_at = Some(clock.unix_timestamp);

    emit!(crate::events::MarketResolved {
        market_id: market.market_id,
        winning_outcome: outcome_index,
        resolution_value,
    });

    Ok(())
}

#[derive(Accounts)]
pub struct ResolveMarket<'info> {
    /// Market account to resolve
    #[account(
        mut,
        seeds = ["market", market.market_id.to_le_bytes().as_ref()],
        bump = market.bump
    )]
    pub market: Box<Account<'info, Market>>,
    
    /// Oracle authority - must sign
    #[account(
        seeds = [b"platform_config"],
        bump = platform_config.bump
    )]
    pub platform_config: Box<Account<'info, crate::state::PlatformConfig>>,
    
    /// Oracle authority signer
    #[account(
        address = platform_config.oracle_authority @ FredMarketsError::UnauthorizedOracle
    )]
    pub oracle_authority: Signer<'info>,
}

pub type ResolveMarketParams = ();
