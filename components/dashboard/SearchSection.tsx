"use client";

import { useMemo, useRef } from "react";
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
                      {product.stores.length > 1 && (
                        <p className="text-[10px] text-zinc-400 mt-0.5">
                          +{product.stores.length - 1} {product.stores.length - 1 === 1 ? "obchod" : "obchody"}
                        </p>
                      )}
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
    </div>
  );
}
