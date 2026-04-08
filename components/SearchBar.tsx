"use client";
import { useState, useRef, useEffect } from "react";
import type { Product } from "@/lib/food";

type AppMode = "search" | "recipes";

type SearchBarProps = {
  onResults: (products: Product[]) => void;
  onLoading: (loading: boolean) => void;
  onSearchStart?: () => void;
  mode: AppMode;
  onModeChange: (mode: AppMode) => void;
};

const POPULAR_SEARCHES = [
  "mléko",
  "máslo", 
  "chleba",
  "vejce",
  "kuřecí prsa",
  "banány",
  "jogurt",
  "sýr",
];

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
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const inputRef = useRef<HTMLInputElement>(null);
  const suggestionsRef = useRef<HTMLDivElement>(null);

  const filteredSuggestions = query.trim()
    ? POPULAR_SEARCHES.filter((s) =>
        s.toLowerCase().includes(query.toLowerCase())
      )
    : POPULAR_SEARCHES;

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (
        suggestionsRef.current &&
        !suggestionsRef.current.contains(e.target as Node) &&
        inputRef.current &&
        !inputRef.current.contains(e.target as Node)
      ) {
        setShowSuggestions(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  async function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    if (!query.trim()) return;
    setShowSuggestions(false);
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

  function selectSuggestion(suggestion: string) {
    setQuery(suggestion);
    setShowSuggestions(false);
    inputRef.current?.focus();
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (!showSuggestions || filteredSuggestions.length === 0) return;

    if (e.key === "ArrowDown") {
      e.preventDefault();
      setSelectedIndex((prev) =>
        prev < filteredSuggestions.length - 1 ? prev + 1 : 0
      );
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setSelectedIndex((prev) =>
        prev > 0 ? prev - 1 : filteredSuggestions.length - 1
      );
    } else if (e.key === "Enter" && selectedIndex >= 0) {
      e.preventDefault();
      selectSuggestion(filteredSuggestions[selectedIndex]);
    } else if (e.key === "Escape") {
      setShowSuggestions(false);
    }
  }

  return (
    <form
      onSubmit={handleSearch}
      className="flex w-full flex-col gap-2 rounded-2xl md:rounded-full border border-white/50 dark:border-zinc-800 bg-white/90 dark:bg-zinc-900/90 p-2 md:p-3 shadow-[0_20px_60px_-20px_rgba(132,204,22,0.35)] dark:shadow-none backdrop-blur sm:flex-row sm:items-center"
    >
      <label htmlFor="product-search" className="sr-only">
        Hledat produkty
      </label>
      
      {/* Mode Toggle */}
      <div className="flex rounded-full bg-foodapka-50 dark:bg-black/50 p-1 self-start sm:self-auto">
        <button
          type="button"
          onClick={() => onModeChange("search")}
          className={`flex items-center gap-2 rounded-full px-3 md:px-4 py-2 text-xs md:text-sm font-medium transition-all ${
            mode === "search"
              ? "bg-white dark:bg-zinc-800 text-foodapka-700 dark:text-foodapka-400 shadow-sm"
              : "text-zinc-500 hover:text-foodapka-700"
          }`}
        >
          <SearchIcon />
          <span>Hledat</span>
        </button>
        <button
          type="button"
          onClick={() => onModeChange("recipes")}
          className={`flex items-center gap-2 rounded-full px-3 md:px-4 py-2 text-xs md:text-sm font-medium transition-all ${
            mode === "recipes"
              ? "bg-white dark:bg-zinc-800 text-foodapka-700 dark:text-foodapka-400 shadow-sm"
              : "text-zinc-500 hover:text-foodapka-700"
          }`}
        >
          <RecipeIcon />
          <span>Recepty</span>
        </button>
      </div>

      {/* Search Input - only shown in search mode */}
      {mode === "search" && (
        <div className="flex flex-1 gap-2">
          <div className="relative flex-1">
            <input
              ref={inputRef}
              id="product-search"
              type="text"
              value={query}
              onChange={(e) => {
                setQuery(e.target.value);
                setSelectedIndex(-1);
              }}
              onFocus={() => setShowSuggestions(true)}
              onKeyDown={handleKeyDown}
              placeholder="Co chcete nakoupit?"
              autoComplete="off"
              className="h-11 md:h-12 w-full rounded-xl md:rounded-full border border-foodapka-100 dark:border-zinc-800 bg-foodapka-50/70 dark:bg-black/50 px-4 md:px-5 text-sm md:text-base text-zinc-900 dark:text-white outline-none transition placeholder:text-zinc-500 focus:border-foodapka-400"
            />
            
            {/* Custom Suggestions Dropdown */}
            {showSuggestions && filteredSuggestions.length > 0 && (
              <div
                ref={suggestionsRef}
                className="absolute left-0 right-0 top-full z-50 mt-2 overflow-hidden rounded-xl border border-foodapka-100 dark:border-zinc-800 bg-white dark:bg-zinc-900 shadow-lg"
              >
                <ul className="py-1">
                  {filteredSuggestions.map((suggestion, index) => (
                    <li key={suggestion}>
                      <button
                        type="button"
                        onClick={() => selectSuggestion(suggestion)}
                        className={`flex w-full items-center gap-3 px-4 py-2.5 text-left transition-colors ${
                          index === selectedIndex
                            ? "bg-foodapka-50 dark:bg-zinc-800 text-foodapka-700"
                            : "text-zinc-700 dark:text-zinc-300 hover:bg-foodapka-50/50"
                        }`}
                      >
                        <span className="material-symbols-outlined text-base text-foodapka-400">
                          {query.trim() ? "search" : "trending_up"}
                        </span>
                        <span className="text-sm font-medium">{suggestion}</span>
                      </button>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
          <button
            type="submit"
            className="h-11 md:h-12 rounded-xl md:rounded-full bg-foodapka-500 hover:bg-foodapka-600 px-4 md:px-6 text-sm font-bold text-white transition-all shadow-md active:scale-95"
          >
            Hledat
          </button>
        </div>
      )}
    </form>
  );
}
