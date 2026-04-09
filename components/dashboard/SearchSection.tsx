"use client";

import { useMemo } from "react";
import SearchBar from "@/components/SearchBar";
import { 
  cleanProductName, 
  parsePrice, 
  sortStoresByPrice, 
  type Product, 
  type Store 
} from "@/lib/food";
import { normalizeText } from "@/lib/food";
import { FOODORA_STORE_CONFIGS } from "@/data/foodoraStores";
import { StoreBrand, LoadingCards, EmptyState } from "./DashboardShared";

type ProductSort = "relevance" | "cheapest" | "coverage";

type SearchSectionProps = {
  products: Product[];
  loading: boolean;
  hasSearched: boolean;
  selectedFilter: string;
  setSelectedFilter: (filter: string) => void;
  selectedSort: ProductSort;
  setSelectedSort: (sort: ProductSort) => void;
  handleResults: (products: Product[]) => void;
  setLoading: (loading: boolean) => void;
  setHasSearched: (hasSearched: boolean) => void;
  handleModeChange: (mode: any) => void;
};

const BASE_SOURCE_FILTERS = [
  { key: "all", label: "Vše" },
  { key: "source:kaufland", label: "Kaufland" },
  { key: "source:lidl", label: "Lidl.cz" },
  ...FOODORA_STORE_CONFIGS.map((store) => ({
    key: `foodora:${normalizeText(store.chainName)}`,
    label: `${store.chainName}`,
  })),
];

