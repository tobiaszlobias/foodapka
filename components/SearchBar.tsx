"use client";
import { useState } from "react";
import type { Product } from "@/lib/food";

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
      <div className="relative flex-1">
        <span className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-5">
          <SearchIcon />
        </span>
        <input
          id="product-search"
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Hledejte třeba mléko, pečivo nebo limonádu"
          className="h-15 w-full rounded-[1.4rem] border border-emerald-100 bg-emerald-50/70 pl-14 pr-4 text-base text-zinc-900 outline-none transition placeholder:text-zinc-500 focus:border-emerald-400 focus:bg-white"
        />
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
