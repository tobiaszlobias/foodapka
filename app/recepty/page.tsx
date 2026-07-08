import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import SiteHeader from "@/components/SiteHeader";
import { RECIPE_PRESETS, recipeSlug } from "@/lib/recipes";

export const metadata: Metadata = {
  title: "Recepty | Mnamio",
  description:
    "Recepty s chytrým nákupem — ke každému receptu najdeme nejlevnější suroviny v akci napříč supermarkety.",
};

export default function RecipesIndexPage() {
  return (
    <div className="min-h-screen bg-surface dark:bg-black transition-colors">
      <SiteHeader current="recipes" />

      <main className="max-w-5xl mx-auto px-4 md:px-6 py-10 md:py-16">
        <header className="mb-10 text-left">
          <h1 className="text-3xl md:text-5xl font-display font-extrabold tracking-tight text-mnamio-950 dark:text-white leading-tight mb-3">
            Recepty <span className="text-mnamio-600 dark:text-mnamio-400">s chytrým nákupem</span>
          </h1>
          <p className="text-base md:text-lg text-zinc-600 dark:text-zinc-400 max-w-2xl">
            Vyberte si recept a my najdeme nejlevnější suroviny v aktuálních akcích supermarketů.
          </p>
        </header>

        <section className="grid gap-5 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
          {RECIPE_PRESETS.map((recipe) => (
            <Link
              key={recipe.name}
              href={`/recepty/${recipeSlug(recipe.name)}`}
              className="group rounded-2xl bg-white dark:bg-mnamio-950 border border-zinc-100 dark:border-zinc-800 overflow-hidden shadow-sm transition-all hover:shadow-lg hover:-translate-y-0.5 active:scale-[0.98]"
            >
              {recipe.image && (
                <div className="h-44 relative">
                  <Image
                    src={recipe.image}
                    alt={recipe.name}
                    fill
                    className="object-cover transition-transform duration-500 group-hover:scale-105"
                    sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                  />
                  <div className="absolute top-3 left-3 px-3 py-1 rounded-full bg-white/90 backdrop-blur-md text-[10px] font-black text-mnamio-800 uppercase tracking-widest shadow-sm">
                    #{recipe.tag}
                  </div>
                </div>
              )}
              <div className="p-5">
                <h2 className="text-lg font-black text-zinc-900 dark:text-white leading-tight group-hover:text-mnamio-600 transition-colors">
                  {recipe.name}
                </h2>
                <p className="mt-2 text-sm text-zinc-500 dark:text-zinc-400 line-clamp-2 font-medium">
                  {recipe.description}
                </p>
              </div>
            </Link>
          ))}
        </section>

        <div className="mt-12 rounded-[2rem] bg-mnamio-950 p-8 md:p-10 text-white text-center">
          <h2 className="text-xl md:text-2xl font-black mb-2">Nenašli jste svůj recept?</h2>
          <p className="text-sm md:text-base text-mnamio-200 mb-6">
            V aplikaci si můžete vytvořit vlastní recept nebo si ho nechat vygenerovat od AI.
          </p>
          <Link
            href="/app?mode=recipes"
            className="inline-flex items-center gap-2 rounded-full bg-mnamio-500 px-8 py-3 font-black text-white transition hover:bg-mnamio-600 active:scale-95"
          >
            Otevřít aplikaci
          </Link>
        </div>
      </main>
    </div>
  );
}
