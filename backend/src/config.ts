import dotenv from "dotenv";
dotenv.config();

export const config = {
  port: parseInt(process.env.PORT || "3001", 10),
  databaseUrl: process.env.DATABASE_URL || "",
  fredApiKey: process.env.FRED_API_KEY || "",
  fredBaseUrl: "https://api.stlouisfed.org/fred",
  frontendUrl: process.env.FRONTEND_URL || "http://localhost:3000",
  nodeEnv: process.env.NODE_ENV || "development",

  // ─── Oracle relay ──────────────────────────────────────────────────────────
  /**
   * 64-byte oracle keypair in one of two formats:
   *   • Base64 string   — Buffer.from(key, 'base64') → 64 bytes
   *   • JSON array str  — "[1,2,3,...,64]" (output of `solana-keygen new --outfile kp.json`)
   *
   * The public key of this keypair must match oracle_authority in PlatformConfig
   * (set during initialize_platform).
   */
  oracleKeypair: process.env.ORACLE_KEYPAIR || "",

  /** Solana RPC endpoint.  Defaults to devnet. */
  solanaRpcUrl: process.env.SOLANA_RPC_URL || "https://api.devnet.solana.com",

  /** FREDmarkets Anchor program ID (matches declare_id! in lib.rs). */
  fredMarketsProgramId:
    process.env.FRED_MARKETS_PROGRAM_ID ||
    "GaK745UiF6FMZt5hXbCrKQrhmdcmRx8SYi3AdfFshMBo",

  // node-cron schedule for the oracle cycle.
  // Default: every 15 minutes.  Use every-5-min ("*/5 * * * *") for testing.
  oracleCronSchedule: process.env.ORACLE_CRON_SCHEDULE || "*/15 * * * *",

  /**
   * Secret for POST /api/oracle/trigger admin endpoint.
   * Leave empty to disable manual trigger entirely.
   */
  oracleAdminSecret: process.env.ORACLE_ADMIN_SECRET || "",
};
