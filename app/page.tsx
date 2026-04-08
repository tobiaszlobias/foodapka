"use client";

import Link from "next/link";
import Image from "next/image";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";

export default function HomePage() {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState("");

  // Force light mode on landing page
  useEffect(() => {
    document.documentElement.dataset.theme = "light";
    document.documentElement.style.colorScheme = "light";
  }, []);

  function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    if (searchQuery.trim()) {
      router.push(`/app?query=${encodeURIComponent(searchQuery.trim())}`);
    }
  }

  return (
    <div className="min-h-screen bg-surface text-on-surface antialiased overflow-x-hidden">
      {/* Top Navigation Bar */}
      <nav className="fixed top-0 z-50 w-full bg-white/80 backdrop-blur-xl border-b border-foodapka-100">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 md:px-8 py-3 md:py-4">
          <div className="text-xl md:text-2xl font-bold tracking-tight text-foodapka-700">foodapka</div>
          <div className="hidden items-center space-x-8 md:flex">
            <Link href="/recepty" className="font-semibold text-zinc-600 hover:text-foodapka-600 transition-colors">
              Recepty
            </Link>
            <a className="text-zinc-600 transition-all duration-300 hover:text-foodapka-600" href="#letaky">
              Letáky
            </a>
            <a className="text-zinc-600 transition-all duration-300 hover:text-foodapka-600" href="#funkce">
              Funkce
            </a>
          </div>
          <Link
            href="/app"
            className="transform rounded-full bg-foodapka-500 px-4 md:px-6 py-2 md:py-2.5 text-sm md:text-base font-semibold text-white shadow-md transition-all duration-300 hover:bg-foodapka-600 active:scale-95"
          >
            Spustit
          </Link>
        </div>
      </nav>

      <main className="min-h-screen pt-20 md:pt-24">
        {/* Hero Section */}
        <section className="mx-auto grid max-w-7xl grid-cols-1 items-center gap-8 md:gap-12 px-4 md:px-8 py-10 md:py-16 lg:grid-cols-2">
          <div className="space-y-6 md:space-y-8 text-center lg:text-left">
            <h1 className="text-3xl md:text-5xl lg:text-6xl font-extrabold leading-[1.15] md:leading-[1.1] tracking-tight text-black">
              Najděte nejlevnější akční cenu <span className="text-foodapka-600">dřív</span>, než vyrazíte do obchodu.
            </h1>
            <form onSubmit={handleSearch} className="group relative max-w-xl mx-auto lg:mx-0">
              <div className="flex flex-col sm:flex-row rounded-2xl sm:rounded-full bg-white p-1.5 shadow-[0px_20px_40px_rgba(0,33,20,0.08)] ring-1 ring-outline-variant/10">
                <input
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="flex-grow border-none bg-transparent px-6 py-3 md:py-4 text-base md:text-lg text-on-surface placeholder:text-outline focus:outline-none focus:ring-0"
                  placeholder="Co dnes nakoupíte?"
                  type="text"
                />
                <button
                  type="submit"
                  className="flex items-center justify-center gap-2 rounded-xl sm:rounded-full bg-primary px-6 md:px-8 py-3 md:py-4 font-bold text-white transition-all duration-300 hover:bg-primary-container active:scale-95"
                >
                  <span className="material-symbols-outlined text-xl">search</span>
                  <span>Hledat</span>
                </button>
              </div>
            </form>
            <div className="flex items-center justify-center lg:justify-start gap-3 font-medium text-secondary text-sm md:text-base">
              <span
                className="material-symbols-outlined text-primary"
                style={{ fontVariationSettings: "'FILL' 1" }}
              >
                verified
              </span>
              <span>Aktuální ceny z vašich oblíbených obchodů</span>
            </div>
          </div>

          {/* Hero Image - Optimized with priority */}
          <div className="relative mt-8 lg:mt-0 px-4 md:px-0">
            <div className="absolute -right-4 md:-right-10 -top-4 md:-top-10 h-40 md:h-80 w-40 md:w-80 rounded-full bg-primary/10 blur-3xl"></div>
            <div className="relative mx-auto max-w-lg lg:max-w-none">
              <div className="relative h-[300px] md:h-[500px] w-full overflow-hidden rounded-2xl md:rounded-3xl shadow-2xl">
                <Image
                  src="/hero-food.png"
                  alt="Čerstvé potraviny"
                  fill
                  className="object-cover"
                  priority
                  sizes="(max-width: 768px) 100vw, 50vw"
                />
              </div>
              {/* Floating ingredients card */}
              <div className="absolute -bottom-4 -left-2 md:-bottom-6 md:-left-6 rounded-xl md:rounded-2xl bg-white p-3 md:p-5 shadow-xl border border-foodapka-100 max-w-[200px] md:max-w-none z-10">
                <p className="mb-2 md:mb-3 text-[10px] md:text-xs font-bold uppercase tracking-wider text-primary">Ingredience v akci</p>
                <div className="flex flex-wrap gap-1.5 md:gap-2">
                  <span className="rounded-full bg-red-50 px-2 py-0.5 md:px-3 md:py-1 text-[10px] md:text-sm">🍅 Rajčata</span>
                  <span className="rounded-full bg-green-50 px-2 py-0.5 md:px-3 md:py-1 text-[10px] md:text-sm">🧀 Sýr</span>
                </div>
                <p className="mt-2 md:mt-3 text-xs md:text-sm text-on-surface-variant">
                  Ušetříte <span className="font-bold text-primary">47 Kč</span>
                </p>
              </div>
              {/* Floating savings badge */}
              <div className="absolute -right-2 top-4 md:-right-4 md:top-8 rounded-full bg-foodapka-600 px-3 md:px-4 py-1.5 md:py-2 text-white shadow-lg text-xs md:text-base font-black z-10">
                -35%
              </div>
            </div>
          </div>
        </section>

        {/* Stats + Popular Products - Optimized images */}
        <section className="mx-auto max-w-7xl px-4 md:px-8 pb-10 md:pb-16">
          <div className="grid gap-4 md:gap-6 grid-cols-2 md:grid-cols-6 auto-rows-[160px] md:auto-rows-[200px]">
            {/* Stat 1 */}
            <div className="col-span-2 md:col-span-2 md:row-span-1 group relative flex flex-col justify-between overflow-hidden rounded-2xl bg-zinc-50 p-5 md:p-6 border border-zinc-100">
              <div className="relative z-10">
                <span className="text-4xl md:text-5xl font-bold tracking-tighter text-primary">5 mil.</span>
                <p className="mt-1 text-sm md:text-base font-semibold text-on-surface-variant">Porovnaných produktů</p>
              </div>
              <div className="absolute -bottom-4 -right-4 transform opacity-10 transition-transform duration-500 group-hover:scale-110 text-primary">
                <span className="material-symbols-outlined text-[6rem] md:text-[8rem]">shopping_basket</span>
              </div>
            </div>
            
            {/* Pečivo */}
            <div className="col-span-1 md:col-span-2 md:row-span-2 group relative overflow-hidden rounded-2xl bg-white shadow-sm border border-zinc-100">
              <Image
                src="/pecivo.png"
                alt="Čerstvé pečivo"
                fill
                className="object-cover transition-transform duration-500 group-hover:scale-105"
                sizes="(max-width: 768px) 50vw, 33vw"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent"></div>
              <div className="absolute bottom-4 left-4 right-4 text-white">
                <p className="text-[10px] md:text-sm opacity-80 uppercase font-black">Pečivo</p>
              </div>
            </div>

            {/* Ovoce a zelenina */}
            <div className="col-span-1 md:col-span-2 md:row-span-1 group relative overflow-hidden rounded-2xl bg-white shadow-sm border border-zinc-100">
              <Image
                src="/zeleninaovoce.png"
                alt="Ovoce a zelenina"
                fill
                className="object-cover transition-transform duration-500 group-hover:scale-105"
                sizes="(max-width: 768px) 50vw, 33vw"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent"></div>
              <div className="absolute bottom-4 left-4 right-4 text-white text-xs md:text-base font-bold">
                Ovoce
              </div>
            </div>

            {/* Stat 2 */}
            <div className="col-span-1 md:col-span-2 md:row-span-1 flex flex-col items-center justify-center rounded-2xl bg-foodapka-100 p-4 md:p-6 text-center border border-foodapka-200">
              <span className="text-3xl md:text-4xl font-extrabold text-foodapka-800">7+</span>
              <p className="mt-1 text-[10px] md:text-sm font-semibold text-foodapka-700">
                Řetězců
              </p>
            </div>

            {/* Maso */}
            <div className="col-span-2 md:col-span-4 md:row-span-2 group relative overflow-hidden rounded-2xl bg-white shadow-lg border border-zinc-100">
              <Image
                src="/maso.png"
                alt="Čerstvé maso"
                fill
                className="object-cover transition-transform duration-500 group-hover:scale-105"
                sizes="(max-width: 768px) 100vw, 66vw"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent"></div>
              <div className="absolute bottom-5 left-5 right-5 text-white">
                <p className="text-2xl md:text-4xl font-bold">Čerstvé maso</p>
                <p className="hidden md:block text-sm opacity-80 mt-2">Široký sortiment masa z prověřených zdrojů</p>
              </div>
            </div>
          </div>
        </section>

        {/* User Journey Section */}
        <section className="mx-auto max-w-7xl px-4 md:px-8 py-16 md:py-24">
          <div className="mb-10 md:mb-12 text-center">
            <h2 className="text-3xl md:text-5xl font-black tracking-tight text-zinc-900 mb-3 md:mb-4 px-2">Vaše cesta k úspoře</h2>
            <p className="text-base md:text-lg text-zinc-600 max-w-2xl mx-auto">Od výběru surovin až po první sousto.</p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 md:gap-16 items-center">
            {/* Left Side - Hero Image */}
            <div className="relative aspect-[4/3] md:aspect-square rounded-2xl md:rounded-3xl overflow-hidden shadow-2xl group">
              <Image
                alt="Myšlenková mapa foodapka"
                fill
                className="object-cover object-center group-hover:scale-105 transition-transform duration-700"
                src="/myslenkova mapa hero.png"
                sizes="(max-width: 1024px) 100vw, 50vw"
              />
              <div className="absolute inset-0 bg-gradient-to-br from-foodapka-600/20 via-transparent to-black/30"></div>
            </div>

            {/* Right Side - Steps */}
            <div className="relative flex flex-col gap-6 md:gap-8 px-2 md:px-0">
              {/* Step 1 */}
              <div className="flex items-center gap-4 md:gap-6 group">
                <div className="flex-shrink-0 w-12 h-12 md:w-16 md:h-16 bg-gradient-to-br from-foodapka-400 to-foodapka-600 text-white rounded-xl md:rounded-2xl flex items-center justify-center shadow-lg transition-all">
                  <span className="material-symbols-outlined text-2xl md:text-3xl">shopping_cart</span>
                </div>
                <div>
                  <h3 className="text-lg md:text-2xl font-bold text-zinc-900">Nákup s Foodapkou</h3>
                  <p className="text-xs md:text-sm text-zinc-600">Najdeme nejvýhodnější nabídky v okolí.</p>
                </div>
              </div>

              {/* Step 2 */}
              <div className="flex items-center gap-4 md:gap-6 group">
                <div className="flex-shrink-0 w-12 h-12 md:w-16 md:h-16 bg-gradient-to-br from-foodapka-500 to-foodapka-700 text-white rounded-xl md:rounded-2xl flex items-center justify-center shadow-lg transition-all">
                  <span className="material-symbols-outlined text-2xl md:text-3xl">home</span>
                </div>
                <div>
                  <h3 className="text-lg md:text-2xl font-bold text-zinc-900">Příprava jídla</h3>
                  <p className="text-xs md:text-sm text-zinc-600">S našimi recepty je vaření radost, ne starost.</p>
                </div>
              </div>

              {/* Step 3 */}
              <div className="flex items-center gap-4 md:gap-6 group">
                <div className="flex-shrink-0 w-12 h-12 md:w-16 md:h-16 bg-gradient-to-br from-foodapka-600 to-foodapka-800 text-white rounded-xl md:rounded-2xl flex items-center justify-center shadow-lg transition-all">
                  <span className="material-symbols-outlined text-2xl md:text-3xl" style={{ fontVariationSettings: "'FILL' 1" }}>favorite</span>
                </div>
                <div>
                  <h3 className="text-lg md:text-2xl font-bold text-zinc-900">Hotové jídlo</h3>
                  <p className="text-xs md:text-sm text-zinc-600">Vychutnejte si zdravé jídlo s rodinou.</p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Store Leaflets */}
        <section id="letaky" className="bg-zinc-50 py-16 md:py-20 border-y border-zinc-100">
          <div className="mx-auto max-w-7xl px-4 md:px-8">
            <div className="mb-10 text-center">
              <h2 className="text-2xl md:text-4xl font-bold text-zinc-900">Aktuální letáky</h2>
              <p className="mt-2 text-zinc-500 text-sm md:text-base">
                Procházíme letáky z nejoblíbenějších obchodů
              </p>
            </div>
            
            <div className="flex gap-4 overflow-x-auto no-scrollbar pb-4 -mx-4 px-4 md:mx-0 md:px-0 md:grid md:grid-cols-4 lg:grid-cols-7">
              {[
                { name: "Albert", logo: "/albertlogo.png" },
                { name: "Lidl", logo: "/lidllogo.png" },
                { name: "Kaufland", logo: "/kauflandlogo.png" },
                { name: "Billa", logo: "/billalogo.png" },
                { name: "Tesco", logo: "/tescologo.png" },
                { name: "Penny", logo: "/pennylogo.png" },
                { name: "Globus", logo: "/globuslogo.png" },
              ].map((store) => (
                <div
                  key={store.name}
                  className="flex-shrink-0 w-32 md:w-auto flex flex-col items-center justify-center rounded-2xl bg-white p-5 border border-zinc-100 transition-all hover:shadow-md"
                >
                  <Image
                    src={store.logo}
                    alt={`${store.name} logo`}
                    width={60}
                    height={60}
                    className="h-12 w-auto object-contain transition-transform group-hover:scale-110"
                  />
                  <p className="mt-3 font-bold text-zinc-800 text-sm">{store.name}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="py-16 md:py-24 bg-white text-center">
          <div className="mx-auto max-w-4xl px-6">
            <h2 className="text-3xl md:text-5xl font-black text-zinc-900">
              Připraveni ušetřit?
            </h2>
            <p className="mx-auto mt-4 md:mt-6 max-w-2xl text-base md:text-lg text-zinc-600">
              Začněte hledat a porovnávat ceny ještě dnes. Zdarma a bez registrace.
            </p>
            <div className="mt-8 md:mt-10 flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link
                href="/app"
                className="w-full sm:w-auto flex items-center justify-center gap-3 rounded-full bg-foodapka-500 px-8 py-4 font-bold text-white shadow-lg transition hover:bg-foodapka-600 active:scale-95"
              >
                <span className="material-symbols-outlined">search</span>
                Spustit vyhledávač
              </Link>
              <Link
                href="/recepty"
                className="w-full sm:w-auto flex items-center justify-center gap-3 rounded-full border-2 border-zinc-200 bg-white px-8 py-4 font-bold text-zinc-700 transition hover:bg-zinc-50 active:scale-95"
              >
                <span className="material-symbols-outlined">restaurant</span>
                Zobrazit recepty
              </Link>
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="w-full bg-zinc-50 text-sm leading-relaxed border-t border-zinc-100">
        <div className="mx-auto flex max-w-7xl flex-col items-center justify-between px-8 py-12 md:flex-row">
          <div className="mb-8 space-y-3 md:mb-0 text-center md:text-left">
            <div className="text-xl font-bold text-foodapka-800">foodapka</div>
            <p className="max-w-xs text-zinc-500">
              Pomáháme českým domácnostem nakupovat chytře každý den.
            </p>
          </div>
          <div className="flex gap-10">
            <div className="flex flex-col space-y-2">
              <span className="mb-1 font-bold text-zinc-900 uppercase text-xs tracking-wider">Aplikace</span>
              <Link href="/app" className="text-zinc-500 hover:text-foodapka-600 transition-colors">Vyhledávač</Link>
              <Link href="/recepty" className="text-zinc-500 hover:text-foodapka-600 transition-colors">Recepty</Link>
            </div>
            <div className="flex flex-col space-y-2">
              <span className="mb-1 font-bold text-zinc-900 uppercase text-xs tracking-wider">Právní</span>
              <a className="text-zinc-500 hover:text-foodapka-600 transition-colors" href="#">Ochrana údajů</a>
              <a className="text-zinc-500 hover:text-foodapka-600 transition-colors" href="#">Podmínky</a>
            </div>
          </div>
        </div>
        <div className="mx-auto max-w-7xl border-t border-zinc-200/50 px-8 py-6 text-center text-zinc-400 text-xs">
          © 2026 foodapka. Všechna práva vyhrazena.
        </div>
      </footer>
    </div>
  );
}
