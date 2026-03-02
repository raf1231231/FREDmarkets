//! Claim winnings instruction - redeems winning tokens for USDC minus fees

use anchor_lang::prelude::*;
use anchor_spl::token::{Token, TokenAccount, Mint, transfer, Burn, Transfer};
use crate::errors::FredMarketsError;
use crate::state::{Market, MarketStatus, PlatformConfig, MarketCreatorConfig};

pub fn handler(
    ctx: Context<ClaimWinnings>,
    outcome_index: u8,
    amount: u64,
) -> Result<u64> {
    let market = &mut ctx.accounts.market;
    let platform_config = &ctx.accounts.platform_config;
    let creator_config = &mut ctx.accounts.creator_config;

    // Verify market is Resolved
    require!(
        market.status == MarketStatus::Resolved,
        FredMarketsError::MarketNotResolved
    );

    // Get winning outcome
    let winning_outcome = market.winning_outcome
        .ok_or(FredMarketsError::MarketAlreadyResolved)?;

    // Verify claiming the winning outcome
    require!(
        outcome_index == winning_outcome,
        FredMarketsError::InvalidWinningOutcome
    );

    // Verify outcome index is valid
    require!(
        outcome_index < market.num_outcomes,
        FredMarketsError::InvalidOutcomeIndex
    );

    // Verify outcome mint matches the market's registered mint for this outcome
    let expected_mint = market.outcome_mints[outcome_index as usize];
    require!(
        ctx.accounts.outcome_mint.key() == expected_mint,
        FredMarketsError::InvalidOutcomeIndex
    );

    // Amount must be > 0
    require!(
        amount > 0,
        FredMarketsError::InsufficientAmount
    );

    // Calculate payout: amount (in outcome tokens) = USDC amount
    // Each winning token is worth 1 USDC (base units)
    let payout = amount;

    // Calculate fees (e.g., 200 bps = 2%)
    let fee_bps = platform_config.fee_bps as u64;
    let fee = payout * fee_bps / 10000;
    let payout_after_fee = payout - fee;

    // Calculate creator and treasury shares from fee
    let creator_share = fee * platform_config.creator_fee_share_bps as u64 / 10000;
    let treasury_share = fee * platform_config.treasury_fee_share_bps as u64 / 10000;
    let reserve_share = fee - creator_share - treasury_share;

    // Transfer USDC from vault to user
    let seeds = &[
        b"vault",
        market.market_id.to_le_bytes().as_ref(),
        &[ctx.bumps.vault],
    ];
    let signer_seeds = &[&seeds[..]];

    transfer(
        CpiContext::new_with_signer(
            ctx.accounts.token_program.to_account_info(),
            Transfer {
                from: ctx.accounts.vault.to_account_info(),
                to: ctx.accounts.user_usdc.to_account_info(),
                authority: ctx.accounts.vault.to_account_info(),
            },
            signer_seeds,
        ),
        payout_after_fee,
    )?;

    // Burn the winning tokens
    let outcome_mint = market.outcome_mints[outcome_index as usize];
    burn(
        CpiContext::new(
            ctx.accounts.token_program.to_account_info(),
            Burn {
                mint: ctx.accounts.outcome_mint.to_account_info(),
                from: ctx.accounts.user_outcome_account.to_account_info(),
                authority: ctx.accounts.user.to_account_info(),
            },
        ),
        amount,
    )?;

    // Update creator accumulated fees
    creator_config.accumulated_fees += creator_share;

    emit!(crate::events::WinningsClaimed {
        market_id: market.market_id,
        user: ctx.accounts.user.key(),
        amount: payout_after_fee,
        fee,
    });

    Ok(payout_after_fee)
}

#[derive(Accounts)]
pub struct ClaimWinnings<'info> {
    /// User claiming winnings
    #[account(mut)]
    pub user: Signer<'info>,
    
    /// Market account (resolved)
    #[account(
        mut,
        seeds = ["market", market.market_id.to_le_bytes().as_ref()],
        bump = market.bump
    )]
    pub market: Box<Account<'info, Market>>,
    
    /// Platform config for fee calculation
    #[account(
        seeds = [b"platform_config"],
        bump = platform_config.bump
    )]
    pub platform_config: Box<Account<'info, PlatformConfig>>,
    
    /// Creator config for fee accumulation
    #[account(
        mut,
        seeds = ["creator_config", market.key().as_ref()],
        bump = creator_config.bump
    )]
    pub creator_config: Box<Account<'info, MarketCreatorConfig>>,
    
    /// Vault PDA - USDC escrow
    #[account(
        mut,
        seeds = ["vault", market.market_id.to_le_bytes().as_ref()],
        bump
    )]
    pub vault: Box<Account<'info, TokenAccount>>,
    
    /// User's USDC account
    #[account(mut)]
    pub user_usdc: Box<Account<'info, TokenAccount>>,
    
    /// Outcome mint for the winning outcome
    #[account(mut)]
    pub outcome_mint: Box<Account<'info, Mint>>,
    
    /// User's outcome token account
    #[account(mut)]
    pub user_outcome_account: Box<Account<'info, TokenAccount>>,
    
    pub token_program: Program<'info, Token>,
}

pub type ClaimWinningsParams = ();
