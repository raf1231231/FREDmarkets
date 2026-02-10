use anchor_lang::prelude::*;

#[account]
pub struct MarketCreatorConfig {
    /// Associated market pubkey
    pub market: Pubkey,
    /// Creator wallet
    pub creator: Pubkey,
    /// USDC deposited when claiming (base units)
    pub stake_amount: u64,
    /// Initial odds in basis points per outcome (sum to 10000 for active outcomes)
    pub initial_odds: [u16; 8],
    /// Creator's fee share in basis points (copied from platform config at claim time)
    pub fee_share_bps: u16,
    /// Unclaimed fee revenue in USDC base units
    pub accumulated_fees: u64,
    /// Creator can't sell positions before this timestamp
    pub locked_until: i64,
    /// PDA bump seed
    pub bump: u8,
}

impl MarketCreatorConfig {
    /// 8 (disc) + 32 + 32 + 8 + 16 + 2 + 8 + 8 + 1 = 115
    pub const LEN: usize = 8 + 32 + 32 + 8 + (2 * 8) + 2 + 8 + 8 + 1;
}
