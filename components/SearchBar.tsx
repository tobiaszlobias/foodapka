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
  initialQuery?: string;
  isLandingPage?: boolean;
};

const DEFAULT_SUGGESTIONS = [
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
    <svg aria-hidden="true" viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="11" cy="11" r="7" />
      <path d="m20 20-3.5-3.5" />
    </svg>
  );
}

function RecipeIcon() {
  return (
    <svg aria-hidden="true" viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
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
  initialQuery = "",
  isLandingPage = false,
}: SearchBarProps) {
  const [query, setQuery] = useState(initialQuery);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const inputRef = useRef<HTMLInputElement>(null);
  const suggestionsRef = useRef<HTMLDivElement>(null);

  // Sync with initialQuery if it changes
  useEffect(() => {
    if (initialQuery) setQuery(initialQuery);
  }, [initialQuery]);

  // Load and manage suggestions
  useEffect(() => {
    const hidden = JSON.parse(localStorage.getItem("hidden_suggestions") || "[]");
    setSuggestions(DEFAULT_SUGGESTIONS.filter(s => !hidden.includes(s)));
  }, []);

  const filteredSuggestions = (query.trim()
    ? suggestions.filter((s) => s.toLowerCase().includes(query.toLowerCase()))
    : suggestions).slice(0, isLandingPage ? 3 : 10);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (suggestionsRef.current && !suggestionsRef.current.contains(e.target as Node) && inputRef.current && !inputRef.current.contains(e.target as Node)) {
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
      if (!res.ok) throw new Error("Search request failed");
      const data = await res.json();
      onResults(data.products ?? []);
    } catch (err) {
      console.error("Search fetch error:", err);
      onResults([]);
    } finally {
      onLoading(false);
    }
  }

  function selectSuggestion(suggestion: string) {
    setQuery(suggestion);
    setShowSuggestions(false);
    onSearchStart?.();
    onLoading(true);
    fetch(`/api/search?q=${encodeURIComponent(suggestion)}`)
      .then(res => {
        if (!res.ok) throw new Error("Suggestion search failed");
        return res.json();
      })
      .then(data => {
        onResults(data.products ?? []);
        onLoading(false);
      })
      .catch(err => {
        console.error("Suggestion fetch error:", err);
        onResults([]);
        onLoading(false);
      });
  }

  function removeSuggestion(e: React.MouseEvent, suggestion: string) {
    e.stopPropagation();
    const hidden = JSON.parse(localStorage.getItem("hidden_suggestions") || "[]");
    const newHidden = [...hidden, suggestion];
    localStorage.setItem("hidden_suggestions", JSON.stringify(newHidden));
    setSuggestions(prev => prev.filter(s => s !== suggestion));
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (!showSuggestions || filteredSuggestions.length === 0) return;
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setSelectedIndex((prev) => prev < filteredSuggestions.length - 1 ? prev + 1 : 0);
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setSelectedIndex((prev) => prev > 0 ? prev - 1 : filteredSuggestions.length - 1);
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
      className="relative flex w-full flex-col gap-2 rounded-3xl sm:rounded-full border border-white/50 dark:border-zinc-800 bg-white/90 dark:bg-zinc-900/90 p-2 md:p-3 shadow-[0_20px_60px_-20px_rgba(132,204,22,0.35)] dark:shadow-none backdrop-blur sm:flex-row sm:items-center z-10"
    >
      <label htmlFor="product-search" className="sr-only">Hledat produkty</label>
      
      {/* Animated Mode Toggle */}
      <div className="relative flex rounded-full bg-zinc-100 dark:bg-black/50 p-1 self-start sm:self-auto shrink-0 overflow-hidden">
        {/* Animated Background Pill */}
        <div 
          className="absolute top-1 bottom-1 left-1 bg-white dark:bg-zinc-800 rounded-full shadow-sm transition-transform duration-300 ease-out pointer-events-none"
          style={{ 
            width: "calc(50% - 4px)",
            transform: mode === "recipes" ? "translateX(100%)" : "translateX(0)"
          }}
        />
        
        <button 
          type="button" 
          onClick={() => onModeChange("search")} 
          className={`relative z-10 flex items-center gap-2 rounded-full px-3 md:px-4 py-2 text-xs md:text-sm font-bold transition-colors duration-300 ${
            mode === "search" ? "text-foodappka-700 dark:text-foodappka-400" : "text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300"
          }`}
        >
          <SearchIcon />
          <span>Hledat</span>
        </button>
        <button 
          type="button" 
          onClick={() => onModeChange("recipes")} 
          className={`relative z-10 flex items-center gap-2 rounded-full px-3 md:px-4 py-2 text-xs md:text-sm font-bold transition-colors duration-300 ${
            mode === "recipes" ? "text-foodappka-700 dark:text-foodappka-400" : "text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300"
          }`}
        >
          <RecipeIcon />
          <span>Recepty</span>
        </button>
      </div>

      {/* Search Input - only shown in search mode */}
      <div className={`flex flex-1 gap-2 transition-all duration-500 ${mode === "recipes" ? "opacity-40 pointer-events-none grayscale" : "opacity-100"}`}>
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
            className="h-11 md:h-12 w-full rounded-full border border-zinc-100 dark:border-zinc-800 bg-zinc-50/50 dark:bg-black/50 px-4 md:px-5 text-sm md:text-base text-zinc-900 dark:text-white outline-none transition placeholder:text-zinc-400 focus:border-foodappka-400"
          />
          
          {showSuggestions && filteredSuggestions.length > 0 && mode === "search" && (
            <div ref={suggestionsRef} className="absolute left-0 right-0 top-full z-[120] mt-2 overflow-hidden rounded-2xl border border-zinc-100 dark:border-zinc-800 bg-white/95 dark:bg-zinc-900/95 backdrop-blur-xl shadow-2xl shadow-black/10">
              <div className="px-4 py-2 text-[10px] font-black text-zinc-400 uppercase tracking-widest border-b border-zinc-50 dark:border-zinc-800/50">
                {query.trim() ? "Návrhy" : "Populární hledání"}
              </div>
              <ul className="py-1">
                {filteredSuggestions.map((suggestion, index) => (
                  <li key={suggestion}>
                    <div onClick={() => selectSuggestion(suggestion)} className={`flex w-full items-center justify-between gap-3 px-4 py-3 text-left transition-colors group cursor-pointer ${index === selectedIndex ? "bg-foodappka-50 dark:bg-zinc-800 text-foodappka-700 dark:text-foodappka-400" : "text-zinc-700 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-zinc-800/50"}`} role="button" tabIndex={0}>
                      <div className="flex items-center gap-3 min-w-0">
                        <span className="material-symbols-outlined text-base text-zinc-400">{query.trim() ? "search" : "trending_up"}</span>
                        <span className="text-sm font-bold truncate">{suggestion}</span>
                      </div>
                      <button type="button" onClick={(e) => removeSuggestion(e, suggestion)} className="opacity-0 group-hover:opacity-100 p-1 hover:bg-zinc-200 dark:hover:bg-zinc-700 rounded-full transition-all flex items-center justify-center" aria-label="Odstranit návrh">
                        <span className="material-symbols-outlined text-sm leading-none">close</span>
                      </button>
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
        <button type="submit" className="h-11 md:h-12 rounded-full bg-foodappka-500 hover:bg-foodappka-600 px-4 md:px-6 text-sm font-black text-white transition-all shadow-md active:scale-95 shrink-0">
          Hledat
        </button>
      </div>
    </form>
  );
}
