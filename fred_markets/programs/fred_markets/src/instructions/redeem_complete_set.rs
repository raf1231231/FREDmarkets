use anchor_lang::prelude::*;
use anchor_spl::token::{self, Burn, Mint, TokenAccount, Transfer};

/// Params for redeeming complete sets
#[derive(AnchorSerialize, AnchorDeserialize)]
pub struct RedeemCompleteSetParams {
    pub sets_count: u64,
}

/// Redeems one of each outcome token for USDC.
/// User must have at least 1 of each outcome token.
/// Burns all outcome tokens and transfers USDC back.
#[derive(Accounts)]
pub struct RedeemCompleteSet<'info> {
    #[account(mut)]
    pub user: Signer<'info>,
    #[account(
        mut,
        seeds = [b"market", market.market_id.to_le_bytes().as_ref()],
        bump = market.bump
    )]
    pub market: Box<Account<'info, Market>>,
    #[account(
        mut,
        seeds = [b"vault", market.market_id.to_le_bytes().as_ref()],
        bump
    )]
    pub vault: Box<Account<'info, TokenAccount>>,
    #[account(
        mut,
        associated_token::mint = token_mint,
        associated_token::authority = user
    )]
    pub user_usdc: Box<Account<'info, TokenAccount>>,
    pub token_mint: Box<Account<'info, Mint>>,
    /// Outcome token mints - one per outcome
    pub outcome_mints: [Box<Account<'info, Mint>>; 8],
    /// User's outcome token accounts - one per outcome
    #[account(mut)]
    pub user_outcome_0: Box<Account<'info, TokenAccount>>,
    #[account(mut)]
    pub user_outcome_1: Box<Account<'info, TokenAccount>>,
    #[account(mut)]
    pub user_outcome_2: Box<Account<'info, TokenAccount>>,
    #[account(mut)]
    pub user_outcome_3: Box<Account<'info, TokenAccount>>,
    #[account(mut)]
    pub user_outcome_4: Box<Account<'info, TokenAccount>>,
    #[account(mut)]
    pub user_outcome_5: Box<Account<'info, TokenAccount>>,
    #[account(mut)]
    pub user_outcome_6: Box<Account<'info, TokenAccount>>,
    #[account(mut)]
    pub user_outcome_7: Box<Account<'info, TokenAccount>>,
    pub token_program: Program<'info, Token>,
    pub associated_token_program: Program<'info, AssociatedToken>,
    pub system_program: Program<'info, System>,
}

pub fn handler(ctx: Context<RedeemCompleteSet>, params: RedeemCompleteSetParams) -> Result<()> {
    let RedeemCompleteSetParams { sets_count } = params;
    let market = &ctx.accounts.market;
    
    // Allow redemption in Active or Closed status
    require!(
        market.status == MarketStatus::Active || market.status == MarketStatus::Closed,
        ErrorCode::MarketNotRedeemable
    );
    require!(sets_count > 0, ErrorCode::InvalidSetsCount);
    
    // Calculate USDC amount
    let decimals = ctx.accounts.token_mint.decimals;
    let amount = sets_count * 10_u64.pow(decimals as u32);
    
    // Verify vault has enough USDC
    require!(
        ctx.accounts.vault.amount >= amount,
        ErrorCode::InsufficientVaultBalance
    );
    
    // User's outcome token accounts
    let outcome_accounts = [
        &ctx.accounts.user_outcome_0,
        &ctx.accounts.user_outcome_1,
        &ctx.accounts.user_outcome_2,
        &ctx.accounts.user_outcome_3,
        &ctx.accounts.user_outcome_4,
        &ctx.accounts.user_outcome_5,
        &ctx.accounts.user_outcome_6,
        &ctx.accounts.user_outcome_7,
    ];
    
    // Verify user has enough of each outcome token and burn them
    for i in 0..market.num_outcomes as usize {
        require!(
            outcome_accounts[i].amount >= sets_count,
            ErrorCode::InsufficientOutcomeTokens
        );
        
        let burn_ctx = CpiContext::new(
            ctx.accounts.token_program.to_account_info(),
            Burn {
                mint: ctx.accounts.outcome_mints[i].to_account_info(),
                from: outcome_accounts[i].to_account_info(),
                authority: ctx.accounts.user.to_account_info(),
            },
        );
        token::burn(burn_ctx, sets_count)?;
    }
    
    // Transfer USDC from vault to user (signed by PDA)
    let seeds = &[
        b"market",
        market.market_id.to_le_bytes().as_ref(),
        &[market.bump],
    ];
    let signer = &[&seeds[..]];
    
    let transfer_ctx = CpiContext::new_with_signer(
        ctx.accounts.token_program.to_account_info(),
        Transfer {
            from: ctx.accounts.vault.to_account_info(),
            to: ctx.accounts.user_usdc.to_account_info(),
            authority: ctx.accounts.vault.to_account_info(), // vault is the authority
        },
        signer,
    );
    token::transfer(transfer_ctx, amount)?;
    
    // Update market state
    ctx.accounts.market.total_sets_minted = ctx.accounts.market.total_sets_minted
        .checked_sub(sets_count)
        .unwrap();
    
    emit!(CompleteSetRedeemed {
        market_id: market.market_id,
        user: ctx.accounts.user.key(),
        sets_count,
        total_sets: ctx.accounts.market.total_sets_minted,
    });
    
    Ok(())
}

#[event]
pub struct CompleteSetRedeemed {
    pub market_id: u64,
    pub user: Pubkey,
    pub sets_count: u64,
    pub total_sets: u64,
}

#[error_code]
pub enum ErrorCode {
    #[msg("Market is not redeemable")]
    MarketNotRedeemable,
    #[msg("Invalid sets count")]
    InvalidSetsCount,
    #[msg("Insufficient vault balance")]
    InsufficientVaultBalance,
    #[msg("Insufficient outcome tokens")]
    InsufficientOutcomeTokens,
}
