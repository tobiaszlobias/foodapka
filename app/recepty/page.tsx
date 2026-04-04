"use client";

import SiteHeader from "@/components/SiteHeader";
import {
  cleanProductName,
  getStoreIcon,
  parsePrice,
  sortStoresByPrice,
  type Product,
  type Store,
} from "@/lib/food";
import { RECIPE_PRESETS } from "@/lib/recipes";
import { useEffect, useRef, useState } from "react";

type ShoppingMode = "cross_store" | "single_store";

type IngredientStoreOption = {
  product: Product;
  store: Store;
};

type IngredientResult = {
  ingredient: string;
  product: Product | null;
  store: Store | null;
  storeOptions: IngredientStoreOption[];
};

type SavedShoppingList = {
  recipe: string;
  ingredients: string[];
  results: IngredientResult[];
  checkedIngredients?: string[];
  shoppingMode?: ShoppingMode;
};

type SingleStorePlan = {
  shopName: string;
  totalPrice: number;
  matchedCount: number;
  missingCount: number;
};

const STORAGE_KEY = "foodapka-shopping-list";

function RecipeSkeleton() {
  return (
    <div className="grid gap-4">
      {Array.from({ length: 4 }).map((_, index) => (
        <div
          key={index}
          className="animate-pulse rounded-[1.75rem] border border-emerald-100 bg-white/85 p-5"
        >
          <div className="h-5 w-36 rounded-full bg-emerald-100" />
          <div className="mt-4 h-20 rounded-[1.25rem] bg-zinc-100" />
        </div>
      ))}
    </div>
  );
}

function readJsonSafely(text: string) {
  if (!text.trim()) return null;

  try {
    return JSON.parse(text) as unknown;
  } catch {
    return null;
  }
}

function buildIngredientStoreOptions(products: Product[]) {
  const bestStoreByShop = new Map<string, IngredientStoreOption>();

  products.forEach((product) => {
    sortStoresByPrice(product.stores).forEach((store) => {
      const shopName = store.shopName.trim();
      if (!shopName) return;

      const currentBest = bestStoreByShop.get(shopName);
      if (
        !currentBest ||
        parsePrice(store.price) < parsePrice(currentBest.store.price)
      ) {
        bestStoreByShop.set(shopName, { product, store });
      }
    });
  });

  return Array.from(bestStoreByShop.values()).sort(
    (a, b) => parsePrice(a.store.price) - parsePrice(b.store.price),
  );
}

function getSelectionForMode(
  item: IngredientResult,
  mode: ShoppingMode,
  preferredShopName?: string,
) {
  if (mode === "single_store" && preferredShopName) {
    const preferredOption =
      item.storeOptions.find(
        (option) => option.store.shopName === preferredShopName,
      ) ?? null;

    return {
      product: preferredOption?.product ?? null,
      store: preferredOption?.store ?? null,
    };
  }

  return {
    product: item.product,
    store: item.store,
  };
}

function buildSingleStorePlans(items: IngredientResult[]) {
  const seenShops = new Set<string>();
  const shopNames: string[] = [];

  items.forEach((item) => {
    item.storeOptions.forEach((option) => {
      if (seenShops.has(option.store.shopName)) return;
      seenShops.add(option.store.shopName);
      shopNames.push(option.store.shopName);
    });
  });

  return shopNames
    .map((shopName) => {
      let totalPrice = 0;
      let matchedCount = 0;

      items.forEach((item) => {
        const option = item.storeOptions.find(
          (candidate) => candidate.store.shopName === shopName,
        );
        if (!option) return;

        matchedCount += 1;
        totalPrice += parsePrice(option.store.price);
      });

      return {
        shopName,
        totalPrice,
        matchedCount,
        missingCount: items.length - matchedCount,
      } satisfies SingleStorePlan;
    })
    .sort((a, b) => {
      if (b.matchedCount !== a.matchedCount) {
        return b.matchedCount - a.matchedCount;
      }

      if (a.totalPrice !== b.totalPrice) {
        return a.totalPrice - b.totalPrice;
      }

      return a.shopName.localeCompare(b.shopName, "cs");
    });
}

