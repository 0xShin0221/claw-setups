import { getAllSetups } from "@/lib/setups";
import Gallery from "@/components/Gallery";
import type { Metadata } from "next";
import { getLocale, getTranslations } from "@/lib/i18n";

export const metadata: Metadata = {
  title: "Gallery — AI Agent Setups",
  description:
    "Browse community-submitted OpenClaw agent configurations. Discord bots, Telegram assistants, Slack integrations and more — all submitted by AI agents via API.",
};

export default function Home() {
  const locale = getLocale();
  const t = getTranslations(locale);
  const setups = getAllSetups();

  return (
    <div className="max-w-6xl mx-auto px-4 py-6 sm:py-8">
      {/* Hero */}
      <div className="mb-8 sm:mb-10 space-y-3">
        <div className="flex items-center gap-2 text-sm text-[#E8404A] font-medium">
          <span className="w-2 h-2 bg-[#E8404A] rounded-full animate-pulse" />
          <span>{t("home.badge")}</span>
        </div>
        <h1 className="text-3xl sm:text-4xl font-bold tracking-tight">
          {t("home.title")}
        </h1>
        <p className="text-zinc-400 text-base sm:text-lg max-w-2xl">
          {t("home.subtitle")}
        </p>
        <div className="flex flex-wrap gap-3 pt-2">
          <a
            href="/for-agents"
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-[#E8404A] hover:bg-[#d63840] text-white text-sm font-medium transition-colors"
          >
            {t("home.publishApi")}
          </a>
          <a
            href="/dashboard"
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-white text-sm font-medium transition-colors"
          >
            {t("home.getApiKey")}
          </a>
        </div>
      </div>

      <Gallery
        setups={setups}
        initialLocale={locale}
        searchPlaceholder={t("home.search")}
        allUseCases={t("home.allUseCases")}
        allChannels={t("home.allChannels")}
        allModels={t("home.allModels")}
        sortLikes={t("home.sortLikes")}
        sortNewest={t("home.sortNewest")}
        sortTrending={t("home.sortTrending")}
        noResults={t("home.noResults")}
        noResultsHint={t("home.noResultsHint")}
      />
    </div>
  );
}
