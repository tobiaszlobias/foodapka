"use client";
import { useState } from "react";
import type { Product } from "@/lib/food";
import { buildAutocompleteSuggestions } from "@/lib/searchQueries";

type SearchBarProps = {
  onResults: (products: Product[]) => void;
  onLoading: (loading: boolean) => void;
  onSearchStart?: () => void;
};

function SearchIcon() {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 24 24"
      className="h-5 w-5 text-emerald-700"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <circle cx="11" cy="11" r="7" />
      <path d="m20 20-3.5-3.5" />
    </svg>
  );
}

export default function SearchBar({
  onResults,
  onLoading,
  onSearchStart,
}: SearchBarProps) {
  const [query, setQuery] = useState("");
  const [showSuggestions, setShowSuggestions] = useState(false);
  const suggestions = buildAutocompleteSuggestions(query);

  async function runSearch(searchTerm: string) {
    if (!searchTerm.trim()) return;
    onSearchStart?.();
    onLoading(true);

    try {
      const res = await fetch(`/api/search?q=${encodeURIComponent(searchTerm)}`);
      const data = await res.json();
      onResults(data.products ?? []);
    } finally {
      onLoading(false);
    }
  }

  async function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    setShowSuggestions(false);
    await runSearch(query);
  }

  async function handleSuggestionSelect(suggestion: string) {
    setQuery(suggestion);
    setShowSuggestions(false);
    await runSearch(suggestion);
  }

  return (
    <form
      onSubmit={handleSearch}
      className="flex w-full flex-col gap-3 rounded-[2rem] border border-white/50 bg-white/90 p-3 shadow-[0_20px_60px_-20px_rgba(16,185,129,0.45)] backdrop-blur sm:flex-row sm:items-center"
    >
      <label htmlFor="product-search" className="sr-only">
        Hledat produkty
      </label>
      <div className="relative flex-1">
        <span className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-5">
          <SearchIcon />
        </span>
        <input
          id="product-search"
          type="text"
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setShowSuggestions(true);
          }}
          onFocus={() => setShowSuggestions(true)}
          onBlur={() => {
            window.setTimeout(() => setShowSuggestions(false), 120);
          }}
          placeholder="Hledejte třeba mléko, pečivo nebo limonádu"
          className="h-15 w-full rounded-[1.4rem] border border-emerald-100 bg-emerald-50/70 pl-14 pr-4 text-base text-zinc-900 outline-none transition placeholder:text-zinc-500 focus:border-emerald-400 focus:bg-white"
        />
        {showSuggestions && suggestions.length > 0 && (
          <div className="absolute left-0 right-0 top-[calc(100%+0.6rem)] z-20 overflow-hidden rounded-[1.2rem] border border-emerald-100 bg-white/98 p-2 shadow-[0_18px_45px_-24px_rgba(16,185,129,0.35)] backdrop-blur">
            <p className="px-3 pb-2 pt-1 text-xs font-semibold uppercase tracking-[0.14em] text-emerald-700">
              Možná hledáte
            </p>
            <div className="grid gap-1">
              {suggestions.map((suggestion) => (
                <button
                  key={suggestion}
                  type="button"
                  onMouseDown={(event) => event.preventDefault()}
                  onClick={() => void handleSuggestionSelect(suggestion)}
                  className="rounded-[1rem] px-3 py-2 text-left text-sm font-medium text-zinc-700 transition hover:bg-emerald-50 hover:text-emerald-800"
                >
                  {suggestion}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
      <button
        type="submit"
        className="h-15 rounded-[1.4rem] bg-emerald-600 px-7 text-base font-semibold text-white transition hover:bg-emerald-700"
      >
        Hledat
      </button>
    </form>
  );
}
