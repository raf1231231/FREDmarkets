use anchor_lang::prelude::*;

#[account(zero_copy)]
#[repr(C)]
pub struct OrderBook {
    /// Associated market pubkey
    pub market: Pubkey,
    /// Which outcome this order book is for
    pub outcome_index: u8,
    /// Padding for alignment
    pub _padding0: [u8; 7],
    /// Buy orders sorted by price descending
    pub bids: [Order; 32],
    /// Sell orders sorted by price ascending
    pub asks: [Order; 32],
    /// Number of active bids
    pub bid_count: u8,
    /// Number of active asks
    pub ask_count: u8,
    /// Padding for alignment
    pub _padding1: [u8; 6],
    /// Global order ID counter for this book
    pub next_order_id: u64,
    /// PDA bump seed
    pub bump: u8,
    /// Padding for alignment
    pub _padding2: [u8; 7],
}

impl OrderBook {
    pub const LEN: usize = 8 + std::mem::size_of::<OrderBook>();
}

#[derive(AnchorSerialize, AnchorDeserialize, Clone, Copy, bytemuck::Pod, bytemuck::Zeroable)]
#[repr(C)]
pub struct Order {
    /// Maker's wallet pubkey (32 bytes)
    pub maker: [u8; 32],
    /// Price in basis points (1–9999)
    pub price_bps: u16,
    /// Padding for alignment
    pub _padding: [u8; 6],
    /// Total outcome tokens in the order (base units)
    pub amount: u64,
    /// Tokens already filled (base units)
    pub filled_amount: u64,
    /// Unique order ID within this book
    pub order_id: u64,
    /// Unix timestamp of order creation
    pub created_at: i64,
    /// Whether the order is still active (1 = active, 0 = inactive)
    pub active: u8,
    /// Padding for alignment
    pub _padding2: [u8; 7],
}

impl Default for Order {
    fn default() -> Self {
        bytemuck::Zeroable::zeroed()
    }
}

impl Order {
    pub const LEN: usize = std::mem::size_of::<Order>();

    pub fn maker_pubkey(&self) -> Pubkey {
        Pubkey::from(self.maker)
    }

    pub fn is_active(&self) -> bool {
        self.active != 0
    }
}

#[derive(AnchorSerialize, AnchorDeserialize, Clone, Copy, PartialEq, Eq)]
pub enum OrderSide {
    Bid,
    Ask,
}
