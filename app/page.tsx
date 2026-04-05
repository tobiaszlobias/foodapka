import Image from "next/image";
import Link from "next/link";

export default function HomePage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-emerald-50 via-white to-emerald-50/30">
      {/* Navigation */}
      <nav className="fixed top-0 z-50 w-full border-b border-emerald-100/50 bg-white/80 backdrop-blur-xl">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4 lg:px-8">
          <div className="text-2xl font-black tracking-tight text-emerald-800" style={{ fontFamily: 'Plus Jakarta Sans, sans-serif' }}>
            foodapka
          </div>
          <div className="hidden items-center gap-8 md:flex">
            <a href="#recepty" className="font-semibold text-emerald-800 transition hover:text-emerald-600">
              Recepty
            </a>
            <a href="#letaky" className="font-semibold text-emerald-700 transition hover:text-emerald-600">
              Letáky
            </a>
            <a href="#aplikace" className="font-semibold text-emerald-700 transition hover:text-emerald-600">
              Aplikace
            </a>
          </div>
          <Link
            href="/app"
            className="rounded-full bg-emerald-700 px-6 py-2.5 font-bold text-white transition hover:bg-emerald-800 active:scale-95"
          >
            Začít hledat
          </Link>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative overflow-hidden px-6 pb-32 pt-32 lg:px-8">
        <div className="mx-auto grid max-w-7xl grid-cols-1 items-center gap-16 lg:grid-cols-2">
          <div className="z-10">
            <h1 
              className="mb-8 text-5xl font-extrabold leading-[1.1] tracking-tight text-emerald-950 md:text-6xl lg:text-7xl"
              style={{ fontFamily: 'Plus Jakarta Sans, sans-serif' }}
            >
              Najděte nejlevnější akční cenu dřív, než vyrazíte do obchodu.
            </h1>
            
            {/* Hero Search Bar */}
            <Link href="/app" className="group relative block max-w-2xl">
              <div className="flex items-center rounded-xl bg-white p-2 shadow-[0_12px_24px_rgba(25,28,28,0.06)] transition-all duration-300 group-hover:scale-[1.02] group-hover:shadow-[0_20px_40px_rgba(25,28,28,0.1)]">
                <span className="ml-4 text-2xl text-emerald-600">🔍</span>
                <div className="w-full px-4 py-4 text-lg font-medium text-emerald-600/70">
                  Hledejte máslo, mléko nebo vaši oblíbenou kávu...
                </div>
                <div className="rounded-lg bg-emerald-700 px-8 py-4 font-bold text-white transition group-hover:bg-emerald-800">
                  Hledat
                </div>
              </div>
            </Link>

            {/* Statistics Cards */}
            <div className="mt-12 flex flex-wrap gap-4">
              <div className="rounded-xl border-l-4 border-emerald-700 bg-white px-6 py-4 shadow-sm">
                <div className="text-2xl font-black text-emerald-800">5 mil</div>
                <div className="text-sm font-bold uppercase tracking-wider text-emerald-700">produktů</div>
              </div>
              <div className="rounded-xl border-l-4 border-emerald-700 bg-white px-6 py-4 shadow-sm">
                <div className="text-2xl font-black text-emerald-800">7+ řetězců</div>
                <div className="text-sm font-bold uppercase tracking-wider text-emerald-700">partnerů</div>
              </div>
              <div className="rounded-xl border-l-4 border-emerald-700 bg-white px-6 py-4 shadow-sm">
                <div className="text-2xl font-black text-emerald-800">Denně</div>
                <div className="text-sm font-bold uppercase tracking-wider text-emerald-700">aktualizace</div>
              </div>
            </div>
          </div>

          {/* Hero Image */}
          <div className="relative hidden lg:block">
            <div className="absolute -right-20 -top-20 -z-10 h-[600px] w-[600px] rounded-full bg-emerald-200/30 blur-3xl"></div>
            <div className="relative rotate-2 overflow-hidden rounded-3xl shadow-2xl">
              <img
                alt="Čerstvá bio zelenina"
                className="h-[600px] w-full object-cover"
                src="https://images.unsplash.com/photo-1540420773420-3366772f4999?w=800&h=1200&fit=crop"
              />
              <div className="absolute bottom-8 left-8 max-w-xs rounded-2xl bg-white/90 p-6 shadow-xl backdrop-blur-md">
                <div className="mb-2 flex items-center gap-2">
                  <span className="rounded-full bg-emerald-700 px-2 py-0.5 text-[10px] font-bold uppercase text-white">
                    Nejlepší nabídka
                  </span>
                  <span className="font-bold text-emerald-700">Dnes</span>
                </div>
                <p className="text-xl font-bold text-emerald-950" style={{ fontFamily: 'Plus Jakarta Sans, sans-serif' }}>
                  Bio máslo 250g
                </p>
                <div className="flex items-baseline gap-2">
                  <span className="text-2xl font-black text-emerald-700">39,90 Kč</span>
                  <span className="text-sm text-zinc-500 line-through">64,90 Kč</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Current Best Deals */}
      <section id="nabidky" className="bg-emerald-50/50 px-6 py-32 lg:px-8">
        <div className="mx-auto max-w-7xl">
          <div className="mb-12 flex items-end justify-between">
            <div>
              <span className="text-sm font-bold uppercase tracking-widest text-emerald-700">
                Úspora v reálném čase
              </span>
              <h2 className="mt-2 text-4xl font-extrabold text-emerald-950" style={{ fontFamily: 'Plus Jakarta Sans, sans-serif' }}>
                Aktuální nejlepší nabídky
              </h2>
            </div>
            <Link href="/app" className="flex items-center gap-2 font-bold text-emerald-700 transition hover:gap-3">
              Zobrazit vše →
            </Link>
          </div>

          <div className="grid gap-6 md:grid-cols-4">
            {/* Featured Large Card */}
            <div className="relative flex flex-col justify-between overflow-hidden rounded-3xl bg-white p-8 shadow-sm md:col-span-2 md:row-span-2">
              <div className="z-10">
                <span className="rounded-full bg-emerald-100 px-4 py-1 text-sm font-bold text-emerald-800">
                  -45% SLEVA
                </span>
                <h3 className="mt-4 text-3xl font-extrabold text-emerald-950" style={{ fontFamily: 'Plus Jakarta Sans, sans-serif' }}>
                  Premium arabská káva
                </h3>
                <p className="mt-2 max-w-xs text-emerald-700">
                  Skvělá příležitost. Nejnižší cena za posledních 90 dní v Albertu.
                </p>
              </div>
              <div className="z-10 mt-8">
                <div className="text-4xl font-black text-emerald-800">129,00 Kč</div>
                <Link 
                  href="/app"
                  className="mt-6 inline-block rounded-full bg-emerald-700 px-8 py-3 font-bold text-white transition hover:bg-emerald-800"
                >
                  Najít v aplikaci
                </Link>
              </div>
              <div className="absolute -bottom-20 -right-20 h-80 w-80 rounded-full bg-emerald-100/50"></div>
            </div>

            {/* Small Cards */}
            {[
              { name: "Bio mléko 1L", price: "24,90 Kč", discount: "-30%", emoji: "🥛" },
              { name: "Avokádo Hass", price: "19,90 Kč", discount: "-50%", emoji: "🥑" },
              { name: "Vejce (L) 10ks", price: "34,90 Kč", discount: "-25%", emoji: "🥚" },
              { name: "Premium sorbet", price: "89,90 Kč", discount: "-40%", emoji: "🍦" },
            ].map((item) => (
              <div key={item.name} className="rounded-3xl bg-white p-6 shadow-sm">
                <div className="mb-4 flex h-32 w-full items-center justify-center rounded-2xl bg-emerald-50 text-5xl">
                  {item.emoji}
                </div>
                <div className="text-sm font-bold uppercase tracking-tighter text-emerald-700">
                  Čerstvé
                </div>
                <h4 className="text-lg font-bold" style={{ fontFamily: 'Plus Jakarta Sans, sans-serif' }}>
                  {item.name}
                </h4>
                <div className="mt-2 flex items-center gap-2">
                  <span className="text-xl font-black text-emerald-800">{item.price}</span>
                  <span className="rounded bg-emerald-100 px-2 py-0.5 text-xs font-bold text-emerald-800">
                    {item.discount}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Weekly Leaflets */}
      <section id="letaky" className="px-6 py-32 lg:px-8">
        <div className="mx-auto max-w-7xl">
          <div className="mb-16 text-center">
            <h2 className="text-4xl font-extrabold text-emerald-950" style={{ fontFamily: 'Plus Jakarta Sans, sans-serif' }}>
              Týdenní letáky
            </h2>
            <p className="mt-4 text-lg text-emerald-700">
              Digitální verze katalogů vašich oblíbených obchodů, aktualizované každou hodinu.
            </p>
          </div>

          <div className="grid grid-cols-2 gap-8 md:grid-cols-3 lg:grid-cols-6">
            {[
              { name: "Albert", logo: "/albertlogo.png" },
              { name: "Lidl", logo: "/lidllogo.png" },
              { name: "Billa", logo: "/billalogo.png" },
              { name: "Tesco", logo: "/tescologo.png" },
              { name: "Penny", logo: "/pennylogo.png" },
              { name: "Kaufland", logo: "/kauflandlogo.png" },
            ].map((store) => (
              <div key={store.name} className="group cursor-pointer">
                <div className="aspect-[3/4] overflow-hidden rounded-2xl bg-white shadow-sm transition-all duration-300 group-hover:-translate-y-2 group-hover:shadow-xl">
                  <div className="flex h-full w-full items-center justify-center p-4">
                    <Image
                      src={store.logo}
                      alt={`${store.name} logo`}
                      width={120}
                      height={120}
                      className="h-auto w-full object-contain"
                    />
                  </div>
                </div>
                <div className="mt-4 text-center">
                  <p className="font-bold text-emerald-950">{store.name}</p>
                  <p className="text-xs font-medium text-emerald-600">Platný leták</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Recipes Section */}
      <section id="recepty" className="relative overflow-hidden bg-emerald-700 px-6 py-32 lg:px-8">
        <div className="absolute right-0 top-0 -z-10 h-full w-1/3 -skew-x-12 translate-x-20 transform bg-emerald-600/20"></div>
        <div className="relative z-10 mx-auto max-w-7xl">
          <div className="grid items-center gap-20 lg:grid-cols-2">
            <div>
              <h2 
                className="text-4xl font-extrabold leading-tight text-white lg:text-5xl"
                style={{ fontFamily: 'Plus Jakarta Sans, sans-serif' }}
              >
                Náměty na recepty se slevněnými ingrediencemi
              </h2>
              <p className="mt-6 max-w-lg text-xl text-emerald-100">
                Nejen najdeme nejlepší ceny; pomůžeme vám z nich uvařit skvělá jídla. 
                Nakupujte chytře, vařte lépe.
              </p>
              <Link
                href="/recepty"
                className="mt-12 inline-block rounded-full bg-white px-10 py-4 text-lg font-bold text-emerald-800 transition hover:bg-emerald-50"
              >
                Prozkoumat recepty
              </Link>
            </div>

            <div className="grid gap-6 md:grid-cols-2">
              {[
                {
                  name: "Sezonní salát",
                  items: 4,
                  savings: "82 Kč",
                  image: "https://images.unsplash.com/photo-1512621776951-a57141f2eefd?w=600&h=400&fit=crop",
                },
                {
                  name: "Krémové těstoviny",
                  items: 3,
                  savings: "45 Kč",
                  image: "https://images.unsplash.com/photo-1621996346565-e3dbc646d9a9?w=600&h=400&fit=crop",
                },
              ].map((recipe, idx) => (
                <div
                  key={recipe.name}
                  className={`rounded-3xl border border-white/10 bg-white/10 p-6 backdrop-blur-md ${
                    idx === 0 ? "-rotate-2" : "translate-y-8 rotate-3"
                  }`}
                >
                  <div className="mb-4 aspect-video overflow-hidden rounded-2xl">
                    <img alt={recipe.name} className="h-full w-full object-cover" src={recipe.image} />
                  </div>
                  <h3 className="text-xl font-bold text-white" style={{ fontFamily: 'Plus Jakarta Sans, sans-serif' }}>
                    {recipe.name}
                  </h3>
                  <div className="mt-4 flex items-center justify-between">
                    <span className="text-sm font-bold text-emerald-100">
                      {recipe.items} zlevněné položky
                    </span>
                    <span className="font-black text-emerald-100">Ušetříte {recipe.savings}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section id="aplikace" className="px-6 py-32 lg:px-8">
        <div className="relative mx-auto max-w-4xl overflow-hidden rounded-[3rem] bg-gradient-to-br from-emerald-50 to-emerald-100 p-12 text-center md:p-20">
          <div className="absolute -left-10 -top-10 h-40 w-40 rounded-full bg-emerald-200/40 blur-3xl"></div>
          <div className="absolute -bottom-10 -right-10 h-60 w-60 rounded-full bg-emerald-300/20 blur-3xl"></div>
          <h2 
            className="relative mb-8 text-4xl font-extrabold text-emerald-950 md:text-5xl"
            style={{ fontFamily: 'Plus Jakarta Sans, sans-serif' }}
          >
            Jste připraveni ušetřit tisíce každý měsíc?
          </h2>
          <p className="relative mx-auto mb-12 max-w-2xl text-xl text-emerald-800">
            Začněte používat foodapka ještě dnes a připojte se k chytrým nakupujícím po celé zemi.
          </p>
          <div className="relative flex flex-col items-center justify-center gap-6 sm:flex-row">
            <Link
              href="/app"
              className="flex w-full items-center justify-center gap-3 rounded-2xl bg-emerald-950 px-10 py-5 text-white transition hover:bg-emerald-900 sm:w-auto"
            >
              <span className="text-3xl">🔍</span>
              <div className="text-left">
                <div className="text-sm font-bold uppercase opacity-70">Spustit</div>
                <div className="text-2xl font-bold leading-none">Vyhledávač</div>
              </div>
            </Link>
            <Link
              href="/recepty"
              className="flex w-full items-center justify-center gap-3 rounded-2xl border-2 border-emerald-950 bg-white px-10 py-5 text-emerald-950 transition hover:bg-emerald-50 sm:w-auto"
            >
              <span className="text-3xl">🍳</span>
              <div className="text-left">
                <div className="text-sm font-bold uppercase opacity-70">Zobrazit</div>
                <div className="text-2xl font-bold leading-none">Recepty</div>
              </div>
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="w-full bg-emerald-50 pb-8 pt-16">
        <div className="mx-auto grid max-w-7xl grid-cols-1 gap-12 px-6 md:grid-cols-4 lg:px-8">
          <div className="col-span-1 md:col-span-1">
            <div className="mb-6 text-lg font-bold text-emerald-800">foodapka</div>
            <p className="max-w-xs text-sm text-emerald-700">
              Váš osobní kulinářský kurátor. Prohledáváme každý leták a obchod, 
              abychom vám našli nejlepší nabídky na ingredience, které milujete.
            </p>
          </div>
          <div>
            <h4 className="mb-6 font-bold text-emerald-800">Produkt</h4>
            <div className="flex flex-col gap-4 text-sm text-emerald-700">
              <Link href="/app" className="transition hover:text-emerald-900 hover:underline">
                Vyhledávač cen
              </Link>
              <Link href="/recepty" className="transition hover:text-emerald-900 hover:underline">
                Recepty
              </Link>
              <a href="#letaky" className="transition hover:text-emerald-900 hover:underline">
                Letáky
              </a>
            </div>
          </div>
          <div>
            <h4 className="mb-6 font-bold text-emerald-800">Společnost</h4>
            <div className="flex flex-col gap-4 text-sm text-emerald-700">
              <a href="#" className="transition hover:text-emerald-900 hover:underline">
                Ochrana soukromí
              </a>
              <a href="#" className="transition hover:text-emerald-900 hover:underline">
                Podmínky služby
              </a>
              <a href="#" className="transition hover:text-emerald-900 hover:underline">
                Kontaktujte nás
              </a>
            </div>
          </div>
          <div>
            <h4 className="mb-6 font-bold text-emerald-800">Sledujte nás</h4>
            <div className="flex flex-col gap-4 text-sm text-emerald-700">
              <a href="#" className="transition hover:text-emerald-900 hover:underline">
                Instagram
              </a>
              <a href="#" className="transition hover:text-emerald-900 hover:underline">
                Facebook
              </a>
            </div>
          </div>
        </div>
        <div className="mx-auto mt-16 flex max-w-7xl items-center justify-between border-t border-emerald-200 px-6 pt-8 text-sm text-emerald-700 lg:px-8">
          <div>© 2024 foodapka. Všechna práva vyhrazena.</div>
          <div className="flex gap-6">
            <span className="cursor-pointer text-emerald-700">🌍</span>
            <span className="font-bold">Česká republika</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