export default function RecipesPage() {
  const [recipe, setRecipe] = useState("");
  const [activeRecipe, setActiveRecipe] = useState("");
  const [loading, setLoading] = useState(false);
  const [ingredients, setIngredients] = useState<string[]>([]);
  const [results, setResults] = useState<IngredientResult[]>([]);
  const [checkedIngredients, setCheckedIngredients] = useState<string[]>([]);
  const [shoppingMode, setShoppingMode] =
    useState<ShoppingMode>("cross_store");
  const [error, setError] = useState<string | null>(null);
  const [shareMessage, setShareMessage] = useState<string | null>(null);
  const shoppingListRef = useRef<HTMLElement | null>(null);

  const itemsToBuy = results.filter(
    (item) => !checkedIngredients.includes(item.ingredient),
  );
  const singleStorePlans = buildSingleStorePlans(itemsToBuy);
  const bestSingleStorePlan = singleStorePlans[0] ?? null;
  const selectedSingleStoreName =
    shoppingMode === "single_store" ? bestSingleStorePlan?.shopName : undefined;

  const selectedResults = results.map((item) => {
    const selection = getSelectionForMode(
      item,
      shoppingMode,
      selectedSingleStoreName,
    );

    return {
      ...item,
      selectedProduct: selection.product,
      selectedStore: selection.store,
    };
  });

  const totalPrice = selectedResults.reduce((sum, item) => {
    if (checkedIngredients.includes(item.ingredient) || !item.selectedStore) {
      return sum;
    }

    return sum + parsePrice(item.selectedStore.price);
  }, 0);

  useEffect(() => {
    const saved = window.localStorage.getItem(STORAGE_KEY);
    if (!saved) return;

    try {
      const parsed = JSON.parse(saved) as SavedShoppingList;
      setRecipe(parsed.recipe);
      setActiveRecipe(parsed.recipe);
      setIngredients(parsed.ingredients);
      setResults(
        parsed.results.map((item) => ({
          ...item,
          storeOptions: Array.isArray(item.storeOptions) ? item.storeOptions : [],
        })),
      );
      setCheckedIngredients(parsed.checkedIngredients ?? []);
      setShoppingMode(parsed.shoppingMode ?? "cross_store");
    } catch {
      window.localStorage.removeItem(STORAGE_KEY);
    }
  }, []);

  useEffect(() => {
    if (!shareMessage) return;

    const timeout = window.setTimeout(() => setShareMessage(null), 2500);
    return () => window.clearTimeout(timeout);
  }, [shareMessage]);

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
      shoppingMode === "single_store"
        ? bestSingleStorePlan
          ? `Rezim: co nejlevneji v jednom obchode (${bestSingleStorePlan.shopName})`
          : "Rezim: co nejlevneji v jednom obchode"
        : "Rezim: nejlevneji napric obchody",
      "",
      ...selectedResults.map((item) => {
        if (checkedIngredients.includes(item.ingredient)) {
          return `- ${item.ingredient}: mam doma`;
        }

        if (!item.selectedProduct || !item.selectedStore) {
          return shoppingMode === "single_store" && bestSingleStorePlan
            ? `- ${item.ingredient}: v ${bestSingleStorePlan.shopName} nenalezeno`
            : `- ${item.ingredient}: bez nalezene nabidky`;
        }

        const meta = [item.selectedStore.price, item.selectedStore.shopName]
          .filter(Boolean)
          .join(" - ");

        return `- ${item.ingredient}: ${meta}`;
      }),
      "",
      `Celkem: ${totalPrice.toFixed(2).replace(".", ",")} Kc`,
    ];

    if (shoppingMode === "single_store" && bestSingleStorePlan) {
      lines.push(
        `Pokryti: ${bestSingleStorePlan.matchedCount}/${itemsToBuy.length} polozek`,
      );
    }

    return lines.join("\n");
  }

  function saveShoppingList() {
    const payload: SavedShoppingList = {
      recipe: activeRecipe || recipe,
      ingredients,
      results,
      checkedIngredients,
      shoppingMode,
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

    setLoading(true);
    setError(null);
    setActiveRecipe(recipeName);
    setResults([]);
    setIngredients([]);
    setCheckedIngredients([]);
    setShoppingMode("cross_store");

    try {
      const recipeResponse = await fetch("/api/recipe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ recipe: recipeName }),
      });
      const recipeData = readJsonSafely(await recipeResponse.text()) as
        | { recipe?: string; ingredients?: unknown[]; error?: string }
        | null;

      if (!recipeResponse.ok) {
        throw new Error(recipeData?.error || "Nepodařilo se načíst ingredience.");
      }

      const parsedIngredients = Array.isArray(recipeData?.ingredients)
        ? recipeData.ingredients.filter(
            (ingredient): ingredient is string => typeof ingredient === "string",
          )
        : [];

      const recipeLabel = recipeData?.recipe ?? recipeName;
      setActiveRecipe(recipeLabel);
      setIngredients(parsedIngredients);

      const ingredientResults = await Promise.all(
        parsedIngredients.map(async (ingredient) => {
          const searchParams = new URLSearchParams({
            q: ingredient,
            recipe: recipeLabel,
            ingredients: parsedIngredients.join("|"),
          });
          const searchResponse = await fetch(`/api/search?${searchParams}`);
          const searchData = readJsonSafely(await searchResponse.text()) as
            | { products?: Product[] }
            | null;
          const products = Array.isArray(searchData?.products)
            ? searchData.products
            : [];
          const storeOptions = buildIngredientStoreOptions(products);
          const cheapestOption = storeOptions[0] ?? null;

          return {
            ingredient,
            product: cheapestOption?.product ?? null,
            store: cheapestOption?.store ?? null,
            storeOptions,
          };
        }),
      );

      setResults(ingredientResults);
      window.setTimeout(() => {
        shoppingListRef.current?.scrollIntoView({
          behavior: "smooth",
          block: "start",
        });
      }, 50);
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
    <main className="min-h-screen bg-[radial-gradient(circle_at_top,_rgba(110,231,183,0.22),_transparent_35%),linear-gradient(180deg,_#ecfdf5_0%,_#f8fafc_52%,_#f5f7f6_100%)] px-4 py-6 sm:px-6 lg:px-8">
      <div className="mx-auto flex max-w-6xl flex-col gap-8">
        <section className="rounded-[2rem] border border-white/70 bg-[linear-gradient(135deg,_rgba(236,253,245,0.96),_rgba(209,250,229,0.9)_45%,_rgba(167,243,208,0.74)_100%)] p-5 shadow-[0_30px_90px_-40px_rgba(5,150,105,0.55)] sm:p-8 lg:p-10">
          <SiteHeader current="recipes" />
          <div className="mt-10 grid gap-8 lg:grid-cols-[minmax(0,1.15fr)_minmax(280px,0.85fr)] lg:items-center">
            <div className="space-y-4">
              <h1 className="text-4xl font-bold tracking-tight text-emerald-950 sm:text-5xl">
                Napište recept a foodapka najde nejlevnější suroviny.
              </h1>
              <p className="max-w-2xl text-base leading-7 text-emerald-950/75 sm:text-lg">
                Ingredience bereme z připraveného katalogu receptů a ke každé
                dohledáme nejlevnější aktuálně dostupnou variantu.
              </p>
              <p className="text-sm font-medium text-emerald-800">
                Výsledek si pak můžete uložit nebo poslat jako nákupní list.
              </p>
            </div>

            <form
              onSubmit={handleSubmit}
              className="rounded-[1.75rem] border border-white/70 bg-white/85 p-4 shadow-[0_20px_60px_-35px_rgba(16,185,129,0.45)]"
            >
              <label
                htmlFor="recipe-name"
                className="mb-3 block text-sm font-semibold text-emerald-900"
              >
                Název receptu
              </label>
              <input
                id="recipe-name"
                type="text"
                value={recipe}
                onChange={(event) => setRecipe(event.target.value)}
                placeholder="Např. Svíčková, Špagety carbonara nebo wrap"
                className="h-14 w-full rounded-[1.2rem] border border-emerald-100 bg-emerald-50/60 px-4 text-base text-zinc-900 outline-none transition placeholder:text-zinc-500 focus:border-emerald-400 focus:bg-white"
              />
              <button
                type="submit"
                className="mt-4 inline-flex h-12 w-full items-center justify-center rounded-[1rem] bg-emerald-600 px-5 text-sm font-semibold text-white transition hover:bg-emerald-700"
              >
                Najít ingredience
              </button>
            </form>
          </div>
        </section>

        <section className="space-y-5">
          <div>
            <h2 className="text-2xl font-semibold tracking-tight text-emerald-950">
              Rychlý výběr
            </h2>
            <p className="mt-1 text-sm text-zinc-600">
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
                className="rounded-[1.5rem] border border-emerald-100 bg-white/90 p-5 text-left shadow-[0_20px_50px_-35px_rgba(16,185,129,0.45)] transition hover:-translate-y-0.5 hover:border-emerald-300 hover:bg-emerald-50"
              >
                <span className="inline-flex rounded-full bg-emerald-100 px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-emerald-800">
                  {preset.tag}
                </span>
                <h3 className="mt-4 text-lg font-semibold text-zinc-950">
                  {preset.name}
                </h3>
                <p className="mt-2 text-sm leading-6 text-zinc-600">
                  {preset.description}
                </p>
              </button>
            ))}
          </div>
        </section>

        <section ref={shoppingListRef} className="space-y-5">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <h2 className="text-2xl font-semibold tracking-tight text-emerald-950">
                Nákupní list
              </h2>
              <p className="text-sm text-zinc-600">
                Přepněte si, jestli chcete nejlevnější nákup napříč obchody,
                nebo co nejlevnější variantu v jednom řetězci.
              </p>
            </div>
            {ingredients.length > 0 && !loading && (
              <p className="rounded-full border border-emerald-200 bg-white px-4 py-2 text-sm font-medium text-emerald-800">
                {ingredients.length} ingrediencí
              </p>
            )}
          </div>

          {error && (
            <div className="rounded-[1.5rem] border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
              {error}
            </div>
          )}

          {loading && <RecipeSkeleton />}

          {!loading && results.length > 0 && (
            <div className="grid gap-4">
              <div className="rounded-[1.75rem] border border-emerald-100 bg-white/95 p-4 shadow-[0_20px_50px_-35px_rgba(16,185,129,0.45)] sm:p-5">
                <div className="flex flex-col gap-4 border-b border-emerald-100 pb-4 sm:flex-row sm:items-start sm:justify-between">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.2em] text-emerald-700">
                      Nákup pro
                    </p>
                    <h3 className="mt-1 text-2xl font-semibold text-zinc-950">
                      {activeRecipe}
                    </h3>
                    <p className="mt-2 text-sm text-zinc-600">
                      {checkedIngredients.length}/{results.length} položek máte
                      doma
                    </p>
                  </div>

                  <div className="flex flex-wrap gap-2">
                    <button
                      type="button"
                      onClick={saveShoppingList}
                      className="inline-flex items-center rounded-full border border-emerald-200 bg-emerald-50 px-4 py-2 text-sm font-semibold text-emerald-800 transition hover:border-emerald-300 hover:bg-emerald-100"
                    >
                      Uložit seznam
                    </button>
                    <button
                      type="button"
                      onClick={() => void shareShoppingList()}
                      className="inline-flex items-center rounded-full border border-zinc-200 bg-white px-4 py-2 text-sm font-semibold text-zinc-700 transition hover:border-emerald-300 hover:text-emerald-700"
                    >
                      Sdílet
                    </button>
                  </div>
                </div>

                <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <div className="inline-flex rounded-full border border-emerald-200 bg-emerald-50 p-1">
                    <button
                      type="button"
                      onClick={() => setShoppingMode("cross_store")}
                      className={`rounded-full px-4 py-2 text-sm font-semibold transition ${
                        shoppingMode === "cross_store"
                          ? "bg-emerald-600 text-white"
                          : "text-emerald-800 hover:bg-emerald-100"
                      }`}
                    >
                      Napříč obchody
                    </button>
                    <button
                      type="button"
                      onClick={() => setShoppingMode("single_store")}
                      className={`rounded-full px-4 py-2 text-sm font-semibold transition ${
                        shoppingMode === "single_store"
                          ? "bg-emerald-600 text-white"
                          : "text-emerald-800 hover:bg-emerald-100"
                      }`}
                    >
                      Jeden obchod
                    </button>
                  </div>

                  {shoppingMode === "single_store" && bestSingleStorePlan && (
                    <p className="rounded-full border border-zinc-200 bg-white px-4 py-2 text-sm font-medium text-zinc-700">
                      {getStoreIcon(bestSingleStorePlan.shopName)}{" "}
                      {bestSingleStorePlan.shopName} ·{" "}
                      {bestSingleStorePlan.matchedCount}/{itemsToBuy.length}{" "}
                      položek
                    </p>
                  )}
                </div>

                {shareMessage && (
                  <div className="mt-4 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800">
                    {shareMessage}
                  </div>
                )}

                <ul className="mt-4 grid gap-3">
                  {selectedResults.map((item) => {
                    const isChecked = checkedIngredients.includes(item.ingredient);

                    return (
                      <li
                        key={item.ingredient}
                        className={`rounded-[1.5rem] border px-4 py-4 transition ${
                          isChecked
                            ? "border-emerald-200 bg-emerald-50/70"
                            : "border-zinc-100 bg-zinc-50"
                        }`}
                      >
                        <div className="flex gap-3">
                          <button
                            type="button"
                            onClick={() => toggleIngredient(item.ingredient)}
                            className={`mt-1 flex h-6 w-6 shrink-0 items-center justify-center rounded-full border text-sm font-bold transition ${
                              isChecked
                                ? "border-emerald-600 bg-emerald-600 text-white"
                                : "border-zinc-300 bg-white text-transparent"
                            }`}
                            aria-label={`Označit ${item.ingredient}`}
                          >
                            ✓
                          </button>

                          <div className="min-w-0 flex-1">
                            <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                              <div className="space-y-2">
                                <p
                                  className={`text-lg font-semibold ${
                                    isChecked
                                      ? "text-zinc-500 line-through"
                                      : "text-zinc-950"
                                  }`}
                                >
                                  {item.ingredient}
                                </p>

                                {item.selectedProduct && item.selectedStore ? (
                                  <>
                                    <p className="text-sm font-medium text-zinc-800">
                                      {cleanProductName(item.selectedProduct.name)}
                                    </p>
                                    <div className="flex flex-wrap items-center gap-2 text-sm text-zinc-600">
                                      <span className="text-lg">
                                        {getStoreIcon(item.selectedStore.shopName)}
                                      </span>
                                      <span>{item.selectedStore.shopName}</span>
                                      {item.selectedStore.sourceLabel && (
                                        <span className="rounded-full border border-zinc-200 bg-white px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.14em] text-zinc-500">
                                          {item.selectedStore.sourceLabel}
                                        </span>
                                      )}
                                      <span className="rounded-full bg-emerald-600 px-3 py-1 text-xs font-semibold text-white">
                                        {shoppingMode === "single_store"
                                          ? "Vybráno v jednom obchodě"
                                          : "Nejlevnější"}
                                      </span>
                                    </div>
                                    {(item.selectedStore.validity ||
                                      item.selectedStore.pricePerUnit) && (
                                      <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-zinc-500">
                                        {item.selectedStore.validity && (
                                          <span>
                                            Platnost: {item.selectedStore.validity}
                                          </span>
                                        )}
                                        {item.selectedStore.pricePerUnit && (
                                          <span>
                                            Jednotková cena:{" "}
                                            {item.selectedStore.pricePerUnit}
                                          </span>
                                        )}
                                      </div>
                                    )}
                                  </>
                                ) : (
                                  <p className="text-sm text-zinc-600">
                                    {shoppingMode === "single_store" &&
                                    bestSingleStorePlan
                                      ? `V ${bestSingleStorePlan.shopName} jsme pro tuto ingredienci nenašli akční nabídku.`
                                      : "Pro tuto ingredienci jsme zatím nenašli odpovídající akční nabídku."}
                                  </p>
                                )}
                              </div>

                              <div className="flex flex-col items-start gap-3 sm:items-end">
                                {item.selectedStore ? (
                                  <>
                                    <p className="text-2xl font-bold text-emerald-700">
                                      {item.selectedStore.price}
                                    </p>
                                    <a
                                      href={item.selectedProduct?.url ?? ""}
                                      target="_blank"
                                      rel="noreferrer"
                                      className="inline-flex items-center rounded-full border border-emerald-200 bg-white px-4 py-2 text-sm font-semibold text-emerald-800 transition hover:border-emerald-300 hover:bg-emerald-100"
                                    >
                                      Detail nabídky
                                    </a>
                                  </>
                                ) : (
                                  <span className="rounded-full border border-zinc-200 bg-white px-3 py-1 text-xs font-semibold text-zinc-500">
                                    Bez ceny
                                  </span>
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

              <div className="rounded-[1.75rem] border border-emerald-200 bg-emerald-950 px-5 py-6 text-white shadow-[0_25px_60px_-35px_rgba(5,150,105,0.8)]">
                <p className="text-sm uppercase tracking-[0.2em] text-emerald-200">
                  {shoppingMode === "single_store"
                    ? "Cena v jednom obchodě"
                    : "Cena napříč obchody"}
                </p>
                <p className="mt-2 text-3xl font-bold">
                  {totalPrice.toFixed(2).replace(".", ",")} Kč
                </p>
                <p className="mt-2 text-sm text-emerald-100">
                  {shoppingMode === "single_store"
                    ? bestSingleStorePlan
                      ? `Nejlíp vychází ${bestSingleStorePlan.shopName}. Pokrývá ${bestSingleStorePlan.matchedCount}/${itemsToBuy.length} položek.`
                      : "Pro tento seznam zatím nemáme společný obchod."
                    : "Součet nejlevnějších nalezených variant napříč všemi obchody."}
                </p>
                {shoppingMode === "single_store" &&
                  bestSingleStorePlan &&
                  bestSingleStorePlan.missingCount > 0 && (
                    <p className="mt-2 text-sm text-emerald-200">
                      {bestSingleStorePlan.missingCount} položek je potřeba
                      dokoupit jinde nebo počkat na jinou akci.
                    </p>
                  )}
              </div>
            </div>
          )}

          {!loading && !error && results.length === 0 && (
            <div className="rounded-[1.75rem] border border-dashed border-emerald-200 bg-white/70 px-6 py-12 text-center">
              <div className="mx-auto mb-5 flex h-20 w-20 items-center justify-center rounded-full bg-emerald-100 text-4xl">
                🍲
              </div>
              <h2 className="text-xl font-semibold text-emerald-950">
                Zatím bez receptu
              </h2>
              <p className="mx-auto mt-3 max-w-md text-sm leading-6 text-zinc-600">
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
