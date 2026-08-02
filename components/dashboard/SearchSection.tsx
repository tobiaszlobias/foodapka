"use client";

import { useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { useBodyScrollLock } from "@/lib/useBodyScrollLock";
import SearchBar from "@/components/SearchBar";
import {
  cleanProductName,
  parsePrice,
  sortStoresByPrice,
  formatDiscountPercent,
  getStoreSavings,
  getUnitPriceLabel,
  type Product
} from "@/lib/food";
import { getStoreFilter } from "@/lib/storeFilters";
import { AVAILABLE_STORES } from "@/lib/favoriteStores";
import { FOODORA_STORE_CONFIGS } from "@/data/foodoraStores";
import { StoreBrand, LoadingCards, EmptyState, SearchLoadingAnimation, LeafletViewer, StoreFilterChips, ProductImage } from "./DashboardShared";
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
};

async function createWatch(query: string, targetPrice: number, storeFilter: string[]) {
  const res = await fetch("/api/watchdog", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ query, targetPrice, storeFilter }),
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
  useBodyScrollLock();
  const [query, setQuery] = useState(defaultQuery);
  const [targetPrice, setTargetPrice] = useState(String(Math.floor(defaultPrice)));
  const [selectedStores, setSelectedStores] = useState<string[]>([]);
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    const priceNum = Number(targetPrice.replace(",", "."));
    if (!query.trim() || !Number.isFinite(priceNum) || priceNum <= 0) {
      showToast("Zadejte platný dotaz a cenu.", "error");
      return;
    }
    setSaving(true);
    const ok = await createWatch(query.trim(), priceNum, selectedStores);
    setSaving(false);
    if (ok) onClose();
  };

  return createPortal(
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
            <span className="material-symbols-outlined text-mnamio-600">trending_down</span>
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
              className="w-full h-12 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-black px-4 text-zinc-900 dark:text-white outline-none transition focus:border-mnamio-500 focus:ring-2 focus:ring-mnamio-500/20"
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
                className="w-full h-12 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-black px-4 pr-12 text-zinc-900 dark:text-white outline-none transition focus:border-mnamio-500 focus:ring-2 focus:ring-mnamio-500/20"
              />
              <span className="absolute right-4 top-1/2 -translate-y-1/2 text-sm font-bold text-zinc-400">Kč</span>
            </div>
          </div>

          <div>
            <label className="block text-sm font-bold text-zinc-700 dark:text-zinc-300 mb-2">
              Ve kterých obchodech hlídat
            </label>
            <StoreFilterChips stores={AVAILABLE_STORES} selected={selectedStores} onChange={setSelectedStores} />
            <p className="mt-1.5 text-xs text-zinc-500 dark:text-zinc-400">
              {selectedStores.length === 0 ? "Nevybráno = hlídáme napříč všemi obchody." : "Hlídáme jen ve vybraných obchodech."}
            </p>
          </div>

          <button
            onClick={handleSave}
            disabled={saving}
            className="w-full h-12 rounded-full bg-mnamio-600 text-white font-black transition hover:bg-mnamio-700 shadow-lg shadow-mnamio-600/20 active:scale-95 disabled:opacity-50"
          >
            {saving ? "Ukládám…" : "Zapnout hlídání"}
          </button>
        </div>
      </div>
    </div>,
    document.body,
  );
}

const BASE_SOURCE_FILTERS = [
  { key: "all", label: "Vše" },
];

