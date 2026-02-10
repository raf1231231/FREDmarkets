use anchor_lang::prelude::*;
use anchor_spl::token::{Token, Mint};
use crate::constants::*;
use crate::errors::FredMarketsError;
use crate::state::{Market, MarketStatus};

#[derive(Accounts)]
#[instruction(outcome_index: u8)]
pub struct InitializeOutcomeMint<'info> {
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
        mint::decimals = 6,
        mint::authority = market,
        seeds = [OUTCOME_MINT_SEED, market.key().as_ref(), &[outcome_index]],
        bump,
    )]
    pub outcome_mint: Account<'info, Mint>,

    pub token_program: Program<'info, Token>,
    pub system_program: Program<'info, System>,
}

pub fn handler(ctx: Context<InitializeOutcomeMint>, outcome_index: u8) -> Result<()> {
    let market = &mut ctx.accounts.market;

    // Validate outcome index
    require!(outcome_index < market.num_outcomes, FredMarketsError::InvalidOutcome);

    // Store the mint address in the market
    market.outcome_mints[outcome_index as usize] = ctx.accounts.outcome_mint.key();

    // Increment initialized counter
    market.initialized_outcomes = market.initialized_outcomes
        .checked_add(1)
        .ok_or(FredMarketsError::MathOverflow)?;

    Ok(())
}
