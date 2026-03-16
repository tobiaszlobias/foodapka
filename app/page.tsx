"use client";

import SearchBar from "@/components/SearchBar";
import SiteHeader from "@/components/SiteHeader";
import {
  cleanProductName,
  getStoreIcon,
  sortStoresByPrice,
  type Product,
} from "@/lib/food";
import { useState } from "react";

function LoadingCards() {
  return (
    <div className="grid gap-4">
      {Array.from({ length: 3 }).map((_, index) => (
        <article
          key={index}
          className="overflow-hidden rounded-[2rem] border border-emerald-100 bg-white/90 p-5 shadow-[0_20px_50px_-30px_rgba(16,185,129,0.4)]"
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
                    <div className="h-4 w-24 rounded-full bg-zinc-200" />
                    <div className="h-3 w-16 rounded-full bg-zinc-100" />
                  </div>
                  <div className="space-y-2">
                    <div className="h-4 w-20 rounded-full bg-emerald-100" />
                    <div className="h-3 w-24 rounded-full bg-zinc-100" />
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
    <div className="rounded-[2rem] border border-dashed border-emerald-200 bg-white/70 px-6 py-12 text-center shadow-[0_20px_40px_-35px_rgba(16,185,129,0.5)]">
      <div className="mx-auto mb-5 flex h-20 w-20 items-center justify-center rounded-full bg-emerald-100 text-4xl">
        {hasSearched ? "🧺" : "🥬"}
      </div>
      <h2 className="text-xl font-semibold text-emerald-950">
        {hasSearched ? "Nic jsme nenašli" : "Začněte hledat výhodnější nákup"}
      </h2>
      <p className="mx-auto mt-3 max-w-md text-sm leading-6 text-zinc-600">
        {hasSearched
          ? "Zkuste jiný název produktu nebo obecnější výraz. Výsledky taháme z aktuálních akčních letáků."
          : "Zadejte název potraviny a foodapka vám ukáže akční ceny napříč obchody seřazené od nejlevnější nabídky."}
      </p>
    </div>
  );
}

export default function Home() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);

  return (
    <main className="min-h-screen bg-[radial-gradient(circle_at_top,_rgba(110,231,183,0.28),_transparent_40%),linear-gradient(180deg,_#ecfdf5_0%,_#f8fafc_48%,_#f5f7f6_100%)] px-4 py-6 text-zinc-900 sm:px-6 lg:px-8">
      <div className="mx-auto flex max-w-6xl flex-col gap-8">
        <section className="overflow-hidden rounded-[2rem] border border-white/60 bg-[linear-gradient(135deg,_rgba(236,253,245,0.92),_rgba(209,250,229,0.88)_42%,_rgba(167,243,208,0.78)_100%)] p-5 shadow-[0_30px_90px_-40px_rgba(5,150,105,0.55)] sm:p-8 lg:p-10">
          <div className="absolute inset-x-0 top-0 -z-10 h-32 bg-[radial-gradient(circle,_rgba(16,185,129,0.18),_transparent_70%)] blur-3xl" />
          <SiteHeader current="home" />
          <div className="mt-10 grid gap-8 lg:grid-cols-[minmax(0,1.2fr)_minmax(280px,0.8fr)] lg:items-end">
            <div className="space-y-5">
              <div className="space-y-4">
                <h1 className="max-w-3xl text-4xl font-bold tracking-tight text-emerald-950 sm:text-5xl lg:text-6xl">
                  Najděte nejlevnější akční cenu dřív, než vyrazíte do obchodu.
                </h1>
                <p className="max-w-2xl text-base leading-7 text-emerald-950/75 sm:text-lg">
                  foodapka prochází aktuální nabídky a ukáže vám, kde dnes
                  vychází konkrétní produkt nejlépe. Výsledek je přehledný,
                  rychlý a připravený i pro mobil.
                </p>
              </div>
              <SearchBar
                onResults={setProducts}
                onLoading={setLoading}
                onSearchStart={() => setHasSearched(true)}
              />
            </div>

            <div className="grid gap-4 rounded-[1.75rem] border border-white/60 bg-white/65 p-4 backdrop-blur sm:grid-cols-3 lg:grid-cols-1">
              {[
                ["5", "nejrelevantnějších produktů"],
                ["7+", "sledovaných řetězců"],
                ["Denně", "aktualizované akční nabídky"],
              ].map(([value, label]) => (
                <div
                  key={label}
                  className="rounded-[1.4rem] bg-emerald-950 px-4 py-5 text-white shadow-sm"
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
              <h2 className="text-2xl font-semibold tracking-tight text-emerald-950 sm:text-3xl">
                Výsledky hledání
              </h2>
              <p className="mt-1 text-sm text-zinc-600">
                Obchody jsou uvnitř každé karty řazené od nejlevnější ceny.
              </p>
            </div>
            {!loading && products.length > 0 && (
              <p className="rounded-full border border-emerald-200 bg-white px-4 py-2 text-sm font-medium text-emerald-800">
                {products.length} produktů
              </p>
            )}
          </div>

          {loading && <LoadingCards />}

          {!loading && products.length > 0 && (
            <div className="grid gap-4">
              {products.map((product) => {
                const stores = sortStoresByPrice(product.stores);

                return (
                  <article
                    key={product.url}
                    className="rounded-[2rem] border border-emerald-100 bg-white/90 p-5 shadow-[0_25px_60px_-35px_rgba(16,185,129,0.45)] sm:p-6"
                  >
                    <div className="flex flex-col gap-5">
                      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                        <div className="space-y-2">
                          <h3 className="text-xl font-semibold text-zinc-950">
                            {cleanProductName(product.name)}
                          </h3>
                          <p className="text-sm text-zinc-500">
                            Dostupné v {stores.length} obchodech
                          </p>
                        </div>
                        <a
                          href={`https://www.kupi.cz${product.url}`}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex items-center justify-center rounded-full border border-emerald-200 bg-emerald-50 px-4 py-2 text-sm font-semibold text-emerald-800 transition hover:border-emerald-300 hover:bg-emerald-100"
                        >
                          Detail nabídky
                        </a>
                      </div>

                      <ul className="grid gap-3">
                        {stores.map((item, index) => {
                          const cheapest = index === 0;

                          return (
                            <li
                              key={`${item.shopId}-${item.price}-${index}`}
                              className={`rounded-[1.5rem] border px-4 py-4 transition sm:px-5 ${
                                cheapest
                                  ? "border-emerald-300 bg-emerald-50 shadow-[0_18px_35px_-28px_rgba(5,150,105,0.8)]"
                                  : "border-zinc-100 bg-zinc-50"
                              }`}
                            >
                              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                                <div className="space-y-2">
                                  <div className="flex flex-wrap items-center gap-2">
                                    <span className="text-lg">
                                      {getStoreIcon(item.shopName)}
                                    </span>
                                    <span className="font-semibold text-zinc-800">
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
                                        <span>Jednotková cena: {item.pricePerUnit}</span>
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
                                          : "text-zinc-900"
                                      }`}
                                    >
                                      {item.price}
                                    </p>
                                    {item.amount && (
                                      <p className="text-xs text-zinc-500">
                                        Sleva: {item.amount}
                                      </p>
                                    )}
                                  </div>

                                  {item.leafletUrl && (
                                    <a
                                      href={`https://www.kupi.cz${item.leafletUrl}`}
                                      target="_blank"
                                      rel="noreferrer"
                                      className="inline-flex items-center rounded-full border border-zinc-200 bg-white px-3 py-1.5 text-xs font-semibold text-zinc-700 transition hover:border-emerald-300 hover:text-emerald-700"
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
                    </div>
                  </article>
                );
              })}
            </div>
          )}

          {!loading && products.length === 0 && <EmptyState hasSearched={hasSearched} />}
        </section>
      </div>
    </main>
  );
}
