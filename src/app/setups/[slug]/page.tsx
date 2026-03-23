import { notFound } from "next/navigation";
import Link from "next/link";
import { getAllSlugs, getSetupBySlug } from "@/lib/setups";
import { CHANNEL_COLORS } from "@/lib/constants";
import CopyButton from "@/components/CopyButton";

export function generateMetadata({ params }: { params: { slug: string } }) {
  const setup = getSetupBySlug(params.slug);
  if (!setup) return {};
  return {
    title: `${setup.title} | ClawSetups.dev`,
    description: setup.description,
  };
}

export function generateStaticParams() {
  return getAllSlugs().map((slug) => ({ slug }));
}

export default function SetupDetail({ params }: { params: { slug: string } }) {
  const setup = getSetupBySlug(params.slug);
  if (!setup) notFound();

  const modelShort = setup.model.split("/").pop() || setup.model;
  const configJson = JSON.stringify(setup.config, null, 2);

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <Link
        href="/"
        className="text-sm text-zinc-500 hover:text-white transition-colors mb-6 inline-flex items-center gap-1"
      >
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
        </svg>
        Back to Gallery
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
            <h2 className="text-lg font-semibold">Configuration</h2>
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
            <h2 className="text-lg font-semibold mb-3">Workspace Files</h2>
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
        <div className="rounded-xl border border-[#E8404A]/30 bg-[#E8404A]/5 p-6 space-y-4">
          <div>
            <h2 className="text-lg font-semibold text-white">Apply this setup</h2>
            <p className="text-sm text-zinc-400 mt-1">
              Use this configuration in your OpenClaw workspace in one command.
            </p>
          </div>

          {/* CLI command */}
          <div className="space-y-2">
            <p className="text-xs text-zinc-500 uppercase tracking-wide font-medium">OpenClaw CLI</p>
            <div className="flex items-center gap-2 bg-zinc-900 rounded-lg border border-zinc-800 px-4 py-3">
              <code className="flex-1 text-sm font-mono text-[#E8404A]">
                openclaw setup apply {setup.id}
              </code>
              <CopyButton text={`openclaw setup apply ${setup.id}`} />
            </div>
            <p className="text-xs text-zinc-600">
              Downloads SOUL.md, AGENTS.md and config to your current workspace.
            </p>
          </div>

          {/* Or tell your agent */}
          <div className="space-y-2">
            <p className="text-xs text-zinc-500 uppercase tracking-wide font-medium">Or tell your agent</p>
            <div className="flex items-center gap-2 bg-zinc-900 rounded-lg border border-zinc-800 px-4 py-3">
              <code className="flex-1 text-sm font-mono text-zinc-300 break-all">
                Apply the &ldquo;{setup.title}&rdquo; setup from claw-setups.vercel.app/{setup.id}
              </code>
              <CopyButton text={`Apply the "${setup.title}" setup from claw-setups.vercel.app/${setup.id}`} />
            </div>
          </div>
        </div>

        {/* Fork */}
        <div className="flex gap-3 mt-4">
          <Link
            href="/dashboard"
            className="bg-zinc-800 hover:bg-zinc-700 text-white px-4 py-2 rounded-lg transition-colors text-sm font-medium"
          >
            Publish your own setup →
          </Link>
        </div>
      </div>
    </div>
  );
}
