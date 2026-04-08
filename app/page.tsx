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
      <nav className="fixed top-0 z-50 w-full bg-foodapka-50/80 backdrop-blur-xl border-b border-foodapka-100">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-8 py-4">
          <div className="text-2xl font-bold tracking-tight text-foodapka-700">foodapka</div>
          <div className="hidden items-center space-x-8 md:flex">
            <Link href="/recepty" className="border-b-2 border-foodapka-600 font-semibold text-foodapka-700">
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
            href="/app?mode=recipes"
            className="transform rounded-full bg-foodapka-500 px-6 py-2.5 font-semibold text-white shadow-md transition-all duration-300 hover:bg-foodapka-600 active:scale-95"
          >
            Začít hledat
          </Link>
        </div>
      </nav>

      <main className="min-h-screen pt-24">
        {/* Hero Section */}
        <section className="mx-auto grid max-w-7xl grid-cols-1 items-center gap-12 px-8 py-16 lg:grid-cols-2">
          <div className="space-y-8">
            <h1 className="text-5xl font-extrabold leading-[1.1] tracking-tight text-black lg:text-6xl">
              Najděte nejlevnější akční cenu dřív, než vyrazíte do obchodu.
            </h1>
            <form onSubmit={handleSearch} className="group relative max-w-xl">
              <div className="flex rounded-full bg-white p-2 shadow-[0px_20px_40px_rgba(0,33,20,0.08)] ring-1 ring-outline-variant/10">
                <input
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="flex-grow border-none bg-transparent px-6 py-4 text-lg text-on-surface placeholder:text-outline focus:outline-none focus:ring-0"
                  placeholder="Co dnes nakoupíte? (např. Máslo, Mléko...)"
                  type="text"
                />
                <button
                  type="submit"
                  className="flex items-center gap-2 rounded-full bg-primary px-8 py-4 font-bold text-white transition-all duration-300 hover:bg-primary-container active:scale-95"
                >
                  <span className="material-symbols-outlined">search</span>
                  Hledat
                </button>
              </div>
            </form>
            <div className="flex items-center gap-4 font-medium text-secondary">
              <span
                className="material-symbols-outlined text-primary"
                style={{ fontVariationSettings: "'FILL' 1" }}
              >
                verified
              </span>
              <span>Aktuální ceny z vašich oblíbených obchodů</span>
            </div>
          </div>

          {/* Hero Image */}
          <div className="relative hidden lg:block">
            <div className="absolute -right-10 -top-10 h-80 w-80 rounded-full bg-primary/10 blur-3xl"></div>
            <div className="relative">
              <img
                src="/hero-food.png"
                alt="Čerstvé potraviny"
                className="h-[500px] w-full rounded-3xl object-cover shadow-2xl"
              />
              {/* Floating ingredients card */}
              <div className="absolute -bottom-6 -left-6 rounded-2xl bg-white p-5 shadow-xl">
                <p className="mb-3 text-xs font-bold uppercase tracking-wider text-primary">Ingredience v akci</p>
                <div className="flex gap-2">
                  <span className="rounded-full bg-red-50 px-3 py-1 text-sm">🍅 Rajčata</span>
                  <span className="rounded-full bg-green-50 px-3 py-1 text-sm">🧀 Mozzarella</span>
                  <span className="rounded-full bg-foodapka-50 px-3 py-1 text-sm">🌿 Bazalka</span>
                </div>
                <p className="mt-3 text-sm text-on-surface-variant">
                  Ušetříte <span className="font-bold text-primary">47 Kč</span>
                </p>
              </div>
              {/* Floating savings badge */}
              <div className="absolute -right-4 top-8 rounded-full bg-tertiary px-4 py-2 text-white shadow-lg">
                <span className="font-bold">-35%</span>
              </div>
            </div>
          </div>
        </section>

        {/* Stats + Popular Products */}
        <section className="mx-auto max-w-7xl px-8 pb-16">
          {/* Bento Grid Layout */}
          <div className="grid gap-6 md:grid-cols-6 auto-rows-[200px]">
            {/* Stat 1 - Medium */}
            <div className="md:col-span-2 md:row-span-1 group relative flex flex-col justify-between overflow-hidden rounded-2xl bg-surface-container-highest p-6">
              <div className="relative z-10">
                <span className="text-5xl font-bold tracking-tighter text-primary">5 mil.</span>
                <p className="mt-2 font-semibold text-on-surface-variant">Porovnaných produktů</p>
              </div>
              <div className="absolute -bottom-4 -right-4 transform opacity-10 transition-transform duration-500 group-hover:scale-110">
                <span className="material-symbols-outlined text-[8rem]">shopping_basket</span>
              </div>
            </div>
            
            {/* Pečivo - Tall */}
            <div className="md:col-span-2 md:row-span-2 group relative overflow-hidden rounded-2xl bg-white shadow-sm">
              <img
                src="/pecivo.png"
                alt="Čerstvé pečivo"
                className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent"></div>
              <div className="absolute bottom-6 left-6 right-6 text-white">
                <p className="text-sm opacity-80">Nejhledanější</p>
                <p className="text-2xl font-bold">Pečivo</p>
              </div>
            </div>

            {/* Ovoce a zelenina - Wide */}
            <div className="md:col-span-2 md:row-span-1 group relative overflow-hidden rounded-2xl bg-white shadow-sm">
              <img
                src="/zeleninaovoce.png"
                alt="Ovoce a zelenina"
                className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent"></div>
              <div className="absolute bottom-4 left-4 right-4 text-white">
                <p className="text-sm opacity-80">Nejhledanější</p>
                <p className="text-xl font-bold">Ovoce a zelenina</p>
              </div>
            </div>

            {/* Stat 2 - Small */}
            <div className="md:col-span-2 md:row-span-1 flex flex-col items-center justify-center rounded-2xl bg-secondary-container p-6 text-center">
              <span className="text-4xl font-extrabold text-on-secondary-container">7+</span>
              <p className="mt-1 text-sm font-semibold text-on-secondary-container">
                Obchodních řetězců
              </p>
            </div>

            {/* Mléčné výrobky - Medium */}
            <div className="md:col-span-2 md:row-span-1 group relative overflow-hidden rounded-2xl bg-white shadow-sm">
              <img
                src="/mlecnevyrobky.png"
                alt="Mléčné výrobky"
                className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent"></div>
              <div className="absolute bottom-4 left-4 right-4 text-white">
                <p className="text-sm opacity-80">Nejhledanější</p>
                <p className="text-xl font-bold">Mléčné výrobky</p>
              </div>
            </div>

            {/* Koření - Medium */}
            <div className="md:col-span-2 md:row-span-1 group relative overflow-hidden rounded-2xl bg-white shadow-sm">
              <img
                src="/koreni.png"
                alt="Koření a přísady"
                className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent"></div>
              <div className="absolute bottom-4 left-4 right-4 text-white">
                <p className="text-sm opacity-80">Nejhledanější</p>
                <p className="text-xl font-bold">Koření</p>
              </div>
            </div>

            {/* Maso - Wide & Tall (Featured) */}
            <div className="md:col-span-4 md:row-span-2 group relative overflow-hidden rounded-2xl bg-white shadow-lg">
              <img
                src="/maso.png"
                alt="Čerstvé maso"
                className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent"></div>
              <div className="absolute bottom-8 left-8 right-8 text-white">
                <p className="text-base opacity-90">Nejhledanější</p>
                <p className="text-4xl font-bold mt-2">Čerstvé maso</p>
                <p className="text-sm opacity-80 mt-2">Široký sortiment masa z prověřených zdrojů</p>
              </div>
            </div>
          </div>
        </section>

        {/* Search Results Preview - DEMO */}
        <section className="mx-auto max-w-7xl px-8 pb-24">
          <div className="overflow-hidden rounded-2xl bg-white shadow-[0px_40px_80px_rgba(0,33,20,0.04)]">
            {/* Search bar mockup */}
            <div className="border-b border-outline-variant/10 bg-surface-container-low p-6">
              <div className="flex items-center gap-3 rounded-full bg-white px-5 py-3 shadow-sm">
                <span className="material-symbols-outlined text-outline">search</span>
                <span className="text-on-surface">máslo</span>
                <span className="ml-auto rounded-full bg-primary/10 px-3 py-1 text-xs font-semibold text-primary">
                  12 výsledků
                </span>
              </div>
            </div>
            
            {/* Results preview */}
            <div className="p-6 md:p-8">
              <div className="space-y-4">
                {/* Result item 1 */}
                <div className="rounded-2xl border border-primary/20 bg-primary/5 p-5">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="rounded-full bg-primary px-2 py-0.5 text-xs font-bold text-white">
                          Nejlevnější
                        </span>
                        <h3 className="font-bold text-on-surface">Máslo čerstvé 250g</h3>
                      </div>
                      <p className="mt-1 text-sm text-on-surface-variant">Dostupné ve 4 obchodech</p>
                    </div>
                    <div className="text-right">
                      <p className="text-2xl font-bold text-primary">34,90 Kč</p>
                      <p className="text-sm text-zinc-400 line-through">49,90 Kč</p>
                    </div>
                  </div>
                  <div className="mt-4 flex gap-2">
                    <span className="flex items-center gap-1 rounded-full bg-white px-3 py-1 text-xs font-medium shadow-sm">
                      <Image src="/lidllogo.png" alt="Lidl" width={16} height={16} className="h-4 w-4 object-contain" />
                      Lidl
                    </span>
                    <span className="flex items-center gap-1 rounded-full bg-white px-3 py-1 text-xs font-medium shadow-sm">
                      <Image src="/kauflandlogo.png" alt="Kaufland" width={16} height={16} className="h-4 w-4 object-contain" />
                      Kaufland
                    </span>
                  </div>
                </div>
                
                {/* Result item 2 */}
                <div className="rounded-2xl border border-outline-variant/20 bg-surface p-5">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <h3 className="font-bold text-on-surface">Máslo Président 200g</h3>
                      <p className="mt-1 text-sm text-on-surface-variant">Dostupné ve 3 obchodech</p>
                    </div>
                    <div className="text-right">
                      <p className="text-2xl font-bold text-on-surface">42,90 Kč</p>
                    </div>
                  </div>
                </div>
                
                {/* Result item 3 */}
                <div className="rounded-2xl border border-outline-variant/20 bg-surface p-5">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <h3 className="font-bold text-on-surface">Bio máslo Olma 250g</h3>
                      <p className="mt-1 text-sm text-on-surface-variant">Dostupné ve 2 obchodech</p>
                    </div>
                    <div className="text-right">
                      <p className="text-2xl font-bold text-on-surface">54,90 Kč</p>
                    </div>
                  </div>
                </div>
              </div>
              
              <Link
                href="/app?mode=recipes"
                className="mt-6 flex items-center justify-center gap-2 rounded-full bg-primary px-6 py-3 font-bold text-white transition hover:bg-primary-container"
              >
                Vyzkoušet vyhledávání
                <span className="material-symbols-outlined">arrow_forward</span>
              </Link>
            </div>
          </div>
        </section>

        {/* User Journey Section */}
        <section className="mx-auto max-w-7xl px-8 py-24">
          <div className="mb-12 text-center">
            <h2 className="text-4xl md:text-5xl font-black tracking-tight text-zinc-900 mb-4">Vaše cesta k lepšímu stravování</h2>
            <p className="text-lg text-zinc-600 max-w-2xl mx-auto">Od výběru surovin až po první sousto.</p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-16 items-center">
            {/* Left Side - Hero Image (Square) */}
            <div className="relative aspect-square rounded-3xl overflow-hidden shadow-2xl group order-2 lg:order-1">
              <img
                alt="Myšlenková mapa foodapka"
                className="w-full h-full object-cover object-center group-hover:scale-105 transition-transform duration-700"
                src="/myslenkova mapa hero.png"
              />
              <div className="absolute inset-0 bg-gradient-to-br from-foodapka-600/20 via-transparent to-black/30"></div>
            </div>

            {/* Right Side - Steps (Vertical) */}
            <div className="relative flex flex-col gap-8 order-1 lg:order-2">
              {/* Point 1 */}
              <div className="flex items-start gap-6 group">
                <div className="flex-shrink-0 w-16 h-16 bg-gradient-to-br from-foodapka-400 to-foodapka-600 text-white rounded-2xl flex items-center justify-center shadow-lg group-hover:scale-110 group-hover:rotate-3 transition-all">
                  <span className="material-symbols-outlined text-3xl">shopping_cart</span>
                </div>
                <div className="flex-1">
                  <h4 className="text-xs font-black text-foodapka-600 tracking-widest uppercase mb-2">Krok 1</h4>
                  <h3 className="text-2xl font-bold text-zinc-900 mb-2">Nákup s Foodapkou</h3>
                  <p className="text-sm text-zinc-600 leading-relaxed">Najdeme pro vás nejvýhodnější nabídky v okolí a ušetříme váš čas i peníze.</p>
                </div>
              </div>

              {/* Arrow Down */}
              <div className="flex justify-start pl-8">
                <svg width="40" height="60" viewBox="0 0 40 60" className="opacity-60">
                  <defs>
                    <marker id="arrow-down-1" markerWidth="6" markerHeight="6" refX="3" refY="3" orient="auto">
                      <polygon points="0 0, 6 3, 0 6" fill="#92D63F" />
                    </marker>
                  </defs>
                  <path 
                    d="M 20 5 Q 30 30, 20 55" 
                    stroke="#92D63F" 
                    strokeWidth="2.5" 
                    fill="none" 
                    strokeDasharray="5,5"
                    markerEnd="url(#arrow-down-1)"
                    className="animate-pulse"
                  />
                </svg>
              </div>

              {/* Point 2 */}
              <div className="flex items-start gap-6 group">
                <div className="flex-shrink-0 w-16 h-16 bg-gradient-to-br from-foodapka-500 to-foodapka-700 text-white rounded-2xl flex items-center justify-center shadow-lg group-hover:scale-110 group-hover:rotate-3 transition-all">
                  <span className="material-symbols-outlined text-3xl">home</span>
                </div>
                <div className="flex-1">
                  <h4 className="text-xs font-black text-foodapka-600 tracking-widest uppercase mb-2">Krok 2</h4>
                  <h3 className="text-2xl font-bold text-zinc-900 mb-2">Příprava jídla</h3>
                  <p className="text-sm text-zinc-600 leading-relaxed">S našimi recepty je vaření radost, ne starost. Krok za krokem k dokonalému jídlu.</p>
                </div>
              </div>

              {/* Arrow Down */}
              <div className="flex justify-start pl-8">
                <svg width="40" height="60" viewBox="0 0 40 60" className="opacity-60">
                  <defs>
                    <marker id="arrow-down-2" markerWidth="6" markerHeight="6" refX="3" refY="3" orient="auto">
                      <polygon points="0 0, 6 3, 0 6" fill="#7bc02e" />
                    </marker>
                  </defs>
                  <path 
                    d="M 20 5 Q 10 30, 20 55" 
                    stroke="#7bc02e" 
                    strokeWidth="2.5" 
                    fill="none" 
                    strokeDasharray="5,5"
                    markerEnd="url(#arrow-down-2)"
                    className="animate-pulse"
                    style={{ animationDelay: '0.5s' }}
                  />
                </svg>
              </div>

              {/* Point 3 */}
              <div className="flex items-start gap-6 group">
                <div className="flex-shrink-0 w-16 h-16 bg-gradient-to-br from-foodapka-600 to-foodapka-800 text-white rounded-2xl flex items-center justify-center shadow-lg group-hover:scale-110 group-hover:rotate-3 transition-all">
                  <span className="material-symbols-outlined text-3xl" style={{ fontVariationSettings: "'FILL' 1" }}>favorite</span>
                </div>
                <div className="flex-1">
                  <h4 className="text-xs font-black text-foodapka-600 tracking-widest uppercase mb-2">Krok 3</h4>
                  <h3 className="text-2xl font-bold text-zinc-900 mb-2">Hotové zdravé jídlo</h3>
                  <p className="text-sm text-zinc-600 leading-relaxed">Vychutnejte si nutričně vyvážené jídlo s rodinou a přáteli.</p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Store Leaflets Section */}
        <section id="letaky" className="bg-surface-container-low py-20">
          <div className="mx-auto max-w-7xl px-8">
            <div className="mb-12 text-center">
              <h2 className="text-3xl font-bold text-on-surface md:text-4xl">Aktuální letáky</h2>
              <p className="mt-3 text-on-surface-variant">
                Procházíme letáky z nejpopulárnějších obchodů každý den
              </p>
            </div>
            
            <div className="grid grid-cols-2 gap-4 md:grid-cols-4 lg:grid-cols-7">
              {[
                { name: "Albert", logo: "/albertlogo.png", color: "bg-red-50" },
                { name: "Lidl", logo: "/lidllogo.png", color: "bg-blue-50" },
                { name: "Kaufland", logo: "/kauflandlogo.png", color: "bg-red-50" },
                { name: "Billa", logo: "/billalogo.png", color: "bg-yellow-50" },
                { name: "Tesco", logo: "/tescologo.png", color: "bg-blue-50" },
                { name: "Penny", logo: "/pennylogo.png", color: "bg-red-50" },
                { name: "Globus", logo: "/globuslogo.png", color: "bg-orange-50" },
              ].map((store) => (
                <div
                  key={store.name}
                  className={`group flex flex-col items-center justify-center rounded-2xl ${store.color} p-6 transition-all duration-300 hover:-translate-y-1 hover:shadow-lg`}
                >
                  <Image
                    src={store.logo}
                    alt={`${store.name} logo`}
                    width={80}
                    height={80}
                    className="h-16 w-auto object-contain transition-transform duration-300 group-hover:scale-110"
                  />
                  <p className="mt-3 font-semibold text-on-surface">{store.name}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Features Section - Mockups instead of stock photos */}
        <section id="funkce" className="overflow-hidden py-24">
          <div className="mx-auto max-w-7xl px-8">
            <div className="mb-16 text-center">
              <h2 className="text-3xl font-bold text-on-surface md:text-4xl">
                Více než jen srovnávač cen
              </h2>
              <p className="mt-3 text-lg text-on-surface-variant">
                Váš osobní nákupní asistent
              </p>
            </div>

            <div className="grid gap-8 lg:grid-cols-2">
              {/* Feature 1 - Shopping List Mockup */}
              <div className="group overflow-hidden rounded-3xl bg-gradient-to-br from-primary to-primary-container p-8 text-white">
                <div className="mb-6">
                  <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-white/20">
                    <span className="material-symbols-outlined">receipt_long</span>
                  </div>
                  <h3 className="mb-2 text-2xl font-bold">Chytré nákupní seznamy</h3>
                  <p className="text-white/80">
                    Vytvořte si seznam a my vám spočítáme, v jakém obchodě vyjde celý nákup nejlevněji.
                  </p>
                </div>
                
                {/* List mockup */}
                <div className="rounded-2xl bg-white p-4 text-on-surface shadow-xl">
                  <p className="mb-3 text-sm font-bold text-primary">Můj nákupní seznam</p>
                  <div className="space-y-2">
                    {[
                      { name: "Mléko 1L", checked: true },
                      { name: "Chleba", checked: true },
                      { name: "Vejce 10ks", checked: false },
                      { name: "Máslo", checked: false },
                    ].map((item) => (
                      <div key={item.name} className="flex items-center gap-3 rounded-lg bg-surface p-2">
                        <div className={`flex h-5 w-5 items-center justify-center rounded-full ${item.checked ? 'bg-primary' : 'border-2 border-outline-variant'}`}>
                          {item.checked && <span className="material-symbols-outlined text-sm text-white">check</span>}
                        </div>
                        <span className={item.checked ? 'text-zinc-400 line-through' : ''}>{item.name}</span>
                      </div>
                    ))}
                  </div>
                  <div className="mt-4 flex items-center justify-between rounded-lg bg-primary/10 p-3">
                    <span className="text-sm font-medium">Nejlevněji v:</span>
                    <span className="flex items-center gap-2 font-bold text-primary">
                      <Image src="/lidllogo.png" alt="Lidl" width={20} height={20} className="h-5 w-5 object-contain" />
                      Lidl - 187 Kč
                    </span>
                  </div>
                </div>
              </div>

              {/* Feature 2 - Price Alert Mockup */}
              <div className="group overflow-hidden rounded-3xl bg-gradient-to-br from-tertiary to-tertiary-container p-8 text-white">
                <div className="mb-6">
                  <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-white/20">
                    <span className="material-symbols-outlined">notifications_active</span>
                  </div>
                  <h3 className="mb-2 text-2xl font-bold">Hlídací pes</h3>
                  <p className="text-white/80">
                    Upozorníme vás, jakmile vaše oblíbené produkty spadnou do akce. Už nikdy nezmeškáte slevu.
                  </p>
                </div>
                
                {/* Notification mockup */}
                <div className="space-y-3">
                  <div className="rounded-2xl bg-white p-4 text-on-surface shadow-xl">
                    <div className="flex items-start gap-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-full bg-green-100">
                        <span className="text-lg">🎉</span>
                      </div>
                      <div className="flex-1">
                        <p className="font-bold">Máslo je v akci!</p>
                        <p className="text-sm text-on-surface-variant">Lidl - pouze 34,90 Kč (-30%)</p>
                        <p className="mt-1 text-xs text-zinc-400">před 2 hodinami</p>
                      </div>
                    </div>
                  </div>
                  <div className="rounded-2xl bg-white/90 p-4 text-on-surface shadow-lg">
                    <div className="flex items-start gap-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-100">
                        <span className="text-lg">📢</span>
                      </div>
                      <div className="flex-1">
                        <p className="font-bold">Nový leták Albert</p>
                        <p className="text-sm text-on-surface-variant">3 položky z vašeho seznamu jsou v akci</p>
                        <p className="mt-1 text-xs text-zinc-400">před 5 hodinami</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Recipes Preview - Redesigned */}
        <section className="relative overflow-hidden bg-surface-container-low py-24">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,rgba(0,105,72,0.1),transparent_50%)]"></div>
          <div className="mx-auto max-w-7xl px-8">
            <div className="mb-12 flex flex-col items-start justify-between gap-6 md:flex-row md:items-end">
              <div>
                <span className="mb-2 inline-block rounded-full bg-primary/10 px-4 py-1 text-sm font-bold text-primary">
                  Nové
                </span>
                <h2 className="text-4xl font-bold text-on-surface">
                  Recepty ze zlevněných surovin
                </h2>
                <p className="mt-3 max-w-lg text-on-surface-variant">
                  Pomůžeme vám uvařit skvělá jídla z ingrediencí, které jsou právě v akci. 
                  Nakupujte chytře, vařte lépe.
                </p>
              </div>
              <Link
                href="/recepty"
                className="flex items-center gap-2 rounded-full bg-primary px-6 py-3 font-bold text-white transition hover:bg-primary-container"
              >
                Všechny recepty
                <span className="material-symbols-outlined">arrow_forward</span>
              </Link>
            </div>

            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {[
                {
                  name: "Domácí hummus s pita chlebem",
                  time: "20 min",
                  savings: "38 Kč",
                  tag: "Snack",
                  ingredients: ["Cizrna", "Tahini", "Česnek"],
                  image: "/humus.png",
                },
                {
                  name: "Zdravé krabičkové kuře s rýží",
                  time: "35 min",
                  savings: "52 Kč",
                  tag: "Krabičkové",
                  ingredients: ["Kuřecí prsa", "Rýže", "Brokolice"],
                  image: "/krabickove kure.png",
                },
                {
                  name: "Overnight oats s ovocem",
                  time: "10 min",
                  savings: "29 Kč",
                  tag: "Fit snídaně",
                  ingredients: ["Ovesné vločky", "Jogurt", "Banán"],
                  image: "/overnight oats.png",
                },
              ].map((recipe) => (
                <div
                  key={recipe.name}
                  className="group overflow-hidden rounded-3xl bg-white shadow-lg transition-all duration-300 hover:-translate-y-1 hover:shadow-xl"
                >
                  <div className="relative aspect-[4/3] overflow-hidden">
                    <img
                      src={recipe.image}
                      alt={recipe.name}
                      className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                    />
                    <div className="absolute left-3 top-3 rounded-full bg-foodapka-100/90 backdrop-blur-md px-3 py-1 text-xs font-bold text-foodapka-800 shadow-lg uppercase tracking-wider">
                      {recipe.tag}
                    </div>
                    <div className="absolute right-3 top-3 rounded-full bg-tertiary px-3 py-1 text-sm font-bold text-white shadow-lg">
                      Ušetříte {recipe.savings}
                    </div>
                  </div>
                  <div className="p-6">
                    <div className="mb-3 flex items-center gap-2 text-sm text-on-surface-variant">
                      <span className="material-symbols-outlined text-base">schedule</span>
                      {recipe.time}
                    </div>
                    <h3 className="mb-3 text-xl font-bold text-on-surface">{recipe.name}</h3>
                    <div className="flex flex-wrap gap-2">
                      {recipe.ingredients.map((ing) => (
                        <span key={ing} className="rounded-full bg-primary/10 px-3 py-1 text-xs font-medium text-primary">
                          {ing}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="py-24">
          <div className="mx-auto max-w-4xl px-8 text-center">
            <h2 className="text-4xl font-bold text-on-surface md:text-5xl">
              Připraveni ušetřit?
            </h2>
            <p className="mx-auto mt-6 max-w-2xl text-lg text-on-surface-variant">
              Začněte hledat a porovnávat ceny ještě dnes. Je to zdarma a bez registrace.
            </p>
            <div className="mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row">
              <Link
                href="/app?mode=recipes"
                className="flex items-center gap-3 rounded-full bg-primary px-10 py-5 font-bold text-white shadow-lg transition hover:bg-primary-container hover:shadow-xl"
              >
                <span className="material-symbols-outlined">search</span>
                Spustit vyhledávač
              </Link>
              <Link
                href="/recepty"
                className="flex items-center gap-3 rounded-full border-2 border-primary bg-white px-10 py-5 font-bold text-primary transition hover:bg-primary/5"
              >
                <span className="material-symbols-outlined">restaurant</span>
                Zobrazit recepty
              </Link>
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="w-full bg-foodapka-50 text-sm leading-relaxed">
        <div className="mx-auto flex max-w-7xl flex-col items-center justify-between px-12 py-16 md:flex-row">
          <div className="mb-8 space-y-4 md:mb-0">
            <div className="text-xl font-bold text-foodapka-800">foodapka</div>
            <p className="max-w-xs text-zinc-500">
              Pomáháme českým domácnostem nakupovat chytře a šetřit čas i peníze každý den.
            </p>
          </div>
          <div className="flex flex-wrap justify-center gap-12">
            <div className="flex flex-col space-y-3">
              <span className="mb-2 font-bold text-on-surface">Aplikace</span>
              <Link href="/app?mode=recipes" className="text-zinc-500 transition-transform duration-200 hover:translate-x-1 hover:text-foodapka-600">
                Vyhledávač
              </Link>
              <Link href="/recepty" className="text-zinc-500 transition-transform duration-200 hover:translate-x-1 hover:text-foodapka-600">
                Recepty
              </Link>
            </div>
            <div className="flex flex-col space-y-3">
              <span className="mb-2 font-bold text-on-surface">Právní</span>
              <a className="text-zinc-500 transition-transform duration-200 hover:translate-x-1 hover:text-foodapka-600" href="#">
                Ochrana údajů
              </a>
              <a className="text-zinc-500 transition-transform duration-200 hover:translate-x-1 hover:text-foodapka-600" href="#">
                Podmínky
              </a>
            </div>
          </div>
        </div>
        <div className="mx-auto max-w-7xl border-t border-outline-variant/10 px-12 py-8 text-center text-zinc-400">
          © 2026 foodapka. Všechna práva vyhrazena.
        </div>
      </footer>
    </div>
  );
}
