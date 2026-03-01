use anchor_lang::prelude::*;
use anchor_spl::token::{self, Mint, TokenAccount, Transfer};

/// Params for minting complete sets
#[derive(AnchorSerialize, AnchorDeserialize)]
pub struct MintCompleteSetParams {
    pub sets_count: u64,
}

/// Mints one token of each outcome in exchange for USDC deposit.
/// Each complete set costs 1 USDC (in base units).
/// User receives 1 token of each outcome per set.
#[derive(Accounts)]
pub struct MintCompleteSet<'info> {
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
    #[account(
        init_if_needed,
        payer = user,
        associated_token::mint = outcome_mints[0],
        associated_token::authority = user
    )]
    pub user_outcome_0: Box<Account<'info, TokenAccount>>,
    #[account(
        init_if_needed,
        payer = user,
        associated_token::mint = outcome_mints[1],
        associated_token::authority = user
    )]
    pub user_outcome_1: Box<Account<'info, TokenAccount>>,
    #[account(
        init_if_needed,
        payer = user,
        associated_token::mint = outcome_mints[2],
        associated_token::authority = user
    )]
    pub user_outcome_2: Box<Account<'info, TokenAccount>>,
    #[account(
        init_if_needed,
        payer = user,
        associated_token::mint = outcome_mints[3],
        associated_token::authority = user
    )]
    pub user_outcome_3: Box<Account<'info, TokenAccount>>,
    #[account(
        init_if_needed,
        payer = user,
        associated_token::mint = outcome_mints[4],
        associated_token::authority = user
    )]
    pub user_outcome_4: Box<Account<'info, TokenAccount>>,
    #[account(
        init_if_needed,
        payer = user,
        associated_token::mint = outcome_mints[5],
        associated_token::authority = user
    )]
    pub user_outcome_5: Box<Account<'info, TokenAccount>>,
    #[account(
        init_if_needed,
        payer = user,
        associated_token::mint = outcome_mints[6],
        associated_token::authority = user
    )]
    pub user_outcome_6: Box<Account<'info, TokenAccount>>,
    #[account(
        init_if_needed,
        payer = user,
        associated_token::mint = outcome_mints[7],
        associated_token::authority = user
    )]
    pub user_outcome_7: Box<Account<'info, TokenAccount>>,
    pub token_program: Program<'info, Token>,
    pub associated_token_program: Program<'info, AssociatedToken>,
    pub system_program: Program<'info, System>,
    pub rent: Sysvar<'info, Rent>,
}

pub fn handler(ctx: Context<MintCompleteSet>, params: MintCompleteSetParams) -> Result<()> {
    let MintCompleteSetParams { sets_count } = params;
    let market = &ctx.accounts.market;
    
    require!(market.status == MarketStatus::Active, ErrorCode::MarketNotActive);
    require!(sets_count > 0, ErrorCode::InvalidSetsCount);
    
    // Calculate USDC amount (1 USDC = 10^6 base units for USDC)
    let decimals = ctx.accounts.token_mint.decimals;
    let amount = sets_count * 10_u64.pow(decimals as u32);
    
    // Transfer USDC from user to vault
    let transfer_ctx = CpiContext::new(
        ctx.accounts.token_program.to_account_info(),
        Transfer {
            from: ctx.accounts.user_usdc.to_account_info(),
            to: ctx.accounts.vault.to_account_info(),
            authority: ctx.accounts.user.to_account_info(),
        },
    );
    token::transfer(transfer_ctx, amount)?;
    
    // Mint one token of each outcome to user
    let outcome_accounts = [
        ctx.accounts.user_outcome_0.to_account_info(),
        ctx.accounts.user_outcome_1.to_account_info(),
        ctx.accounts.user_outcome_2.to_account_info(),
        ctx.accounts.user_outcome_3.to_account_info(),
        ctx.accounts.user_outcome_4.to_account_info(),
        ctx.accounts.user_outcome_5.to_account_info(),
        ctx.accounts.user_outcome_6.to_account_info(),
        ctx.accounts.user_outcome_7.to_account_info(),
    ];
    
    let outcome_mints = [
        ctx.accounts.outcome_mints[0].to_account_info(),
        ctx.accounts.outcome_mints[1].to_account_info(),
        ctx.accounts.outcome_mints[2].to_account_info(),
        ctx.accounts.outcome_mints[3].to_account_info(),
        ctx.accounts.outcome_mints[4].to_account_info(),
        ctx.accounts.outcome_mints[5].to_account_info(),
        ctx.accounts.outcome_mints[6].to_account_info(),
        ctx.accounts.outcome_mints[7].to_account_info(),
    ];
    
    // Mint tokens for each initialized outcome
    for i in 0..market.num_outcomes as usize {
        let mint_to_ctx = CpiContext::new(
            ctx.accounts.token_program.to_account_info(),
            token::MintTo {
                mint: outcome_mints[i].clone(),
                to: outcome_accounts[i].clone(),
                authority: market.to_account_info(), // PDA is mint authority
            },
        );
        // Sign with market PDA
        let seeds = &[
            b"market",
            market.market_id.to_le_bytes().as_ref(),
            &[market.bump],
        ];
        let signer = &[&seeds[..]];
        let mint_to_ctx = CpiContext::new_with_signer(
            ctx.accounts.token_program.to_account_info(),
            token::MintTo {
                mint: outcome_mints[i].clone(),
                to: outcome_accounts[i].clone(),
                authority: ctx.accounts.market.to_account_info(),
            },
            signer,
        );
        token::mint_to(mint_to_ctx, sets_count)?;
    }
    
    // Update market state
    ctx.accounts.market.total_sets_minted = ctx.accounts.market.total_sets_minted
        .checked_add(sets_count)
        .unwrap();
    
    emit!(CompleteSetMinted {
        market_id: market.market_id,
        user: ctx.accounts.user.key(),
        sets_count,
        total_sets: ctx.accounts.market.total_sets_minted,
    });
    
    Ok(())
}

#[event]
pub struct CompleteSetMinted {
    pub market_id: u64,
    pub user: Pubkey,
    pub sets_count: u64,
    pub total_sets: u64,
}

#[error_code]
pub enum ErrorCode {
    #[msg("Market is not active")]
    MarketNotActive,
    #[msg("Invalid sets count")]
    InvalidSetsCount,
    #[msg("Insufficient USDC balance")]
    InsufficientBalance,
    #[msg("Market does not have enough outcome mints initialized")]
    OutcomesNotInitialized,
}
