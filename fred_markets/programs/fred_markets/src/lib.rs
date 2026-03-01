use anchor_lang::prelude::*;

pub mod constants;
pub mod errors;
pub mod events;
pub mod instructions;
pub mod state;

use instructions::*;

declare_id!("GaK745UiF6FMZt5hXbCrKQrhmdcmRx8SYi3AdfFshMBo");

#[program]
pub mod fred_markets {
    use super::*;

    /// Initializes the platform configuration singleton. One-time setup.
    pub fn initialize_platform(
        ctx: Context<InitializePlatform>,
        params: InitializePlatformParams,
    ) -> Result<()> {
        initialize_platform::handler(ctx, params)
    }

    /// Proposes a new prediction market. Creates Market PDA with Pending status.
    pub fn propose_market(
        ctx: Context<ProposeMarket>,
        params: ProposeMarketParams,
    ) -> Result<()> {
        propose_market::handler(ctx, params)
    }

    /// Claims a pending market. Creates vault + creator config, sets Active.
    pub fn claim_market(
        ctx: Context<ClaimMarket>,
        params: ClaimMarketParams,
    ) -> Result<()> {
        claim_market::handler(ctx, params)
    }

    /// Initializes an outcome token mint for a specific outcome index.
    pub fn initialize_outcome_mint(
        ctx: Context<InitializeOutcomeMint>,
        outcome_index: u8,
    ) -> Result<()> {
        initialize_outcome_mint::handler(ctx, outcome_index)
    }

    /// Initializes an order book for a specific outcome index.
    pub fn initialize_order_book(
        ctx: Context<InitializeOrderBook>,
        outcome_index: u8,
    ) -> Result<()> {
        initialize_order_book::handler(ctx, outcome_index)
    }

    /// Mints one token of each outcome in exchange for USDC.
    pub fn mint_complete_set(
        ctx: Context<MintCompleteSet>,
        params: MintCompleteSetParams,
    ) -> Result<()> {
        mint_complete_set::handler(ctx, params)
    }

    /// Redeems one of each outcome token for USDC.
    pub fn redeem_complete_set(
        ctx: Context<RedeemCompleteSet>,
        params: RedeemCompleteSetParams,
    ) -> Result<()> {
        redeem_complete_set::handler(ctx, params)
    }
}
