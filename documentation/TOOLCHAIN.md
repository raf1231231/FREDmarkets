# TOOLCHAIN.md — Version Compatibility & Implementation Guide for FREDmarkets

This document exists to prevent build failures from version mismatches. Read this BEFORE writing any code.

---

## 1. Pinned Toolchain Versions

Use these exact versions. Do not deviate.

| Tool | Version | Install Command |
|------|---------|----------------|
| **Anchor CLI** | **0.30.1** | `avm install 0.30.1 && avm use 0.30.1` |
| **anchor-lang** (Cargo) | **0.30.1** | `anchor-lang = "0.30.1"` |
| **anchor-spl** (Cargo) | **0.30.1** | `anchor-spl = "0.30.1"` |
| **Solana CLI** | **1.18.17** | `solana-install init 1.18.17` |
| **Rust** | **1.75.0** | `rustup default 1.75.0` |
| **@coral-xyz/anchor** (npm) | **0.30.1** | `npm install @coral-xyz/anchor@0.30.1` |
| **@solana/web3.js** (npm) | **1.95.x** | `npm install @solana/web3.js@1` |
| **@solana/spl-token** (npm) | **0.4.x** | `npm install @solana/spl-token@0.4` |
| **Node.js** | **18 LTS or 20 LTS** | — |

### Why 0.30.1 and not newer?

- **0.31.0** targets Solana v2 (Agave). It renames binaries (`solana-install` → `agave-install`), requires Rust 1.79+, and restructures internal `solana-program` dependencies. The `anchor-spl` v0.31.0 crate pulls in `spl-token-2022 v6.0.0` which pins `solana-program = "=2.1.0"` — this causes cascading dependency conflicts if any other crate resolves a different `solana-program` version.
- **0.32.0** goes further — it replaces `solana-program` with smaller split crates (`solana-invoke`, etc.), changes `anchor deploy` behavior to upload IDL by default, and disallows duplicate mutable accounts by default. It also targets Solana v2.1+ and is not compatible with Solana 1.18.x.
- **0.30.1** is the last stable version targeting Solana 1.18.x with the v1 `solana-program` crate. It's battle-tested, has fewer dependency conflicts, and all existing documentation/tutorials align with it.

If you need features from 0.31+ (custom discriminators, `LazyAccount`, `cfg` attributes on instructions), you must also upgrade to Solana CLI v2.1.0+ and Rust 1.79+. Do not mix versions.

---

## 2. Cargo.toml — Exact Configuration

```toml
[workspace]
members = ["programs/fred_markets"]

[workspace.metadata]
overflow-checks = true  # REQUIRED in 0.30.0+ — must be explicitly set

[profile.release]
overflow-checks = true
lto = "fat"
codegen-units = 1
```

### Program Cargo.toml

```toml
[package]
name = "fred-markets"
version = "0.1.0"
edition = "2021"

[lib]
crate-type = ["cdylib", "lib"]
name = "fred_markets"

[features]
default = []
crt-static = []
no-entrypoint = []
no-idl = []
no-log-ix-name = []
idl-build = ["anchor-lang/idl-build", "anchor-spl/idl-build"]

[dependencies]
anchor-lang = { version = "0.30.1", features = ["init-if-needed"] }
anchor-spl = "0.30.1"
```

### Critical Cargo Rules

1. **`idl-build` feature is REQUIRED.** Without it, `anchor build` fails with: `Error: idl-build feature is missing`. Every crate used for IDL type generation must also be listed (e.g., `anchor-spl/idl-build`).

2. **`overflow-checks` must be explicitly set** in workspace `Cargo.toml`. Anchor 0.30.0+ enforces this. It doesn't matter if you set it to `true` or `false`, but you must be explicit.

3. **Do NOT add `solana-program` as a direct dependency.** Use `anchor_lang::solana_program` instead. Adding it separately risks version conflicts between the version Anchor pins internally and whatever Cargo resolves. If you need `pubkey!` macro, it's re-exported from `anchor_lang::prelude`.

4. **Do NOT add `spl-associated-token-account` as a direct dependency.** It's re-exported from `anchor_spl::associated_token` since 0.30.1.

5. **Cargo.lock lockfile version must be 3** (not 4). Anchor 0.30.x targets Rust 1.75 which doesn't support lockfile v4. If `anchor build` fails with a lockfile error, add this to the top of `Cargo.lock`:
   ```
   version = 3
   ```
   Or delete `Cargo.lock` and let it regenerate.

