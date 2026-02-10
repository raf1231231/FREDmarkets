use anchor_lang::prelude::*;

#[account]
pub struct UserAccount {
    /// User wallet pubkey
    pub user: Pubkey,
    /// Number of markets the user has participated in
    pub total_markets_participated: u64,
    /// Lifetime USDC deposited (base units)
    pub total_deposited: u64,
    /// Lifetime USDC claimed from winnings (base units)
    pub total_winnings: u64,
    /// Number of markets where user had winning positions
    pub total_markets_won: u64,
    /// Lifetime complete sets minted
    pub total_sets_minted: u64,
    /// Lifetime orders placed
    pub total_orders_placed: u64,
    /// Unix timestamp of account creation
    pub created_at: i64,
    /// PDA bump seed
    pub bump: u8,
}

impl UserAccount {
    /// 8 (disc) + 32 + 8*6 + 8 + 1 = 89
    pub const LEN: usize = 8 + 32 + 8 + 8 + 8 + 8 + 8 + 8 + 8 + 1;
}
