"use client";

import { useMemo, useRef, useState } from "react";
import Image from "next/image";
import SearchBar from "@/components/SearchBar";
import { 
  cleanProductName, 
  parsePrice, 
  sortStoresByPrice, 
  formatDiscountPercent,
  getSavings,
  type Product, 
  type Store 
} from "@/lib/food";
import { normalizeText } from "@/lib/food";
import { FOODORA_STORE_CONFIGS } from "@/data/foodoraStores";
import { StoreBrand, LoadingCards, EmptyState, SearchLoadingAnimation } from "./DashboardShared";
import { showToast } from "@/components/Toast";
import { matchIngredientPreset } from "@/lib/ingredientPresets";

type ProductSort = "relevance" | "cheapest" | "coverage";

type SearchSectionProps = {
  products: Product[];
  loading: boolean;
  hasSearched: boolean;
  selectedFilter: string[];
  setSelectedFilter: (filter: string[]) => void;
  selectedSort: ProductSort;
  setSelectedSort: (sort: ProductSort) => void;
  handleResults: (products: Product[]) => void;
  setLoading: (loading: boolean) => void;
  setHasSearched: (hasSearched: boolean) => void;
  handleModeChange: (mode: any) => void;
  initialQuery?: string;
  hideHeader?: boolean;
  favorites: { id: string }[];
  onToggleFavorite: (item: any) => void;
};

async function createWatch(query: string, targetPrice: number) {
  const res = await fetch("/api/watchdog", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ query, targetPrice }),
  });
  if (res.status === 401) {
    showToast("Pro hlídání cen se musíte přihlásit.", "info");
    return false;
  }
  if (!res.ok) {
    showToast("Nepodařilo se nastavit hlídání ceny.", "error");
    return false;
  }
  showToast("🐶 Hlídáme! Dáme vám vědět na Telegramu, až cena klesne.", "success");
  return true;
}

type WatchDialogProps = {
  defaultQuery: string;
  defaultPrice: number;
  onClose: () => void;
};

function WatchDialog({ defaultQuery, defaultPrice, onClose }: WatchDialogProps) {
  const [query, setQuery] = useState(defaultQuery);
  const [targetPrice, setTargetPrice] = useState(String(Math.floor(defaultPrice)));
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    const priceNum = Number(targetPrice.replace(",", "."));
    if (!query.trim() || !Number.isFinite(priceNum) || priceNum <= 0) {
      showToast("Zadejte platný dotaz a cenu.", "error");
      return;
    }
    setSaving(true);
    const ok = await createWatch(query.trim(), priceNum);
    setSaving(false);
    if (ok) onClose();
  };

  return (
    <div
      className="fixed inset-0 z-[200] flex items-end sm:items-center justify-center bg-black/50 backdrop-blur-sm p-0 sm:p-4"
      onClick={onClose}
    >
      <div
        className="w-full sm:max-w-sm rounded-t-[2rem] sm:rounded-[2rem] bg-white dark:bg-zinc-900 p-6 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-5">
          <h3 className="text-lg font-black text-zinc-900 dark:text-white flex items-center gap-2">
            <span className="material-symbols-outlined text-foodappka-600">trending_down</span>
            Hlídat cenu
          </h3>
          <button
            onClick={onClose}
            className="flex h-9 w-9 items-center justify-center rounded-full bg-zinc-100 dark:bg-zinc-800 text-zinc-500 hover:text-zinc-900 dark:hover:text-white transition-colors"
          >
            <span className="material-symbols-outlined text-lg">close</span>
          </button>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-bold text-zinc-700 dark:text-zinc-300 mb-2">Co hlídat</label>
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="např. trvanlivé mléko"
              className="w-full h-12 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-black px-4 text-zinc-900 dark:text-white outline-none transition focus:border-foodappka-500 focus:ring-2 focus:ring-foodappka-500/20"
            />
            <p className="mt-1.5 text-xs text-zinc-500 dark:text-zinc-400">
              Klidně upravte na obecnější pojem — budeme hlídat nejlevnější nabídku napříč obchody.
            </p>
          </div>

          <div>
            <label className="block text-sm font-bold text-zinc-700 dark:text-zinc-300 mb-2">
              Upozornit, když cena klesne pod
            </label>
            <div className="relative">
              <input
                value={targetPrice}
                onChange={(e) => setTargetPrice(e.target.value)}
                inputMode="decimal"
                placeholder="20"
                className="w-full h-12 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-black px-4 pr-12 text-zinc-900 dark:text-white outline-none transition focus:border-foodappka-500 focus:ring-2 focus:ring-foodappka-500/20"
              />
              <span className="absolute right-4 top-1/2 -translate-y-1/2 text-sm font-bold text-zinc-400">Kč</span>
            </div>
          </div>

          <button
            onClick={handleSave}
            disabled={saving}
            className="w-full h-12 rounded-full bg-foodappka-600 text-white font-black transition hover:bg-foodappka-700 shadow-lg shadow-foodappka-600/20 active:scale-95 disabled:opacity-50"
          >
            {saving ? "Ukládám…" : "Zapnout hlídání"}
          </button>
        </div>
      </div>
    </div>
  );
}

