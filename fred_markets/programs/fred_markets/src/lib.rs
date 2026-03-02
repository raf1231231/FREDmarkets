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

    /// Places a limit order (bid or ask) with auto-fill against existing orders.
    pub fn place_order(
        ctx: Context<PlaceOrder>,
        outcome_index: u8,
        side: u8, // 0 = Bid, 1 = Ask
        price_bps: u16,
        amount: u64,
    ) -> Result<u64> {
        let side = if side == 0 {
            crate::state::order_book::OrderSide::Bid
        } else {
            crate::state::order_book::OrderSide::Ask
        };
        place_order::handler(ctx, outcome_index, side, price_bps, amount)
    }

    /// Cancels a resting order and returns collateral.
    pub fn cancel_order(
        ctx: Context<CancelOrder>,
        outcome_index: u8,
        order_id: u64,
    ) -> Result<u64> {
        cancel_order::handler(ctx, outcome_index, order_id)
    }

    /// Closes trading on a market - transitions from Active to Closed
    pub fn close_market(
        ctx: Context<CloseMarket>,
    ) -> Result<()> {
        close_market::handler(ctx)
    }

    /// Resolves a market - sets the winning outcome (oracle only)
    pub fn resolve_market(
        ctx: Context<ResolveMarket>,
        outcome_index: u8,
        resolution_value: i64,
        resolution_timestamp: i64,
    ) -> Result<()> {
        resolve_market::handler(ctx, outcome_index, resolution_value, resolution_timestamp)
    }

    /// Claims winnings - redeems winning tokens for USDC minus fees
    pub fn claim_winnings(
        ctx: Context<ClaimWinnings>,
        outcome_index: u8,
        amount: u64,
    ) -> Result<u64> {
        claim_winnings::handler(ctx, outcome_index, amount)
    }

    /// Claims creator fees - creator withdraws accumulated fee revenue
    pub fn claim_creator_fees(
        ctx: Context<ClaimCreatorFees>,
    ) -> Result<u64> {
        claim_creator_fees::handler(ctx)
    }

    /// Emergency cranker: cancels all resting orders in an outcome's order book
    /// and refunds USDC collateral to bid makers. Platform authority only.
    /// Market must be Closed, Resolved, Cancelled, or Expired.
    pub fn clear_order_book(
        ctx: Context<ClearOrderBook>,
        outcome_index: u8,
    ) -> Result<()> {
        clear_order_book::handler(ctx, outcome_index)
    }
}
