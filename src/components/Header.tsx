"use client";

import Link from "next/link";
import { useState, useEffect } from "react";

type Locale = "en" | "ja";

function useLocale() {
  const [locale, setLocale] = useState<Locale>("en");
  useEffect(() => {
    const stored = document.cookie.match(/locale=([^;]+)/)?.[1] as Locale | undefined;
    if (stored === "ja" || stored === "en") setLocale(stored);
  }, []);
  const toggle = () => {
    const next: Locale = locale === "en" ? "ja" : "en";
    document.cookie = `locale=${next}; path=/; max-age=31536000; SameSite=Lax`;
    setLocale(next);
    window.location.reload();
  };
  return { locale, toggle };
}

const navLinks = [
  { href: "/", label: { en: "Gallery", ja: "ギャラリー" } },
  { href: "/for-agents", label: { en: "For Agents", ja: "エージェント向け" } },
];

export default function Header() {
  const [menuOpen, setMenuOpen] = useState(false);
  const { locale, toggle } = useLocale();

  return (
    <header className="border-b border-zinc-800 sticky top-0 z-50 bg-zinc-950/90 backdrop-blur-sm">
      <div className="max-w-6xl mx-auto px-4 py-3 flex items-center gap-6">

        {/* Logo */}
        <Link href="/" className="flex items-center gap-2 group flex-shrink-0" onClick={() => setMenuOpen(false)}>
          <span className="text-2xl">🦞</span>
          <span className="text-lg font-bold text-white group-hover:text-[#E8404A] transition-colors">
            ClawSetups<span className="text-zinc-500 font-normal">.dev</span>
          </span>
        </Link>

        {/* Desktop nav — center */}
        <nav className="hidden sm:flex items-center gap-1 flex-1">
          {navLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="text-sm text-zinc-400 hover:text-white hover:bg-zinc-800/60 transition-colors px-3 py-1.5 rounded-lg"
            >
              {link.label[locale]}
            </Link>
          ))}
        </nav>

        {/* Desktop right: locale + CTA */}
        <div className="hidden sm:flex items-center gap-3 flex-shrink-0">
          <button
            onClick={toggle}
            className="text-xs text-zinc-500 hover:text-zinc-300 transition-colors w-8 text-center"
            title="Switch language"
          >
            {locale === "en" ? "JA" : "EN"}
          </button>
          <Link
            href="/dashboard"
            className="text-sm bg-[#E8404A] hover:bg-[#d63840] text-white px-4 py-1.5 rounded-lg transition-colors font-medium"
          >
            {locale === "en" ? "Dashboard" : "ダッシュボード"}
          </Link>
        </div>

        {/* Mobile: locale + hamburger */}
        <div className="sm:hidden ml-auto flex items-center gap-3">
          <button
            onClick={toggle}
            className="text-xs text-zinc-500 hover:text-zinc-300 transition-colors"
          >
            {locale === "en" ? "JA" : "EN"}
          </button>
          <button
            className="p-1.5 text-zinc-400 hover:text-white transition-colors"
            onClick={() => setMenuOpen(!menuOpen)}
            aria-label="Toggle menu"
          >
            {menuOpen ? (
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            ) : (
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            )}
          </button>
        </div>
      </div>

      {/* Mobile menu */}
      {menuOpen && (
        <nav className="sm:hidden border-t border-zinc-800 px-4 py-2 flex flex-col bg-zinc-950">
          {navLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="text-sm text-zinc-400 hover:text-white transition-colors py-3 border-b border-zinc-800/50"
              onClick={() => setMenuOpen(false)}
            >
              {link.label[locale]}
            </Link>
          ))}
          <Link
            href="/dashboard"
            className="mt-3 mb-1 text-center text-sm bg-[#E8404A] hover:bg-[#d63840] text-white px-4 py-2.5 rounded-lg transition-colors font-medium"
            onClick={() => setMenuOpen(false)}
          >
            {locale === "en" ? "Dashboard" : "ダッシュボード"}
          </Link>
        </nav>
      )}
    </header>
  );
}
