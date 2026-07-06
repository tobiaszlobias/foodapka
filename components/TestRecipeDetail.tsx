"use client";

import { useMemo, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import type { RecipePreset } from "@/lib/recipes";

type Tab = "ingredients" | "method" | "nutrition";

/** Experimentální layout detailu receptu — inspirovaný UX vzorem (taby, počet
 * porcí s přepočtem, cooking mode), zatím jen pro jeden testovací recept.
 * Vlastní fonty (Special Gothic Expanded One / Stack Sans Text) jsou tu
 * izolované přes inline style, aby neovlivnily zbytek appky. */
export default function TestRecipeDetail({ recipe }: { recipe: RecipePreset }) {
  const [activeTab, setActiveTab] = useState<Tab>("ingredients");
  const [servings, setServings] = useState(recipe.baseServings ?? 2);
  const [cookingMode, setCookingMode] = useState(false);
  const baseServings = recipe.baseServings ?? 2;

  const scaledIngredients = useMemo(() => {
    const scale = servings / baseServings;
    return recipe.ingredients.map((ing) => {
      if (typeof ing === "string") return { name: ing, amount: undefined };
      if (ing.amountValue && ing.amountUnit) {
        const scaledValue = ing.amountValue * scale;
        const formatted = Number.isInteger(scaledValue)
          ? scaledValue.toString()
          : scaledValue.toFixed(1).replace(/\.0$/, "");
        return { name: ing.name, amount: `${formatted} ${ing.amountUnit}` };
      }
      return { name: ing.name, amount: ing.amount };
    });
  }, [recipe.ingredients, servings, baseServings]);

  const headingStyle = { fontFamily: "var(--font-special-gothic)" };
  const bodyStyle = { fontFamily: "'Stack Sans Text', var(--font-manrope)" };

  return (
    <div className="min-h-screen bg-[#FAF8F1] dark:bg-black transition-colors" style={bodyStyle}>
      {recipe.image && (
        <div className="relative h-56 md:h-72 w-full">
          <Image src={recipe.image} alt={recipe.name} fill priority className="object-cover" />
        </div>
      )}

      <main className="max-w-3xl mx-auto px-5 md:px-8 py-8">
        <Link
          href="/recepty"
          className="inline-flex items-center gap-2 text-sm font-bold text-zinc-500 hover:text-foodappka-700 transition-colors mb-6"
        >
          <span className="material-symbols-outlined text-lg">arrow_back</span>
          Všechny recepty
        </Link>

        <h1
          className="text-4xl md:text-6xl uppercase leading-[0.95] text-foodappka-800 dark:text-foodappka-400 mb-6"
          style={headingStyle}
        >
          {recipe.name}
        </h1>

        <div className="flex flex-wrap items-center gap-3 mb-8">
          <button
            onClick={() => setCookingMode((v) => !v)}
            className="inline-flex items-center gap-2 rounded-full bg-foodappka-600 text-white px-5 py-2.5 font-bold text-sm hover:bg-foodappka-700 transition active:scale-95"
          >
            <span className="material-symbols-outlined text-lg">play_arrow</span>
            Play
          </button>
          <button className="inline-flex items-center gap-2 rounded-full border-2 border-foodappka-200 dark:border-foodappka-800 px-5 py-2.5 font-bold text-sm text-zinc-700 dark:text-zinc-300 hover:bg-foodappka-50 dark:hover:bg-foodappka-900/30 transition">
            <span className="material-symbols-outlined text-lg">bookmark</span>
            Uložit
          </button>
          <button className="inline-flex items-center gap-2 rounded-full border-2 border-foodappka-200 dark:border-foodappka-800 px-5 py-2.5 font-bold text-sm text-zinc-700 dark:text-zinc-300 hover:bg-foodappka-50 dark:hover:bg-foodappka-900/30 transition">
            <span className="material-symbols-outlined text-lg">check</span>
            Uvařeno
          </button>
          <button className="inline-flex items-center gap-2 rounded-full border-2 border-foodappka-200 dark:border-foodappka-800 px-5 py-2.5 font-bold text-sm text-zinc-700 dark:text-zinc-300 hover:bg-foodappka-50 dark:hover:bg-foodappka-900/30 transition">
            <span className="material-symbols-outlined text-lg">calendar_add_on</span>
            Přidat do plánu
          </button>
        </div>

        {recipe.timing && (
          <div className="flex items-center gap-8 mb-8">
            <div>
              <p className="text-xs font-black uppercase tracking-widest text-foodappka-700 dark:text-foodappka-400">Příprava</p>
              <p className="text-lg font-bold text-zinc-900 dark:text-white">{recipe.timing.prepMinutes}m</p>
            </div>
            <div>
              <p className="text-xs font-black uppercase tracking-widest text-foodappka-700 dark:text-foodappka-400">Vaření</p>
              <p className="text-lg font-bold text-zinc-900 dark:text-white">{recipe.timing.cookMinutes}m</p>
            </div>
            <div>
              <p className="text-xs font-black uppercase tracking-widest text-foodappka-700 dark:text-foodappka-400">Celkem</p>
              <p className="text-lg font-bold text-zinc-900 dark:text-white">
                {recipe.timing.prepMinutes + recipe.timing.cookMinutes}m
              </p>
            </div>
          </div>
        )}

        <div className="flex items-center gap-6 border-b border-zinc-200 dark:border-zinc-800 mb-6">
          {(
            [
              ["ingredients", "Ingredience"],
              ["method", "Postup"],
              ["nutrition", "Nutriční hodnoty"],
            ] as [Tab, string][]
          ).map(([tab, label]) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`pb-3 font-bold text-lg transition-colors border-b-2 -mb-px ${
                activeTab === tab
                  ? "text-foodappka-700 dark:text-foodappka-400 border-foodappka-600"
                  : "text-zinc-400 border-transparent hover:text-zinc-600"
              }`}
              style={headingStyle}
            >
              {label}
            </button>
          ))}
        </div>

        {activeTab === "ingredients" && (
          <div>
            <div className="flex items-center gap-3 mb-6">
              <span className="text-sm font-bold text-zinc-600 dark:text-zinc-400">Pro</span>
              <button
                onClick={() => setServings((s) => Math.max(1, s - 1))}
                className="flex h-8 w-8 items-center justify-center rounded-full bg-foodappka-700 text-white font-bold hover:bg-foodappka-800 transition"
              >
                −
              </button>
              <span className="w-8 text-center font-bold text-zinc-900 dark:text-white">{servings}</span>
              <button
                onClick={() => setServings((s) => s + 1)}
                className="flex h-8 w-8 items-center justify-center rounded-full bg-foodappka-700 text-white font-bold hover:bg-foodappka-800 transition"
              >
                +
              </button>
              <span className="text-sm text-zinc-500">porcí</span>
            </div>

            <ul className="divide-y divide-zinc-200 dark:divide-zinc-800">
              {scaledIngredients.map((ing, idx) => (
                <li key={idx} className="flex items-center justify-between gap-4 py-3">
                  <span className="w-24 shrink-0 text-sm font-bold text-zinc-500">{ing.amount ?? ""}</span>
                  <span className="flex-1 text-zinc-800 dark:text-zinc-200 capitalize">{ing.name}</span>
                  <input
                    type="checkbox"
                    className="h-5 w-5 rounded border-2 border-foodappka-300 text-foodappka-600 focus:ring-foodappka-500"
                  />
                </li>
              ))}
            </ul>
          </div>
        )}

        {activeTab === "method" && recipe.instructions && (
          <div>
            <label className="inline-flex items-center gap-3 mb-6 cursor-pointer">
              <span className="text-sm font-bold text-zinc-700 dark:text-zinc-300">
                {cookingMode ? "Vypnout cooking mode" : "Zapnout cooking mode"}
              </span>
              <span
                onClick={() => setCookingMode((v) => !v)}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors cursor-pointer ${
                  cookingMode ? "bg-foodappka-600" : "bg-zinc-300 dark:bg-zinc-700"
                }`}
              >
                <span
                  className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                    cookingMode ? "translate-x-6" : "translate-x-1"
                  }`}
                />
              </span>
            </label>
            {cookingMode && (
              <p className="text-xs text-foodappka-700 dark:text-foodappka-400 font-bold mb-4 flex items-center gap-1.5">
                <span className="material-symbols-outlined text-sm">visibility</span>
                Obrazovka zůstane rozsvícená během vaření.
              </p>
            )}
            <ol className="space-y-4">
              {recipe.instructions.map((step, index) => (
                <li key={index} className="flex gap-4">
                  <div
                    className="flex-shrink-0 w-9 h-9 rounded-full bg-foodappka-700 text-white flex items-center justify-center font-black"
                    style={headingStyle}
                  >
                    {index + 1}
                  </div>
                  <p className="text-zinc-700 dark:text-zinc-300 leading-relaxed pt-1.5">{step}</p>
                </li>
              ))}
            </ol>
          </div>
        )}

        {activeTab === "nutrition" && recipe.nutrition && (
          <div className="grid grid-cols-2 gap-4 max-w-sm">
            <div className="rounded-2xl border border-foodappka-100 dark:border-zinc-800 p-4">
              <p className="text-xs font-black uppercase tracking-widest text-zinc-400">Kalorie</p>
              <p className="text-2xl font-black text-zinc-900 dark:text-white">{recipe.nutrition.calories}</p>
            </div>
            <div className="rounded-2xl border border-foodappka-100 dark:border-zinc-800 p-4">
              <p className="text-xs font-black uppercase tracking-widest text-zinc-400">Bílkoviny</p>
              <p className="text-2xl font-black text-zinc-900 dark:text-white">{recipe.nutrition.protein}g</p>
            </div>
          </div>
        )}

        <div className="mt-10">
          <Link
            href={`/app?mode=recipes&query=${encodeURIComponent(recipe.name)}`}
            className="inline-flex items-center gap-2 rounded-full bg-foodappka-600 px-8 py-3.5 font-black text-white shadow-lg shadow-foodappka-600/20 transition hover:bg-foodappka-700 active:scale-95"
          >
            <span className="material-symbols-outlined text-xl">shopping_cart</span>
            Najít nejlevnější suroviny
          </Link>
        </div>
      </main>
    </div>
  );
}
