"use client";

import SiteHeader from "@/components/SiteHeader";
import {
  calculateStoreSavings,
  cleanProductName,
  getStoreIcon,
  parsePrice,
  sortStoresByPrice,
  type Product,
  type Store,
} from "@/lib/food";
import { RECIPE_PRESETS } from "@/lib/recipes";
import { useEffect, useRef, useState } from "react";

type RecipeIngredient = {
  name: string;
  searchQuery: string;
};

type IngredientResult = {
  ingredient: string;
  product: Product | null;
  store: Store | null;
  lookupStatus: "sale" | "not_on_sale" | "not_found";
  matchNote?: string;
  statusNote?: string;
  estimatedPrice?: {
    minPrice: number;
    maxPrice: number;
    note?: string;
  };
};

type SavedShoppingList = {
  recipe: string;
  ingredients: string[];
  results: IngredientResult[];
  checkedIngredients?: string[];
};

const STORAGE_KEY = "foodapka-shopping-list";

async function readJsonSafely(response: Response) {
  const text = await response.text();
  if (!text.trim()) {
    return null;
  }

  try {
    return JSON.parse(text) as unknown;
  } catch {
    return null;
  }
}

function normalizeIngredientKey(value: string) {
  return value
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim();
}

function resolveLookupStatus(item: {
  store?: Store | null;
  product?: Product | null;
}) {
  if (item.store) return "sale" as const;
  if (item.product?.availability === "not_on_sale") return "not_on_sale" as const;
  return "not_found" as const;
}

function ShareIcon() {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 24 24"
      className="h-4 w-4"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M12 16V4" />
      <path d="m7 9 5-5 5 5" />
      <path d="M5 20h14" />
    </svg>
  );
}

function BookmarkIcon() {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 24 24"
      className="h-4 w-4"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M7 4h10v16l-5-3-5 3z" />
    </svg>
  );
}

function RecipeSkeleton() {
  return (
    <div className="grid gap-4">
      {Array.from({ length: 4 }).map((_, index) => (
        <div
          key={index}
          className="animate-pulse rounded-[1.75rem] border border-emerald-100 bg-white/85 p-5 dark:border-slate-800 dark:bg-slate-950/80"
        >
          <div className="h-5 w-36 rounded-full bg-emerald-100 dark:bg-emerald-900/60" />
          <div className="mt-4 h-20 rounded-[1.25rem] bg-zinc-100 dark:bg-slate-800" />
        </div>
      ))}
    </div>
  );
}