// Hlavní sledované řetězce — chipsy pro ně existují vždy, i když zrovna nejsou
// ve výsledcích (aby fungovaly jako trvalý výběr oblíbených obchodů, ne jen
// jako filtr aktuálních výsledků).
const KNOWN_CHAIN_FILTERS = [
  { key: "chain:lidl", label: "Lidl" },
  { key: "chain:kaufland", label: "Kaufland" },
  { key: "chain:albert", label: "Albert" },
  { key: "chain:tesco", label: "Tesco" },
  { key: "chain:penny", label: "Penny" },
  { key: "chain:billa", label: "Billa" },
  { key: "chain:globus", label: "Globus" },
  { key: "chain:jip", label: "JIP" },
  { key: "chain:hruska", label: "Hruška" },
];

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
}: SearchSectionProps) {
  const resultsRef = useRef<HTMLDivElement>(null);
  const [watchDialog, setWatchDialog] = useState<{ query: string; price: number } | null>(null);
  const [leafletDialog, setLeafletDialog] = useState<{ url: string; shopName: string } | null>(null);

  const availableFilters = useMemo(() => {
    const filters = [...BASE_SOURCE_FILTERS, ...KNOWN_CHAIN_FILTERS];
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

    const stats = new Map<string, { count: number; minPrice: number }>();
    products.forEach(p => {
      const keysInProduct = new Set<string>();
      p.stores.forEach(s => {
        const key = getStoreFilter(s).key;
        keysInProduct.add(key);
        const price = parsePrice(s.price || "");
        const entry = stats.get(key) ?? { count: 0, minPrice: Infinity };
        if (Number.isFinite(price) && price > 0) {
          entry.minPrice = Math.min(entry.minPrice, price);
        }
        stats.set(key, entry);
      });
      keysInProduct.forEach(key => {
        const entry = stats.get(key);
        if (entry) entry.count += 1;
      });
    });

    const withStats = filters.map(f => ({
      ...f,
      count: f.key === "all" ? products.length : (stats.get(f.key)?.count ?? 0),
      minPrice: f.key === "all" ? 0 : (stats.get(f.key)?.minPrice ?? Infinity),
    }));

    const all = withStats.filter(f => f.key === "all");
    const rest = withStats
      .filter(f => f.key !== "all")
      .sort((a, b) => b.count - a.count || a.minPrice - b.minPrice);

    return [...all, ...rest];
  }, [products]);

  const filteredAndSortedProducts = useMemo(() => {
    const filtered = selectedFilter.includes("all")
      ? products
      : products.map(p => ({
          ...p,
          stores: p.stores.filter(s => selectedFilter.includes(getStoreFilter(s).key))
        })).filter(p => p.stores.length > 0);

    return [...filtered].sort((a, b) => {
      // AI relevance vrstva označené produkty vždy až za neoznačené, bez ohledu na řazení
      if (!!a.aiFlagged !== !!b.aiFlagged) return a.aiFlagged ? 1 : -1;
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
          <h1 className="text-2xl md:text-4xl lg:text-5xl font-display font-extrabold tracking-tight text-mnamio-950 dark:text-white leading-tight mb-4">
            Najděte nejlevnější akční cenu <br className="hidden md:block" />
            <span className="text-mnamio-600 dark:text-mnamio-400">dřív, než vyrazíte nakoupit</span>
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
          <h2 className="text-lg font-bold text-mnamio-950 dark:text-white shrink-0">Výsledky</h2>
        </div>

        {!loading && products.length > 0 && (
          <div className="space-y-3 px-1 md:px-2">
            {/* Filtry obchodů */}
            <div className="flex gap-2 overflow-x-auto no-scrollbar pb-2 pt-1 px-1">
              {availableFilters.map((filter) => {
                const count = filter.count;
                const isActive = selectedFilter.includes(filter.key);

                if (filter.key !== "all" && count === 0 && !isActive) {
                  return null;
                }

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
                        ? "ring-2 ring-mnamio-500 ring-offset-2 dark:ring-offset-zinc-900"
                        : ""
                    }`}>
                      <StoreBrand shopName={filter.label} small />
                    </div>
                    <span className={`text-[9px] font-bold tabular-nums ${isActive ? "text-mnamio-600 dark:text-mnamio-400" : "text-zinc-400"}`}>
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
                      ? "border-mnamio-500 text-mnamio-600 dark:text-mnamio-400"
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
              const matchedPreset = matchIngredientPreset(product.name);
              const sortedStores = sortStoresByPrice(product.stores);
              const bestStore = sortedStores[0];
              const bestPrice = bestStore ? parsePrice(bestStore.price) : 0;

              return (
                <article key={product.url} className={`rounded-2xl border border-zinc-100 dark:border-zinc-800 bg-white dark:bg-zinc-900 overflow-hidden w-full ${product.aiFlagged ? "opacity-50" : ""}`}>
                  {/* Header: obrázek/název produktu */}
                  <div className="flex items-center gap-3 px-4 py-3">
                    <div className="shrink-0">
                      <div className="w-12 h-12 rounded-xl bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center overflow-hidden">
                        <ProductImage src={product.image} alt={product.name} size={48} />
                      </div>
                    </div>

                    <div className="min-w-0 flex-1">
                      <h3 className="text-sm font-semibold text-zinc-800 dark:text-zinc-100 leading-tight line-clamp-2">
                        {cleanProductName(product.name)}
                      </h3>
                      <div className="flex items-center gap-1.5 mt-0.5 flex-wrap">
                        {product.aiFlagged && (
                          <span className="text-[10px] font-bold text-amber-600 dark:text-amber-400">
                            Nesouvisí s hledáním?
                          </span>
                        )}
                        {matchedPreset && (
                          <span className="text-[10px] font-bold text-mnamio-600 dark:text-mnamio-400">
                            #{matchedPreset.label.toLowerCase()}
                          </span>
                        )}
                        {bestStore?.packageSize && (
                          <span className="text-[10px] text-zinc-400">{bestStore.packageSize}</span>
                        )}
                        {bestStore && (() => {
                          const unitLabel = getUnitPriceLabel(bestStore, product.name);
                          return unitLabel && (
                            <span className="text-[10px] text-zinc-400">{unitLabel}</span>
                          );
                        })()}
                        {sortedStores.length > 1 && (
                          <span className="text-[10px] text-zinc-400">
                            {sortedStores.length} nabídky
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Hlídat cenu */}
                    <button
                      onClick={(e) => {
                        e.preventDefault();
                        setWatchDialog({ query: cleanProductName(product.name), price: bestPrice });
                      }}
                      title="Hlídat cenu"
                      className="shrink-0 flex h-9 w-9 items-center justify-center rounded-full text-zinc-300 hover:text-mnamio-500 hover:bg-mnamio-50 dark:hover:bg-mnamio-900/30 transition-colors"
                    >
                      <span className="material-symbols-outlined text-[20px]">trending_down</span>
                    </button>
                  </div>

                  {/* Obchody — vertikální seznam, každý stejně velký */}
                  <div className="border-t border-zinc-100 dark:border-zinc-800 divide-y divide-zinc-100 dark:divide-zinc-800">
                    {sortedStores.map((item, idx) => {
                      const currentPrice = parsePrice(item.price);
                      const originalPrice = item.originalPrice ? parsePrice(item.originalPrice) : null;
                      const hasRealOriginalPrice = originalPrice !== null && originalPrice > currentPrice;
                      const savings = getStoreSavings(item);
                      const discount = savings > 0
                        ? (item.discountPercent || (hasRealOriginalPrice ? formatDiscountPercent(currentPrice, originalPrice) : ""))
                        : "";
                      const hasPrice = Number.isFinite(currentPrice);
                      const isCheapest = idx === 0 && hasPrice;

                      return (
                        <div
                          key={idx}
                          className={`flex items-center gap-3 px-4 py-3 ${isCheapest ? "bg-mnamio-50/60 dark:bg-mnamio-900/10" : ""}`}
                        >
                          <div className="shrink-0 w-14 flex items-center justify-center">
                            {item.leafletUrl && (item.source !== "foodora" || item.isSale) ? (
                              <button onClick={() => setLeafletDialog({ url: item.leafletUrl, shopName: item.shopName })}>
                                <StoreBrand shopName={item.shopName} small />
                              </button>
                            ) : (
                              <StoreBrand shopName={item.shopName} small />
                            )}
                          </div>
                          <div className="flex-1 min-w-0 flex flex-col">
                            <div className="flex items-center gap-1.5 flex-wrap">
                              {isCheapest && (
                                <span className="text-[10px] font-black text-mnamio-700 dark:text-mnamio-400 uppercase tracking-wide">
                                  Nejlevnější
                                </span>
                              )}
                              {item.validity && (
                                <span className="text-[10px] text-zinc-400">{item.validity}</span>
                              )}
                            </div>
                            {item.loyaltyCardLabel && (
                              <span className="inline-flex items-center gap-0.5 text-[9px] font-bold text-red-600 dark:text-red-400 w-fit">
                                <span className="material-symbols-outlined text-[11px]">card_membership</span>
                                {item.loyaltyCardLabel}
                              </span>
                            )}
                            {item.note && (
                              <span className="text-[9px] text-amber-600 dark:text-amber-500">{item.note}</span>
                            )}
                            {/* Foodora je živý e-shop feed — u položek bez skutečné slevy
                                (běžná katalogová cena) žádný odpovídající leták neexistuje.
                                Obchody bez leafletUrl (např. Potravinka.cz zdroj u e-shopů
                                jako rohlik.cz) tlačítko nemají vůbec. */}
                            {item.leafletUrl && (item.source !== "foodora" || item.isSale) && (
                              <button
                                onClick={() => setLeafletDialog({ url: item.leafletUrl, shopName: item.shopName })}
                                className="mt-0.5 inline-flex items-center gap-0.5 text-[10px] font-bold text-mnamio-600 hover:text-mnamio-700 transition-colors w-fit"
                              >
                                <span className="material-symbols-outlined text-[12px]">menu_book</span>
                                Leták
                              </button>
                            )}
                          </div>
                          <div className="text-right shrink-0 flex flex-col items-end">
                            <div className="flex items-baseline gap-1.5">
                              {discount && (
                                <span className="bg-red-500 text-[9px] font-black text-white px-1.5 py-0.5 rounded-full leading-none">
                                  {discount}
                                </span>
                              )}
                              {hasPrice ? (
                                <span className={`font-black text-zinc-900 dark:text-white leading-none ${isCheapest ? "text-lg" : "text-sm"}`}>
                                  {item.price}
                                </span>
                              ) : (
                                <span className="text-xs font-bold text-zinc-400 leading-none">
                                  cena neznámá
                                </span>
                              )}
                            </div>
                            {hasRealOriginalPrice && (
                              <span className="text-[10px] text-zinc-400 line-through mt-0.5">
                                {item.originalPrice}
                              </span>
                            )}
                            {savings > 0 && (
                              <span className="text-[9px] text-green-600 dark:text-green-400 font-bold mt-0.5">
                                ušetříš {savings.toFixed(0)} Kč
                              </span>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
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

      {leafletDialog && (
        <LeafletViewer
          leafletUrl={leafletDialog.url}
          shopName={leafletDialog.shopName}
          onClose={() => setLeafletDialog(null)}
        />
      )}
    </div>
  );
}
