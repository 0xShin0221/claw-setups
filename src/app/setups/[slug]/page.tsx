import { notFound } from "next/navigation";
import Link from "next/link";
import { getAllSlugs, getSetupBySlug } from "@/lib/setups";
import { CHANNEL_COLORS } from "@/lib/constants";
import CopyButton from "@/components/CopyButton";
import CopyAgentInstruction from "@/components/CopyAgentInstruction";
import { getLocale, getTranslations } from "@/lib/i18n";
import { DEFAULT_AGENT_INSTRUCTIONS } from "@/lib/types";

// Extract {{PLACEHOLDER}} tokens from all workspace file contents
function extractPlaceholders(workspaceFiles?: Record<string, string>): string[] {
  if (!workspaceFiles) return [];
  const all = Object.values(workspaceFiles).join("\n");
  const matches = all.match(/\{\{([A-Z_]+)\}\}/g) || [];
  const unique: string[] = [];
  const seen = new Set<string>();
  for (const m of matches) {
    const name = m.replace(/\{\{|\}\}/g, "");
    if (!seen.has(name)) { seen.add(name); unique.push(name); }
  }
  return unique;
}

const BASE_URL = process.env.BASE_URL || "https://claw-setups.vercel.app";

export function generateMetadata({ params }: { params: { slug: string } }) {
  const setup = getSetupBySlug(params.slug);
  if (!setup) return {};
  return {
    title: setup.title,
    description: setup.description,
    alternates: {
      canonical: `${BASE_URL}/setups/${params.slug}`,
    },
    openGraph: {
      title: `${setup.title} | ClawSetups.dev`,
      description: setup.description,
      url: `${BASE_URL}/setups/${params.slug}`,
      images: [{ url: `${BASE_URL}/og-image.png`, width: 1200, height: 630 }],
    },
    twitter: {
      card: "summary_large_image",
      title: `${setup.title} | ClawSetups.dev`,
      description: setup.description,
      creator: "@0xShin0221",
    },
  };
}

export function generateStaticParams() {
  return getAllSlugs().map((slug) => ({ slug }));
}

