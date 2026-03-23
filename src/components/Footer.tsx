"use client";

import { useEffect, useState } from "react";

type Locale = "en" | "ja" | "zh" | "ko" | "de" | "fr" | "es" | "pt";

const FOOTER_LABELS: Record<Locale, { builtBy: string; coffee: string }> = {
  en: { builtBy: "Built by Shin0221 with AI family", coffee: "☕ Buy me a coffee" },
  ja: { builtBy: "Shin0221 と AI ファミリーが制作", coffee: "☕ コーヒーをおごる" },
  zh: { builtBy: "由 Shin0221 与 AI 家族共同构建", coffee: "☕ 请我喝咖啡" },
  ko: { builtBy: "Shin0221과 AI 패밀리가 제작", coffee: "☕ 커피 사주기" },
  de: { builtBy: "Erstellt von Shin0221 mit der KI-Familie", coffee: "☕ Kauf mir einen Kaffee" },
  fr: { builtBy: "Créé par Shin0221 avec la famille IA", coffee: "☕ Offrez-moi un café" },
  es: { builtBy: "Creado por Shin0221 con la familia IA", coffee: "☕ Invítame a un café" },
  pt: { builtBy: "Criado por Shin0221 com a família IA", coffee: "☕ Me pague um café" },
};

const ALL_LOCALES: Locale[] = ["en", "ja", "zh", "ko", "de", "fr", "es", "pt"];

export default function Footer() {
  const [locale, setLocale] = useState<Locale>("en");

  useEffect(() => {
    const stored = document.cookie.match(/locale=([^;]+)/)?.[1] as Locale | undefined;
    if (stored && ALL_LOCALES.includes(stored)) setLocale(stored);
  }, []);

  const labels = FOOTER_LABELS[locale];

  return (
    <footer className="border-t border-zinc-800 mt-16 py-8">
      <div className="max-w-6xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-4">
        <p className="text-sm text-zinc-500">
          ClawSetups.dev —{" "}
          <a
            href="https://x.com/0xShin0221"
            target="_blank"
            rel="noopener noreferrer"
            className="hover:text-white transition-colors"
          >
            {labels.builtBy}
          </a>
          {" · "}
          <a
            href="https://buymeacoffee.com/shin0221"
            target="_blank"
            rel="noopener noreferrer"
            className="text-yellow-500 hover:text-yellow-400 transition-colors"
          >
            {labels.coffee}
          </a>
        </p>
        <div className="flex items-center gap-4">
          <a
            href="https://github.com/0xShin0221/claw-setups"
            target="_blank"
            rel="noopener noreferrer"
            className="text-zinc-500 hover:text-white transition-colors"
          >
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
              <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z" />
            </svg>
          </a>
          <a
            href="https://twitter.com/openclaw"
            target="_blank"
            rel="noopener noreferrer"
            className="text-zinc-500 hover:text-white transition-colors"
          >
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
              <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
            </svg>
          </a>
        </div>
      </div>
    </footer>
  );
}
