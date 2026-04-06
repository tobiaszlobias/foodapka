"use client";
import { useState } from "react";
import type { Product } from "@/lib/food";

type AppMode = "search" | "recipes";

type SearchBarProps = {
  onResults: (products: Product[]) => void;
  onLoading: (loading: boolean) => void;
  onSearchStart?: () => void;
  mode: AppMode;
  onModeChange: (mode: AppMode) => void;
};

function SearchIcon() {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 24 24"
      className="h-5 w-5"
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

function RecipeIcon() {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 24 24"
      className="h-5 w-5"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M6 13.87A4 4 0 0 1 7.41 6a5.11 5.11 0 0 1 1.05-1.54 5 5 0 0 1 7.08 0A5.11 5.11 0 0 1 16.59 6 4 4 0 0 1 18 13.87V21H6Z" />
      <line x1="6" x2="18" y1="17" y2="17" />
    </svg>
  );
}

export default function SearchBar({
  onResults,
  onLoading,
  onSearchStart,
  mode,
  onModeChange,
}: SearchBarProps) {
  const [query, setQuery] = useState("");

  async function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    if (!query.trim()) return;
    onSearchStart?.();
    onLoading(true);

    try {
      const res = await fetch(`/api/search?q=${encodeURIComponent(query)}`);
      const data = await res.json();
      onResults(data.products ?? []);
    } finally {
      onLoading(false);
    }
  }

  return (
    <form
      onSubmit={handleSearch}
      className="flex w-full flex-col gap-3 rounded-[2rem] border border-white/50 bg-white/90 p-3 shadow-[0_20px_60px_-20px_rgba(16,185,129,0.45)] backdrop-blur sm:flex-row sm:items-center"
    >
      <label htmlFor="product-search" className="sr-only">
        Hledat produkty
      </label>
      
      {/* Mode Toggle */}
      <div className="flex rounded-[1.2rem] bg-emerald-50 p-1">
        <button
          type="button"
          onClick={() => onModeChange("search")}
          className={`flex items-center gap-2 rounded-[1rem] px-4 py-2.5 text-sm font-medium transition-all ${
            mode === "search"
              ? "bg-white text-emerald-700 shadow-sm"
              : "text-emerald-600 hover:text-emerald-700"
          }`}
        >
          <SearchIcon />
          <span className="hidden sm:inline">Hledat</span>
        </button>
        <button
          type="button"
          onClick={() => onModeChange("recipes")}
          className={`flex items-center gap-2 rounded-[1rem] px-4 py-2.5 text-sm font-medium transition-all ${
            mode === "recipes"
              ? "bg-white text-emerald-700 shadow-sm"
              : "text-emerald-600 hover:text-emerald-700"
          }`}
        >
          <RecipeIcon />
          <span className="hidden sm:inline">Recepty</span>
        </button>
      </div>

      {/* Search Input - only shown in search mode */}
      {mode === "search" && (
        <>
          <div className="relative flex-1">
            <input
              id="product-search"
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Hledejte třeba mléko, pečivo nebo limonádu"
              className="h-14 w-full rounded-[1.4rem] border border-emerald-100 bg-emerald-50/70 px-5 text-base text-zinc-900 outline-none transition placeholder:text-zinc-500 focus:border-emerald-400 focus:bg-white"
            />
          </div>
          <button
            type="submit"
            className="h-14 rounded-[1.4rem] bg-emerald-600 px-7 text-base font-semibold text-white transition hover:bg-emerald-700"
          >
            Hledat
          </button>
        </>
      )}
    </form>
  );
}
