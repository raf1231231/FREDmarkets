pub const MAX_OUTCOMES: u8 = 8;
pub const MAX_ORDERS_PER_SIDE: u8 = 32;
pub const GRACE_PERIOD_SECONDS: i64 = 7 * 24 * 60 * 60; // 7 days
pub const PRICE_BPS_MIN: u16 = 1;
pub const PRICE_BPS_MAX: u16 = 9999;
pub const BPS_DENOMINATOR: u16 = 10000;
pub const USDC_DECIMALS: u8 = 6;

// PDA seed prefixes
pub const PLATFORM_CONFIG_SEED: &[u8] = b"platform_config";
pub const MARKET_SEED: &[u8] = b"market";
pub const VAULT_SEED: &[u8] = b"vault";
pub const OUTCOME_MINT_SEED: &[u8] = b"outcome_mint";
pub const ORDERBOOK_SEED: &[u8] = b"orderbook";
pub const CREATOR_CONFIG_SEED: &[u8] = b"creator_config";
pub const ESCROW_SEED: &[u8] = b"escrow";
pub const USDC_ESCROW_SEED: &[u8] = b"usdc_escrow";
pub const USER_ACCOUNT_SEED: &[u8] = b"user_account";
