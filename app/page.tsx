"use client";

import SearchBar from "@/components/SearchBar";
import SiteHeader from "@/components/SiteHeader";
import {
  calculateStoreSavings,
  cleanProductName,
  getStoreIcon,
  parsePrice,
  sortStoresByPrice,
  type Product,
} from "@/lib/food";
import { useState } from "react";

type ProductSortMode = "relevance" | "cheapest" | "most_stores";

function LoadingCards() {
  return (
    <div className="grid gap-4 xl:grid-cols-2">
      {Array.from({ length: 3 }).map((_, index) => (
        <article
          key={index}
          className="overflow-hidden rounded-[2rem] border border-emerald-100 bg-white/90 p-5 shadow-[0_20px_50px_-30px_rgba(16,185,129,0.4)] dark:border-slate-800 dark:bg-slate-950/85 dark:shadow-[0_28px_70px_-36px_rgba(0,0,0,0.82)]"
        >
          <div className="animate-pulse space-y-4">
            <div className="h-6 w-2/3 rounded-full bg-emerald-100" />
            <div className="h-4 w-40 rounded-full bg-zinc-100" />
            <div className="grid gap-3">
              {Array.from({ length: 3 }).map((_, storeIndex) => (
                <div
                  key={storeIndex}
                  className="flex items-center justify-between rounded-2xl border border-zinc-100 bg-zinc-50 px-4 py-4"
                >
                  <div className="space-y-2">
                    <div className="h-4 w-24 rounded-full bg-zinc-200 dark:bg-slate-700" />
                    <div className="h-3 w-16 rounded-full bg-zinc-100 dark:bg-slate-800" />
                  </div>
                  <div className="space-y-2">
                    <div className="h-4 w-20 rounded-full bg-emerald-100 dark:bg-emerald-900/60" />
                    <div className="h-3 w-24 rounded-full bg-zinc-100 dark:bg-slate-800" />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </article>
      ))}
    </div>
  );
}

function EmptyState({ hasSearched }: { hasSearched: boolean }) {
  return (
    <div className="rounded-[2rem] border border-dashed border-emerald-200 bg-white/70 px-6 py-12 text-center shadow-[0_20px_40px_-35px_rgba(16,185,129,0.5)] dark:border-slate-700 dark:bg-slate-950/65 dark:shadow-[0_24px_70px_-42px_rgba(0,0,0,0.9)]">
      <div className="mx-auto mb-5 flex h-20 w-20 items-center justify-center rounded-full bg-emerald-100 text-4xl dark:bg-emerald-900/50">
        {hasSearched ? "🧺" : "🥬"}
      </div>
      <h2 className="text-xl font-semibold text-emerald-950 dark:text-slate-100">
        {hasSearched ? "Nic jsme nenašli" : "Začněte hledat výhodnější nákup"}
      </h2>
      <p className="mx-auto mt-3 max-w-md text-sm leading-6 text-zinc-600 dark:text-slate-400">
        {hasSearched
          ? "Zkuste jiný název produktu nebo obecnější výraz. Výsledky taháme z aktuálních akčních letáků."
          : "Zadejte název potraviny a foodapka vám ukáže akční ceny napříč obchody seřazené od nejlevnější nabídky."}
      </p>
    </div>
  );
}

function getProductCheapestPrice(product: Product) {
  const cheapestStore = sortStoresByPrice(product.stores)[0];
  return cheapestStore ? parsePrice(cheapestStore.price) : Number.POSITIVE_INFINITY;
}

function flattenStores(products: Product[]) {
  return products.reduce<string[]>((accumulator, product) => {
    accumulator.push(
      ...product.stores.map((store) => store.shopName).filter(Boolean),
    );
    return accumulator;
  }, []);
}

export default function Home() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);
  const [selectedStores, setSelectedStores] = useState<string[]>([]);
  const [sortMode, setSortMode] = useState<ProductSortMode>("relevance");

  const availableStores = Array.from(
    new Set(flattenStores(products)),
  ).sort((a, b) => a.localeCompare(b, "cs"));

  const visibleProducts = products
    .map((product) => {
      if (product.availability === "not_on_sale" || product.stores.length === 0) {
        return selectedStores.length === 0 ? product : null;
      }

      const filteredStores = sortStoresByPrice(product.stores).filter((store) =>
        selectedStores.length === 0
          ? true
          : selectedStores.includes(store.shopName),
      );

      if (filteredStores.length === 0) {
        return null;
      }

      return {
        ...product,
        stores: filteredStores,
      };
    })
    .filter((product): product is Product => !!product);

  if (sortMode === "cheapest") {
    visibleProducts.sort(
      (a, b) => getProductCheapestPrice(a) - getProductCheapestPrice(b),
    );
  }

  if (sortMode === "most_stores") {
    visibleProducts.sort((a, b) => {
      const storeCountDifference = b.stores.length - a.stores.length;
      if (storeCountDifference !== 0) {
        return storeCountDifference;
      }

      return getProductCheapestPrice(a) - getProductCheapestPrice(b);
    });
  }

  function toggleStoreFilter(storeName: string) {
    setSelectedStores((current) =>
      current.includes(storeName)
        ? current.filter((item) => item !== storeName)
        : [...current, storeName],
    );
  }

  function resetFilters() {
    setSelectedStores([]);
    setSortMode("relevance");
  }

  return (
    <main className="min-h-screen bg-[radial-gradient(circle_at_top,_rgba(110,231,183,0.28),_transparent_40%),linear-gradient(180deg,_#ecfdf5_0%,_#f8fafc_48%,_#f5f7f6_100%)] px-4 py-6 text-zinc-900 dark:bg-[radial-gradient(circle_at_top,_rgba(16,185,129,0.18),_transparent_32%),linear-gradient(180deg,_#07130f_0%,_#091510_45%,_#0d1714_100%)] dark:text-slate-100 sm:px-6 lg:px-8">
      <div className="mx-auto flex max-w-6xl flex-col gap-8">
        <section className="relative overflow-visible rounded-[2rem] border border-white/60 bg-[linear-gradient(135deg,_rgba(236,253,245,0.92),_rgba(209,250,229,0.88)_42%,_rgba(167,243,208,0.78)_100%)] p-5 shadow-[0_30px_90px_-40px_rgba(5,150,105,0.55)] dark:border-slate-800 dark:bg-[linear-gradient(145deg,_rgba(10,24,20,0.96),_rgba(12,34,27,0.92)_48%,_rgba(15,61,47,0.78)_100%)] dark:shadow-[0_40px_120px_-56px_rgba(0,0,0,0.95)] sm:p-8 lg:p-10">
          <div className="absolute inset-x-0 top-0 -z-10 h-32 bg-[radial-gradient(circle,_rgba(16,185,129,0.18),_transparent_70%)] blur-3xl dark:bg-[radial-gradient(circle,_rgba(16,185,129,0.16),_transparent_65%)]" />
          <SiteHeader current="home" />
          <div className="mt-10 grid gap-8 lg:grid-cols-[minmax(0,1.2fr)_minmax(280px,0.8fr)] lg:items-end">
            <div className="space-y-5">
              <div className="space-y-4">
                <h1 className="max-w-3xl text-4xl font-bold tracking-tight text-emerald-950 dark:text-slate-50 sm:text-5xl lg:text-6xl">
                  Najděte nejlevnější akční cenu dřív, než vyrazíte do obchodu.
                </h1>
                <p className="max-w-2xl text-base leading-7 text-emerald-950/75 dark:text-slate-300 sm:text-lg">
                  foodapka prochází aktuální nabídky a ukáže vám, kde dnes
                  vychází konkrétní produkt nejlépe. Výsledek je přehledný,
                  rychlý a připravený i pro mobil.
                </p>
              </div>
              <SearchBar
                onResults={setProducts}
                onLoading={setLoading}
                onSearchStart={() => {
                  setHasSearched(true);
                  setSelectedStores([]);
                  setSortMode("relevance");
                }}
              />
            </div>

            <div className="grid gap-4 rounded-[1.75rem] border border-white/60 bg-white/65 p-4 backdrop-blur dark:border-slate-800 dark:bg-slate-950/45 sm:grid-cols-3 lg:grid-cols-1">
              {[
                ["5", "nejrelevantnějších produktů"],
                ["7+", "sledovaných řetězců"],
                ["Denně", "aktualizované akční nabídky"],
              ].map(([value, label]) => (
                <div
                  key={label}
                  className="rounded-[1.4rem] bg-emerald-950 px-4 py-5 text-white shadow-sm dark:bg-slate-900 dark:ring-1 dark:ring-emerald-900/50"
                >
                  <p className="text-2xl font-semibold">{value}</p>
                  <p className="mt-1 text-sm text-emerald-100">{label}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="space-y-5">
          <div className="flex items-end justify-between gap-4">
            <div>
              <h2 className="text-2xl font-semibold tracking-tight text-emerald-950 dark:text-slate-100 sm:text-3xl">
                Výsledky hledání
              </h2>
              <p className="mt-1 text-sm text-zinc-600 dark:text-slate-400">
                Obchody jsou uvnitř každé karty řazené od nejlevnější ceny.
              </p>
            </div>
            {!loading && products.length > 0 && (
              <p className="rounded-full border border-emerald-200 bg-white px-4 py-2 text-sm font-medium text-emerald-800 dark:border-slate-700 dark:bg-slate-950/85 dark:text-emerald-300">
                {products.length} produktů
              </p>
            )}
          </div>

          {loading && <LoadingCards />}

          {!loading && products.length > 0 && (
            <>
              <div className="rounded-[1.75rem] border border-emerald-100 bg-white/90 p-4 shadow-[0_20px_50px_-35px_rgba(16,185,129,0.45)] dark:border-slate-800 dark:bg-slate-950/85 dark:shadow-[0_30px_90px_-48px_rgba(0,0,0,0.9)] sm:p-5">
                <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                  <div className="space-y-3">
                    <div>
                      <p className="text-sm font-semibold text-emerald-900 dark:text-slate-100">
                        Filtr obchodů
                      </p>
                      <p className="text-xs text-zinc-500 dark:text-slate-400">
                        Vyberte řetězce, které máte po cestě.
                      </p>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {availableStores.map((storeName) => {
                        const selected = selectedStores.includes(storeName);

                        return (
                          <button
                            key={storeName}
                            type="button"
                            onClick={() => toggleStoreFilter(storeName)}
                            className={`inline-flex items-center gap-2 rounded-full border px-4 py-2 text-sm font-semibold transition ${
                              selected
                                ? "border-emerald-600 bg-emerald-600 text-white"
                                : "border-emerald-200 bg-emerald-50 text-emerald-800 hover:border-emerald-300 hover:bg-emerald-100 dark:border-slate-700 dark:bg-slate-900 dark:text-emerald-300 dark:hover:border-emerald-500 dark:hover:bg-slate-800"
                            }`}
                          >
                            <span>{getStoreIcon(storeName)}</span>
                            <span>{storeName}</span>
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  <div className="flex flex-col gap-2 sm:min-w-64">
                    <label
                      htmlFor="sort-mode"
                      className="text-sm font-semibold text-emerald-900 dark:text-slate-100"
                    >
                      Řazení produktů
                    </label>
                    <select
                      id="sort-mode"
                      value={sortMode}
                      onChange={(event) =>
                        setSortMode(event.target.value as ProductSortMode)
                      }
                      className="h-12 rounded-[1rem] border border-emerald-100 bg-emerald-50/70 px-4 text-sm text-zinc-900 outline-none transition focus:border-emerald-400 focus:bg-white dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100 dark:focus:bg-slate-950"
                    >
                      <option value="relevance">Výchozí pořadí</option>
                      <option value="cheapest">Nejlevnější nahoře</option>
                      <option value="most_stores">Nejvíc obchodů nahoře</option>
                    </select>
                  </div>
                </div>

                <div className="mt-4 flex flex-wrap items-center gap-3 text-sm text-zinc-600 dark:text-slate-400">
                  <span>
                    Zobrazeno {visibleProducts.length} z {products.length} produktů
                  </span>
                  {(selectedStores.length > 0 || sortMode !== "relevance") && (
                    <button
                      type="button"
                      onClick={resetFilters}
                      className="rounded-full border border-zinc-200 bg-white px-3 py-1 font-semibold text-zinc-700 transition hover:border-emerald-300 hover:text-emerald-700 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 dark:hover:border-emerald-500 dark:hover:text-emerald-300"
                    >
                      Reset filtrů
                    </button>
                  )}
                </div>
              </div>

              {visibleProducts.length === 0 ? (
                <div className="rounded-[2rem] border border-dashed border-emerald-200 bg-white/70 px-6 py-12 text-center shadow-[0_20px_40px_-35px_rgba(16,185,129,0.5)] dark:border-slate-700 dark:bg-slate-950/65">
                  <h3 className="text-xl font-semibold text-emerald-950 dark:text-slate-100">
                    Pro vybrané filtry tu nic není
                  </h3>
                  <p className="mx-auto mt-3 max-w-md text-sm leading-6 text-zinc-600 dark:text-slate-400">
                    Zkuste vypnout některý obchod nebo změnit řazení.
                  </p>
                </div>
              ) : (
                <div className="grid gap-4 xl:grid-cols-2">
                  {visibleProducts.map((product) => {
                    const stores = sortStoresByPrice(product.stores);
                    const isNotOnSale =
                      product.availability === "not_on_sale" ||
                      stores.length === 0;

                    return (
                      <article
                        key={product.url}
                        className="rounded-[2rem] border border-emerald-100 bg-white/90 p-5 shadow-[0_25px_60px_-35px_rgba(16,185,129,0.45)] dark:border-slate-800 dark:bg-slate-950/85 dark:shadow-[0_32px_90px_-48px_rgba(0,0,0,0.92)] sm:p-6"
                      >
                        <div className="flex flex-col gap-5">
                          <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                            <div className="space-y-2">
                              <h3 className="text-xl font-semibold text-zinc-950 dark:text-slate-100">
                                {cleanProductName(product.name)}
                              </h3>
                              <p className="text-sm text-zinc-500 dark:text-slate-400">
                                {isNotOnSale
                                  ? "Produkt jsme našli, ale momentálně není v akci."
                                  : `Dostupné v ${stores.length} obchodech`}
                              </p>
                            </div>
                            <a
                              href={`https://www.kupi.cz${product.url}`}
                              target="_blank"
                              rel="noreferrer"
                              className="inline-flex items-center justify-center rounded-full border border-emerald-200 bg-emerald-50 px-4 py-2 text-sm font-semibold text-emerald-800 transition hover:border-emerald-300 hover:bg-emerald-100 dark:border-slate-700 dark:bg-slate-900 dark:text-emerald-300 dark:hover:border-emerald-500 dark:hover:bg-slate-800"
                            >
                              Detail nabídky
                            </a>
                          </div>

                          {isNotOnSale ? (
                            <div className="rounded-[1.5rem] border border-zinc-100 bg-zinc-50 px-4 py-4 sm:px-5 dark:border-slate-800 dark:bg-slate-900/70">
                              <p className="text-sm text-zinc-600 dark:text-slate-400">
                                Na Kupi existuje detail produktu, ale teď pro něj
                                není dostupná akční cena v letácích.
                              </p>
                            </div>
                          ) : (
                            <ul className="grid gap-3">
                              {stores.map((item, index) => {
                                const cheapest = index === 0;

                                return (
                                  <li
                                    key={`${item.shopId}-${item.price}-${index}`}
                                    className={`rounded-[1.5rem] border px-4 py-4 transition sm:px-5 ${
                                      cheapest
                                        ? "border-emerald-300 bg-emerald-50 shadow-[0_18px_35px_-28px_rgba(5,150,105,0.8)]"
                                        : "border-zinc-100 bg-zinc-50 dark:border-slate-800 dark:bg-slate-900/60"
                                    }`}
                                  >
                                    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                                      <div className="space-y-2">
                                        <div className="flex flex-wrap items-center gap-2">
                                          <span className="text-lg">
                                            {getStoreIcon(item.shopName)}
                                          </span>
                                            <span className="font-semibold text-zinc-800 dark:text-slate-200">
                                            {item.shopName}
                                          </span>
                                          {cheapest && (
                                            <span className="rounded-full bg-emerald-600 px-3 py-1 text-xs font-semibold text-white">
                                              Nejlevnější
                                            </span>
                                          )}
                                        </div>
                                        {(item.validity || item.pricePerUnit) && (
                                          <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-zinc-500">
                                            {item.validity && (
                                              <span>Platnost: {item.validity}</span>
                                            )}
                                            {item.pricePerUnit && (
                                              <span>
                                                Jednotková cena: {item.pricePerUnit}
                                              </span>
                                            )}
                                          </div>
                                        )}
                                      </div>

                                      <div className="flex flex-col items-start gap-3 sm:items-end">
                                        <div className="text-left sm:text-right">
                                          <p
                                            className={`text-xl font-bold ${
                                              cheapest
                                                ? "text-emerald-700"
                                                : "text-zinc-900 dark:text-slate-100"
                                            }`}
                                          >
                                            {item.price}
                                          </p>
                                          {(() => {
                                            const savings = calculateStoreSavings(
                                              item,
                                            );
                                            if (!savings) return null;
                                            return (
                                              <div className="flex flex-col items-end">
                                                <span className="text-xs text-zinc-400 line-through dark:text-slate-500">
                                                  {savings.originalPrice} Kč
                                                </span>
                                                <span
                                                  className={`text-xs font-medium ${
                                                    savings.source === "estimated"
                                                      ? "text-amber-600 dark:text-amber-400"
                                                      : "text-emerald-600 dark:text-emerald-300"
                                                  }`}
                                                >
                                                  {savings.source === "estimated"
                                                    ? "odhad úspory"
                                                    : "ušetříte"}{" "}
                                                  {savings.saving} Kč (
                                                  {savings.pct}%)
                                                </span>
                                              </div>
                                            );
                                          })()}
                                          {item.amount && (
                                            <p className="text-xs text-zinc-500 dark:text-slate-400">
                                              Sleva: {item.amount}
                                            </p>
                                          )}
                                        </div>

                                        {item.leafletUrl && (
                                          <a
                                            href={`https://www.kupi.cz${item.leafletUrl}`}
                                            target="_blank"
                                            rel="noreferrer"
                                            className="inline-flex items-center rounded-full border border-zinc-200 bg-white px-3 py-1.5 text-xs font-semibold text-zinc-700 transition hover:border-emerald-300 hover:text-emerald-700 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 dark:hover:border-emerald-500 dark:hover:text-emerald-300"
                                          >
                                            V letáku
                                          </a>
                                        )}
                                      </div>
                                    </div>
                                  </li>
                                );
                              })}
                            </ul>
                          )}
                        </div>
                      </article>
                    );
                  })}
                </div>
              )}
            </>
          )}

          {!loading && products.length === 0 && <EmptyState hasSearched={hasSearched} />}
        </section>
      </div>
    </main>
  );
}
