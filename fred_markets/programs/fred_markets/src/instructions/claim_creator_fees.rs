//! Claim creator fees instruction - creator withdraws accumulated fee revenue

use anchor_lang::prelude::*;
use anchor_spl::token::{Token, TokenAccount, Transfer};
use crate::errors::FredMarketsError;
use crate::state::{Market, MarketStatus, MarketCreatorConfig};

pub fn handler(ctx: Context<ClaimCreatorFees>) -> Result<u64> {
    let market = &mut ctx.accounts.market;
    let creator_config = &mut ctx.accounts.creator_config;

    // Verify market is Resolved
    require!(
        market.status == MarketStatus::Resolved,
        FredMarketsError::MarketNotResolved
    );

    // Verify accumulated fees > 0
    let accumulated_fees = creator_config.accumulated_fees;
    require!(
        accumulated_fees > 0,
        FredMarketsError::NoFeesToClaim
    );

    // Transfer fees from vault to creator
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
                to: ctx.accounts.creator_usdc.to_account_info(),
                authority: ctx.accounts.vault.to_account_info(),
            },
            signer_seeds,
        ),
        accumulated_fees,
    )?;

    // Reset accumulated fees
    creator_config.accumulated_fees = 0;

    emit!(crate::events::CreatorFeesClaimed {
        market_id: market.market_id,
        creator: ctx.accounts.creator.key(),
        amount: accumulated_fees,
    });

    Ok(accumulated_fees)
}

#[derive(Accounts)]
pub struct ClaimCreatorFees<'info> {
    /// Creator claiming fees
    #[account(
        mut,
        address = creator_config.creator @ FredMarketsError::Unauthorized
    )]
    pub creator: Signer<'info>,
    
    /// Market account (resolved)
    #[account(
        mut,
        seeds = ["market", market.market_id.to_le_bytes().as_ref()],
        bump = market.bump
    )]
    pub market: Box<Account<'info, Market>>,
    
    /// Creator config with accumulated fees
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
    
    /// Creator's USDC account
    #[account(mut)]
    pub creator_usdc: Box<Account<'info, TokenAccount>>,
    
    pub token_program: Program<'info, Token>,
}

pub type ClaimCreatorFeesParams = ();
