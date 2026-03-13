import SearchBar from "@/components/SearchBar";
import { products } from "@/data/mockProducts";

export default function Home() {
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
          <SearchBar />
        </section>

        <section className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold sm:text-2xl">Popularni produkty</h2>
            <p className="text-sm text-zinc-500">{products.length} polozky</p>
          </div>

          <div className="grid gap-4">
            {products.map((product) => (
              <article
                key={product.id}
                className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm"
              >
                <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                  <div>
                    <h3 className="text-lg font-semibold">{product.name}</h3>
                    <p className="text-sm text-zinc-500">
                      Dostupne v {product.stores.length} obchodech
                    </p>
                  </div>

                  <ul className="grid gap-2 sm:min-w-64">
                    {product.stores.map((item) => (
                      <li
                        key={`${product.id}-${item.store}`}
                        className="flex items-center justify-between rounded-xl bg-zinc-50 px-4 py-3 text-sm"
                      >
                        <span className="font-medium text-zinc-700">
                          {item.store}
                        </span>
                        <span className="font-semibold text-emerald-700">
                          {item.price.toFixed(2)} Kc
                        </span>
                      </li>
                    ))}
                  </ul>
                </div>
              </article>
            ))}
          </div>
        </section>
      </div>
    </main>
  );
}
