use anchor_lang::prelude::*;
use anchor_spl::token::{self, Token, TokenAccount, Mint, Transfer};
use crate::constants::*;
use crate::errors::FredMarketsError;
use crate::events::MarketClaimed;
use crate::state::{Market, MarketCreatorConfig, MarketStatus, PlatformConfig};

#[derive(AnchorSerialize, AnchorDeserialize)]
pub struct ClaimMarketParams {
    pub stake_amount: u64,
    pub initial_odds: [u16; 8],
}

#[derive(Accounts)]
pub struct ClaimMarket<'info> {
    #[account(mut)]
    pub creator: Signer<'info>,

    #[account(
        seeds = [PLATFORM_CONFIG_SEED],
        bump = platform_config.bump,
    )]
    pub platform_config: Account<'info, PlatformConfig>,

    #[account(
        mut,
        seeds = [MARKET_SEED, &market.market_id.to_le_bytes()],
        bump = market.bump,
        constraint = market.status == MarketStatus::Pending @ FredMarketsError::MarketNotPending,
    )]
    pub market: Box<Account<'info, Market>>,

    /// USDC mint
    #[account(
        constraint = token_mint.key() == market.token_mint
    )]
    pub token_mint: Account<'info, Mint>,

    /// Creator's USDC token account
    #[account(
        mut,
        token::mint = token_mint,
        token::authority = creator,
    )]
    pub creator_usdc_account: Account<'info, TokenAccount>,

    /// PDA-owned vault token account
    #[account(
        init,
        payer = creator,
        token::mint = token_mint,
        token::authority = market,
        seeds = [VAULT_SEED, market.key().as_ref()],
        bump,
    )]
    pub vault: Account<'info, TokenAccount>,

    /// Creator config PDA
    #[account(
        init,
        payer = creator,
        space = MarketCreatorConfig::LEN,
        seeds = [CREATOR_CONFIG_SEED, market.key().as_ref()],
        bump,
    )]
    pub creator_config: Account<'info, MarketCreatorConfig>,

    pub token_program: Program<'info, Token>,
    pub system_program: Program<'info, System>,
}

pub fn handler(ctx: Context<ClaimMarket>, params: ClaimMarketParams) -> Result<()> {
    let platform_config = &ctx.accounts.platform_config;
    let clock = Clock::get()?;

    // Validate platform not paused
    require!(!platform_config.paused, FredMarketsError::PlatformPaused);

    // Validate stake amount
    require!(
        params.stake_amount >= platform_config.min_stake_amount,
        FredMarketsError::InsufficientStake
    );

    // Capture values before mutable borrow
    let num_outcomes = ctx.accounts.market.num_outcomes as usize;
    let market_id = ctx.accounts.market.market_id;
    let market_key = ctx.accounts.market.key();
    let vault_key = ctx.accounts.vault.key();

    // Validate initial odds: first num_outcomes entries sum to 10000, rest are 0
    let active_sum: u32 = params.initial_odds[..num_outcomes]
        .iter()
        .map(|&x| x as u32)
        .sum();
    require!(active_sum == BPS_DENOMINATOR as u32, FredMarketsError::InvalidOdds);
    for i in num_outcomes..8 {
        require!(params.initial_odds[i] == 0, FredMarketsError::InvalidOdds);
    }

    // Transfer stake USDC from creator to vault
    token::transfer(
        CpiContext::new(
            ctx.accounts.token_program.to_account_info(),
            Transfer {
                from: ctx.accounts.creator_usdc_account.to_account_info(),
                to: ctx.accounts.vault.to_account_info(),
                authority: ctx.accounts.creator.to_account_info(),
            },
        ),
        params.stake_amount,
    )?;

    // Initialize creator config
    let creator_config = &mut ctx.accounts.creator_config;
    creator_config.market = market_key;
    creator_config.creator = ctx.accounts.creator.key();
    creator_config.stake_amount = params.stake_amount;
    creator_config.initial_odds = params.initial_odds;
    creator_config.fee_share_bps = platform_config.creator_fee_share_bps;
    creator_config.accumulated_fees = 0;
    creator_config.locked_until = clock.unix_timestamp
        .checked_add(platform_config.creator_lock_period)
        .ok_or(FredMarketsError::MathOverflow)?;
    creator_config.bump = ctx.bumps.creator_config;

    // Update market
    let market = &mut ctx.accounts.market;
    market.status = MarketStatus::Active;
    market.vault = vault_key;

    // Emit event
    emit!(MarketClaimed {
        market_id,
        creator: ctx.accounts.creator.key(),
        stake_amount: params.stake_amount,
        initial_odds: params.initial_odds,
    });

    Ok(())
}
