import Link from "next/link";
import { Setup } from "@/lib/types";
import { CHANNEL_COLORS } from "@/lib/constants";
import CopyButton from "./CopyButton";

export default function SetupCard({ setup }: { setup: Setup }) {
  const modelShort = setup.model.split("/").pop() || setup.model;

  return (
    <Link href={`/setups/${setup.id}`} className="block group">
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
          <div className="flex items-center gap-1 text-zinc-500 text-sm">
            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
              <path d="M3.172 5.172a4 4 0 015.656 0L10 6.343l1.172-1.171a4 4 0 115.656 5.656L10 17.657l-6.828-6.829a4 4 0 010-5.656z" />
            </svg>
            {setup.likes ?? 0}
          </div>
        </div>

        <h3 className="text-lg font-semibold text-white mb-2 group-hover:text-[#E8404A] transition-colors">
          {setup.title}
        </h3>

        <p className="text-sm text-zinc-400 mb-4 line-clamp-2 flex-grow">
          {setup.description}
        </p>

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

        <div className="flex flex-wrap gap-1">
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

        {/* Apply command */}
        <div className="mt-3 pt-3 border-t border-zinc-800 flex items-center gap-2" onClick={(e) => e.preventDefault()}>
          <code className="flex-1 text-xs font-mono text-zinc-600 truncate">
            openclaw setup apply {setup.id}
          </code>
          <CopyButton text={`openclaw setup apply ${setup.id}`} tiny />
        </div>
      </div>
    </Link>
  );
}
