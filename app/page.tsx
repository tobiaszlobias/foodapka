"use client";
import { useState } from "react";
import SearchBar from "@/components/SearchBar";

type Store = {
  shopId: string;
  shopName: string;
  price: string;
  pricePerUnit: string;
  amount: string;
  validity: string;
  leafletUrl: string;
};

type Product = { name: string; url: string; stores: Store[] };

export default function Home() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(false);

  return (
    <main className="min-h-screen bg-zinc-50 px-4 py-10 text-zinc-900 sm:px-6 lg:px-8">
      <div className="mx-auto flex max-w-5xl flex-col gap-8">
        <section className="space-y-4">
          <span className="inline-flex rounded-full bg-emerald-100 px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-emerald-700">
            Srovnani cen potravin
          </span>
          <div className="space-y-3">
            <h1 className="text-4xl font-bold tracking-tight sm:text-5xl">
              Porovnejte ceny potravin napric oblibenymi obchody
            </h1>
            <p className="max-w-2xl text-sm text-zinc-600 sm:text-base">
              Vyhledejte produkty a rychle zjistete, kde bezne potraviny
              nakoupite levneji.
            </p>
          </div>
          <SearchBar onResults={setProducts} onLoading={setLoading} />
        </section>

        <section className="space-y-4">
          {loading && (
            <p className="text-sm text-zinc-500">Načítám výsledky...</p>
          )}

          {!loading && products.length > 0 && (
            <>
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-semibold sm:text-2xl">Výsledky</h2>
                <p className="text-sm text-zinc-500">
                  {products.length} produktů
                </p>
              </div>
              <div className="grid gap-4">
                {products.map((product) => (
                  <article
                    key={product.url}
                    className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm"
                  >
                    <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                      <div>
                        <h3 className="text-lg font-semibold">
                          {product.name.replace("Aktuální akční slevy ", "")}
                        </h3>
                        <p className="text-sm text-zinc-500">
                          Dostupne v {product.stores.length} obchodech
                        </p>

                        <a
                          href={`https://www.kupi.cz${product.url}`}
                          target="_blank"
                          className="text-xs text-emerald-600 hover:underline"
                        >
                          Zobrazit na Kupi.cz →
                        </a>
                      </div>
                      <ul className="grid gap-2 sm:min-w-72">
                        {product.stores.map((item, i) => (
                          <li
                            key={i}
                            className="flex items-center justify-between rounded-xl bg-zinc-50 px-4 py-3 text-sm"
                          >
                            <div className="flex flex-col">
                              <span className="font-medium text-zinc-700">
                                {item.shopName}
                              </span>
                              {item.validity && (
                                <span className="text-xs text-zinc-400">
                                  {item.validity}
                                </span>
                              )}
                            </div>
                            <div className="flex flex-col items-end gap-1">
                              <span className="font-semibold text-emerald-700">
                                {item.price}
                              </span>
                              {item.pricePerUnit && (
                                <span className="text-xs text-zinc-400">
                                  {item.pricePerUnit}
                                </span>
                              )}
                              {item.leafletUrl && (
                                <a
                                  href={`https://www.kupi.cz${item.leafletUrl}`}
                                  target="_blank"
                                  className="text-xs text-emerald-600 hover:underline"
                                >
                                  V letáku →
                                </a>
                              )}
                            </div>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </article>
                ))}
              </div>
            </>
          )}

          {!loading && products.length === 0 && (
            <p className="text-sm text-zinc-500">
              Zadejte produkt a stiskněte Hledat.
            </p>
          )}
        </section>
      </div>
    </main>
  );
}
