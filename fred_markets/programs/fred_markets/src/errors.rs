use anchor_lang::prelude::*;

#[error_code]
pub enum FredMarketsError {
    // Platform
    #[msg("Platform is paused")]
    PlatformPaused,
    #[msg("Fee shares must sum to 10000 basis points")]
    FeeSharesMustSumTo10000,

    // Market lifecycle
    #[msg("Market is not in Pending status")]
    MarketNotPending,
    #[msg("Market is not in Active status")]
    MarketNotActive,
    #[msg("Market is not in Closed status")]
    MarketNotClosed,
    #[msg("Market is not in Resolved status")]
    MarketNotResolved,
    #[msg("Market has already been claimed")]
    MarketAlreadyClaimed,
    #[msg("Market has already been resolved")]
    MarketAlreadyResolved,
    #[msg("Betting is closed — current time is past closes_at")]
    BettingClosed,
    #[msg("Resolution too early — current time is before resolves_at")]
    ResolutionTooEarly,
    #[msg("Grace period has not expired — less than 7 days past resolves_at")]
    GracePeriodNotExpired,
    #[msg("Invalid number of outcomes — must be 2 (binary) or 3–8 (multi)")]
    InvalidNumOutcomes,
    #[msg("Invalid dates — closes_at must be before resolves_at and both in the future")]
    InvalidDates,
    #[msg("Market is not fully initialized — all outcome mints and order books must be created")]
    MarketNotFullyInitialized,
    #[msg("Cannot redeem complete sets on a Pending or Resolved market")]
    InvalidStatusForRedemption,

    // Creator
    #[msg("Stake amount is below the platform minimum")]
    InsufficientStake,
    #[msg("Initial odds are invalid — must sum to 10000 for active outcomes")]
    InvalidOdds,
    #[msg("Creator positions are locked until the lock period expires")]
    CreatorPositionsLocked,
    #[msg("No accumulated fees to claim")]
    NoFeesToClaim,

    // Trading
    #[msg("Order price must be between 1 and 9999 basis points")]
    InvalidOrderPrice,
    #[msg("Order amount is below the platform minimum")]
    InsufficientAmount,
    #[msg("Insufficient token or USDC balance")]
    InsufficientBalance,
    #[msg("Order book is full — maximum open orders reached")]
    OrderBookFull,
    #[msg("Order not found")]
    OrderNotFound,
    #[msg("Only the order maker can cancel this order")]
    UnauthorizedCancellation,
    #[msg("Incomplete set — need 1 token of each outcome to redeem")]
    IncompleteSet,

    // Oracle
    #[msg("Unauthorized oracle — signer does not match oracle_authority")]
    UnauthorizedOracle,
    #[msg("Invalid winning outcome — must be less than num_outcomes")]
    InvalidWinningOutcome,

    // Outcome
    #[msg("Invalid outcome index — must be less than num_outcomes")]
    InvalidOutcomeIndex,

    // Admin
    #[msg("Treasury account does not match platform config")]
    InvalidTreasury,

    // Math
    #[msg("Math overflow")]
    MathOverflow,

    // Order book
    #[msg("Invalid price: must be 1-9999 bps")]
    InvalidPrice,
    #[msg("Invalid amount: must be greater than 0")]
    InvalidAmount,
    #[msg("Insufficient funds for order")]
    InsufficientFunds,
    #[msg("Insufficient outcome tokens")]
    InsufficientOutcomeTokens,
    #[msg("Overflow occurred")]
    Overflow,

    // Authorization
    #[msg("Unauthorized: account owner does not match")]
    Unauthorized,
}
