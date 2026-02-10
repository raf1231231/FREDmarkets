"use client";

import Link from "next/link";
import NavLink from "./NavLink";
import WalletButton from "../wallet/WalletButton";

export default function Header() {
  return (
    <header className="sticky top-0 z-50 bg-fred-navy">
      <div className="max-w-[1200px] mx-auto px-4 sm:px-6 flex items-center justify-between h-14">
        {/* Logo */}
        <Link href="/" className="text-white text-lg font-bold tracking-tight no-underline hover:text-white">
          FRED<span className="font-normal text-fred-gray-300">markets</span>
        </Link>

        {/* Nav links */}
        <nav className="hidden sm:flex items-center gap-6">
          <NavLink href="/markets">Markets</NavLink>
          <NavLink href="/create">Create</NavLink>
          <NavLink href="/portfolio">Portfolio</NavLink>
        </nav>

        {/* Wallet */}
        <WalletButton />
      </div>
    </header>
  );
}
