/**
 * Minimal Anchor IDL for the FREDmarkets program.
 *
 * Contains only the accounts and instructions needed by the oracle relay:
 *   - close_market
 *   - resolve_market
 *   - market account layout (for on-chain fetching)
 *
 * Anchor 0.29.0 IDL format.  Field names are camelCase (Anchor converts
 * snake_case at build time; we replicate that here manually).
 *
 * Program: GaK745UiF6FMZt5hXbCrKQrhmdcmRx8SYi3AdfFshMBo
 */

export const FRED_MARKETS_IDL = {
  version: "0.1.0",
  name: "fred_markets",

  // ─── Instructions ──────────────────────────────────────────────────────────
  instructions: [
    {
      name: "closeMarket",
      accounts: [
        { name: "market", isMut: true, isSigner: false },
        { name: "caller", isMut: false, isSigner: true },
      ],
      args: [],
    },
    {
      name: "resolveMarket",
      accounts: [
        { name: "market", isMut: true, isSigner: false },
        { name: "platformConfig", isMut: false, isSigner: false },
        { name: "oracleAuthority", isMut: false, isSigner: true },
      ],
      args: [
        { name: "outcomeIndex", type: "u8" },
        { name: "resolutionValue", type: "i64" },
        { name: "resolutionTimestamp", type: "i64" },
      ],
    },
  ],

  // ─── Account Layouts ────────────────────────────────────────────────────────
  accounts: [
    {
      name: "market",
      type: {
        kind: "struct",
        fields: [
          { name: "marketId",             type: "u64" },
          { name: "proposer",             type: "publicKey" },
          { name: "fredSeriesId",         type: { array: ["u8", 32] } },
          { name: "title",                type: { array: ["u8", 128] } },
          { name: "description",          type: { array: ["u8", 512] } },
          { name: "marketType",           type: { defined: "MarketType" } },
          { name: "numOutcomes",          type: "u8" },
          { name: "outcomeLabels",        type: { array: [{ array: ["u8", 32] }, 8] } },
          { name: "outcomeMints",         type: { array: ["publicKey", 8] } },
          { name: "resolutionCondition",  type: { defined: "ResolutionCondition" } },
          { name: "resolutionSourceUrl",  type: { array: ["u8", 128] } },
          { name: "tokenMint",            type: "publicKey" },
          { name: "vault",               type: "publicKey" },
          { name: "totalSetsMinted",      type: "u64" },
          { name: "status",              type: { defined: "MarketStatus" } },
          { name: "winningOutcome",       type: { option: "u8" } },
          { name: "resolutionValue",      type: { option: "i64" } },
          { name: "resolutionTimestamp",  type: { option: "i64" } },
          { name: "createdAt",           type: "i64" },
          { name: "closesAt",            type: "i64" },
          { name: "resolvesAt",          type: "i64" },
          { name: "resolvedAt",          type: { option: "i64" } },
          { name: "initializedOutcomes", type: "u8" },
          { name: "bump",                type: "u8" },
        ],
      },
    },
    {
      name: "platformConfig",
      type: {
        kind: "struct",
        fields: [
          { name: "authority",              type: "publicKey" },
          { name: "oracleAuthority",        type: "publicKey" },
          { name: "treasury",               type: "publicKey" },
          { name: "reserve",                type: "publicKey" },
          { name: "feeBps",                 type: "u16" },
          { name: "creatorFeeShareBps",     type: "u16" },
          { name: "treasuryFeeShareBps",    type: "u16" },
          { name: "reserveFeeShareBps",     type: "u16" },
          { name: "minStakeAmount",         type: "u64" },
          { name: "creatorLockPeriod",      type: "i64" },
          { name: "minOrderAmount",         type: "u64" },
          { name: "marketCreationFee",      type: "u64" },
          { name: "paused",                 type: "bool" },
          { name: "totalMarketsCreated",    type: "u64" },
          { name: "bump",                   type: "u8" },
        ],
      },
    },
  ],

  // ─── Custom Types ────────────────────────────────────────────────────────────
  types: [
    {
      name: "MarketType",
      type: {
        kind: "enum",
        variants: [
          { name: "Binary" },
          { name: "MultiOutcome" },
        ],
      },
    },
    {
      name: "MarketStatus",
      type: {
        kind: "enum",
        variants: [
          { name: "Pending" },
          { name: "Active" },
          { name: "Closed" },
          { name: "Resolved" },
          { name: "Cancelled" },
          { name: "Expired" },
        ],
      },
    },
    {
      name: "ResolutionCondition",
      type: {
        kind: "struct",
        fields: [
          { name: "conditionType",    type: { defined: "ConditionType" } },
          { name: "thresholdValue",   type: "i64" },
          { name: "comparison",       type: { defined: "Comparison" } },
          { name: "rangeLow",         type: "i64" },
          { name: "rangeHigh",        type: "i64" },
          { name: "rangeStep",        type: "i64" },
          { name: "observationDate",  type: "i64" },
        ],
      },
    },
    {
      name: "ConditionType",
      type: {
        kind: "enum",
        variants: [
          { name: "ThresholdAbove" },
          { name: "ThresholdBelow" },
          { name: "ExactRange" },
          { name: "ChangePercent" },
        ],
      },
    },
    {
      name: "Comparison",
      type: {
        kind: "enum",
        variants: [
          { name: "GreaterThan" },
          { name: "GreaterThanOrEqual" },
          { name: "LessThan" },
          { name: "LessThanOrEqual" },
          { name: "Equal" },
        ],
      },
    },
  ],

  events: [],
  errors: [],
};
