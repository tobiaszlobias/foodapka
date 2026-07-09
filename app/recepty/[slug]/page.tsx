import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import SiteHeader from "@/components/SiteHeader";
import TestRecipeDetail from "@/components/TestRecipeDetail";
import { RECIPE_PRESETS, findRecipeBySlug, recipeSlug } from "@/lib/recipes";

// Zatím jediný recept s experimentálním layoutem (viz TestRecipeDetail) —
// inspirovaným UX vzorem, dokud se neschválí rozšíření na ostatní recepty.
const TEST_LAYOUT_SLUG = "studene-nudle-se-sojovou-omackou-a-kurecim-masem";

type PageProps = {
  params: Promise<{ slug: string }>;
};

export function generateStaticParams() {
  return RECIPE_PRESETS.map((recipe) => ({ slug: recipeSlug(recipe.name) }));
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const recipe = findRecipeBySlug(slug);
  if (!recipe) return { title: "Recept nenalezen | Mnamio" };
  return {
    title: `${recipe.name} | Mnamio`,
    description: `${recipe.description} Najdeme k němu nejlevnější suroviny v akci.`,
  };
}

export default async function RecipeDetailPage({ params }: PageProps) {
  const { slug } = await params;
  const recipe = findRecipeBySlug(slug);
  if (!recipe) notFound();

  if (slug === TEST_LAYOUT_SLUG) {
    return <TestRecipeDetail recipe={recipe} />;
  }

  const ingredientNames = recipe.ingredients.map((ing) =>
    typeof ing === "string" ? ing : ing.name,
  );

  return (
    <div className="min-h-screen bg-surface dark:bg-black transition-colors">
      <SiteHeader current="recipes" />

      <main className="max-w-3xl mx-auto px-4 md:px-6 py-8 md:py-12">
        <Link
          href="/recepty"
          className="inline-flex items-center gap-2 text-sm font-bold text-zinc-500 hover:text-mnamio-600 transition-colors mb-6"
        >
          <span className="material-symbols-outlined text-lg">arrow_back</span>
          Všechny recepty
        </Link>

        {recipe.image && (
          <div className="relative h-56 md:h-80 rounded-[2rem] overflow-hidden mb-8 shadow-lg">
            <Image
              src={recipe.image}
              alt={recipe.name}
              fill
              priority
              className="object-cover"
              sizes="(max-width: 768px) 100vw, 768px"
            />
            <div className="absolute top-4 left-4 px-3 py-1 rounded-full bg-white/90 backdrop-blur-md text-[10px] font-black text-mnamio-800 uppercase tracking-widest shadow-sm">
              #{recipe.tags[0]}
            </div>
          </div>
        )}

        <h1 className="text-3xl md:text-4xl font-display font-extrabold tracking-tight text-mnamio-950 dark:text-white leading-tight mb-3">
          {recipe.name}
        </h1>
        <p className="text-base md:text-lg text-zinc-600 dark:text-zinc-400 mb-8">
          {recipe.description}
        </p>

        <Link
          href={`/app?mode=recipes&query=${encodeURIComponent(recipe.name)}`}
          className="inline-flex items-center gap-2 rounded-full bg-mnamio-600 px-8 py-3.5 font-black text-white shadow-lg shadow-mnamio-600/20 transition hover:bg-mnamio-700 active:scale-95 mb-10"
        >
          <span className="material-symbols-outlined text-xl">shopping_cart</span>
          Najít nejlevnější suroviny
        </Link>

        <section className="rounded-2xl border border-mnamio-100 dark:border-zinc-800 bg-white/95 dark:bg-mnamio-950 p-6 md:p-8 shadow-sm mb-6">
          <h2 className="text-xl font-bold text-zinc-900 dark:text-white mb-4 flex items-center gap-2">
            <span className="material-symbols-outlined text-mnamio-600">grocery</span>
            Ingredience
          </h2>
          <ul className="space-y-2.5">
            {ingredientNames.map((name) => (
              <li key={name} className="flex items-center gap-3 text-zinc-700 dark:text-zinc-300">
                <span className="w-2 h-2 rounded-full bg-mnamio-500 shrink-0" />
                <span className="capitalize">{name}</span>
              </li>
            ))}
          </ul>
        </section>

        {recipe.instructions && recipe.instructions.length > 0 && (
          <section className="rounded-2xl border border-mnamio-100 dark:border-zinc-800 bg-white/95 dark:bg-mnamio-950 p-6 md:p-8 shadow-sm">
            <h2 className="text-xl font-bold text-zinc-900 dark:text-white mb-6 flex items-center gap-2">
              <span className="material-symbols-outlined text-mnamio-600">restaurant_menu</span>
              Postup přípravy
            </h2>
            <div className="space-y-4">
              {recipe.instructions.map((step, index) => (
                <div key={index} className="flex gap-4">
                  <div className="flex-shrink-0 w-8 h-8 rounded-full bg-mnamio-100 dark:bg-mnamio-900/40 text-mnamio-700 dark:text-mnamio-300 flex items-center justify-center font-black text-sm border border-mnamio-200 dark:border-mnamio-800">
                    {index + 1}
                  </div>
                  <p className="text-zinc-700 dark:text-zinc-300 leading-relaxed pt-1">
                    {typeof step === "string" ? step : step.text}
                  </p>
                </div>
              ))}
            </div>
          </section>
        )}
      </main>
    </div>
  );
}