export default function RecipesPage() {
  const [recipe, setRecipe] = useState("");
  const [activeRecipe, setActiveRecipe] = useState("");
  const [loading, setLoading] = useState(false);
  const [ingredients, setIngredients] = useState<RecipeIngredient[]>([]);
  const [results, setResults] = useState<IngredientResult[]>([]);
  const [checkedIngredients, setCheckedIngredients] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [shareMessage, setShareMessage] = useState<string | null>(null);
  const [estimatingMissingPrices, setEstimatingMissingPrices] = useState(false);
  const shoppingListRef = useRef<HTMLElement | null>(null);
  const shouldScrollToResultsRef = useRef(false);
  const itemsToBuy = results.filter(
    (item) => !checkedIngredients.includes(item.ingredient),
  );
  const exactTotalPrice = itemsToBuy.reduce((sum, item) => {
    if (!item.store) return sum;
    return sum + parsePrice(item.store.price);
  }, 0);
  const estimatedPriceRange = itemsToBuy.reduce(
    (summary, item) => {
      if (!item.estimatedPrice) return summary;

      return {
        min: summary.min + item.estimatedPrice.minPrice,
        max: summary.max + item.estimatedPrice.maxPrice,
      };
    },
    { min: 0, max: 0 },
  );
  const hasEstimatedTotals = estimatedPriceRange.max > 0;
  const unresolvedItems = itemsToBuy.filter((item) => item.lookupStatus !== "sale");
  const missingItemsCount = unresolvedItems.filter(
    (item) => item.lookupStatus === "not_found",
  ).length;
  const notOnSaleItemsCount = unresolvedItems.filter(
    (item) => item.lookupStatus === "not_on_sale",
  ).length;

  const savingsSummary = itemsToBuy.reduce(
    (summary, item) => {
      if (!item.store) return summary;

      const savings = calculateStoreSavings(item.store);
      if (!savings) return summary;

      const savingValue = Number(savings.saving.replace(",", "."));
      if (!Number.isFinite(savingValue)) return summary;

      return {
        total: summary.total + savingValue,
        exact:
          summary.exact +
          (savings.source === "exact" ? savingValue : 0),
        estimated:
          summary.estimated +
          (savings.source === "estimated" ? savingValue : 0),
      };
    },
    { total: 0, exact: 0, estimated: 0 },
  );

  const totalSavings = savingsSummary.total;

  useEffect(() => {
    const saved = window.localStorage.getItem(STORAGE_KEY);
    if (!saved) return;

    try {
      const parsed = JSON.parse(saved) as SavedShoppingList;
      setRecipe(parsed.recipe);
      setActiveRecipe(parsed.recipe);
      setIngredients(
        parsed.ingredients.map((ingredient) => ({
          name: ingredient,
          searchQuery: ingredient,
        })),
      );
      setResults(
        parsed.results.map((item) => ({
          ...item,
          lookupStatus: resolveLookupStatus(item),
        })),
      );
      setCheckedIngredients(parsed.checkedIngredients ?? []);
    } catch {
      window.localStorage.removeItem(STORAGE_KEY);
    }
  }, []);

  useEffect(() => {
    if (!shareMessage) return;

    const timeout = window.setTimeout(() => setShareMessage(null), 2500);
    return () => window.clearTimeout(timeout);
  }, [shareMessage]);

  useEffect(() => {
    if (!shouldScrollToResultsRef.current || loading) return;
    if (results.length === 0 && !error) return;

    shoppingListRef.current?.scrollIntoView({
      behavior: "smooth",
      block: "start",
    });
    shouldScrollToResultsRef.current = false;
  }, [loading, results, error]);

  function toggleIngredient(ingredient: string) {
    setCheckedIngredients((current) =>
      current.includes(ingredient)
        ? current.filter((item) => item !== ingredient)
        : [...current, ingredient],
    );
  }

  function buildShoppingListText() {
    const lines = [
      activeRecipe ? `Nakup pro recept: ${activeRecipe}` : "Nakupni seznam",
      "",
      ...results.map((item) => {
        if (checkedIngredients.includes(item.ingredient)) {
          return `- ${item.ingredient}: mám doma`;
        }

        if (item.estimatedPrice) {
          const range = `${item.estimatedPrice.minPrice}-${item.estimatedPrice.maxPrice} Kč`;
          const note = item.estimatedPrice.note
            ? ` (${item.estimatedPrice.note})`
            : "";

          return `- ${item.ingredient}: AI odhad ${range}${note}`;
        }

        if (!item.product || !item.store) {
          return `- ${item.ingredient}: bez nalezene nabidky`;
        }

        const meta = [item.store.price, item.store.shopName]
          .filter(Boolean)
          .join(" - ");
        const savings = calculateStoreSavings(item.store);
        const savingsSuffix = savings
          ? savings.source === "estimated"
            ? ` (odhad úspory ${savings.saving} Kc)`
            : ` (úspora ${savings.saving} Kc)`
          : "";

        return `- ${item.ingredient}: ${meta}${savingsSuffix}`;
      }),
      "",
      `Zbyva koupit: ${itemsToBuy.length} polozek`,
      hasEstimatedTotals
        ? `Cena nakupu: ${exactTotalPrice.toFixed(2).replace(".", ",")} + AI odhad ${estimatedPriceRange.min}-${estimatedPriceRange.max} Kc`
        : `Cena nakupu: ${exactTotalPrice.toFixed(2).replace(".", ",")} Kc`,
      `Uspora: ${totalSavings.toFixed(2).replace(".", ",")} Kc`,
    ];

    return lines.join("\n");
  }

  function saveShoppingList() {
    const payload: SavedShoppingList = {
      recipe: activeRecipe || recipe,
      ingredients: ingredients.map((ingredient) => ingredient.name),
      results,
      checkedIngredients,
    };

    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
    setShareMessage("Seznam je uložený v tomto zařízení.");
  }

  async function shareShoppingList() {
    const text = buildShoppingListText();

    if (navigator.share) {
      try {
        await navigator.share({
          title: activeRecipe || "Nákupní seznam",
          text,
        });
        setShareMessage("Seznam byl nasdílen.");
        return;
      } catch {
        // Fall back to clipboard if the share sheet was closed or unsupported.
      }
    }

    await navigator.clipboard.writeText(text);
    setShareMessage("Seznam je zkopírovaný do schránky.");
  }

  async function runRecipeSearch(recipeName: string) {
    if (!recipeName.trim()) return;

    shouldScrollToResultsRef.current = true;
    setLoading(true);
    setError(null);
    setEstimatingMissingPrices(false);
    setActiveRecipe(recipeName);
    setResults([]);
    setIngredients([]);
    setCheckedIngredients([]);

    try {
      const recipeResponse = await fetch("/api/recipe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ recipe: recipeName }),
      });
      const recipeData = (await readJsonSafely(recipeResponse)) as
        | {
            recipe?: string;
            ingredients?: unknown[];
            error?: string;
          }
        | null;

      if (!recipeResponse.ok) {
        throw new Error(
          recipeData?.error || "Nepodařilo se načíst ingredience receptu.",
        );
      }

      if (!recipeData) {
        throw new Error("Recept endpoint vrátil neplatnou odpověď.");
      }

      const parsedIngredients: RecipeIngredient[] = Array.isArray(
        recipeData.ingredients,
      )
        ? recipeData.ingredients
            .map((ingredient: unknown) => {
              if (typeof ingredient === "string") {
                return {
                  name: ingredient,
                  searchQuery: ingredient,
                };
              }

              if (
                ingredient &&
                typeof ingredient === "object"
              ) {
                const ingredientRecord = ingredient as Record<string, unknown>;

                if (typeof ingredientRecord.name !== "string") {
                  return null;
                }

                return {
                  name: ingredientRecord.name,
                  searchQuery:
                    typeof ingredientRecord.searchQuery === "string" &&
                    ingredientRecord.searchQuery.trim()
                      ? ingredientRecord.searchQuery
                      : ingredientRecord.name,
                };
              }

              return null;
            })
            .filter(
              (ingredient: RecipeIngredient | null): ingredient is RecipeIngredient =>
                !!ingredient,
            )
        : [];

      setActiveRecipe(recipeData.recipe ?? recipeName);
      setIngredients(parsedIngredients);

      const ingredientResults = await Promise.all(
        parsedIngredients.map(async (ingredient) => {
          const searchParams = new URLSearchParams({
            q: ingredient.searchQuery,
            recipe: recipeData.recipe ?? recipeName,
            ingredients: parsedIngredients.map((item) => item.name).join("|"),
          });
          const searchResponse = await fetch(`/api/search?${searchParams}`);
          const searchData = (await readJsonSafely(searchResponse)) as
            | {
                products?: Product[];
                usedFallbackQuery?: boolean;
                resolvedQuery?: string;
              }
            | null;
          const products = (searchData?.products ?? []) as Product[];

          const cheapestProduct = products
            .map((product) => ({
              product,
              stores: sortStoresByPrice(product.stores),
            }))
            .filter((item) => item.stores.length > 0)
            .sort(
              (a, b) =>
                parsePrice(a.stores[0].price) - parsePrice(b.stores[0].price),
            )[0];
          const firstKnownProduct =
            products.find((product) => product.availability === "not_on_sale") ??
            products[0] ??
            null;

          return {
            ingredient: ingredient.name,
            product: cheapestProduct?.product ?? firstKnownProduct,
            store: cheapestProduct?.stores[0] ?? null,
            lookupStatus: resolveLookupStatus({
              store: cheapestProduct?.stores[0] ?? null,
              product: cheapestProduct?.product ?? firstKnownProduct,
            }),
            matchNote:
              searchData?.usedFallbackQuery && searchData.resolvedQuery
                ? `Použili jsme nejbližší akční alternativu pro dotaz: ${searchData.resolvedQuery}`
                : undefined,
            statusNote:
              !cheapestProduct &&
              firstKnownProduct?.availability === "not_on_sale"
                ? "Produkt jsme našli na Kupi, ale momentálně není v akci."
                : undefined,
          };
        }),
      );

      setResults(ingredientResults);

      const missingItems = ingredientResults.filter((item) => !item.store);

      if (missingItems.length > 0) {
        setEstimatingMissingPrices(true);

        try {
          const estimateResponse = await fetch("/api/estimate-price", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              recipe: recipeData.recipe ?? recipeName,
              items: missingItems.map((item) => ({
                ingredient: item.ingredient,
                productName: item.product?.name ?? null,
                status:
                  item.product?.availability === "not_on_sale"
                    ? "not_on_sale"
                    : "not_found",
              })),
            }),
          });
          const estimateData = (await readJsonSafely(estimateResponse)) as
            | {
                items?: Array<{
                  ingredient: string;
                  minPrice: number;
                  maxPrice: number;
                  note?: string;
                }>;
              }
            | null;

          if (estimateResponse.ok && Array.isArray(estimateData?.items)) {
            const estimateMap = new Map(
              estimateData.items.map((item) => [
                normalizeIngredientKey(item.ingredient),
                item,
              ]),
            );

            setResults((current) =>
              current.map((item) => {
                if (item.store) return item;

                const estimate = estimateMap.get(
                  normalizeIngredientKey(item.ingredient),
                );
                if (!estimate) return item;

                return {
                  ...item,
                  estimatedPrice: {
                    minPrice: estimate.minPrice,
                    maxPrice: estimate.maxPrice,
                    note: estimate.note,
                  },
                };
              }),
            );
          }
        } finally {
          setEstimatingMissingPrices(false);
        }
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Něco se pokazilo.");
    } finally {
      setLoading(false);
    }
  }

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    await runRecipeSearch(recipe);
  }

  return (
    <main className="min-h-screen bg-[radial-gradient(circle_at_top,_rgba(110,231,183,0.22),_transparent_35%),linear-gradient(180deg,_#ecfdf5_0%,_#f8fafc_52%,_#f5f7f6_100%)] px-4 py-6 dark:bg-[radial-gradient(circle_at_top,_rgba(16,185,129,0.16),_transparent_30%),linear-gradient(180deg,_#07130f_0%,_#091510_50%,_#0d1714_100%)] sm:px-6 lg:px-8">
      <div className="mx-auto flex max-w-6xl flex-col gap-8">
        <section className="rounded-[2rem] border border-white/70 bg-[linear-gradient(135deg,_rgba(236,253,245,0.96),_rgba(209,250,229,0.9)_45%,_rgba(167,243,208,0.74)_100%)] p-5 shadow-[0_30px_90px_-40px_rgba(5,150,105,0.55)] dark:border-slate-800 dark:bg-[linear-gradient(145deg,_rgba(10,24,20,0.96),_rgba(12,34,27,0.92)_48%,_rgba(15,61,47,0.78)_100%)] dark:shadow-[0_40px_120px_-56px_rgba(0,0,0,0.95)] sm:p-8 lg:p-10">
          <SiteHeader current="recipes" />
          <div className="mt-10 grid gap-8 lg:grid-cols-[minmax(0,1.15fr)_minmax(280px,0.85fr)] lg:items-center">
            <div className="space-y-4">
              <h1 className="text-4xl font-bold tracking-tight text-emerald-950 dark:text-slate-50 sm:text-5xl">
                Napište recept a foodapka najde nejlevnější suroviny.
              </h1>
              <p className="max-w-2xl text-base leading-7 text-emerald-950/75 dark:text-slate-300 sm:text-lg">
                Ingredience bereme z připraveného katalogu receptů a ke každé
                dohledáme nejlevnější aktuálně dostupnou variantu.
              </p>
              <p className="text-sm font-medium text-emerald-800 dark:text-emerald-300">
                Výsledek si pak můžete uložit nebo poslat jako nákupní list.
              </p>
            </div>

            <form
              onSubmit={handleSubmit}
              className="rounded-[1.75rem] border border-white/70 bg-white/85 p-4 shadow-[0_20px_60px_-35px_rgba(16,185,129,0.45)] dark:border-slate-800 dark:bg-slate-950/80 dark:shadow-[0_28px_80px_-44px_rgba(0,0,0,0.9)]"
            >
              <label
                htmlFor="recipe-name"
                className="mb-3 block text-sm font-semibold text-emerald-900 dark:text-slate-100"
              >
                Název receptu
              </label>
              <input
                id="recipe-name"
                type="text"
                value={recipe}
                onChange={(event) => setRecipe(event.target.value)}
                placeholder="Např. Svíčková, Špagety carbonara nebo wrap"
                className="h-14 w-full rounded-[1.2rem] border border-emerald-100 bg-emerald-50/60 px-4 text-base text-zinc-900 outline-none transition placeholder:text-zinc-500 focus:border-emerald-400 focus:bg-white dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100 dark:placeholder:text-slate-400 dark:focus:bg-slate-950"
              />
              <button
                type="submit"
                className="mt-4 inline-flex h-12 w-full items-center justify-center rounded-[1rem] bg-emerald-600 px-5 text-sm font-semibold text-white transition hover:bg-emerald-700 dark:bg-emerald-500 dark:text-slate-950 dark:hover:bg-emerald-400"
              >
                Najít ingredience
              </button>
            </form>
          </div>
        </section>

        <section className="space-y-5">
          <div>
            <h2 className="text-2xl font-semibold tracking-tight text-emerald-950 dark:text-slate-100">
              Rychlý výběr
            </h2>
            <p className="mt-1 text-sm text-zinc-600 dark:text-slate-400">
              Klikněte na hotový nápad a rovnou spočítáme nejlevnější suroviny.
            </p>
          </div>
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {RECIPE_PRESETS.map((preset) => (
              <button
                key={preset.name}
                type="button"
                onClick={() => {
                  setRecipe(preset.name);
                  void runRecipeSearch(preset.name);
                }}
                className="rounded-[1.5rem] border border-emerald-100 bg-white/90 p-5 text-left shadow-[0_20px_50px_-35px_rgba(16,185,129,0.45)] transition hover:-translate-y-0.5 hover:border-emerald-300 hover:bg-emerald-50 dark:border-slate-800 dark:bg-slate-950/85 dark:shadow-[0_28px_80px_-44px_rgba(0,0,0,0.9)] dark:hover:border-emerald-500 dark:hover:bg-slate-900"
              >
                <span className="inline-flex rounded-full bg-emerald-100 px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-emerald-800 dark:bg-emerald-900/50 dark:text-emerald-300">
                  {preset.tag}
                </span>
                <h3 className="mt-4 text-lg font-semibold text-zinc-950 dark:text-slate-100">
                  {preset.name}
                </h3>
                <p className="mt-2 text-sm leading-6 text-zinc-600 dark:text-slate-400">
                  {preset.description}
                </p>
              </button>
            ))}
          </div>
        </section>

        <section ref={shoppingListRef} className="scroll-mt-24 space-y-5">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <h2 className="text-2xl font-semibold tracking-tight text-emerald-950 dark:text-slate-100">
                Nákupní list
              </h2>
              <p className="text-sm text-zinc-600 dark:text-slate-400">
                Odškrtávejte položky a vezměte si seznam s sebou do obchodu.
              </p>
            </div>
            {ingredients.length > 0 && !loading && (
              <p className="rounded-full border border-emerald-200 bg-white px-4 py-2 text-sm font-medium text-emerald-800 dark:border-slate-700 dark:bg-slate-950/85 dark:text-emerald-300">
                {ingredients.length} ingrediencí
              </p>
            )}
          </div>

          {error && (
            <div className="rounded-[1.5rem] border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-900/70 dark:bg-red-950/40 dark:text-red-300">
              {error}
            </div>
          )}

          {loading && <RecipeSkeleton />}

          {!loading && results.length > 0 && (
            <div className="grid gap-4">
              <div className="rounded-[1.75rem] border border-emerald-100 bg-white/95 p-4 shadow-[0_20px_50px_-35px_rgba(16,185,129,0.45)] dark:border-slate-800 dark:bg-slate-950/88 dark:shadow-[0_32px_90px_-48px_rgba(0,0,0,0.92)] sm:p-5">
                <div className="flex flex-col gap-4 border-b border-emerald-100 pb-4 dark:border-slate-800 sm:flex-row sm:items-start sm:justify-between">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.2em] text-emerald-700 dark:text-emerald-300">
                      Nákup pro
                    </p>
                    <h3 className="mt-1 text-2xl font-semibold text-zinc-950 dark:text-slate-100">
                      {activeRecipe}
                    </h3>
                    <p className="mt-2 text-sm text-zinc-600 dark:text-slate-400">
                      {checkedIngredients.length}/{results.length} položek máte
                      doma, koupit zbývá {itemsToBuy.length}
                    </p>
                    {estimatingMissingPrices && (
                      <p className="mt-2 text-xs font-medium text-amber-700 dark:text-amber-400">
                        Dopočítáváme AI odhad pro položky bez ceny.
                      </p>
                    )}
                    {unresolvedItems.length > 0 && (
                      <div className="mt-3 flex flex-wrap gap-2">
                        {notOnSaleItemsCount > 0 && (
                          <span className="rounded-full border border-amber-300 bg-amber-50 px-3 py-1 text-xs font-semibold text-amber-800 dark:border-amber-700 dark:bg-amber-950/40 dark:text-amber-300">
                            {notOnSaleItemsCount}x nalezeno, ale není v akci
                          </span>
                        )}
                        {missingItemsCount > 0 && (
                          <span className="rounded-full border border-zinc-200 bg-white px-3 py-1 text-xs font-semibold text-zinc-700 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300">
                            {missingItemsCount}x nenalezeno
                          </span>
                        )}
                        {hasEstimatedTotals && (
                          <span className="rounded-full border border-emerald-300 bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-800 dark:border-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300">
                            AI dopočítává běžné ceny chybějících položek
                          </span>
                        )}
                      </div>
                    )}
                  </div>

                  <div className="flex flex-wrap gap-2">
                    <button
                      type="button"
                      onClick={saveShoppingList}
                      className="inline-flex items-center gap-2 rounded-full border border-emerald-200 bg-emerald-50 px-4 py-2 text-sm font-semibold text-emerald-800 transition hover:border-emerald-300 hover:bg-emerald-100 dark:border-slate-700 dark:bg-slate-900 dark:text-emerald-300 dark:hover:border-emerald-500 dark:hover:bg-slate-800"
                    >
                      <BookmarkIcon />
                      Uložit
                    </button>
                    <button
                      type="button"
                      onClick={() => void shareShoppingList()}
                      className="inline-flex items-center gap-2 rounded-full border border-zinc-200 bg-white px-4 py-2 text-sm font-semibold text-zinc-700 transition hover:border-emerald-300 hover:text-emerald-700 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 dark:hover:border-emerald-500 dark:hover:text-emerald-300"
                    >
                      <ShareIcon />
                      Sdílet
                    </button>
                  </div>
                </div>

                {shareMessage && (
                  <div className="mt-4 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800 dark:border-slate-700 dark:bg-slate-900 dark:text-emerald-300">
                    {shareMessage}
                  </div>
                )}

                <ul className="mt-4 grid gap-3">
                  {results.map((item) => {
                    const isChecked = checkedIngredients.includes(item.ingredient);

                    return (
                      <li
                        key={item.ingredient}
                        className={`rounded-[1.5rem] border px-4 py-4 transition ${
                          isChecked
                            ? "border-emerald-200 bg-emerald-50/70 dark:border-emerald-900/60 dark:bg-emerald-950/25"
                            : "border-zinc-100 bg-zinc-50 dark:border-slate-800 dark:bg-slate-900/60"
                        }`}
                      >
                        <div className="flex gap-3">
                          <button
                            type="button"
                            onClick={() => toggleIngredient(item.ingredient)}
                            className={`mt-1 flex h-6 w-6 shrink-0 items-center justify-center rounded-full border text-sm font-bold transition ${
                              isChecked
                                ? "border-emerald-600 bg-emerald-600 text-white"
                                : "border-zinc-300 bg-white text-transparent dark:border-slate-600 dark:bg-slate-950"
                            }`}
                            aria-label={`Mám doma ${item.ingredient}`}
                          >
                            ✓
                          </button>

                          <div className="min-w-0 flex-1">
                            <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                              <div className="space-y-2">
                                <p
                                  className={`text-lg font-semibold ${
                                    isChecked
                                      ? "text-zinc-500 line-through dark:text-slate-500"
                                      : "text-zinc-950 dark:text-slate-100"
                                  }`}
                                >
                                  {item.ingredient}
                                </p>
                                {isChecked && (
                                  <p className="text-xs font-medium text-emerald-700 dark:text-emerald-300">
                                    Máte doma, nezapočítává se do ceny nákupu.
                                  </p>
                                )}
                                {!item.store && (
                                  <div className="flex flex-wrap gap-2">
                                    <span
                                      className={`rounded-full border px-3 py-1 text-xs font-semibold ${
                                        item.lookupStatus === "not_on_sale"
                                          ? "border-amber-300 bg-amber-50 text-amber-800 dark:border-amber-700 dark:bg-amber-950/40 dark:text-amber-300"
                                          : "border-zinc-200 bg-white text-zinc-600 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300"
                                      }`}
                                    >
                                      {item.lookupStatus === "not_on_sale"
                                        ? "Není v akci"
                                        : "Nenalezeno"}
                                    </span>
                                    <span className="rounded-full border border-zinc-200 bg-white px-3 py-1 text-xs font-semibold text-zinc-600 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300">
                                      Bez potvrzené akční ceny
                                    </span>
                                    {item.estimatedPrice && (
                                      <span className="rounded-full border border-amber-300 bg-amber-50 px-3 py-1 text-xs font-semibold text-amber-800 dark:border-amber-700 dark:bg-amber-950/40 dark:text-amber-300">
                                        AI odhad
                                      </span>
                                    )}
                                  </div>
                                )}

                                {item.product && item.store ? (
                                  <>
                                    <p className="text-sm font-medium text-zinc-800 dark:text-slate-200">
                                      {cleanProductName(item.product.name)}
                                    </p>
                                    {item.matchNote && (
                                      <p className="text-xs font-medium text-amber-700 dark:text-amber-400">
                                        {item.matchNote}
                                      </p>
                                    )}
                                    {item.statusNote && (
                                      <p className="text-xs font-medium text-zinc-500 dark:text-slate-400">
                                        {item.statusNote}
                                      </p>
                                    )}
                                    <div className="flex flex-wrap items-center gap-2 text-sm text-zinc-600 dark:text-slate-400">
                                      <span className="text-lg">
                                        {getStoreIcon(item.store.shopName)}
                                      </span>
                                      <span>{item.store.shopName}</span>
                                      <span className="rounded-full bg-emerald-600 px-3 py-1 text-xs font-semibold text-white">
                                        Nejlevnější
                                      </span>
                                    </div>
                                    {(item.store.validity ||
                                      item.store.pricePerUnit) && (
                                      <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-zinc-500 dark:text-slate-400">
                                        {item.store.validity && (
                                          <span>Platnost: {item.store.validity}</span>
                                        )}
                                        {item.store.pricePerUnit && (
                                          <span>
                                            Jednotková cena:{" "}
                                            {item.store.pricePerUnit}
                                          </span>
                                        )}
                                      </div>
                                    )}
                                  </>
                                ) : (
                                  <div className="space-y-2">
                                    <p className="text-sm text-zinc-600 dark:text-slate-400">
                                      {item.lookupStatus === "not_on_sale"
                                        ? "Produkt jsme dohledali, ale zrovna pro něj není dostupná akční cena."
                                        : "Pro tuto ingredienci jsme zatím nenašli odpovídající akční nabídku."}
                                    </p>
                                    {item.statusNote && (
                                      <p className="text-xs font-medium text-zinc-500 dark:text-slate-400">
                                        {item.statusNote}
                                      </p>
                                    )}
                                    {item.estimatedPrice && (
                                      <p className="text-sm font-medium text-amber-700 dark:text-amber-400">
                                        AI odhad běžné ceny:{" "}
                                        {item.estimatedPrice.minPrice}-
                                        {item.estimatedPrice.maxPrice} Kč
                                        {item.estimatedPrice.note
                                          ? ` · ${item.estimatedPrice.note}`
                                          : ""}
                                      </p>
                                    )}
                                  </div>
                                )}
                              </div>

                              <div className="flex flex-col items-start gap-3 sm:items-end">
                                {item.store ? (
                                  <>
                                    <div className="text-left sm:text-right">
                                      <p className="text-2xl font-bold text-emerald-700">
                                        {item.store.price}
                                      </p>
                                      {(() => {
                                        const savings = calculateStoreSavings(
                                          item.store,
                                        );
                                        if (!savings) return null;
                                        return (
                                          <div className="flex flex-col items-start sm:items-end">
                                            <span className="text-xs text-zinc-400 line-through dark:text-slate-500">
                                              {savings.originalPrice} Kč
                                            </span>
                                            <span
                                              className={`text-xs font-medium ${
                                                savings.source === "estimated"
                                                  ? "text-amber-600 dark:text-amber-400"
                                                  : "text-emerald-600 dark:text-emerald-300"
                                              }`}
                                            >
                                              {savings.source === "estimated"
                                                ? "odhad úspory"
                                                : "ušetříte"}{" "}
                                              {savings.saving} Kč (
                                              {savings.pct}%)
                                            </span>
                                          </div>
                                        );
                                      })()}
                                    </div>
                                    <a
                                      href={`https://www.kupi.cz${item.product?.url ?? ""}`}
                                      target="_blank"
                                      rel="noreferrer"
                                      className="inline-flex items-center rounded-full border border-emerald-200 bg-white px-4 py-2 text-sm font-semibold text-emerald-800 transition hover:border-emerald-300 hover:bg-emerald-100 dark:border-slate-700 dark:bg-slate-900 dark:text-emerald-300 dark:hover:border-emerald-500 dark:hover:bg-slate-800"
                                    >
                                      Detail nabídky
                                    </a>
                                  </>
                                ) : (
                                  <div className="flex flex-col items-start gap-2 sm:items-end">
                                    <span className="rounded-full border border-zinc-200 bg-white px-3 py-1 text-xs font-semibold text-zinc-500 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-400">
                                      Bez ceny
                                    </span>
                                    {item.product && (
                                      <a
                                        href={`https://www.kupi.cz${item.product.url}`}
                                        target="_blank"
                                        rel="noreferrer"
                                        className="inline-flex items-center rounded-full border border-zinc-200 bg-white px-4 py-2 text-sm font-semibold text-zinc-700 transition hover:border-emerald-300 hover:text-emerald-700 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 dark:hover:border-emerald-500 dark:hover:text-emerald-300"
                                      >
                                        Detail produktu
                                      </a>
                                    )}
                                  </div>
                                )}
                              </div>
                            </div>
                          </div>
                        </div>
                      </li>
                    );
                  })}
                </ul>
              </div>

              <div className="rounded-[1.75rem] border border-emerald-200 bg-emerald-950 px-5 py-6 text-white shadow-[0_25px_60px_-35px_rgba(5,150,105,0.8)] dark:border-emerald-900/60 dark:bg-slate-950 dark:shadow-[0_30px_90px_-48px_rgba(0,0,0,0.92)]">
                <p className="text-sm uppercase tracking-[0.2em] text-emerald-200">
                  Souhrn nákupu
                </p>
                <div className="mt-4 grid gap-4 sm:grid-cols-2">
                  <div>
                    <p className="text-sm text-emerald-200">Cena nákupu</p>
                    <p className="mt-1 text-3xl font-bold">
                      {hasEstimatedTotals
                        ? `${exactTotalPrice
                            .toFixed(2)
                            .replace(".", ",")} + ${estimatedPriceRange.min}-${estimatedPriceRange.max} Kč`
                        : `${exactTotalPrice.toFixed(2).replace(".", ",")} Kč`}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-emerald-200">Celková úspora</p>
                    <p className="mt-1 text-3xl font-bold">
                      {totalSavings.toFixed(2).replace(".", ",")} Kč
                    </p>
                  </div>
                </div>
                <p className="mt-3 text-sm text-emerald-200">
                  Do ceny se počítají jen položky, které ještě nemáte doma.
                  {hasEstimatedTotals
                    ? " U chybějících akčních cen používáme AI odhad běžné ceny."
                    : ""}
                </p>
                {unresolvedItems.length > 0 && (
                  <p className="mt-2 text-sm text-emerald-200">
                    Bez potvrzené akční ceny je aktuálně {unresolvedItems.length}{" "}
                    položek.
                  </p>
                )}
                <p className="mt-2 text-sm text-emerald-100">
                  {savingsSummary.estimated > 0
                    ? "Součet potvrzených i odhadovaných úspor. Odhad vychází z porovnání s ostatními aktuálními nabídkami stejného produktu."
                    : "Součet úspory oproti původním cenám u nejlevnějších nalezených variant pro celý seznam."}
                </p>
                {savingsSummary.estimated > 0 && (
                  <p className="mt-2 text-sm text-emerald-200">
                    Z toho odhadovaná úspora:{" "}
                    {savingsSummary.estimated.toFixed(2).replace(".", ",")} Kč
                  </p>
                )}
              </div>
            </div>
          )}

          {!loading && !error && results.length === 0 && (
            <div className="rounded-[1.75rem] border border-dashed border-emerald-200 bg-white/70 px-6 py-12 text-center dark:border-slate-700 dark:bg-slate-950/65">
              <div className="mx-auto mb-5 flex h-20 w-20 items-center justify-center rounded-full bg-emerald-100 text-4xl dark:bg-emerald-900/50">
                🍲
              </div>
              <h2 className="text-xl font-semibold text-emerald-950 dark:text-slate-100">
                Zatím bez receptu
              </h2>
              <p className="mx-auto mt-3 max-w-md text-sm leading-6 text-zinc-600 dark:text-slate-400">
                Zadejte název jídla a vytvoříme seznam ingrediencí i orientační
                cenu nejlevnějšího nákupu.
              </p>
            </div>
          )}
        </section>
      </div>
    </main>
  );
}
