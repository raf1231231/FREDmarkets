import { PublicKey } from "@solana/web3.js";

export const PROGRAM_ID = new PublicKey(
  "GaK745UiF6FMZt5hXbCrKQrhmdcmRx8SYi3AdfFshMBo"
);

export const RPC_ENDPOINT =
  process.env.NEXT_PUBLIC_RPC_ENDPOINT || "http://127.0.0.1:8899";

export const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:3001/api";

export const USDC_DECIMALS = 6;
