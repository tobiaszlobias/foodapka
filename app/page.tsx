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
            <Link href="/recepty" className="font-bold text-zinc-500 hover:text-foodapka-600 transition-colors">
              Recepty
            </Link>
            <a className="font-bold text-zinc-500 hover:text-foodapka-600 transition-colors" href="#letaky">
              Letáky
            </a>
          </div>
          <Link
            href="/app"
            className="transform rounded-full bg-foodapka-500 px-5 md:px-6 py-2 font-bold text-white shadow-lg shadow-foodapka-500/20 transition-all hover:bg-foodapka-600 active:scale-95 text-sm md:text-base"
          >
            Spustit aplikaci
          </Link>
        </div>
      </nav>

      <main className="min-h-screen pt-20 md:pt-24">
        {/* Hero Section */}
        <section className="mx-auto grid max-w-7xl grid-cols-1 items-center gap-8 md:gap-12 px-4 md:px-8 py-10 md:py-20 lg:grid-cols-2">
          <div className="space-y-6 md:space-y-8 text-center lg:text-left">
            <h1 className="text-4xl md:text-6xl lg:text-7xl font-black leading-[1.05] tracking-tight text-zinc-900">
              Ušetřete za nákup <br />
              <span className="text-foodapka-600">dřív, než vyrazíte.</span>
            </h1>
            <p className="text-lg md:text-xl text-zinc-500 max-w-xl mx-auto lg:mx-0 font-medium">
              Srovnáváme tisíce akčních cen z vašich oblíbených obchodů v reálném čase.
            </p>
            <form onSubmit={handleSearch} className="group relative max-w-xl mx-auto lg:mx-0">
              <div className="flex flex-col sm:flex-row rounded-3xl sm:rounded-full bg-zinc-50 p-2 border border-zinc-100 shadow-sm focus-within:ring-4 ring-foodapka-100 transition-all">
                <input
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="flex-grow border-none bg-transparent px-6 py-3 md:py-4 text-base md:text-lg text-zinc-900 placeholder:text-zinc-400 focus:outline-none focus:ring-0 font-bold"
                  placeholder="Co dnes nakoupíte?"
                  type="text"
                />
                <button
                  type="submit"
                  className="flex items-center justify-center gap-2 rounded-2xl sm:rounded-full bg-zinc-900 px-8 py-3 md:py-4 font-black text-white transition-all hover:bg-black active:scale-95"
                >
                  <span className="material-symbols-outlined text-xl">search</span>
                  <span>Hledat</span>
                </button>
              </div>
            </form>
          </div>

          {/* Hero Image - Clean */}
          <div className="relative mt-8 lg:mt-0 px-4 md:px-0">
            <div className="absolute -right-4 md:-right-10 -top-4 md:-top-10 h-40 md:h-80 w-40 md:w-80 rounded-full bg-foodapka-100/50 blur-3xl"></div>
            <div className="relative mx-auto max-w-lg lg:max-w-none">
              <div className="relative h-[350px] md:h-[550px] w-full overflow-hidden rounded-[2.5rem] shadow-2xl shadow-foodapka-900/10">
                <Image
                  src="/hero-food.png"
                  alt="Čerstvé potraviny"
                  fill
                  className="object-cover"
                  priority
                  sizes="(max-width: 768px) 100vw, 50vw"
                />
              </div>
              {/* Simple floating savings badge */}
              <div className="absolute -right-2 top-8 md:-right-6 md:top-12 rounded-2xl bg-foodapka-500 px-4 py-3 md:px-6 md:py-4 text-white shadow-2xl transform rotate-12 active:rotate-0 transition-transform">
                <span className="text-xl md:text-3xl font-black tracking-tighter">-35%</span>
              </div>
            </div>
          </div>
        </section>

        {/* Stats + Category Grid - No bread, full coverage */}
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
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent"></div>
              <div className="absolute bottom-6 md:bottom-10 left-6 md:left-10 right-6 md:right-10 text-white">
                <span className="bg-white/20 backdrop-blur-md px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest mb-3 inline-block">Nejhledanější</span>
                <p className="text-3xl md:text-5xl font-black leading-tight">Čerstvé maso za zlomek ceny</p>
              </div>
            </div>

            {/* Stat 1 */}
            <div className="col-span-2 md:col-span-2 md:row-span-1 flex flex-col justify-center items-center rounded-[2rem] bg-foodapka-500 p-6 text-center text-white shadow-lg shadow-foodapka-500/20">
              <span className="text-5xl md:text-6xl font-black tracking-tighter">5 mil.</span>
              <p className="mt-1 text-sm md:text-base font-bold opacity-90 uppercase tracking-widest">Cen srovnáno</p>
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
              <div className="absolute inset-0 bg-black/20 group-hover:bg-black/40 transition-colors"></div>
              <div className="absolute inset-0 flex items-center justify-center text-white font-black text-xl md:text-2xl uppercase tracking-tighter">Ovoce</div>
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
              <div className="absolute inset-0 bg-black/20 group-hover:bg-black/40 transition-colors"></div>
              <div className="absolute inset-0 flex items-center justify-center text-white font-black text-xl md:text-2xl uppercase tracking-tighter">Mléko</div>
            </div>

            {/* Stat 2 */}
            <div className="col-span-2 md:col-span-2 md:row-span-1 flex flex-col justify-center items-center rounded-[2rem] bg-zinc-900 p-6 text-center text-white shadow-xl">
              <span className="text-5xl font-black tracking-tighter text-foodapka-400">7+</span>
              <p className="mt-1 text-sm font-bold opacity-80 uppercase tracking-widest">Řetězců v kapse</p>
            </div>
          </div>
        </section>

        {/* Store Leaflets Carousel - Auto scrolling */}
        <section id="letaky" className="bg-zinc-50 py-20 border-y border-zinc-100 overflow-hidden">
          <div className="mx-auto max-w-7xl px-4 md:px-8 mb-12 text-center">
            <h2 className="text-3xl md:text-4xl font-black text-zinc-900 tracking-tight">Aktuální letáky v aplikaci</h2>
            <p className="mt-3 text-zinc-500 font-medium">Každý den procházíme ty nejoblíbenější obchody</p>
          </div>
          
          <div className="relative flex overflow-hidden group">
            {/* First loop */}
            <div className="flex gap-8 animate-scroll whitespace-nowrap py-4 px-4">
              {[...stores, ...stores].map((store, i) => (
                <div
                  key={`${store.name}-${i}`}
                  className="flex-shrink-0 w-[220px] flex flex-col items-center justify-center rounded-[2rem] bg-white p-8 border border-zinc-100 transition-all hover:shadow-xl hover:-translate-y-2 cursor-pointer"
                >
                  <Image
                    src={store.logo}
                    alt={`${store.name} logo`}
                    width={80}
                    height={80}
                    className="h-16 w-auto object-contain transition-transform group-hover:scale-110"
                  />
                  <p className="mt-4 font-black text-zinc-800 text-lg tracking-tight uppercase">{store.name}</p>
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
                href="/recepty"
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
              <Link href="/recepty" className="font-bold text-zinc-500 hover:text-foodapka-600 transition-colors">Recepty</Link>
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
