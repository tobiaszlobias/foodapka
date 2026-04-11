"use client";

import Link from "next/link";
import Image from "next/image";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import SearchBar from "@/components/SearchBar";
import { type Product, cleanProductName, sortStoresByPrice } from "@/lib/food";
import { StoreBrand } from "@/components/dashboard/DashboardShared";
import { AuroraBackground } from "@/components/ui/aurora-background";
import { motion } from "framer-motion";

export default function HomePage() {
  const router = useRouter();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(false);
  const [hasSearchedDirectly, setHasSearchedDirectly] = useState(false);
  const [searchMode, setSearchMode] = useState<"search" | "recipes">("search");
  const [scrolled, setScrolled] = useState(false);

  // Force light mode on landing page
  useEffect(() => {
    document.documentElement.dataset.theme = "light";
    document.documentElement.style.colorScheme = "light";

    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const handleModeChange = (mode: string) => {
    setSearchMode(mode as "search" | "recipes");
    // Only clear products if we're actually changing mode to keep it snappy
    if (mode !== searchMode) {
      setProducts([]);
      setHasSearchedDirectly(false);
    }
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
      <nav className={`fixed top-0 z-50 w-full bg-white/80 backdrop-blur-xl border-b border-zinc-100 transition-all duration-500 ${scrolled ? "translate-y-0 opacity-100" : "-translate-y-full opacity-0"}`}>
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 md:px-8 py-3 md:py-4">
          <div className="text-xl md:text-2xl font-asset tracking-tighter text-foodappka-700">foodappka</div>
          <Link
            href="/app"
            className="transform rounded-full bg-foodappka-500 px-5 md:px-6 py-2 font-black text-white shadow-lg shadow-foodappka-500/20 transition-all hover:bg-foodappka-600 active:scale-95 text-sm md:text-base"
          >
            Spustit aplikaci
          </Link>
        </div>
      </nav>

      <AuroraBackground>
        <motion.section 
          initial={{ opacity: 0.0, y: 40 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{
            delay: 0.3,
            duration: 0.8,
            ease: "easeInOut",
          }}
          className="mx-auto grid max-w-7xl grid-cols-1 items-center gap-8 md:gap-12 px-4 md:px-8 py-20 md:py-32 lg:grid-cols-2 relative z-10 w-full"
        >
          <div className="space-y-6 md:space-y-8 text-center lg:text-left">
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-black leading-[1.05] tracking-tight text-zinc-900">
              Ušetřete za nákup <br />
              <span className="text-foodappka-600">dřív, než vyrazíte.</span>
            </h1>
            <p className="text-lg md:text-xl text-zinc-500 max-w-xl mx-auto lg:mx-0 font-medium leading-relaxed">
              Srovnáváme tisíce akčních cen z vašich oblíbených obchodů v reálném čase.
            </p>
            
            <div className="max-w-xl mx-auto lg:mx-0 relative">
              <SearchBar 
                onResults={handleDirectResults}
                onLoading={setLoading}
                mode={searchMode}
                onModeChange={handleModeChange}
                isLandingPage={true}
              />

              {/* Recipe Mode Preview */}
              {searchMode === "recipes" && !loading && products.length === 0 && (
                <div className="mt-6 space-y-3 animate-in fade-in slide-in-from-top-4 duration-500">
                  <article className="rounded-2xl border border-foodappka-100 bg-white p-6 shadow-[0_10px_30px_-10px_rgba(132,204,22,0.15)] text-left">
                    <div className="flex items-start gap-4">
                      <div className="w-12 h-12 rounded-2xl bg-foodappka-50 flex items-center justify-center shrink-0">
                        <span className="material-symbols-outlined text-foodappka-600 text-2xl">restaurant</span>
                      </div>
                      <div>
                        <h4 className="font-black text-foodappka-950 text-lg leading-tight">Chcete uvařit levněji?</h4>
                        <p className="text-zinc-500 text-sm mt-1 font-medium">Napište název jídla do vyhledávače a my vám najdeme nejlevnější akční suroviny pro váš nákup.</p>
                      </div>
                    </div>
                  </article>
                  
                  <button 
                    onClick={() => router.push("/app?mode=recipes")}
                    className="w-full py-4 rounded-full bg-foodappka-500 text-white font-black text-sm hover:bg-foodappka-600 transition-all shadow-xl shadow-foodappka-500/20 active:scale-[0.98] flex items-center justify-center gap-2"
                  >
                    Spustit recepty v aplikaci
                    <span className="material-symbols-outlined text-lg">rocket_launch</span>
                  </button>
                </div>
              )}

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
                            className="rounded-2xl border border-foodappka-100 bg-white p-4 shadow-[0_10px_30px_-10px_rgba(132,204,22,0.15)] cursor-pointer hover:border-foodappka-300 hover:shadow-md transition-all group overflow-hidden"
                          >
                            <div className="flex items-center justify-between gap-4">
                              <div className="min-w-0 flex-1">
                                <h4 className="font-bold text-zinc-900 truncate group-hover:text-foodappka-700 transition-colors max-w-full block">
                                  {cleanProductName(product.name)}
                                </h4>
                                <div className="flex items-center gap-3 mt-2">
                                  <StoreBrand shopName={sortStoresByPrice(product.stores)[0]?.shopName} small />
                                  <span className="text-lg font-black text-foodappka-700">{sortStoresByPrice(product.stores)[0]?.price}</span>
                                </div>
                              </div>
                              <div className="shrink-0 w-8 h-8 rounded-full bg-foodappka-50 flex items-center justify-center group-hover:bg-foodappka-500 group-hover:text-white transition-all">
                                <span className="material-symbols-outlined text-sm">arrow_forward</span>
                              </div>
                            </div>
                          </article>
                        ))}
                      </div>
                      <button 
                        onClick={() => router.push("/app")}
                        className="w-full py-4 rounded-full bg-foodappka-500 text-white font-black text-sm hover:bg-foodappka-600 transition-all shadow-xl shadow-foodappka-500/20 active:scale-[0.98] flex items-center justify-center gap-2"
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
            <div className="absolute -right-4 md:-right-10 -top-4 md:-top-10 h-40 md:h-80 w-40 md:w-80 rounded-full bg-foodappka-100/50 blur-3xl"></div>
            <div className="relative mx-auto max-w-lg lg:max-w-none">
              <div className="relative h-[350px] md:h-[500px] lg:h-[550px] w-full overflow-hidden rounded-[2.5rem] shadow-2xl shadow-foodappka-900/10">
                <Image
                  src="/hero-food.png"
                  alt="Čerstvé potraviny"
                  fill
                  className="object-cover"
                  priority
                  sizes="(max-width: 768px) 100vw, 50vw"
                />
                {/* Floating Mini Shopping List */}
                <div className="absolute -left-4 -bottom-6 md:-left-8 md:-bottom-10 bg-white/95 backdrop-blur-xl rounded-[2.5rem] p-6 shadow-[0_20px_50px_-12px_rgba(0,0,0,0.2)] border border-white animate-in fade-in slide-in-from-left-6 duration-1000 delay-500 z-20 w-[240px] md:w-[280px]">
                  <div className="space-y-4">
                    <div className="flex items-center justify-between border-b border-zinc-100 pb-3">
                      <span className="text-[10px] font-black text-zinc-400 uppercase tracking-widest">Nákupní seznam</span>
                      <span className="flex h-5 w-5 items-center justify-center rounded-full bg-foodappka-500 text-[10px] text-white font-black">3</span>
                    </div>
                    
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2 min-w-0">
                          <div className="w-1.5 h-1.5 rounded-full bg-red-400"></div>
                          <span className="text-xs font-bold text-zinc-700 truncate">Rajčata (500g)</span>
                        </div>
                        <span className="text-[10px] font-black text-red-500 bg-red-50 px-1.5 py-0.5 rounded-md">-40%</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2 min-w-0">
                          <div className="w-1.5 h-1.5 rounded-full bg-blue-400"></div>
                          <span className="text-xs font-bold text-zinc-700 truncate">Mozzarella (125g)</span>
                        </div>
                        <span className="text-[10px] font-black text-foodappka-600 bg-foodappka-50 px-1.5 py-0.5 rounded-md">-25%</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2 min-w-0">
                          <div className="w-1.5 h-1.5 rounded-full bg-orange-400"></div>
                          <span className="text-xs font-bold text-zinc-700 truncate">Olivový olej</span>
                        </div>
                        <span className="text-[10px] font-black text-red-500 bg-red-50 px-1.5 py-0.5 rounded-md">-30%</span>
                      </div>
                    </div>

                    <div className="pt-3 border-t border-zinc-100 flex items-center justify-between">
                      <p className="text-[10px] font-black text-zinc-400 uppercase tracking-widest">Ušetříte</p>
                      <p className="text-xl font-asset text-foodappka-700">88 Kč</p>
                    </div>
                  </div>
                </div>
              </div>
              <div className="absolute -right-2 top-8 md:-right-6 md:top-12 rounded-2xl bg-[#e2ff3b] px-4 py-3 md:px-6 md:py-4 text-zinc-900 shadow-2xl shadow-[#e2ff3b]/20 transform rotate-12 active:rotate-0 transition-transform z-20 border-2 border-white/50">
                <span className="text-xl md:text-3xl font-black tracking-tighter leading-none">-35%</span>
              </div>
            </div>
          </div>
        </motion.section>
      </AuroraBackground>

      <main>
        {/* Stats + Category Grid */}
        <section className="mx-auto max-w-7xl px-4 md:px-8 pb-16 md:pb-24 pt-10 md:pt-20">
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
                <p className="text-3xl md:text-5xl font-black leading-tight tracking-tighter drop-shadow-md">Čerstvé maso za zlomek ceny</p>
              </div>
              </div>

            {/* Stat 1 */}
            <div className="col-span-2 md:col-span-2 md:row-span-1 flex flex-col justify-center items-center rounded-[2rem] bg-foodappka-500 p-6 text-center text-white shadow-lg shadow-foodappka-500/20">
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
            <div className="col-span-2 md:col-span-2 md:row-span-1 flex flex-col justify-center items-center rounded-[2rem] bg-[#e2ff3b] p-6 text-center text-zinc-900 shadow-xl">
              <span className="text-5xl font-black tracking-tighter">10+</span>
              <p className="mt-1 text-sm font-bold text-zinc-600">Řetězců v kapse</p>
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
                  className="flex-shrink-0 w-[200px] h-[140px] flex flex-col items-center justify-center rounded-[2rem] bg-white p-6 border border-zinc-100 transition-all hover:shadow-xl hover:-translate-y-2 cursor-pointer group/card"
                >
                  <Image src={store.logo} alt={`${store.name} logo`} width={140} height={140} className="h-20 w-auto object-contain transition-transform group-hover/card:scale-110" />
                </div>
              ))}
              {/* Second loop for seamless infinite scroll */}
              {stores.map((store, i) => (
                <div
                  key={`${store.name}-2-${i}`}
                  className="flex-shrink-0 w-[200px] h-[140px] flex flex-col items-center justify-center rounded-[2rem] bg-white p-6 border border-zinc-100 transition-all hover:shadow-xl hover:-translate-y-2 cursor-pointer group/card"
                >
                  <Image src={store.logo} alt={`${store.name} logo`} width={140} height={140} className="h-20 w-auto object-contain transition-transform group-hover/card:scale-110" />
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Process Section */}
        <section className="mx-auto max-w-7xl px-4 md:px-8 py-16 md:py-24">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div className="relative order-2 lg:order-1">
              <div className="absolute inset-0 bg-foodappka-100/50 blur-3xl rounded-full transform -rotate-12 scale-90"></div>
              <Image 
                src="/myslenkova mapa hero.png" 
                alt="Jak funguje foodappka" 
                width={600} 
                height={600} 
                className="relative w-full h-auto drop-shadow-2xl rounded-[3rem]"
              />
            </div>
            <div className="space-y-8 order-1 lg:order-2 text-left">
              <h2 className="text-3xl md:text-5xl font-black tracking-tight text-zinc-900 leading-[1.1]">
                Chytrá cesta k <br />
                <span className="text-foodappka-600">levnějšímu vaření.</span>
              </h2>
              <div className="space-y-6">
                <div className="flex gap-4">
                  <div className="w-12 h-12 rounded-2xl bg-foodappka-50 flex items-center justify-center shrink-0 border border-foodappka-100">
                    <span className="material-symbols-outlined text-foodappka-600">search</span>
                  </div>
                  <div>
                    <h4 className="font-bold text-lg text-zinc-900">Najděte nejnižší ceny</h4>
                    <p className="text-zinc-500 font-medium">Srovnáváme tisíce položek z akčních letáků v reálném čase. Stačí zadat název receptu nebo potraviny.</p>
                  </div>
                </div>
                <div className="flex gap-4">
                  <div className="w-12 h-12 rounded-2xl bg-foodappka-50 flex items-center justify-center shrink-0 border border-foodappka-100">
                    <span className="material-symbols-outlined text-foodappka-600">shopping_cart</span>
                  </div>
                  <div>
                    <h4 className="font-bold text-lg text-zinc-900">Naplánujte nákup</h4>
                    <p className="text-zinc-500 font-medium">Sestavte si nákupní seznam z nejvýhodnějších nabídek a ušetřete stovky korun při každé návštěvě obchodu.</p>
                  </div>
                </div>
                <div className="flex gap-4">
                  <div className="w-12 h-12 rounded-2xl bg-foodappka-50 flex items-center justify-center shrink-0 border border-foodappka-100">
                    <span className="material-symbols-outlined text-foodappka-600">restaurant</span>
                  </div>
                  <div>
                    <h4 className="font-bold text-lg text-zinc-900">Vařte zdravě a levně</h4>
                    <p className="text-zinc-500 font-medium">Dopřejte si kvalitní suroviny za zlomek ceny. Peníze, které ušetříte, můžete využít na věci, které máte rádi.</p>
                  </div>
                </div>
              </div>
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
                className="w-full sm:w-auto flex items-center justify-center gap-3 rounded-full bg-foodappka-500 px-10 py-5 md:px-12 md:py-6 font-black text-white shadow-2xl shadow-foodappka-500/40 transition hover:bg-foodappka-600 active:scale-95 text-lg"
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
            <div className="text-2xl font-asset tracking-tighter text-foodappka-800">foodappka</div>
            <p className="max-w-xs text-zinc-500 mt-2 font-medium">
              Chytrý nákup pro každou českou domácnost.
            </p>
          </div>
          <div className="flex gap-16">
            <div className="flex flex-col space-y-3">
              <span className="font-black text-zinc-900 uppercase text-xs tracking-widest mb-2">Aplikace</span>
              <Link href="/app" className="font-bold text-zinc-500 hover:text-foodappka-600 transition-colors">Vyhledávač</Link>
              <Link href="/app?mode=recipes" className="font-bold text-zinc-500 hover:text-foodappka-600 transition-colors">Recepty</Link>
            </div>
            <div className="flex flex-col space-y-3">
              <span className="font-black text-zinc-900 uppercase text-xs tracking-widest mb-2">Právní</span>
              <a className="font-bold text-zinc-500 hover:text-foodappka-600 transition-colors" href="#">Soukromí</a>
              <a className="font-bold text-zinc-500 hover:text-foodappka-600 transition-colors" href="#">Podmínky</a>
            </div>
          </div>
        </div>
        <div className="mx-auto max-w-7xl border-t border-zinc-200/50 px-8 py-8 mt-16 text-center text-zinc-400 text-xs font-bold uppercase tracking-widest">
          © 2026 foodappka. Všechna práva vyhrazena.
        </div>
      </footer>
    </div>
  );
}
