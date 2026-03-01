pub mod initialize_platform;
pub mod propose_market;
pub mod claim_market;
pub mod initialize_outcome_mint;
pub mod initialize_order_book;
pub mod mint_complete_set;
pub mod redeem_complete_set;

// Re-export types (Accounts structs, Params). Handlers are called via qualified
// paths (e.g., propose_market::handler) so the ambiguous glob is harmless.
#[allow(ambiguous_glob_reexports)]
pub use initialize_platform::*;
pub use propose_market::*;
pub use claim_market::*;
pub use initialize_outcome_mint::*;
pub use initialize_order_book::*;
pub use mint_complete_set::*;
pub use redeem_complete_set::*;