const BASE_SOURCE_FILTERS = [
  { key: "all", label: "Vše" },
];

function getStoreFilter(store: Store) {
  const n = normalizeText(store.shopName);
  if (n.includes("albert")) return { key: "chain:albert", label: "Albert" };
  if (n.includes("globus")) return { key: "chain:globus", label: "Globus" };
  if (n.includes("billa")) return { key: "chain:billa", label: "Billa" };
  if (n.includes("tesco")) return { key: "chain:tesco", label: "Tesco" };
  if (n.includes("penny")) return { key: "chain:penny", label: "Penny" };
  if (n.includes("flop")) return { key: "chain:flop", label: "FLOP TOP" };
  if (n.includes("coop")) return { key: "chain:coop", label: "Coop" };
  if (n.includes("hruska") || n.includes("hruška")) return { key: "chain:hruska", label: "Hruška" };
  if (n.includes("kosik")) return { key: "chain:kosik", label: "Košík" };
  if (n.includes("tamda")) return { key: "chain:tamda", label: "TAMDA" };
  if (n.includes("bene")) return { key: "chain:bene", label: "Bene" };
  if (n.includes("cba")) return { key: "chain:cba", label: "CBA" };
  if (n.includes("ratio")) return { key: "chain:ratio", label: "Ratio" };
  if (n.includes("jip")) return { key: "chain:jip", label: "JIP" };
  if (store.source === "kaufland") return { key: "chain:kaufland", label: "Kaufland" };
  if (store.source === "lidl") return { key: "chain:lidl", label: "Lidl" };
  return { key: `chain:${n}`, label: store.shopName };
}

