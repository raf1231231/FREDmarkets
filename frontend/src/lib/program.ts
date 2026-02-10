import { PublicKey } from "@solana/web3.js";
import BN from "bn.js";
import { PROGRAM_ID } from "./constants";

export function getPlatformConfigPda(): [PublicKey, number] {
  return PublicKey.findProgramAddressSync(
    [Buffer.from("platform_config")],
    PROGRAM_ID
  );
}

export function getMarketPda(marketId: BN): [PublicKey, number] {
  return PublicKey.findProgramAddressSync(
    [Buffer.from("market"), marketId.toArrayLike(Buffer, "le", 8)],
    PROGRAM_ID
  );
}

export function getVaultPda(market: PublicKey): [PublicKey, number] {
  return PublicKey.findProgramAddressSync(
    [Buffer.from("vault"), market.toBuffer()],
    PROGRAM_ID
  );
}

export function getOutcomeMintPda(
  market: PublicKey,
  outcomeIndex: number
): [PublicKey, number] {
  return PublicKey.findProgramAddressSync(
    [Buffer.from("outcome_mint"), market.toBuffer(), Buffer.from([outcomeIndex])],
    PROGRAM_ID
  );
}

export function getOrderBookPda(
  market: PublicKey,
  outcomeIndex: number
): [PublicKey, number] {
  return PublicKey.findProgramAddressSync(
    [Buffer.from("orderbook"), market.toBuffer(), Buffer.from([outcomeIndex])],
    PROGRAM_ID
  );
}

export function getCreatorConfigPda(market: PublicKey): [PublicKey, number] {
  return PublicKey.findProgramAddressSync(
    [Buffer.from("creator_config"), market.toBuffer()],
    PROGRAM_ID
  );
}