6. **`init-if-needed` requires a feature flag.** The `anchor-lang` dependency must include `features = ["init-if-needed"]` to use `#[account(init_if_needed, ...)]` constraints.

---

## 3. Anchor.toml Configuration

```toml
[toolchain]
anchor_version = "0.30.1"
solana_version = "1.18.17"

[features]
resolution = true
skip-lint = false

[programs.localnet]
fred_markets = "Fg6PaFpoGXkYsidMpWTK6W2BeZ7FEfcYkg476zPFsLnS"

[programs.devnet]
fred_markets = "<DEPLOYED_PROGRAM_ID>"

[registry]
url = "https://api.apr.dev"

[provider]
cluster = "Localnet"
wallet = "~/.config/solana/id.json"

[scripts]
test = "npx ts-mocha -p ./tsconfig.json -t 1000000 tests/**/*.ts"
```

### Critical Anchor.toml Rules

1. **Always specify `[toolchain]` with both versions.** This prevents anchor from using whatever Solana/Anchor version is globally installed and ensures reproducible builds.

2. **`anchor_version` and `solana_version` must match** your installed versions. Mismatched versions between CLI, Cargo crates, and TS packages produce a warning in 0.30.0+ and can cause silent bugs.

---

## 4. TypeScript / Frontend Package Compatibility

```json
{
  "dependencies": {
    "@coral-xyz/anchor": "0.30.1",
    "@solana/web3.js": "^1.95.0",
    "@solana/spl-token": "^0.4.0",
    "@solana/wallet-adapter-react": "^0.15.35",
    "@solana/wallet-adapter-react-ui": "^0.9.35",
    "@solana/wallet-adapter-wallets": "^0.19.32"
  }
}
```

### Critical TS Rules

1. **`@coral-xyz/anchor` version MUST match `anchor-lang`/`anchor-cli`.** If the Rust crate is 0.30.1, the TS package must be 0.30.1. Mismatched versions cause IDL deserialization failures and silent account resolution bugs.

2. **IDL format changed completely in 0.30.0.** The new IDL format includes `address`, `metadata.spec`, and uses discriminators as byte arrays. The TS client reads the IDL to generate type-safe methods. If you have a 0.29.x IDL with a 0.30.x client (or vice versa), it will fail. Use `anchor idl convert` if needed.

3. **Account resolution changed in 0.30.0.** The TS client auto-resolves system programs and sysvars from the IDL's `address` field. You no longer pass `systemProgram`, `tokenProgram`, etc. in your `.accounts({})` call. If you do, you get a type error. Remove them.

4. **`programId` removed from `new Program()`.** In 0.30.0+, the program ID is read from the IDL's `address` field:
   ```typescript
   // OLD (0.29.x):
   const program = new Program(idl, programId, provider);
   // NEW (0.30.x):
   const program = new Program(idl as any, provider);
   ```

5. **Do NOT use `@solana/web3.js` v2.x** with `@coral-xyz/anchor` 0.30.x. The web3.js v2 is a complete rewrite with incompatible APIs. Anchor 0.30.x depends on web3.js v1.x.

---

## 5. Known Build Issues & Fixes

### Issue: `stack frame exceeded` or undefined behavior at runtime

**Cause:** Anchor 0.30.x with Solana 1.18 has stack space issues when using multiple `init` constraints in one instruction. The `try_accounts` macro expands to excessive stack usage.

**Fix:** Split instructions with many `init` constraints into separate instructions. For example, in `claim_market` which initializes vault + N outcome mints + N order books + creator config — do NOT initialize all of these in a single instruction. Split into:
- `claim_market` — creates vault, creator config, sets market active
- `initialize_outcome_mint` — called N times, one per outcome
- `initialize_order_book` — called N times, one per outcome

This is the most likely issue you will hit in this project given the number of accounts `claim_market` needs to create. Plan for it.

### Issue: `BPF SDK not found` or `not a directory: platform-tools/rust/lib`

**Fix:**
```bash
solana-install init 1.18.17
cargo build-sbf --force-tools-install
rm -rf ~/.cache/solana
anchor build
```

### Issue: `failed to select a version for solana-program`

**Cause:** Conflicting `solana-program` versions from different dependencies.

**Fix:** Do NOT add `solana-program` directly. Use `anchor_lang::solana_program`. If forced, pin exact: `solana-program = "=1.18.17"` but this is a last resort.

