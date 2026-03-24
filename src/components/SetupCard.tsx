"use client";

import Link from "next/link";
import { useState, useEffect } from "react";
import { Setup } from "@/lib/types";
import { CHANNEL_COLORS } from "@/lib/constants";

function hasPlaceholders(setup: Setup): boolean {
  if (!setup.workspaceFiles) return false;
  return Object.values(setup.workspaceFiles).some((v) => v.includes("{{"));
}

function buildAgentPrompt(setup: Setup): string {
  if (hasPlaceholders(setup)) {
    return `Apply the "${setup.title}" setup from claw-setups.vercel.app/setups/${setup.id}.\nRead my SOUL.md and AGENTS.md to infer the template variables.\nOnly ask about values you cannot determine.`;
  }
  return `Apply the "${setup.title}" setup from claw-setups.vercel.app/setups/${setup.id}.`;
}

export default function SetupCard({ setup }: { setup: Setup }) {
  const [copied, setCopied] = useState(false);
  const [liked, setLiked] = useState(false);
  const [likeCount, setLikeCount] = useState(setup.likes ?? 0);
  const [liking, setLiking] = useState(false);
  const modelShort = setup.model.split("/").pop() || setup.model;

  // Fetch like state on mount
  useEffect(() => {
    fetch(`/api/setups/${setup.id}/like`)
      .then((r) => r.json())
      .then((d) => {
        setLikeCount(d.count);
        setLiked(d.liked);
      })
      .catch(() => {});
  }, [setup.id]);

  async function handleLike(e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();
    if (liking) return;
    setLiking(true);
    // Optimistic update
    setLiked((prev) => !prev);
    setLikeCount((prev) => (liked ? prev - 1 : prev + 1));
    try {
      const res = await fetch(`/api/setups/${setup.id}/like`, {
        method: "POST",
      });
      const data = await res.json();
      if (data.ok) {
        setLiked(data.liked);
        setLikeCount(data.count);
      }
    } catch {
      // Revert optimistic update on error
      setLiked((prev) => !prev);
      setLikeCount((prev) => (liked ? prev + 1 : prev - 1));
    }
    setLiking(false);
  }

  async function handleCopy(e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();
    const text = buildAgentPrompt(setup);
    try {
      await navigator.clipboard.writeText(text);
    } catch {
      const el = document.createElement("textarea");
      el.value = text;
      document.body.appendChild(el);
      el.select();
      document.execCommand("copy");
      document.body.removeChild(el);
    }
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-5 hover:border-[#E8404A]/50 transition-all duration-200 hover:shadow-lg hover:shadow-[#E8404A]/5 h-full flex flex-col">
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-2">
          <img
            src={`https://github.com/${setup.author.github}.png`}
            alt={setup.author.name}
            className="w-8 h-8 rounded-full bg-zinc-700"
          />
          <span className="text-sm text-zinc-400">{setup.author.name}</span>
        </div>
        <button
          onClick={handleLike}
          disabled={liking}
          className={`flex items-center gap-1 text-sm transition-colors ${
            liked ? "text-[#E8404A]" : "text-zinc-500 hover:text-[#E8404A]"
          }`}
          title={liked ? "Unlike" : "Like"}
        >
          <svg
            className="w-4 h-4 transition-transform active:scale-125"
            fill={liked ? "currentColor" : "none"}
            stroke="currentColor"
            strokeWidth={liked ? 0 : 2}
            viewBox="0 0 20 20"
          >
            <path d="M3.172 5.172a4 4 0 015.656 0L10 6.343l1.172-1.171a4 4 0 115.656 5.656L10 17.657l-6.828-6.829a4 4 0 010-5.656z" />
          </svg>
          {likeCount}
        </button>
      </div>

      <Link href={`/setups/${setup.id}`} className="block group flex-grow">
        <h3 className="text-lg font-semibold text-white mb-2 group-hover:text-[#E8404A] transition-colors">
          {setup.title}
        </h3>

        <p className="text-sm text-zinc-400 mb-4 line-clamp-2">
          {setup.description}
        </p>
      </Link>

      <div className="flex flex-wrap gap-1.5 mb-3">
        {setup.channels.map((ch) => (
          <span
            key={ch}
            className={`text-xs px-2 py-0.5 rounded-full border ${CHANNEL_COLORS[ch] || "bg-zinc-700/50 text-zinc-400 border-zinc-600"}`}
          >
            {ch}
          </span>
        ))}
        <span className="text-xs px-2 py-0.5 rounded-full bg-[#E8404A]/10 text-[#E8404A] border border-[#E8404A]/20">
          {modelShort}
        </span>
      </div>

      <div className="flex flex-wrap gap-1 mb-3">
        {setup.skills.slice(0, 3).map((skill) => (
          <span
            key={skill}
            className="text-xs px-2 py-0.5 rounded bg-zinc-800 text-zinc-500"
          >
            {skill}
          </span>
        ))}
        {setup.skills.length > 3 && (
          <span className="text-xs px-2 py-0.5 rounded bg-zinc-800 text-zinc-500">
            +{setup.skills.length - 3}
          </span>
        )}
      </div>

      {/* CTAs */}
      <div className="mt-auto pt-3 border-t border-zinc-800 flex items-center gap-2">
        <button
          onClick={handleCopy}
          className="flex-1 flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#E8404A] hover:bg-[#d63840] text-white text-xs font-medium transition-colors"
        >
          {copied ? (
            <>✅ Copied!</>
          ) : (
            <>🤖 Tell your agent</>
          )}
        </button>
        <Link
          href={`/setups/${setup.id}`}
          className="px-3 py-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-xs font-medium transition-colors"
        >
          Details →
        </Link>
      </div>
    </div>
  );
}
