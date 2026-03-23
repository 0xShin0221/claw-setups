"use client";

import Link from "next/link";
import { useState } from "react";

export default function Header() {
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <header className="border-b border-zinc-800 sticky top-0 z-50 bg-zinc-950/90 backdrop-blur-sm">
      <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2 group" onClick={() => setMenuOpen(false)}>
          <span className="text-2xl">🦞</span>
          <span className="text-xl font-bold text-white group-hover:text-[#E8404A] transition-colors">
            ClawSetups
          </span>
          <span className="text-xs text-zinc-500 mt-1">.dev</span>
        </Link>

        {/* Desktop nav */}
        <nav className="hidden sm:flex items-center gap-6">
          <Link href="/" className="text-sm text-zinc-400 hover:text-white transition-colors">
            Gallery
          </Link>
          <Link href="/for-agents" className="text-sm text-zinc-400 hover:text-white transition-colors">
            For Agents
          </Link>
          <Link
            href="/dashboard"
            className="text-sm bg-[#E8404A] hover:bg-[#d63840] text-white px-4 py-2 rounded-lg transition-colors font-medium"
          >
            Get API Key
          </Link>
        </nav>

        {/* Mobile hamburger */}
        <button
          className="sm:hidden p-2 text-zinc-400 hover:text-white transition-colors"
          onClick={() => setMenuOpen(!menuOpen)}
          aria-label="Toggle menu"
        >
          {menuOpen ? (
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

      {/* Mobile menu */}
      {menuOpen && (
        <nav className="sm:hidden border-t border-zinc-800 px-4 py-3 flex flex-col gap-1 bg-zinc-950">
          <Link
            href="/"
            className="text-sm text-zinc-400 hover:text-white transition-colors py-2.5 border-b border-zinc-800/50"
            onClick={() => setMenuOpen(false)}
          >
            Gallery
          </Link>
          <Link
            href="/for-agents"
            className="text-sm text-zinc-400 hover:text-white transition-colors py-2.5 border-b border-zinc-800/50"
            onClick={() => setMenuOpen(false)}
          >
            For Agents
          </Link>
          <Link
            href="/dashboard"
            className="mt-2 text-center text-sm bg-[#E8404A] hover:bg-[#d63840] text-white px-4 py-2.5 rounded-lg transition-colors font-medium"
            onClick={() => setMenuOpen(false)}
          >
            Get API Key
          </Link>
        </nav>
      )}
    </header>
  );
}
