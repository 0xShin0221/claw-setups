"use client";

import { CHANNELS, USE_CASES, MODELS } from "@/lib/constants";

interface Props {
  search: string;
  onSearchChange: (v: string) => void;
  channelFilter: string;
  onChannelChange: (v: string) => void;
  useCaseFilter: string;
  onUseCaseChange: (v: string) => void;
  modelFilter: string;
  onModelChange: (v: string) => void;
  sort: string;
  onSortChange: (v: string) => void;
}

export default function SearchAndFilter({
  search,
  onSearchChange,
  channelFilter,
  onChannelChange,
  useCaseFilter,
  onUseCaseChange,
  modelFilter,
  onModelChange,
  sort,
  onSortChange,
}: Props) {
  return (
    <div className="space-y-4">
      <div className="relative">
        <svg
          className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-zinc-500"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
          />
        </svg>
        <input
          type="text"
          placeholder="Search setups..."
          value={search}
          onChange={(e) => onSearchChange(e.target.value)}
          className="w-full bg-zinc-900 border border-zinc-800 rounded-lg pl-10 pr-4 py-2.5 text-white placeholder-zinc-500 focus:outline-none focus:border-[#E8404A]/50 transition-colors"
        />
      </div>

      <div className="grid grid-cols-2 sm:flex sm:flex-wrap gap-2 sm:gap-3">
        <select
          value={channelFilter}
          onChange={(e) => onChannelChange(e.target.value)}
          className="bg-zinc-900 border border-zinc-800 rounded-lg px-3 py-2 text-sm text-zinc-300 focus:outline-none focus:border-[#E8404A]/50 w-full sm:w-auto"
        >
          <option value="">All Channels</option>
          {CHANNELS.map((ch) => (
            <option key={ch} value={ch}>
              {ch.charAt(0).toUpperCase() + ch.slice(1)}
            </option>
          ))}
        </select>

        <select
          value={modelFilter}
          onChange={(e) => onModelChange(e.target.value)}
          className="bg-zinc-900 border border-zinc-800 rounded-lg px-3 py-2 text-sm text-zinc-300 focus:outline-none focus:border-[#E8404A]/50 w-full sm:w-auto"
        >
          <option value="">All Models</option>
          {MODELS.map((m) => (
            <option key={m} value={m}>
              {m.split("/").pop()}
            </option>
          ))}
        </select>

        <select
          value={useCaseFilter}
          onChange={(e) => onUseCaseChange(e.target.value)}
          className="bg-zinc-900 border border-zinc-800 rounded-lg px-3 py-2 text-sm text-zinc-300 focus:outline-none focus:border-[#E8404A]/50 w-full sm:w-auto"
        >
          <option value="">All Use Cases</option>
          {USE_CASES.map((uc) => (
            <option key={uc} value={uc}>
              {uc
                .split("-")
                .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
                .join(" ")}
            </option>
          ))}
        </select>

        <select
          value={sort}
          onChange={(e) => onSortChange(e.target.value)}
          className="bg-zinc-900 border border-zinc-800 rounded-lg px-3 py-2 text-sm text-zinc-300 focus:outline-none focus:border-[#E8404A]/50 w-full sm:w-auto sm:ml-auto"
        >
          <option value="likes">Most Liked</option>
          <option value="newest">Newest</option>
          <option value="trending">Trending</option>
        </select>
      </div>
    </div>
  );
}
