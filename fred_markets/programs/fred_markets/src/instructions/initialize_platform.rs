use anchor_lang::prelude::*;
use crate::constants::*;
use crate::errors::FredMarketsError;
use crate::state::PlatformConfig;

#[derive(AnchorSerialize, AnchorDeserialize)]
pub struct InitializePlatformParams {
    pub oracle_authority: Pubkey,
    pub treasury: Pubkey,
    pub reserve: Pubkey,
    pub fee_bps: u16,
    pub creator_fee_share_bps: u16,
    pub treasury_fee_share_bps: u16,
    pub reserve_fee_share_bps: u16,
    pub min_stake_amount: u64,
    pub creator_lock_period: i64,
    pub min_order_amount: u64,
    pub market_creation_fee: u64,
}

#[derive(Accounts)]
pub struct InitializePlatform<'info> {
    #[account(mut)]
    pub authority: Signer<'info>,

    #[account(
        init,
        payer = authority,
        space = PlatformConfig::LEN,
        seeds = [PLATFORM_CONFIG_SEED],
        bump,
    )]
    pub platform_config: Account<'info, PlatformConfig>,

    pub system_program: Program<'info, System>,
}

/// Initializes the platform singleton. Can only be called once.
pub fn handler(ctx: Context<InitializePlatform>, params: InitializePlatformParams) -> Result<()> {
    // Validate fee shares sum to 10000
    let fee_sum = (params.creator_fee_share_bps as u32)
        .checked_add(params.treasury_fee_share_bps as u32)
        .ok_or(FredMarketsError::MathOverflow)?
        .checked_add(params.reserve_fee_share_bps as u32)
        .ok_or(FredMarketsError::MathOverflow)?;
    require!(
        fee_sum == BPS_DENOMINATOR as u32,
        FredMarketsError::FeeSharesMustSumTo10000
    );

    let config = &mut ctx.accounts.platform_config;
    config.authority = ctx.accounts.authority.key();
    config.oracle_authority = params.oracle_authority;
    config.treasury = params.treasury;
    config.reserve = params.reserve;
    config.fee_bps = params.fee_bps;
    config.creator_fee_share_bps = params.creator_fee_share_bps;
    config.treasury_fee_share_bps = params.treasury_fee_share_bps;
    config.reserve_fee_share_bps = params.reserve_fee_share_bps;
    config.min_stake_amount = params.min_stake_amount;
    config.creator_lock_period = params.creator_lock_period;
    config.min_order_amount = params.min_order_amount;
    config.market_creation_fee = params.market_creation_fee;
    config.paused = false;
    config.total_markets_created = 0;
    config.bump = ctx.bumps.platform_config;

    Ok(())
}
