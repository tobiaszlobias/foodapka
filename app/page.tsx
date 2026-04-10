"use client";

import Link from "next/link";
import Image from "next/image";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import SearchBar from "@/components/SearchBar";
import { type Product, cleanProductName, sortStoresByPrice } from "@/lib/food";
import { StoreBrand } from "@/components/dashboard/DashboardShared";

export default function HomePage() {
  const router = useRouter();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(false);
  const [hasSearchedDirectly, setHasSearchedDirectly] = useState(false);

  // Force light mode on landing page
  useEffect(() => {
    document.documentElement.dataset.theme = "light";
    document.documentElement.style.colorScheme = "light";
  }, []);

  const handleModeChange = (mode: string) => {
    router.push(`/app?mode=${mode}`);
  };

  const handleDirectResults = (newProducts: Product[]) => {
    if (hasSearchedDirectly) {
      router.push("/app");
      return;
    }
    setProducts(newProducts);
    setHasSearchedDirectly(true);
  };

  const stores = [
    { name: "Albert", logo: "/albertlogo.png" },
    { name: "Lidl", logo: "/lidllogo.png" },
    { name: "Kaufland", logo: "/kauflandlogo.png" },
    { name: "Billa", logo: "/billalogo.png" },
    { name: "Tesco", logo: "/tescologo.png" },
    { name: "Penny", logo: "/pennylogo.png" },
    { name: "Globus", logo: "/globuslogo.png" },
  ];

  return (
    <div className="min-h-screen bg-white text-zinc-900 antialiased overflow-x-hidden">
      {/* Top Navigation Bar */}
      <nav className="fixed top-0 z-50 w-full bg-white/80 backdrop-blur-xl border-b border-zinc-100">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 md:px-8 py-3 md:py-4">
          <div className="text-xl md:text-2xl font-black tracking-tighter text-foodapka-700">foodapka</div>
          <div className="hidden items-center space-x-8 md:flex">
            <Link href="/app?mode=recipes" className="font-bold text-zinc-500 hover:text-foodapka-600 transition-colors">
              Recepty
            </Link>
            <a className="font-bold text-zinc-500 hover:text-foodapka-600 transition-colors" href="#letaky">
              Letáky
            </a>
          </div>
          <Link
            href="/app"
            className="transform rounded-full bg-foodapka-500 px-5 md:px-6 py-2 font-black text-white shadow-lg shadow-foodapka-500/20 transition-all hover:bg-foodapka-600 active:scale-95 text-sm md:text-base"
          >
            Spustit aplikaci
          </Link>
        </div>
      </nav>

      <main className="min-h-screen pt-16 md:pt-20">
        {/* Hero Section */}
        <section className="mx-auto grid max-w-7xl grid-cols-1 items-center gap-8 md:gap-12 px-4 md:px-8 py-10 md:py-16 lg:grid-cols-2">
          <div className="space-y-6 md:space-y-8 text-center lg:text-left">
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-black leading-[1.05] tracking-tight text-zinc-900">
              Ušetřete za nákup <br />
              <span className="text-foodapka-600">dřív, než vyrazíte.</span>
            </h1>
            <p className="text-lg md:text-xl text-zinc-500 max-w-xl mx-auto lg:mx-0 font-medium leading-relaxed">
              Srovnáváme tisíce akčních cen z vašich oblíbených obchodů v reálném čase.
            </p>
            
            <div className="max-w-xl mx-auto lg:mx-0 relative">
              <SearchBar 
                onResults={handleDirectResults}
                onLoading={setLoading}
                mode="search"
                onModeChange={handleModeChange}
              />

              {(loading || products.length > 0) && (
                <div className="mt-6 space-y-3 animate-in fade-in slide-in-from-top-2 duration-500 text-left">
                  {loading ? (
                    <div className="space-y-3">
                      <div className="h-24 rounded-2xl bg-zinc-50 animate-pulse border border-zinc-100" />
                      <div className="h-24 rounded-2xl bg-zinc-50 animate-pulse border border-zinc-100" />
                    </div>
                  ) : (
                    <>
                      <div className="grid gap-2">
                        {products.slice(0, 2).map((product) => (
                          <article 
                            key={product.url} 
                            onClick={() => router.push(`/app?query=${encodeURIComponent(cleanProductName(product.name))}`)}
                            className="rounded-2xl border border-foodapka-100 bg-white p-4 shadow-[0_10px_30px_-10px_rgba(132,204,22,0.15)] cursor-pointer hover:border-foodapka-300 hover:shadow-md transition-all group overflow-hidden"
                          >
                            <div className="flex items-center justify-between gap-4">
                              <div className="min-w-0 flex-1">
                                <h4 className="font-bold text-zinc-900 truncate group-hover:text-foodapka-700 transition-colors max-w-full block">
                                  {cleanProductName(product.name)}
                                </h4>
                                <div className="flex items-center gap-3 mt-2">
                                  <StoreBrand shopName={sortStoresByPrice(product.stores)[0]?.shopName} small />
                                  <span className="text-lg font-black text-foodapka-700">{sortStoresByPrice(product.stores)[0]?.price}</span>
                                </div>
                              </div>
                              <div className="shrink-0 w-8 h-8 rounded-full bg-foodapka-50 flex items-center justify-center group-hover:bg-foodapka-500 group-hover:text-white transition-all">
                                <span className="material-symbols-outlined text-sm">arrow_forward</span>
                              </div>
                            </div>
                          </article>
                        ))}
                      </div>
                      <button 
                        onClick={() => router.push("/app")}
                        className="w-full py-4 rounded-full bg-foodapka-500 text-white font-black text-sm hover:bg-foodapka-600 transition-all shadow-xl shadow-foodapka-500/20 active:scale-[0.98] flex items-center justify-center gap-2"
                      >
                        Více v aplikaci
                        <span className="material-symbols-outlined text-lg">rocket_launch</span>
                      </button>
                    </>
                  )}
                </div>
              )}
            </div>
          </div>

          <div className="relative mt-8 lg:mt-0 px-4 md:px-0">
            <div className="absolute -right-4 md:-right-10 -top-4 md:-top-10 h-40 md:h-80 w-40 md:w-80 rounded-full bg-foodapka-100/50 blur-3xl"></div>
            <div className="relative mx-auto max-w-lg lg:max-w-none">
              <div className="relative h-[350px] md:h-[500px] lg:h-[550px] w-full overflow-hidden rounded-[2.5rem] shadow-2xl shadow-foodapka-900/10">
                <Image
                  src="/hero-food.png"
                  alt="Čerstvé potraviny"
                  fill
                  className="object-cover"
                  priority
                  sizes="(max-width: 768px) 100vw, 50vw"
                />
              </div>
              <div className="absolute -right-2 top-8 md:-right-6 md:top-12 rounded-2xl bg-foodapka-500 px-4 py-3 md:px-6 md:py-4 text-white shadow-2xl transform rotate-12 active:rotate-0 transition-transform">
                <span className="text-xl md:text-3xl font-black tracking-tighter">-35%</span>
              </div>
            </div>
          </div>
        </section>

        {/* Stats + Category Grid */}
        <section className="mx-auto max-w-7xl px-4 md:px-8 pb-16 md:pb-24">
          <div className="grid gap-4 md:gap-6 grid-cols-2 md:grid-cols-6 auto-rows-[180px] md:auto-rows-[240px]">
            {/* Featured Box - Maso */}
            <div className="col-span-2 md:col-span-4 md:row-span-2 group relative overflow-hidden rounded-[2rem] bg-white shadow-xl border border-zinc-100">
              <Image
                src="/maso.png"
                alt="Čerstvé maso"
                fill
                className="object-cover transition-transform duration-700 group-hover:scale-105"
                sizes="(max-width: 768px) 100vw, 66vw"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/10 to-transparent"></div>
              <div className="absolute bottom-6 md:bottom-10 left-6 md:left-10 right-6 md:right-10 text-white">
                <div className="inline-block bg-black/20 backdrop-blur-sm px-6 py-3 rounded-3xl">
                  <p className="text-3xl md:text-5xl font-black leading-tight tracking-tighter">Čerstvé maso za zlomek ceny</p>
                </div>
              </div>
              </div>

            {/* Stat 1 */}
            <div className="col-span-2 md:col-span-2 md:row-span-1 flex flex-col justify-center items-center rounded-[2rem] bg-foodapka-500 p-6 text-center text-white shadow-lg shadow-foodapka-500/20">
              <span className="text-4xl md:text-5xl font-black tracking-tighter leading-none">250 tis.</span>
              <p className="mt-2 text-xs md:text-sm font-bold opacity-90 leading-tight">Cen srovnáno denně</p>
            </div>

            {/* Ovoce a zelenina */}
            <div className="col-span-1 md:col-span-2 md:row-span-1 group relative overflow-hidden rounded-[2rem] bg-white shadow-sm border border-zinc-100">
              <Image
                src="/zeleninaovoce.png"
                alt="Ovoce a zelenina"
                fill
                className="object-cover transition-transform duration-500 group-hover:scale-105"
                sizes="33vw"
              />
              <div className="absolute inset-0 bg-black/10 group-hover:bg-black/20 transition-colors"></div>
              <div className="absolute inset-0 flex items-center justify-center p-4">
                <div className="bg-black/20 backdrop-blur-sm px-4 py-2 rounded-2xl text-white font-black text-lg md:text-xl tracking-tighter text-center">Ovoce & Zelenina</div>
              </div>
            </div>

            {/* Mléčné výrobky */}
            <div className="col-span-1 md:col-span-2 md:row-span-1 group relative overflow-hidden rounded-[2rem] bg-white shadow-sm border border-zinc-100">
              <Image
                src="/mlecnevyrobky.png"
                alt="Mléčné výrobky"
                fill
                className="object-cover transition-transform duration-500 group-hover:scale-105"
                sizes="33vw"
              />
              <div className="absolute inset-0 bg-black/10 group-hover:bg-black/20 transition-colors"></div>
              <div className="absolute inset-0 flex items-center justify-center p-4">
                <div className="bg-black/20 backdrop-blur-sm px-4 py-2 rounded-2xl text-white font-black text-lg md:text-xl tracking-tighter text-center leading-none">Mléčné výrobky</div>
              </div>
            </div>

            {/* Stat 2 */}
            <div className="col-span-2 md:col-span-2 md:row-span-1 flex flex-col justify-center items-center rounded-[2rem] bg-zinc-900 p-6 text-center text-white shadow-xl">
              <span className="text-5xl font-black tracking-tighter text-foodapka-400">10+</span>
              <p className="mt-1 text-sm font-bold opacity-80">Řetězců v kapse</p>
            </div>
          </div>
        </section>

        {/* Store Leaflets Carousel - INFINITE SCROLL FIXED */}
        <section id="letaky" className="bg-zinc-50 py-20 border-y border-zinc-100 overflow-hidden">
          <div className="mx-auto max-w-7xl px-4 md:px-8 mb-12 text-center">
            <h2 className="text-3xl md:text-4xl font-black text-zinc-900 tracking-tight">Aktuální letáky v aplikaci</h2>
            <p className="mt-3 text-zinc-500 font-medium">Každý den procházíme ty nejoblíbenější obchody</p>
          </div>
          
          <div className="relative flex overflow-hidden group">
            <div className="flex gap-8 animate-scroll whitespace-nowrap py-4 px-4">
              {/* First loop */}
              {stores.map((store, i) => (
                <div
                  key={`${store.name}-1-${i}`}
                  className="flex-shrink-0 w-[220px] flex flex-col items-center justify-center rounded-[2rem] bg-white p-8 border border-zinc-100 transition-all hover:shadow-xl hover:-translate-y-2 cursor-pointer"
                >
                  <Image src={store.logo} alt={`${store.name} logo`} width={80} height={80} className="h-16 w-auto object-contain transition-transform group-hover:scale-110" />
                  <p className="mt-4 font-black text-zinc-800 text-lg tracking-tight">{store.name}</p>
                </div>
              ))}
              {/* Second loop for seamless infinite scroll */}
              {stores.map((store, i) => (
                <div
                  key={`${store.name}-2-${i}`}
                  className="flex-shrink-0 w-[220px] flex flex-col items-center justify-center rounded-[2rem] bg-white p-8 border border-zinc-100 transition-all hover:shadow-xl hover:-translate-y-2 cursor-pointer"
                >
                  <Image src={store.logo} alt={`${store.name} logo`} width={80} height={80} className="h-16 w-auto object-contain transition-transform group-hover:scale-110" />
                  <p className="mt-4 font-black text-zinc-800 text-lg tracking-tight">{store.name}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="py-20 md:py-32 bg-white text-center">
          <div className="mx-auto max-w-4xl px-6">
            <h2 className="text-4xl md:text-7xl font-black text-zinc-900 tracking-tighter">
              Přestaňte přeplácet.
            </h2>
            <p className="mx-auto mt-6 max-w-2xl text-lg md:text-2xl text-zinc-500 font-medium leading-relaxed">
              Začněte šetřit hned teď. Zdarma, bez registrace a otravných reklam.
            </p>
            <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4 md:gap-6">
              <Link
                href="/app"
                className="w-full sm:w-auto flex items-center justify-center gap-3 rounded-full bg-foodapka-500 px-10 py-5 md:px-12 md:py-6 font-black text-white shadow-2xl shadow-foodapka-500/40 transition hover:bg-foodapka-600 active:scale-95 text-lg"
              >
                <span className="material-symbols-outlined text-2xl">rocket_launch</span>
                Spustit foodapku
              </Link>
              <Link
                href="/app?mode=recipes"
                className="w-full sm:w-auto flex items-center justify-center gap-3 rounded-full border-2 border-zinc-900 bg-white px-10 py-5 md:px-12 md:py-6 font-black text-zinc-900 transition hover:bg-zinc-50 active:scale-95 text-lg"
              >
                <span className="material-symbols-outlined text-2xl">restaurant</span>
                Chci recepty
              </Link>
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="w-full bg-zinc-50 text-sm border-t border-zinc-100 py-16">
        <div className="mx-auto flex max-w-7xl flex-col items-center justify-between px-8 md:flex-row">
          <div className="mb-10 md:mb-0 text-center md:text-left">
            <div className="text-2xl font-black tracking-tighter text-foodapka-800">foodapka</div>
            <p className="max-w-xs text-zinc-500 mt-2 font-medium">
              Chytrý nákup pro každou českou domácnost.
            </p>
          </div>
          <div className="flex gap-16">
            <div className="flex flex-col space-y-3">
              <span className="font-black text-zinc-900 uppercase text-xs tracking-widest mb-2">Aplikace</span>
              <Link href="/app" className="font-bold text-zinc-500 hover:text-foodapka-600 transition-colors">Vyhledávač</Link>
              <Link href="/app?mode=recipes" className="font-bold text-zinc-500 hover:text-foodapka-600 transition-colors">Recepty</Link>
            </div>
            <div className="flex flex-col space-y-3">
              <span className="font-black text-zinc-900 uppercase text-xs tracking-widest mb-2">Právní</span>
              <a className="font-bold text-zinc-500 hover:text-foodapka-600 transition-colors" href="#">Soukromí</a>
              <a className="font-bold text-zinc-500 hover:text-foodapka-600 transition-colors" href="#">Podmínky</a>
            </div>
          </div>
        </div>
        <div className="mx-auto max-w-7xl border-t border-zinc-200/50 px-8 py-8 mt-16 text-center text-zinc-400 text-xs font-bold uppercase tracking-widest">
          © 2026 foodapka. Všechna práva vyhrazena.
        </div>
      </footer>
    </div>
  );
}
