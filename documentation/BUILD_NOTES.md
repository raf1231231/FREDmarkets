# Solana/Anchor Build Notes

Lessons learned building the FREDmarkets smart contracts. Useful for any Anchor project on this toolchain.

---

## 1. Platform-Tools Cargo Version vs Crate Editions

**Problem:** `anchor build` uses Solana's bundled platform-tools (not your system Rust). As of early 2026, platform-tools v1.48 ships **Cargo 1.84**, which cannot parse crates using `edition2024`. The crate `constant_time_eq v0.4.x` requires it, and it's pulled in transitively through `blake3` → `solana-program` → `anchor-lang`.

**Symptom:**
```
error: failed to parse manifest at .../constant_time_eq-0.4.2/Cargo.toml
  feature `edition2024` is required
```

**Fix:** Pin `blake3` to the last version that uses `constant_time_eq 0.3.x`:
```toml
# In your program's Cargo.toml
[dependencies]
blake3 = "=1.5.5"
```

After adding this, delete `Cargo.lock` and regenerate: `cargo generate-lockfile`.

**Note:** This affects Anchor 0.29.0 AND 0.30.1 — both use the same platform-tools v1.48.

---

## 2. Anchor 0.30.1 Has a Compile Bug

**Problem:** `anchor-syn v0.30.1` calls `proc_macro2::Span::source_file()` which requires an unstable nightly feature. This breaks IDL generation on stable Rust.

**Symptom:**
```
error[E0599]: no method named `source_file` found for struct `proc_macro2::Span`
```

**Fix:** Stay on **Anchor 0.29.0** for now. The program crate deps should also be 0.29.0:
```toml
anchor-lang = { version = "0.29.0", features = ["init-if-needed"] }
anchor-spl = "0.29.0"
```

---

## 3. Solana BPF 4096-Byte Stack Frame Limit

**Problem:** Solana BPF programs have a hard **4096-byte stack frame limit** per function. Anchor's auto-generated `try_accounts()` deserializes all account structs on the stack. If your accounts struct contains large account types, you'll blow the limit.

**Symptom:**
```
Error: Stack offset of 5624 exceeded max offset of 4096 by 1528 bytes
```

**Fixes (apply all that help):**

### a) `Box<Account>` for large accounts
```rust
// Before (on stack — ~165 bytes each for TokenAccount, ~580 for Market)
pub market: Account<'info, Market>,
pub vault: Account<'info, TokenAccount>,

// After (on heap — only 8 bytes pointer on stack)
pub market: Box<Account<'info, Market>>,
pub vault: Box<Account<'info, TokenAccount>>,
```

Box everything over ~100 bytes: `Market`, `TokenAccount`, `Mint`, `PlatformConfig`. You may need to Box **all** of them in a single instruction struct to get under 4096.

### b) Reduce account struct sizes
On-chain storage is expensive anyway. Keep structs lean:
- Short fixed-byte arrays instead of large ones (title: 48B, not 128B)
- Move long text (descriptions, URLs) off-chain to your backend DB
- FRED series IDs are max ~10 chars — 12 bytes is plenty

### c) Use a params struct for instructions with many arguments
Many arguments = many stack variables in the generated code.
```rust
// Before — 11 args on the stack
pub fn create_market(ctx, series_id, title, description, ...) -> Result<()>

// After — 1 struct arg
#[derive(AnchorSerialize, AnchorDeserialize)]
pub struct CreateMarketParams { ... }

pub fn create_market(ctx: Context<CreateMarket>, params: CreateMarketParams) -> Result<()>
```

### d) You CANNOT Box Sysvars
`Box<Sysvar<'info, Rent>>` causes `undeclared crate __cpi_client_accounts_box`. Just remove the Rent sysvar — Anchor handles it implicitly.

---

## 4. `init_if_needed` Feature Flag

**Problem:** Using `init_if_needed` in `#[account(...)]` attributes requires an explicit cargo feature.

**Symptom:**
```
error: init_if_needed requires that anchor-lang be imported with the init-if-needed cargo feature enabled
```

**Fix:**
```toml
[dependencies]
anchor-lang = { version = "0.29.0", features = ["init-if-needed"] }
```

---

## 5. Quick Reference: Stack Sizes of Common Account Types

| Type | Approximate Size |
|------|-----------------|
| `Pubkey` | 32 bytes |
| `Signer` | 32 bytes |
| `Account<TokenAccount>` | ~165 bytes |
| `Account<Mint>` | ~82 bytes |
| `AccountInfo` | ~72 bytes |
| `Program<Token>` | ~32 bytes |
| `Sysvar<Rent>` | ~40 bytes |
| Custom `Account<Market>` | depends on struct |

**Rule of thumb:** If your `#[derive(Accounts)]` struct has 6+ accounts, start Boxing the large ones preemptively.