function getStoreFilter(store: Store) {
  if (store.source === "foodora") return { key: `foodora:${normalizeText(store.shopName)}`, label: store.shopName };
  if (store.source === "kaufland") return { key: "source:kaufland", label: "Kaufland.cz" };
  if (store.source === "lidl") return { key: "source:lidl", label: "Lidl.cz" };
  return { key: `kupi:${normalizeText(store.shopName)}`, label: store.shopName };
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
}: SearchSectionProps) {
  
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
    let result = selectedFilter === "all" 
      ? products 
      : products.map(p => ({
          ...p,
          stores: p.stores.filter(s => getStoreFilter(s).key === selectedFilter)
        })).filter(p => p.stores.length > 0);

    if (selectedSort === "cheapest") {
      return [...result].sort((a, b) => 
        parsePrice(sortStoresByPrice(a.stores)[0]?.price || "") - 
        parsePrice(sortStoresByPrice(b.stores)[0]?.price || "")
      );
    }
    return result;
  }, [products, selectedFilter, selectedSort]);

  return (
    <div className="space-y-6 md:space-y-8 w-full max-w-full overflow-x-hidden">
      <header className="px-1 md:px-2 w-full">
        <h1 className="text-2xl md:text-4xl lg:text-5xl font-extrabold tracking-tight text-foodapka-950 dark:text-white leading-tight mb-4">
          Najděte nejlevnější akční cenu <br className="hidden md:block" />
          <span className="text-foodapka-600 dark:text-foodapka-400">dřív, než vyrazíte nakoupit</span>
        </h1>
        
        <div className="w-full">
          <SearchBar
            onResults={handleResults}
            onLoading={setLoading}
            onSearchStart={() => setHasSearched(true)}
            mode="search"
            onModeChange={handleModeChange}
          />
        </div>
      </header>

      <section className="space-y-4 w-full">
        <div className="flex items-center justify-between gap-4 px-1 md:px-2 overflow-hidden">
          <h2 className="text-lg font-bold text-foodapka-950 dark:text-white shrink-0">Výsledky</h2>
          <div className="flex gap-2 overflow-x-auto no-scrollbar pb-1 min-w-0">
            {["relevance", "cheapest"].map((s) => (
              <button
                key={s}
                onClick={() => setSelectedSort(s as ProductSort)}
                className={`whitespace-nowrap rounded-full border px-3 py-1.5 text-[11px] font-bold transition-all ${
                  selectedSort === s
                    ? "border-foodapka-600 bg-foodapka-600 text-white shadow-md"
                    : "border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 text-zinc-600 dark:text-zinc-400"
                }`}
              >
                {s === "relevance" ? "Relevance" : "Nejlevnější"}
              </button>
            ))}
          </div>
        </div>

        {!loading && products.length > 0 && (
          <div className="flex gap-2 overflow-x-auto no-scrollbar pb-2 px-1 md:px-2">
            {availableFilters.map((filter) => {
              const count = products.filter(p => p.stores.some(s => getStoreFilter(s).key === filter.key || filter.key === "all")).length;
              if (filter.key !== "all" && count === 0) return null;

              return (
                <button
                  key={filter.key}
                  onClick={() => setSelectedFilter(filter.key)}
                  className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-[11px] font-bold transition-all whitespace-nowrap ${
                    selectedFilter === filter.key
                      ? "border-foodapka-600 bg-foodapka-600 text-white shadow-md"
                      : "border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 text-zinc-600 dark:text-zinc-400"
                  }`}
                >
                  <span>{filter.label}</span>
                  <span className={`rounded-full px-1.5 py-0.5 text-[9px] ${selectedFilter === filter.key ? "bg-white/20 text-white" : "bg-foodapka-100 dark:bg-foodapka-900/50 text-foodapka-700 dark:text-foodapka-300"}`}>
                    {filter.key === "all" ? products.length : count}
                  </span>
                </button>
              );
            })}
          </div>
        )}

        {loading ? <LoadingCards /> : filteredAndSortedProducts.length > 0 ? (
          <div className="grid gap-3 md:gap-4 w-full">
            {filteredAndSortedProducts.map((product) => (
              <article key={product.url} className="rounded-2xl border border-foodapka-100 dark:border-zinc-800 bg-white/90 dark:bg-foodapka-950 p-4 shadow-sm w-full min-w-0 overflow-hidden">
                <div className="flex flex-col gap-4">
                  <div className="flex items-start justify-between gap-4">
                    <div className="min-w-0 flex-1">
                      <h3 className="text-base md:text-lg font-bold text-zinc-950 dark:text-white leading-tight truncate">
                        {cleanProductName(product.name)}
                      </h3>
                      <p className="text-[11px] text-zinc-500 dark:text-zinc-400 mt-0.5">
                        V {product.stores.length} {product.stores.length === 1 ? "obchodě" : "obchodech"}
                      </p>
                    </div>
                    <a href={product.url} target="_blank" rel="noreferrer" className="shrink-0 rounded-full border border-foodapka-200 dark:border-zinc-800 bg-foodapka-50 dark:bg-zinc-900 px-3 py-1.5 text-xs font-bold text-foodapka-800 dark:text-foodapka-300">
                      Detail
                    </a>
                  </div>
                  <ul className="grid gap-2 w-full">
                    {sortStoresByPrice(product.stores).map((item, idx) => (
                      <li key={idx} className={`rounded-xl border px-3 py-2.5 flex items-center justify-between gap-3 min-w-0 ${idx === 0 ? "border-foodapka-300 dark:border-foodapka-800 bg-foodapka-50 dark:bg-foodapka-900/20 shadow-sm" : "border-zinc-100 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900/50"}`}>
                        <div className="flex items-center gap-2 min-w-0 flex-1">
                          <div className="shrink-0">
                            <StoreBrand shopName={item.shopName} small />
                          </div>
                          {idx === 0 && <span className="bg-foodapka-600 text-[8px] font-black text-white px-1.5 py-0.5 rounded-full uppercase tracking-tighter shrink-0">TOP</span>}
                        </div>
                        <div className="text-right shrink-0">
                          <p className={`text-base font-black ${idx === 0 ? "text-foodapka-700 dark:text-foodapka-400" : "text-zinc-900 dark:text-white"}`}>{item.price}</p>
                          {item.amount && <p className="text-[9px] text-zinc-500 dark:text-zinc-400 -mt-0.5">{item.amount}</p>}
                        </div>
                      </li>
                    ))}
                  </ul>
                </div>
              </article>
            ))}
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
