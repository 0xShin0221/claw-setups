"use client";

import Link from "next/link";
import { useState, useEffect, useRef } from "react";

type Locale = "en" | "ja" | "zh" | "ko" | "de" | "fr" | "es" | "pt";

const LOCALE_OPTIONS: { code: Locale; flag: string; label: string }[] = [
  { code: "en", flag: "🇺🇸", label: "EN" },
  { code: "ja", flag: "🇯🇵", label: "JA" },
  { code: "zh", flag: "🇨🇳", label: "ZH" },
  { code: "ko", flag: "🇰🇷", label: "KO" },
  { code: "de", flag: "🇩🇪", label: "DE" },
  { code: "fr", flag: "🇫🇷", label: "FR" },
  { code: "es", flag: "🇪🇸", label: "ES" },
  { code: "pt", flag: "🇧🇷", label: "PT" },
];

const ALL_LOCALES: Locale[] = ["en", "ja", "zh", "ko", "de", "fr", "es", "pt"];

const NAV_LABELS: Record<Locale, { gallery: string; forAgents: string; dashboard: string }> = {
  en: { gallery: "Gallery", forAgents: "For Agents", dashboard: "Dashboard" },
  ja: { gallery: "ギャラリー", forAgents: "エージェント向け", dashboard: "ダッシュボード" },
  zh: { gallery: "画廊", forAgents: "面向智能体", dashboard: "控制台" },
  ko: { gallery: "갤러리", forAgents: "에이전트용", dashboard: "대시보드" },
  de: { gallery: "Galerie", forAgents: "Für Agenten", dashboard: "Dashboard" },
  fr: { gallery: "Galerie", forAgents: "Pour les agents", dashboard: "Tableau de bord" },
  es: { gallery: "Galería", forAgents: "Para agentes", dashboard: "Panel" },
  pt: { gallery: "Galeria", forAgents: "Para agentes", dashboard: "Painel" },
};

function useLocale() {
  const [locale, setLocaleState] = useState<Locale>("en");
  useEffect(() => {
    const stored = document.cookie.match(/locale=([^;]+)/)?.[1] as Locale | undefined;
    if (stored && ALL_LOCALES.includes(stored)) setLocaleState(stored);
  }, []);
  const setLocale = (next: Locale) => {
    document.cookie = `locale=${next}; path=/; max-age=31536000; SameSite=Lax`;
    setLocaleState(next);
    window.location.reload();
  };
  return { locale, setLocale };
}

function LocaleDropdown({ locale, setLocale, className = "" }: { locale: Locale; setLocale: (l: Locale) => void; className?: string }) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const current = LOCALE_OPTIONS.find((o) => o.code === locale) ?? LOCALE_OPTIONS[0];

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  return (
    <div ref={ref} className={`relative ${className}`}>
      <button
        onClick={() => setOpen((v) => !v)}
        className="flex items-center gap-1 text-xs text-zinc-400 hover:text-zinc-200 transition-colors px-2 py-1 rounded-md hover:bg-zinc-800/60"
        title="Switch language"
      >
        <span>{current.flag}</span>
        <span className="font-medium">{current.label}</span>
        <svg className="w-3 h-3 text-zinc-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>
      {open && (
        <div className="absolute right-0 top-full mt-1 z-50 bg-zinc-900 border border-zinc-700 rounded-lg shadow-xl overflow-hidden min-w-[110px]">
          {LOCALE_OPTIONS.map((opt) => (
            <button
              key={opt.code}
              onClick={() => { setLocale(opt.code); setOpen(false); }}
              className={`w-full flex items-center gap-2 px-3 py-2 text-xs hover:bg-zinc-800 transition-colors ${locale === opt.code ? "text-white font-semibold" : "text-zinc-400"}`}
            >
              <span>{opt.flag}</span>
              <span>{opt.label}</span>
              {locale === opt.code && (
                <svg className="w-3 h-3 text-[#E8404A] ml-auto" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

export default function Header() {
  const [menuOpen, setMenuOpen] = useState(false);
  const { locale, setLocale } = useLocale();
  const labels = NAV_LABELS[locale];

  const navLinks = [
    { href: "/", label: labels.gallery },
    { href: "/for-agents", label: labels.forAgents },
  ];

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
              {link.label}
            </Link>
          ))}
        </nav>

        {/* Desktop right: locale dropdown + CTA */}
        <div className="hidden sm:flex items-center gap-3 flex-shrink-0">
          <LocaleDropdown locale={locale} setLocale={setLocale} />
          <Link
            href="/dashboard"
            className="text-sm bg-[#E8404A] hover:bg-[#d63840] text-white px-4 py-1.5 rounded-lg transition-colors font-medium"
          >
            {labels.dashboard}
          </Link>
        </div>

        {/* Mobile: hamburger */}
        <div className="sm:hidden ml-auto flex items-center gap-2">
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
              {link.label}
            </Link>
          ))}
          <Link
            href="/dashboard"
            className="mt-3 text-center text-sm bg-[#E8404A] hover:bg-[#d63840] text-white px-4 py-2.5 rounded-lg transition-colors font-medium"
            onClick={() => setMenuOpen(false)}
          >
            {labels.dashboard}
          </Link>
          {/* Language selector in mobile menu */}
          <div className="mt-3 mb-1 pt-3 border-t border-zinc-800/50">
            <p className="text-xs text-zinc-600 mb-2 uppercase tracking-wide">Language</p>
            <div className="grid grid-cols-4 gap-1.5">
              {LOCALE_OPTIONS.map((opt) => (
                <button
                  key={opt.code}
                  onClick={() => { setLocale(opt.code); setMenuOpen(false); }}
                  className={`flex flex-col items-center gap-0.5 py-2 px-1 rounded-lg text-xs transition-colors ${
                    locale === opt.code
                      ? "bg-[#E8404A]/15 text-white border border-[#E8404A]/40"
                      : "bg-zinc-800/50 text-zinc-400 hover:bg-zinc-800 border border-transparent"
                  }`}
                >
                  <span className="text-base">{opt.flag}</span>
                  <span className="font-medium">{opt.label}</span>
                </button>
              ))}
            </div>
          </div>
        </nav>
      )}
    </header>
  );
}