### Issue: `Error: idl-build feature is missing`

**Fix:** Add to program `Cargo.toml`:
```toml
[features]
idl-build = ["anchor-lang/idl-build", "anchor-spl/idl-build"]
```

### Issue: ATA type errors in TS client

**Cause:** In 0.30.1, the TS client auto-resolves Associated Token Accounts. If you manually specify them in `.accounts({})`, you get a type error.

**Fix:** Remove ATA accounts from your `.accounts()` calls. Let the client resolve them.

### Issue: `overflow-checks` not specified

**Cause:** Anchor 0.30.0+ requires explicit `overflow-checks` in workspace `Cargo.toml`.

**Fix:** Add `overflow-checks = true` (or `false`) under `[profile.release]` in workspace root `Cargo.toml`.

---

## 6. SPL Token Patterns for This Project

This project mints SPL tokens (outcome tokens) from PDAs. Here are the correct Anchor 0.30.1 patterns:

### Creating a Mint (PDA-owned)

```rust
use anchor_lang::prelude::*;
use anchor_spl::token::{Mint, Token};

#[derive(Accounts)]
#[instruction(outcome_index: u8)]
pub struct InitializeOutcomeMint<'info> {
    #[account(mut)]
    pub payer: Signer<'info>,

    #[account(
        mut,
        seeds = [b"market", market.market_id.to_le_bytes().as_ref()],
        bump = market.bump,
    )]
    pub market: Account<'info, Market>,

    #[account(
        init,
        payer = payer,
        mint::decimals = 6,
        mint::authority = market,  // Market PDA is the mint authority
        seeds = [b"outcome_mint", market.key().as_ref(), &[outcome_index]],
        bump,
    )]
    pub outcome_mint: Account<'info, Mint>,

    pub token_program: Program<'info, Token>,
    pub system_program: Program<'info, System>,
    pub rent: Sysvar<'info, Rent>,
}
```

### Minting Tokens (PDA signs as authority)

```rust
use anchor_spl::token::{self, MintTo};

// Inside instruction handler:
let market_seeds = &[
    b"market",
    &market.market_id.to_le_bytes(),
    &[market.bump],
];
let signer_seeds = &[&market_seeds[..]];

token::mint_to(
    CpiContext::new_with_signer(
        ctx.accounts.token_program.to_account_info(),
        MintTo {
            mint: ctx.accounts.outcome_mint.to_account_info(),
            to: ctx.accounts.user_token_account.to_account_info(),
            authority: ctx.accounts.market.to_account_info(),
        },
        signer_seeds,
    ),
    amount,
)?;
```

### Burning Tokens

```rust
use anchor_spl::token::{self, Burn};

token::burn(
    CpiContext::new(
        ctx.accounts.token_program.to_account_info(),
        Burn {
            mint: ctx.accounts.outcome_mint.to_account_info(),
            from: ctx.accounts.user_token_account.to_account_info(),
            authority: ctx.accounts.user.to_account_info(), // user signs to burn their own tokens
        },
    ),
    amount,
)?;
```

### Transferring Tokens from PDA Vault

```rust
use anchor_spl::token::{self, Transfer};

let market_seeds = &[
    b"market",
    &market.market_id.to_le_bytes(),
    &[market.bump],
];
let signer_seeds = &[&market_seeds[..]];

token::transfer(
    CpiContext::new_with_signer(
        ctx.accounts.token_program.to_account_info(),
        Transfer {
            from: ctx.accounts.vault.to_account_info(),
            to: ctx.accounts.user_usdc_account.to_account_info(),
            authority: ctx.accounts.market.to_account_info(),
        },
        signer_seeds,
    ),
    amount,
)?;
```

### Creating Token Accounts (ATA)

Use `init_if_needed` with `associated_token` constraints for user ATAs:

```rust
use anchor_spl::associated_token::AssociatedToken;
use anchor_spl::token::{Mint, Token, TokenAccount};

#[account(
    init_if_needed,
    payer = user,
    associated_token::mint = outcome_mint,
    associated_token::authority = user,
)]
pub user_outcome_ata: Account<'info, TokenAccount>,

pub associated_token_program: Program<'info, AssociatedToken>,
```

---

## 7. Account Size Calculation

Anchor adds an 8-byte discriminator to every account. Calculate space as: `8 + serialized_size`.

