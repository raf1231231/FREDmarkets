use anchor_lang::prelude::*;

#[account]
pub struct PlatformConfig {
    /// Platform admin authority
    pub authority: Pubkey,
    /// Authorized oracle signer for market resolution
    pub oracle_authority: Pubkey,
    /// Platform fee wallet
    pub treasury: Pubkey,
    /// Oracle/insurance reserve wallet
    pub reserve: Pubkey,
    /// Total fee in basis points (e.g., 200 = 2%)
    pub fee_bps: u16,
    /// Creator's share of fee in basis points (e.g., 6000 = 60%)
    pub creator_fee_share_bps: u16,
    /// Treasury's share of fee in basis points (e.g., 3000 = 30%)
    pub treasury_fee_share_bps: u16,
    /// Reserve's share of fee in basis points (e.g., 1000 = 10%)
    pub reserve_fee_share_bps: u16,
    /// Minimum USDC (base units) to claim a market
    pub min_stake_amount: u64,
    /// Seconds creator positions are locked after claiming
    pub creator_lock_period: i64,
    /// Minimum token amount per order (base units)
    pub min_order_amount: u64,
    /// SOL lamports charged to propose a market (anti-spam)
    pub market_creation_fee: u64,
    /// Emergency pause flag
    pub paused: bool,
    /// Counter for sequential market ID generation
    pub total_markets_created: u64,
    /// PDA bump seed
    pub bump: u8,
}

impl PlatformConfig {
    /// 8 (discriminator) + 32*4 + 2*4 + 8*4 + 1 + 8 + 1 = 178
    pub const LEN: usize = 8 + 32 + 32 + 32 + 32 + 2 + 2 + 2 + 2 + 8 + 8 + 8 + 8 + 1 + 8 + 1;
}
