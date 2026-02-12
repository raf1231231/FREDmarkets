"use client";

import { useState } from "react";
import Link from "next/link";
import NavLink from "./NavLink";
import WalletButton from "../wallet/WalletButton";

export default function Header() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <header className="sticky top-0 z-50 bg-fred-navy shadow-md">
      <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link
            href="/"
            className="text-white text-xl font-bold tracking-tight no-underline hover:text-fred-gray-100 transition-colors flex items-center gap-2"
          >
            <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
              <path d="M3 13h8V3H3v10zm0 8h8v-6H3v6zm10 0h8V11h-8v10zm0-18v6h8V3h-8z"/>
            </svg>
            <span>
              FRED<span className="font-normal text-fred-gray-300">markets</span>
            </span>
          </Link>

          {/* Desktop Nav */}
          <nav className="hidden md:flex items-center gap-2">
            <NavLink href="/markets" icon="chart">Markets</NavLink>
            <NavLink href="/create" icon="plus">Create</NavLink>
            <NavLink href="/portfolio" icon="wallet">Portfolio</NavLink>
          </nav>

          {/* Right side */}
          <div className="flex items-center gap-3">
            <WalletButton />

            {/* Mobile menu button */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden text-white p-2 rounded hover:bg-fred-navy-light transition-colors"
              aria-label="Toggle menu"
            >
              {mobileMenuOpen ? (
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              ) : (
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                </svg>
              )}
            </button>
          </div>
        </div>

        {/* Mobile menu */}
        {mobileMenuOpen && (
          <div className="md:hidden border-t border-fred-navy-light py-3 space-y-1">
            <NavLink href="/markets" icon="chart" mobile>Markets</NavLink>
            <NavLink href="/create" icon="plus" mobile>Create</NavLink>
            <NavLink href="/portfolio" icon="wallet" mobile>Portfolio</NavLink>
          </div>
        )}
      </div>
    </header>
  );
}
