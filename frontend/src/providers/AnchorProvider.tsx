"use client";

import {
  createContext,
  useContext,
  useMemo,
  ReactNode,
} from "react";
import { useConnection, useAnchorWallet } from "@solana/wallet-adapter-react";
import { AnchorProvider, Program } from "@coral-xyz/anchor";
import idl from "@/idl/fred_markets.json";

// The Anchor-generated IDL type — we use `any` here since the IDL JSON
// is the source of truth and Anchor constructs types at runtime.
type FredMarketsProgram = Program<any>;

interface AnchorContextType {
  program: FredMarketsProgram | null;
  provider: AnchorProvider | null;
}

const AnchorContext = createContext<AnchorContextType>({
  program: null,
  provider: null,
});

export function useAnchorProgram() {
  return useContext(AnchorContext);
}

export default function AnchorProviderComponent({
  children,
}: {
  children: ReactNode;
}) {
  const { connection } = useConnection();
  const wallet = useAnchorWallet();

  const { provider, program } = useMemo(() => {
    if (!wallet) return { provider: null, program: null };

    const provider = new AnchorProvider(connection, wallet, {
      commitment: "confirmed",
    });

    // Anchor 0.30.x: programId is read from idl.address — do NOT pass it separately
    const program = new Program(idl as any, provider);

    return { provider, program };
  }, [connection, wallet]);

  return (
    <AnchorContext.Provider value={{ program, provider }}>
      {children}
    </AnchorContext.Provider>
  );
}
