"use client";

import { ReactNode } from "react";
import { Buffer } from "buffer";
import SolanaProvider from "@/providers/SolanaProvider";
import AnchorProvider from "@/providers/AnchorProvider";

// Polyfill Buffer for Solana web3.js in the browser
if (typeof window !== "undefined") {
  window.Buffer = Buffer;
}

export default function AppProviders({ children }: { children: ReactNode }) {
  return (
    <SolanaProvider>
      <AnchorProvider>{children}</AnchorProvider>
    </SolanaProvider>
  );
}