export default function SearchSection({
  products,
  loading,
  hasSearched,
  selectedFilter,
  setSelectedFilter,
  selectedSort,
  setSelectedSort,
  handleResults,
  setLoading,
  setHasSearched,
  handleModeChange,
  initialQuery,
  hideHeader,
  favorites,
  onToggleFavorite,
}: SearchSectionProps) {
  const resultsRef = useRef<HTMLDivElement>(null);
  const [watchDialog, setWatchDialog] = useState<{ query: string; price: number } | null>(null);
  
  const availableFilters = useMemo(() => {
    const filters = [...BASE_SOURCE_FILTERS];
    const seen = new Set(filters.map(f => f.key));
    
    products.forEach(p => {
      p.stores.forEach(s => {
        const f = getStoreFilter(s);
        if (!seen.has(f.key)) {
          seen.add(f.key);
          filters.push(f);
        }
      });
    });
    return filters;
  }, [products]);

  const filteredAndSortedProducts = useMemo(() => {
    const filtered = selectedFilter.includes("all")
      ? products
      : products.map(p => ({
          ...p,
          stores: p.stores.filter(s => selectedFilter.includes(getStoreFilter(s).key))
        })).filter(p => p.stores.length > 0);

    return [...filtered].sort((a, b) => {
      if (selectedSort === "relevance") return 0; // API už řadí podle relevance
      const priceA = parsePrice(sortStoresByPrice(a.stores)[0]?.price || "");
      const priceB = parsePrice(sortStoresByPrice(b.stores)[0]?.price || "");
      if (selectedSort === "cheapest") return priceA - priceB;
      if (selectedSort === "coverage") return priceB - priceA;
      return 0;
    });
  }, [products, selectedFilter, selectedSort]);

  return (
    <div className="space-y-6 md:space-y-8 w-full max-w-full overflow-x-hidden">
      {!hideHeader && !hasSearched && (
        <header className="px-1 md:px-2 w-full">
          <h1 className="text-2xl md:text-4xl lg:text-5xl font-display font-extrabold tracking-tight text-foodappka-950 dark:text-white leading-tight mb-4">
            Najděte nejlevnější akční cenu <br className="hidden md:block" />
            <span className="text-foodappka-600 dark:text-foodappka-400">dřív, než vyrazíte nakoupit</span>
          </h1>
          
          <div className="w-full">
            <SearchBar
              onResults={handleResults}
              onLoading={setLoading}
              onSearchStart={() => {
                setHasSearched(true);
                setTimeout(() => {
                  resultsRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
                }, 100);
              }}
              onFocus={() => setHasSearched(true)}
              mode="search"
              onModeChange={handleModeChange}
              initialQuery={initialQuery}
            />
          </div>
        </header>
      )}

      {!hideHeader && hasSearched && (
        <header className="px-1 md:px-2 w-full pt-2">
          <SearchBar
            onResults={handleResults}
            onLoading={setLoading}
            onSearchStart={() => {
              setHasSearched(true);
              setTimeout(() => {
                resultsRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
              }, 100);
            }}
            mode="search"
            onModeChange={handleModeChange}
            initialQuery={initialQuery}
          />
        </header>
      )}

      <section ref={resultsRef} className="space-y-4 w-full">
        <div className="flex items-center justify-between gap-4 px-1 md:px-2 overflow-hidden">
          <h2 className="text-lg font-bold text-foodappka-950 dark:text-white shrink-0">Výsledky</h2>
        </div>

        {!loading && products.length > 0 && (
          <div className="space-y-3 px-1 md:px-2">
            {/* Filtry obchodů */}
            <div className="flex gap-2 overflow-x-auto no-scrollbar pb-2 pt-1 px-1">
              {availableFilters.map((filter) => {
                const count = products.filter(p =>
                  filter.key === "all"
                    ? true
                    : p.stores.some(s => getStoreFilter(s).key === filter.key)
                ).length;
                if (filter.key !== "all" && count === 0) return null;
                const isActive = selectedFilter.includes(filter.key);

                if (filter.key === "all") {
                  return (
                    <button
                      key="all"
                      onClick={() => setSelectedFilter(["all"])}
                      className="shrink-0 flex flex-col items-center gap-1"
                    >
                      <div className={`w-11 h-11 rounded-2xl flex items-center justify-center text-sm font-black transition-colors ${
                        isActive
                          ? "bg-zinc-800 dark:bg-white text-white dark:text-zinc-900"
                          : "bg-zinc-100 dark:bg-zinc-800 text-zinc-500 dark:text-zinc-400"
                      }`}>
                        Vše
                      </div>
                      <span className={`text-[9px] font-bold tabular-nums ${isActive ? "text-zinc-800 dark:text-white" : "text-zinc-400"}`}>
                        {count}
                      </span>
                    </button>
                  );
                }

                return (
                  <button
                    key={filter.key}
                    onClick={() => {
                      if (isActive) {
                        // Odebrat — pokud zůstane prázdno, dát "all"
                        const next = selectedFilter.filter(k => k !== filter.key);
                        setSelectedFilter(next.length === 0 ? ["all"] : next);
                      } else {
                        // Přidat, odebrat "all"
                        setSelectedFilter([...selectedFilter.filter(k => k !== "all"), filter.key]);
                      }
                    }}
                    title={`${filter.label} (${count})`}
                    className="shrink-0 flex flex-col items-center gap-1"
                  >
                    <div className={`w-11 h-11 rounded-2xl flex items-center justify-center bg-white dark:bg-zinc-800 transition-all ${
                      isActive
                        ? "ring-2 ring-foodappka-500 ring-offset-2 dark:ring-offset-zinc-900"
                        : ""
                    }`}>
                      <StoreBrand shopName={filter.label} small />
                    </div>
                    <span className={`text-[9px] font-bold tabular-nums ${isActive ? "text-foodappka-600 dark:text-foodappka-400" : "text-zinc-400"}`}>
                      {count}
                    </span>
                  </button>
                );
              })}
            </div>

            {/* Řazení */}
            <div className="flex gap-4 border-b border-zinc-100 dark:border-zinc-800">
              {([
                { key: "relevance", label: "Relevance" },
                { key: "cheapest", label: "Nejlevnější" },
                { key: "coverage", label: "Nejdražší" },
              ] as const).map((opt) => (
                <button
                  key={opt.key}
                  onClick={() => setSelectedSort(opt.key)}
                  className={`pb-2 text-xs font-bold transition-all border-b-2 -mb-px ${
                    selectedSort === opt.key
                      ? "border-foodappka-500 text-foodappka-600 dark:text-foodappka-400"
                      : "border-transparent text-zinc-400 dark:text-zinc-500 hover:text-zinc-600 dark:hover:text-zinc-300"
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>
        )}

        {loading ? <SearchLoadingAnimation /> : filteredAndSortedProducts.length > 0 ? (
          <div className="grid gap-2 w-full">
            {filteredAndSortedProducts.map((product) => {
              const isFavorite = favorites.some(f => f.id === product.url);
              const matchedPreset = matchIngredientPreset(product.name);
              const sortedStores = sortStoresByPrice(product.stores);
              const bestStore = sortedStores[0];
              const bestPrice = bestStore ? parsePrice(bestStore.price) : 0;
              const bestOriginal = bestStore?.originalPrice ? parsePrice(bestStore.originalPrice) : null;
              const bestSavings = getSavings(bestPrice, bestOriginal);
              const bestDiscount = formatDiscountPercent(bestPrice, bestOriginal);
              const isBestSale = bestOriginal !== null && bestOriginal > bestPrice;

              return (
                <article key={product.url} className="rounded-2xl border border-zinc-100 dark:border-zinc-800 bg-white dark:bg-zinc-900 overflow-hidden w-full">
                  {/* Hlavní řádek */}
                  <div className="flex items-center gap-3 px-4 py-3">
                    {/* Obrázek produktu nebo logo obchodu */}
                    <div className="shrink-0">
                      {product.image ? (
                        <div className="w-12 h-12 rounded-xl overflow-hidden bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center">
                          <Image
                            src={product.image}
                            alt={product.name}
                            width={48}
                            height={48}
                            className="w-full h-full object-contain"
                            unoptimized
                          />
                        </div>
                      ) : bestStore?.leafletUrl ? (
                        <a href={bestStore.leafletUrl} target="_blank" rel="noreferrer">
                          <StoreBrand shopName={bestStore?.shopName ?? ""} small />
                        </a>
                      ) : (
                        <StoreBrand shopName={bestStore?.shopName ?? ""} small />
                      )}
                    </div>

                    {/* Název */}
                    <div className="min-w-0 flex-1">
                      <h3 className="text-sm font-semibold text-zinc-800 dark:text-zinc-100 leading-tight line-clamp-2">
                        {cleanProductName(product.name)}
                      </h3>
                      <div className="flex items-center gap-1.5 mt-0.5 flex-wrap">
                        {matchedPreset && (
                          <span className="text-[10px] font-bold text-foodappka-600 dark:text-foodappka-400">
                            #{matchedPreset.label.toLowerCase()}
                          </span>
                        )}
                        {product.stores.length > 1 && (
                          <p className="text-[10px] text-zinc-400">
                            +{product.stores.length - 1} {product.stores.length - 1 === 1 ? "obchod" : "obchody"}
                          </p>
                        )}
                      </div>
                    </div>

                    {/* Ceny vpravo */}
                    <div className="shrink-0 text-right flex flex-col items-end">
                      <div className="flex items-baseline gap-1.5">
                        {isBestSale && bestDiscount && (
                          <span className="bg-red-500 text-[9px] font-black text-white px-1.5 py-0.5 rounded-full leading-none">
                            {bestDiscount}
                          </span>
                        )}
                        <span className="text-xl font-black text-zinc-900 dark:text-white leading-none">
                          {bestStore?.price}
                        </span>
                      </div>
                      {isBestSale && (
                        <span className="text-[11px] text-zinc-400 line-through mt-0.5">
                          {bestStore?.originalPrice}
                        </span>
                      )}
                      {bestSavings > 0 && (
                        <span className="text-[10px] text-green-600 dark:text-green-400 font-bold mt-0.5">
                          ušetříš {bestSavings.toFixed(0)} Kč
                        </span>
                      )}
                      {bestStore?.validity && (
                        <span className="text-[9px] text-zinc-400 dark:text-zinc-500 mt-0.5">
                          {bestStore.validity}
                        </span>
                      )}
                    </div>

                    {/* Hlídat cenu */}
                    <button
                      onClick={(e) => {
                        e.preventDefault();
                        setWatchDialog({ query: cleanProductName(product.name), price: bestPrice });
                      }}
                      title="Hlídat cenu"
                      className="shrink-0 flex h-8 w-8 items-center justify-center rounded-full text-zinc-300 hover:text-foodappka-500 transition-colors"
                    >
                      <span className="material-symbols-outlined text-[18px]">trending_down</span>
                    </button>

                    {/* Oblíbené */}
                    <button
                      onClick={(e) => { e.preventDefault(); onToggleFavorite(product); }}
                      className={`shrink-0 flex h-8 w-8 items-center justify-center rounded-full transition-colors ${
                        isFavorite
                          ? "text-red-500"
                          : "text-zinc-300 hover:text-red-400"
                      }`}
                    >
                      <span className="material-symbols-outlined text-[18px]" style={isFavorite ? { fontVariationSettings: "'FILL' 1" } : undefined}>
                        favorite
                      </span>
                    </button>
                  </div>

                  {/* Ostatní obchody — jen pokud jich je víc */}
                  {sortedStores.length > 1 && (
                    <div className="border-t border-zinc-100 dark:border-zinc-800 divide-y divide-zinc-100 dark:divide-zinc-800">
                      {sortedStores.slice(1).map((item, idx) => {
                        const currentPrice = parsePrice(item.price);
                        const originalPrice = item.originalPrice ? parsePrice(item.originalPrice) : null;
                        const isSale = originalPrice !== null && originalPrice > currentPrice;
                        const discount = formatDiscountPercent(currentPrice, originalPrice);

                        return (
                          <div key={idx} className="flex items-center gap-3 px-4 py-2">
                            <div className="shrink-0">
                              {item.leafletUrl ? (
                                <a href={item.leafletUrl} target="_blank" rel="noreferrer">
                                  <StoreBrand shopName={item.shopName} small />
                                </a>
                              ) : (
                                <StoreBrand shopName={item.shopName} small />
                              )}
                            </div>
                            <div className="flex-1 min-w-0 flex flex-col">
                              {item.pricePerUnit ? (
                                <span className="text-[10px] text-zinc-400">{item.pricePerUnit}</span>
                              ) : null}
                              {item.validity ? (
                                <span className="text-[9px] text-zinc-400 dark:text-zinc-500">{item.validity}</span>
                              ) : null}
                            </div>
                            <div className="text-right flex items-center gap-1.5">
                              {isSale && discount && (
                                <span className="bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 text-[9px] font-bold px-1.5 py-0.5 rounded-full">
                                  {discount}
                                </span>
                              )}
                              <span className="text-sm font-bold text-zinc-700 dark:text-zinc-200">
                                {item.price}
                              </span>
                              {isSale && (
                                <span className="text-[10px] text-zinc-400 line-through">
                                  {item.originalPrice}
                                </span>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </article>
              );
            })}
          </div>
        ) : hasSearched ? (
          <EmptyState hasSearched={true} />
        ) : (
          <EmptyState hasSearched={false} />
        )}
      </section>

      {watchDialog && (
        <WatchDialog
          defaultQuery={watchDialog.query}
          defaultPrice={watchDialog.price}
          onClose={() => setWatchDialog(null)}
        />
      )}
    </div>
  );
}
