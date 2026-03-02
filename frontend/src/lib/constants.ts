import { PublicKey } from "@solana/web3.js";

export const PROGRAM_ID = new PublicKey(
  "GaK745UiF6FMZt5hXbCrKQrhmdcmRx8SYi3AdfFshMBo"
);

export const RPC_ENDPOINT =
  process.env.NEXT_PUBLIC_RPC_ENDPOINT || "http://127.0.0.1:8899";

export const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:3001/api";

export const USDC_DECIMALS = 6;

// SPL Token Program IDs
export const TOKEN_PROGRAM_ID = new PublicKey(
  "TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA"
);

export const ASSOCIATED_TOKEN_PROGRAM_ID = new PublicKey(
  "ATokenGPvbdGVxr1b2hvZbsiqW5xWH25efTNsLJe1bSP"
);

// USDC mint — override via NEXT_PUBLIC_USDC_MINT for devnet custom tokens
// Devnet note: set NEXT_PUBLIC_USDC_MINT to the mint used when initialize_platform was called
export const USDC_MINT = new PublicKey(
  process.env.NEXT_PUBLIC_USDC_MINT ||
    "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v" // mainnet Circle USDC
);

// Solana network (for explorer links)
export const SOLANA_NETWORK =
  process.env.NEXT_PUBLIC_SOLANA_NETWORK || "devnet";

// Solana Explorer base URL
export function explorerUrl(
  signature: string,
  type: "tx" | "address" = "tx"
): string {
  const cluster = SOLANA_NETWORK === "mainnet-beta" ? "" : `?cluster=${SOLANA_NETWORK}`;
  return `https://explorer.solana.com/${type}/${signature}${cluster}`;
}