export default function SetupDetail({ params }: { params: { slug: string } }) {
  const setup = getSetupBySlug(params.slug);
  if (!setup) notFound();

  const locale = getLocale();
  const t = getTranslations(locale);

  const modelShort = setup.model.split("/").pop() || setup.model;
  const configJson = JSON.stringify(setup.config, null, 2);

  const placeholders = extractPlaceholders(setup.workspaceFiles);
  const agentInstructions = setup.agentInstructions || DEFAULT_AGENT_INSTRUCTIONS;

  // Build "Tell your agent" instruction
  const agentPrompt = placeholders.length > 0
    ? `Apply the "${setup.title}" setup from claw-setups.vercel.app/setups/${setup.id}.\nRead my SOUL.md, AGENTS.md, and USER.md to infer the template variables.\nOnly ask about values you cannot determine from context.`
    : `Apply the "${setup.title}" setup from claw-setups.vercel.app/setups/${setup.id}.\nRead my SOUL.md and AGENTS.md to fill in the details.`;

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "SoftwareSourceCode",
    name: setup.title,
    description: setup.description,
    url: `${BASE_URL}/setups/${setup.id}`,
    author: {
      "@type": "Person",
      name: setup.author.name,
      url: `https://github.com/${setup.author.github}`,
    },
    programmingLanguage: "YAML",
    runtimePlatform: "OpenClaw",
    keywords: [setup.useCase, setup.model, ...setup.channels, ...setup.skills].join(", "),
    dateCreated: setup.createdAt,
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <Link
        href="/"
        className="text-sm text-zinc-500 hover:text-white transition-colors mb-6 inline-flex items-center gap-1"
      >
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
        </svg>
        {t("setupDetail.backToGallery")}
      </Link>

      <div className="mt-4">
        <div className="flex items-start justify-between flex-wrap gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold mb-2">{setup.title}</h1>
            <div className="flex items-center gap-3 mb-4">
              <img
                src={`https://github.com/${setup.author.github}.png`}
                alt={setup.author.name}
                className="w-6 h-6 rounded-full bg-zinc-700"
              />
              <span className="text-sm text-zinc-400">{setup.author.name}</span>
              <span className="text-sm text-zinc-600">·</span>
              <span className="text-sm text-zinc-500">{setup.createdAt}</span>
            </div>
          </div>
          <div className="flex items-center gap-2 text-zinc-400">
            <svg className="w-5 h-5 text-[#E8404A]" fill="currentColor" viewBox="0 0 20 20">
              <path d="M3.172 5.172a4 4 0 015.656 0L10 6.343l1.172-1.171a4 4 0 115.656 5.656L10 17.657l-6.828-6.829a4 4 0 010-5.656z" />
            </svg>
            <span className="font-medium">{setup.likes}</span>
          </div>
        </div>

        <p className="text-zinc-300 mb-6">{setup.description}</p>

        <div className="flex flex-wrap gap-2 mb-6">
          {setup.channels.map((ch) => (
            <span
              key={ch}
              className={`text-sm px-3 py-1 rounded-full border ${CHANNEL_COLORS[ch] || "bg-zinc-700/50 text-zinc-400 border-zinc-600"}`}
            >
              {ch}
            </span>
          ))}
          <span className="text-sm px-3 py-1 rounded-full bg-[#E8404A]/10 text-[#E8404A] border border-[#E8404A]/20">
            {modelShort}
          </span>
          <span className="text-sm px-3 py-1 rounded-full bg-zinc-800 text-zinc-400 border border-zinc-700">
            {setup.useCase.split("-").map((w) => w.charAt(0).toUpperCase() + w.slice(1)).join(" ")}
          </span>
        </div>

        <div className="flex flex-wrap gap-1.5 mb-8">
          {setup.skills.map((skill) => (
            <span
              key={skill}
              className="text-xs px-2 py-1 rounded bg-zinc-800 text-zinc-400"
            >
              {skill}
            </span>
          ))}
        </div>

        {/* Config */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-lg font-semibold">{t("setupDetail.configuration")}</h2>
            <CopyButton text={configJson} />
          </div>
          <div className="bg-zinc-900 border border-zinc-800 rounded-xl overflow-hidden">
            <pre className="p-4 text-sm text-zinc-300 overflow-x-auto">
              <code>{configJson}</code>
            </pre>
          </div>
        </div>

        {/* Workspace Files */}
        {setup.workspaceFiles && Object.keys(setup.workspaceFiles).length > 0 && (
          <div className="mb-8">
            <h2 className="text-lg font-semibold mb-3">{t("setupDetail.workspaceFiles")}</h2>
            <div className="space-y-4">
              {Object.entries(setup.workspaceFiles).map(([name, content]) => (
                <div key={name} className="bg-zinc-900 border border-zinc-800 rounded-xl overflow-hidden">
                  <div className="px-4 py-2 border-b border-zinc-800 bg-zinc-800/50">
                    <span className="text-sm font-mono text-zinc-400">{name}</span>
                  </div>
                  <pre className="p-4 text-sm text-zinc-300 overflow-x-auto whitespace-pre-wrap">
                    <code>{content}</code>
                  </pre>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Apply this setup */}
        <div className="rounded-xl border border-[#E8404A]/30 bg-[#E8404A]/5 p-6 space-y-5">
          <div>
            <h2 className="text-lg font-semibold text-white">{t("setupDetail.applyTitle")}</h2>
            <p className="text-sm text-zinc-400 mt-1">
              {t("setupDetail.applySubtitle")}
            </p>
          </div>

          {/* Workspace files download */}
          {setup.workspaceFiles && Object.keys(setup.workspaceFiles).filter(k => setup.workspaceFiles![k]).length > 0 && (
            <div className="space-y-2">
              <p className="text-xs text-zinc-500 uppercase tracking-wide font-medium">{t("setupDetail.workspaceFiles")}</p>
              <div className="grid gap-2 sm:grid-cols-2">
                {Object.entries(setup.workspaceFiles).filter(([, v]) => v).map(([name, content]) => (
                  <div key={name} className="flex items-center justify-between gap-2 bg-zinc-900 border border-zinc-800 rounded-lg px-3 py-2.5">
                    <div className="flex items-center gap-2 min-w-0">
                      <svg className="w-4 h-4 text-zinc-500 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                      <span className="text-sm font-mono text-zinc-300 truncate">{name}</span>
                    </div>
                    <div className="flex gap-1 flex-shrink-0">
                      <CopyButton text={content} tiny />
                      <a
                        href={`data:text/plain;charset=utf-8,${encodeURIComponent(content)}`}
                        download={name}
                        className="p-1 text-zinc-600 hover:text-zinc-300 transition-colors"
                        title={`Download ${name}`}
                      >
                        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                        </svg>
                      </a>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Template Variables */}
          {placeholders.length > 0 && (
            <div className="space-y-2">
              <p className="text-xs text-zinc-500 uppercase tracking-wide font-medium">
                Template variables <span className="text-zinc-700 normal-case font-normal">— auto-filled from your workspace</span>
              </p>
              <div className="flex flex-wrap gap-2">
                {placeholders.map((p) => (
                  <span key={p} className="text-xs font-mono px-2 py-1 rounded bg-zinc-900 border border-zinc-800 text-[#E8404A]">
                    {`{{${p}}}`}
                  </span>
                ))}
              </div>
              <p className="text-xs text-zinc-600">
                Your agent reads <code className="text-zinc-500">SOUL.md</code> / <code className="text-zinc-500">AGENTS.md</code> / <code className="text-zinc-500">USER.md</code> and infers these automatically. Only asks for what it cannot determine.
              </p>
            </div>
          )}

          {/* Tell your agent — primary CTA */}
          <div className="space-y-3">
            <CopyAgentInstruction text={agentPrompt} />
            <div className="bg-zinc-900 rounded-lg border border-zinc-800 px-3 py-2.5">
              <code className="text-xs sm:text-sm font-mono text-zinc-500 break-words leading-relaxed whitespace-pre-wrap">
                {agentPrompt}
              </code>
            </div>
          </div>

          {/* Agent instructions (collapsed) */}
          <details>
            <summary className="text-xs text-zinc-600 hover:text-zinc-400 cursor-pointer select-none">
              View agent instructions ↓
            </summary>
            <pre className="mt-2 text-xs text-zinc-500 bg-zinc-950 rounded-lg p-3 border border-zinc-800 whitespace-pre-wrap leading-relaxed">
              {agentInstructions}
            </pre>
          </details>

          {/* One-line install */}
          <div className="space-y-2">
            <p className="text-xs text-zinc-500 uppercase tracking-wide font-medium">One-line install</p>
            <div className="flex items-center gap-2 bg-zinc-900 rounded-lg border border-zinc-800 px-3 py-2.5">
              <code className="flex-1 text-xs font-mono text-zinc-300 break-all">
                curl -fsSL https://claw-setups.vercel.app/api/setups/{setup.id}/install.sh | bash
              </code>
              <CopyButton text={`curl -fsSL https://claw-setups.vercel.app/api/setups/${setup.id}/install.sh | bash`} tiny />
            </div>
            <p className="text-xs text-zinc-600">Creates workspace, registers agent, restarts gateway automatically.</p>
          </div>

          {/* Future CLI */}
          <div className="flex items-center gap-2 text-xs text-zinc-600">
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 9l3 3-3 3m5 0h3M5 20h14a2 2 0 002-2V6a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
            <span>{t("setupDetail.cliComing")} <code className="text-zinc-500">openclaw setup apply {setup.id}</code></span>
          </div>
        </div>

        {/* Fork */}
        <div className="flex gap-3 mt-4">
          <Link
            href="/dashboard"
            className="bg-zinc-800 hover:bg-zinc-700 text-white px-4 py-2 rounded-lg transition-colors text-sm font-medium"
          >
            {t("setupDetail.publishYourOwn")}
          </Link>
        </div>
      </div>
    </div>
  );
}