Common type sizes:
| Type | Bytes |
|------|-------|
| bool | 1 |
| u8 | 1 |
| u16 | 2 |
| u32 | 4 |
| u64 | 8 |
| i64 | 8 |
| Pubkey | 32 |
| Option\<T\> | 1 + sizeof(T) |
| [u8; N] | N |
| [T; N] | N × sizeof(T) |
| String | 4 + len |
| Vec\<T\> | 4 + (len × sizeof(T)) |

**Warning on account size limits:** Solana has a 10MB account size limit but rent costs scale linearly. The `Market` account in this project is large due to `outcome_labels: [[u8; 32]; 8]` (256 bytes), `outcome_mints: [Pubkey; 8]` (256 bytes), `title: [u8; 128]`, `description: [u8; 512]`, and `ResolutionCondition`. Calculate carefully and consider using `Box<Account<...>>` for large accounts to move them to the heap.

**Warning on `OrderBook` size:** Each `Order` struct is approximately `32 (maker) + 2 (price) + 8 (amount) + 8 (filled) + 8 (order_id) + 8 (created_at) + 1 (active) = 67 bytes`. With 32 bids + 32 asks = 64 orders × 67 = 4,288 bytes + overhead. This is manageable but verify rent costs. Consider using `zero_copy` (repr(C)) if you need to maximize order capacity.

---

## 8. Compute Budget Awareness

Solana's default compute budget is 200,000 compute units (CU) per instruction. Complex instructions can exceed this. Use `ComputeBudgetInstruction::set_compute_unit_limit()` on the client side for heavy instructions.

Instructions likely to be compute-heavy in this project:
- `claim_market` — multiple account inits (split as described in Section 5)
- `place_order` — order matching loop iterating through the book
- `clear_order_book` — iterating through and returning escrowed funds for many orders
- `resolve_market` — if combined with order cancellation

For `place_order` matching, set a max fill iterations (e.g., 5 fills per call) to keep compute bounded. Partial fills are fine — the taker calls `place_order` again for remaining amount.

---

## 9. Testing

### Local Testing

```bash
# Start local validator
solana-test-validator --reset

# In another terminal
anchor build
anchor deploy --provider.cluster localnet
anchor test --skip-local-validator  # if validator already running
```

### Test Framework

Anchor 0.30.1 defaults to TypeScript tests with `ts-mocha`. Tests go in `tests/` directory. Use `@coral-xyz/anchor` test utilities:

```typescript
import * as anchor from "@coral-xyz/anchor";
import { Program } from "@coral-xyz/anchor";
import { FredMarkets } from "../target/types/fred_markets";

describe("fred_markets", () => {
  const provider = anchor.AnchorProvider.env();
  anchor.setProvider(provider);
  const program = anchor.workspace.FredMarkets as Program<FredMarkets>;

  it("initializes platform", async () => {
    // test code
  });
});
```

### Common Testing Pitfalls

1. **Clock manipulation:** Use `provider.connection.requestAirdrop` for funding and `BanksClient` for clock advancement in tests. For `closes_at` / `resolves_at` testing, you'll need to advance the validator clock.

2. **Account not found:** If an account doesn't exist yet, Anchor throws `AccountNotFound`. Make sure prerequisite instructions (init platform, propose market, etc.) run first.

3. **Token account creation:** ATAs are created on first use with `init_if_needed`. Make sure the payer has enough SOL for rent.

---

## 10. Version Upgrade Path (Future Reference)

If you later decide to upgrade:

### 0.30.1 → 0.31.x
- Solana CLI: 1.18.17 → 2.1.0 (Agave transition)
- Rust: 1.75 → 1.79+
- `solana-install` → `agave-install`
- Lockfile version 3 → 4 (automatic)
- Remove any `solana-program` direct dependencies
- IDL auto-conversion for legacy IDLs
- Stack improvements for `init` constraints
- Custom discriminator support added

### 0.31.x → 0.32.x
- `solana-program` replaced with smaller crates in `anchor-lang`
- `anchor deploy` uploads IDL by default (use `--no-idl` to skip)
- Duplicate mutable accounts disallowed by default (use `dup` constraint)
- `anchor verify` now uses `solana-verify` under the hood
- TS: `@anchor-lang/core` replaces some `@coral-xyz/anchor` exports

### Do not upgrade mid-development. Finish and deploy on 0.30.1 first.
