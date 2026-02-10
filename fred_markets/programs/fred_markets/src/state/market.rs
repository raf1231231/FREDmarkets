use anchor_lang::prelude::*;

#[account]
pub struct Market {
    /// Unique sequential market ID
    pub market_id: u64,
    /// Who proposed the market
    pub proposer: Pubkey,
    /// FRED series ID, padded to 32 bytes
    pub fred_series_id: [u8; 32],
    /// Human-readable title, padded to 128 bytes
    pub title: [u8; 128],
    /// Description, padded to 512 bytes
    pub description: [u8; 512],
    /// Binary or MultiOutcome
    pub market_type: MarketType,
    /// Number of outcomes (2 for binary, 3–8 for multi)
    pub num_outcomes: u8,
    /// Label per outcome, padded to 32 bytes each
    pub outcome_labels: [[u8; 32]; 8],
    /// SPL token mint pubkey per outcome (Pubkey::default() for unused slots)
    pub outcome_mints: [Pubkey; 8],
    /// Machine-readable resolution condition
    pub resolution_condition: ResolutionCondition,
    /// FRED URL for verification, padded to 128 bytes
    pub resolution_source_url: [u8; 128],
    /// USDC mint address
    pub token_mint: Pubkey,
    /// PDA-owned USDC vault token account
    pub vault: Pubkey,
    /// Complete sets currently in circulation (USDC base units)
    pub total_sets_minted: u64,
    /// Current market lifecycle status
    pub status: MarketStatus,
    /// Set on resolution — index of winning outcome
    pub winning_outcome: Option<u8>,
    /// FRED value × 10000 at resolution
    pub resolution_value: Option<i64>,
    /// Timestamp when FRED data was observed
    pub resolution_timestamp: Option<i64>,
    /// Unix timestamp of market creation
    pub created_at: i64,
    /// Trading cutoff timestamp
    pub closes_at: i64,
    /// Expected resolution date
    pub resolves_at: i64,
    /// Actual resolution timestamp
    pub resolved_at: Option<i64>,
    /// Number of initialized outcome mints + order books (target = num_outcomes * 2)
    pub initialized_outcomes: u8,
    /// PDA bump seed
    pub bump: u8,
}

impl Market {
    // 8 (disc) + 8 + 32 + 32 + 128 + 512 + 1 + 1 + 256 + 256 + 41 + 128 + 32 + 32
    // + 8 + 1 + 2 + 9 + 9 + 8 + 8 + 8 + 9 + 1 + 1 = 1543
    pub const LEN: usize = 8 + 8 + 32 + 32 + 128 + 512 + 1 + 1 + (32 * 8) + (32 * 8)
        + ResolutionCondition::LEN + 128 + 32 + 32 + 8 + 1
        + (1 + 1)   // Option<u8> winning_outcome
        + (1 + 8)   // Option<i64> resolution_value
        + (1 + 8)   // Option<i64> resolution_timestamp
        + 8 + 8 + 8
        + (1 + 8)   // Option<i64> resolved_at
        + 1 + 1;
}

#[derive(AnchorSerialize, AnchorDeserialize, Clone, Copy, PartialEq, Eq)]
pub enum MarketType {
    Binary,
    MultiOutcome,
}

#[derive(AnchorSerialize, AnchorDeserialize, Clone, Copy, PartialEq, Eq)]
pub enum MarketStatus {
    Pending,
    Active,
    Closed,
    Resolved,
    Cancelled,
    Expired,
}

#[derive(AnchorSerialize, AnchorDeserialize, Clone, Copy)]
pub struct ResolutionCondition {
    /// Type of condition for resolution
    pub condition_type: ConditionType,
    /// Threshold value × 10000
    pub threshold_value: i64,
    /// Comparison operator
    pub comparison: Comparison,
    /// Lower bound for range conditions × 10000
    pub range_low: i64,
    /// Upper bound for range conditions × 10000
    pub range_high: i64,
    /// Step size for range buckets × 10000
    pub range_step: i64,
    /// Date the observation should be taken
    pub observation_date: i64,
}

impl ResolutionCondition {
    /// 1 + 8 + 1 + 8 + 8 + 8 + 8 = 42, but enum variants serialize as 1 byte each
    pub const LEN: usize = 1 + 8 + 1 + 8 + 8 + 8 + 8;
}

#[derive(AnchorSerialize, AnchorDeserialize, Clone, Copy, PartialEq, Eq)]
pub enum ConditionType {
    ThresholdAbove,
    ThresholdBelow,
    ExactRange,
    ChangePercent,
}

#[derive(AnchorSerialize, AnchorDeserialize, Clone, Copy, PartialEq, Eq)]
pub enum Comparison {
    GreaterThan,
    GreaterThanOrEqual,
    LessThan,
    LessThanOrEqual,
    Equal,
}
