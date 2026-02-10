use anchor_lang::prelude::*;

#[event]
pub struct MarketProposed {
    pub market_id: u64,
    pub proposer: Pubkey,
    pub fred_series_id: [u8; 32],
    pub market_type: u8,
    pub num_outcomes: u8,
    pub closes_at: i64,
    pub resolves_at: i64,
}

#[event]
pub struct MarketClaimed {
    pub market_id: u64,
    pub creator: Pubkey,
    pub stake_amount: u64,
    pub initial_odds: [u16; 8],
}

#[event]
pub struct SetsMinted {
    pub market_id: u64,
    pub user: Pubkey,
    pub num_sets: u64,
}

#[event]
pub struct SetsRedeemed {
    pub market_id: u64,
    pub user: Pubkey,
    pub num_sets: u64,
}

#[event]
pub struct OrderPlaced {
    pub market_id: u64,
    pub user: Pubkey,
    pub outcome: u8,
    pub side: u8,
    pub price_bps: u16,
    pub amount: u64,
    pub order_id: u64,
}

#[event]
pub struct OrderFilled {
    pub market_id: u64,
    pub maker: Pubkey,
    pub taker: Pubkey,
    pub outcome: u8,
    pub price_bps: u16,
    pub fill_amount: u64,
}

#[event]
pub struct OrderCancelled {
    pub market_id: u64,
    pub user: Pubkey,
    pub outcome: u8,
    pub order_id: u64,
}

#[event]
pub struct MarketClosed {
    pub market_id: u64,
}

#[event]
pub struct MarketResolved {
    pub market_id: u64,
    pub winning_outcome: u8,
    pub resolution_value: i64,
}

#[event]
pub struct WinningsClaimed {
    pub market_id: u64,
    pub user: Pubkey,
    pub amount: u64,
    pub fee: u64,
}

#[event]
pub struct CreatorFeesClaimed {
    pub market_id: u64,
    pub creator: Pubkey,
    pub amount: u64,
}

#[event]
pub struct MarketCancelledEvent {
    pub market_id: u64,
}

#[event]
pub struct MarketExpired {
    pub market_id: u64,
}

#[event]
pub struct OrderBookCleared {
    pub market_id: u64,
    pub outcome: u8,
    pub orders_cleared: u8,
}
