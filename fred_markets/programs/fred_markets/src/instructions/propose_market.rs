use anchor_lang::prelude::*;
use anchor_lang::system_program;
use crate::constants::*;
use crate::errors::FredMarketsError;
use crate::events::MarketProposed;
use crate::state::{Market, MarketStatus, MarketType, PlatformConfig, ResolutionCondition};

#[derive(AnchorSerialize, AnchorDeserialize)]
pub struct ProposeMarketParams {
    pub fred_series_id: String,
    pub title: String,
    pub description: String,
    pub market_type: MarketType,
    pub num_outcomes: u8,
    pub outcome_labels: Vec<String>,
    pub resolution_condition: ResolutionCondition,
    pub resolution_source_url: String,
    pub closes_at: i64,
    pub resolves_at: i64,
    pub token_mint: Pubkey,
}

#[derive(Accounts)]
pub struct ProposeMarket<'info> {
    #[account(mut)]
    pub proposer: Signer<'info>,

    #[account(
        mut,
        seeds = [PLATFORM_CONFIG_SEED],
        bump = platform_config.bump,
    )]
    pub platform_config: Account<'info, PlatformConfig>,

    #[account(
        init,
        payer = proposer,
        space = Market::LEN,
        seeds = [MARKET_SEED, &platform_config.total_markets_created.to_le_bytes()],
        bump,
    )]
    pub market: Box<Account<'info, Market>>,

    /// CHECK: Treasury wallet to receive market creation fee
    #[account(
        mut,
        constraint = treasury.key() == platform_config.treasury @ FredMarketsError::InvalidTreasury
    )]
    pub treasury: UncheckedAccount<'info>,

    pub system_program: Program<'info, System>,
}

pub fn handler(ctx: Context<ProposeMarket>, params: ProposeMarketParams) -> Result<()> {
    let platform_config = &mut ctx.accounts.platform_config;
    let clock = Clock::get()?;

    // Validate platform not paused
    require!(!platform_config.paused, FredMarketsError::PlatformPaused);

    // Validate num_outcomes
    match params.market_type {
        MarketType::Binary => {
            require!(params.num_outcomes == 2, FredMarketsError::InvalidNumOutcomes);
        }
        MarketType::MultiOutcome => {
            require!(
                params.num_outcomes >= 3 && params.num_outcomes <= MAX_OUTCOMES,
                FredMarketsError::InvalidNumOutcomes
            );
        }
    }

    // Validate dates
    require!(
        params.closes_at > clock.unix_timestamp
            && params.resolves_at > clock.unix_timestamp
            && params.closes_at < params.resolves_at,
        FredMarketsError::InvalidDates
    );

    // Transfer market creation fee (SOL) to treasury
    if platform_config.market_creation_fee > 0 {
        system_program::transfer(
            CpiContext::new(
                ctx.accounts.system_program.to_account_info(),
                system_program::Transfer {
                    from: ctx.accounts.proposer.to_account_info(),
                    to: ctx.accounts.treasury.to_account_info(),
                },
            ),
            platform_config.market_creation_fee,
        )?;
    }

    // Convert variable-length params to fixed-size arrays
    let fred_series_id = string_to_fixed::<32>(&params.fred_series_id);
    let title = string_to_fixed::<128>(&params.title);
    let description = string_to_fixed::<512>(&params.description);
    let resolution_source_url = string_to_fixed::<128>(&params.resolution_source_url);

    let mut outcome_labels = [[0u8; 32]; 8];
    for (i, label) in params.outcome_labels.iter().enumerate() {
        if i >= MAX_OUTCOMES as usize {
            break;
        }
        outcome_labels[i] = string_to_fixed::<32>(label);
    }

    // Initialize market
    let market_id = platform_config.total_markets_created;
    let market = &mut ctx.accounts.market;
    market.market_id = market_id;
    market.proposer = ctx.accounts.proposer.key();
    market.fred_series_id = fred_series_id;
    market.title = title;
    market.description = description;
    market.market_type = params.market_type;
    market.num_outcomes = params.num_outcomes;
    market.outcome_labels = outcome_labels;
    market.outcome_mints = [Pubkey::default(); 8];
    market.resolution_condition = params.resolution_condition;
    market.resolution_source_url = resolution_source_url;
    market.token_mint = params.token_mint;
    market.vault = Pubkey::default();
    market.total_sets_minted = 0;
    market.status = MarketStatus::Pending;
    market.winning_outcome = None;
    market.resolution_value = None;
    market.resolution_timestamp = None;
    market.created_at = clock.unix_timestamp;
    market.closes_at = params.closes_at;
    market.resolves_at = params.resolves_at;
    market.resolved_at = None;
    market.initialized_outcomes = 0;
    market.bump = ctx.bumps.market;

    // Increment global counter
    platform_config.total_markets_created = platform_config
        .total_markets_created
        .checked_add(1)
        .ok_or(FredMarketsError::MathOverflow)?;

    // Emit event
    emit!(MarketProposed {
        market_id,
        proposer: ctx.accounts.proposer.key(),
        fred_series_id,
        market_type: params.market_type as u8,
        num_outcomes: params.num_outcomes,
        closes_at: params.closes_at,
        resolves_at: params.resolves_at,
    });

    Ok(())
}

fn string_to_fixed<const N: usize>(s: &str) -> [u8; N] {
    let mut arr = [0u8; N];
    let bytes = s.as_bytes();
    let len = bytes.len().min(N);
    arr[..len].copy_from_slice(&bytes[..len]);
    arr
}
