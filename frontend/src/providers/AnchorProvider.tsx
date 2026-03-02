"use client";

import {
  createContext,
  useContext,
  useMemo,
  ReactNode,
} from "react";
import { useConnection, useAnchorWallet } from "@solana/wallet-adapter-react";
import { AnchorProvider, Program } from "@coral-xyz/anchor";
import { PublicKey } from "@solana/web3.js";
import idl from "@/idl/fred_markets.json";

// The Anchor-generated IDL type — we use `any` here since the IDL JSON
// is the source of truth and Anchor constructs types at runtime.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type FredMarketsProgram = Program<any>;

interface AnchorContextType {
  /**
   * Signed program — only set when a wallet is connected.
   * Use this for submitting transactions.
   */
  program: FredMarketsProgram | null;
  /**
   * Read-only program — always available (no wallet required).
   * Use this for fetching on-chain accounts.
   */
  readonlyProgram: FredMarketsProgram;
  provider: AnchorProvider | null;
}

// A placeholder PublicKey for the dummy readonly wallet
const READONLY_PUBKEY = new PublicKey("11111111111111111111111111111111");

const AnchorContext = createContext<AnchorContextType | null>(null);

export function useAnchorProgram(): AnchorContextType {
  const ctx = useContext(AnchorContext);
  if (!ctx) throw new Error("useAnchorProgram must be used inside AnchorProviderComponent");
  return ctx;
}

export default function AnchorProviderComponent({
  children,
}: {
  children: ReactNode;
}) {
  const { connection } = useConnection();
  const wallet = useAnchorWallet();

  const contextValue = useMemo((): AnchorContextType => {
    // Build a read-only Anchor provider that can fetch accounts without a signer.
    // Signing calls will throw — only used for .fetch() / .all() reads.
    const readonlyProvider = new AnchorProvider(
      connection,
      {
        publicKey: READONLY_PUBKEY,
        signTransaction: async (tx) => { throw new Error("Read-only wallet cannot sign"); return tx; },
        signAllTransactions: async (txs) => { throw new Error("Read-only wallet cannot sign"); return txs; },
      },
      { commitment: "confirmed" }
    );
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const readonlyProgram = new Program(idl as any, readonlyProvider);

    if (!wallet) {
      return { program: null, readonlyProgram, provider: null };
    }

    // Full provider with signer — used for transactions
    const provider = new AnchorProvider(connection, wallet, {
      commitment: "confirmed",
    });

    // Anchor 0.30.x: programId is read from idl.address — do NOT pass separately
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const program = new Program(idl as any, provider);

    return { program, readonlyProgram, provider };
  }, [connection, wallet]);

  return (
    <AnchorContext.Provider value={contextValue}>
      {children}
    </AnchorContext.Provider>
  );
}
