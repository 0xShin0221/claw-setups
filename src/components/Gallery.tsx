"use client";

import { useState, useMemo } from "react";
import { Setup } from "@/lib/types";
import SetupCard from "./SetupCard";
import SearchAndFilter from "./SearchAndFilter";

interface GalleryProps {
  setups: Setup[];
  initialLocale?: string;
  searchPlaceholder?: string;
  allUseCases?: string;
  allChannels?: string;
  allModels?: string;
  allLanguages?: string;
  sortLikes?: string;
  sortNewest?: string;
  sortTrending?: string;
  noResults?: string;
  noResultsHint?: string;
}

export default function Gallery({
  setups,
  initialLocale = "en",
  searchPlaceholder = "Search setups...",
  allUseCases = "All use cases",
  allChannels = "All channels",
  allModels = "All models",
  allLanguages = "All languages",
  sortLikes = "Most liked",
  sortNewest = "Newest",
  sortTrending = "Trending",
  noResults = "No setups found.",
  noResultsHint = "Try adjusting your filters",
}: GalleryProps) {
  const [search, setSearch] = useState("");
  const [channelFilter, setChannelFilter] = useState("");
  const [useCaseFilter, setUseCaseFilter] = useState("");
  const [modelFilter, setModelFilter] = useState("");
  // Auto-apply locale as language filter (non-English locales)
  const [languageFilter, setLanguageFilter] = useState(
    initialLocale !== "en" ? initialLocale : ""
  );
  const [sort, setSort] = useState("likes");

  const filtered = useMemo(() => {
    let result = [...setups];

    if (search) {
      const q = search.toLowerCase();
      result = result.filter(
        (s) =>
          s.title.toLowerCase().includes(q) ||
          s.description.toLowerCase().includes(q) ||
          s.skills.some((sk) => sk.toLowerCase().includes(q)) ||
          s.author.name.toLowerCase().includes(q)
      );
    }

    if (channelFilter) {
      result = result.filter((s) => s.channels.includes(channelFilter));
    }

    if (useCaseFilter) {
      result = result.filter((s) => s.useCase === useCaseFilter);
    }

    if (modelFilter) {
      result = result.filter((s) => s.model === modelFilter);
    }

    if (languageFilter) {
      result = result.filter((s) =>
        !s.languages || s.languages.length === 0 || s.languages.includes(languageFilter)
      );
    }

    if (sort === "likes") {
      result.sort((a, b) => (b.likes ?? 0) - (a.likes ?? 0));
    } else if (sort === "newest") {
      result.sort(
        (a, b) =>
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      );
    } else if (sort === "trending") {
      // Trending = likes weighted by recency
      const now = Date.now();
      result.sort((a, b) => {
        const ageA =
          (now - new Date(a.createdAt).getTime()) / (1000 * 60 * 60 * 24);
        const ageB =
          (now - new Date(b.createdAt).getTime()) / (1000 * 60 * 60 * 24);
        return (b.likes ?? 0) / (ageB + 1) - (a.likes ?? 0) / (ageA + 1);
      });
    }

    return result;
  }, [setups, search, channelFilter, useCaseFilter, modelFilter, sort, languageFilter]);

  return (
    <div>
      <SearchAndFilter
        search={search}
        onSearchChange={setSearch}
        channelFilter={channelFilter}
        onChannelChange={setChannelFilter}
        useCaseFilter={useCaseFilter}
        onUseCaseChange={setUseCaseFilter}
        modelFilter={modelFilter}
        onModelChange={setModelFilter}
        languageFilter={languageFilter}
        onLanguageChange={setLanguageFilter}
        sort={sort}
        onSortChange={setSort}
        searchPlaceholder={searchPlaceholder}
        allUseCases={allUseCases}
        allChannels={allChannels}
        allModels={allModels}
        allLanguages={allLanguages}
        sortLikes={sortLikes}
        sortNewest={sortNewest}
        sortTrending={sortTrending}
      />

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mt-6">
        {filtered.map((setup) => (
          <SetupCard key={setup.id} setup={setup} />
        ))}
      </div>

      {filtered.length === 0 && (
        <div className="text-center py-16 text-zinc-500">
          <p className="text-lg">{noResults}</p>
          <p className="text-sm mt-1">{noResultsHint}</p>
          <button
            onClick={() => {
              setSearch("");
              setChannelFilter("");
              setUseCaseFilter("");
              setModelFilter("");
              setLanguageFilter("");
              setSort("likes");
            }}
            className="mt-4 px-4 py-2 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-sm font-medium transition-colors"
          >
            Clear all filters
          </button>
        </div>
      )}
    </div>
  );
}
