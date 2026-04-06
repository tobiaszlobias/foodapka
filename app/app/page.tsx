"use client";

import Image from "next/image";
import Link from "next/link";
import SearchBar from "@/components/SearchBar";
import AppHeader from "@/components/AppHeader";
import Sidebar from "@/components/Sidebar";
import { FOODORA_STORE_CONFIGS } from "@/data/foodoraStores";
import {
  cleanProductName,
  getStoreIcon,
  normalizeText,
  parsePrice,
  sortStoresByPrice,
  type Product,
  type Store,
} from "@/lib/food";
import { RECIPE_PRESETS } from "@/lib/recipes";
import { getStoreLogoPath } from "@/lib/storeLogos";
import { useEffect, useRef, useState } from "react";

type AppMode = "search" | "recipes";
type ShoppingMode = "cross_store" | "single_store";
type ProductSort = "relevance" | "cheapest" | "coverage";

type SearchFilter = {
  key: string;
  label: string;
};

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

type SingleStorePlan = {
  shopName: string;
  totalPrice: number;
  matchedCount: number;
  missingCount: number;
};

const BASE_SOURCE_FILTERS: SearchFilter[] = [
  { key: "all", label: "Vše" },
  { key: "source:kaufland", label: "Kaufland" },
  { key: "source:lidl", label: "Lidl.cz" },
  ...FOODORA_STORE_CONFIGS.map((store) => ({
    key: `foodora:${normalizeText(store.chainName)}`,
    label: `${store.chainName} (Foodora)`,
  })),
];

function getStoreFilter(store: Store): SearchFilter {
  const normalizedShopName = normalizeText(store.shopName);

  if (store.source === "foodora") {
    return {
      key: `foodora:${normalizeText(store.shopName)}`,
      label: `${store.shopName} (Foodora)`,
    };
  }

  if (store.source === "kaufland") {
    return {
      key: "source:kaufland",
      label: "Kaufland.cz",
    };
  }

  if (store.source === "lidl") {
    return {
      key: "source:lidl",
      label: "Lidl.cz",
    };
  }

  if (normalizedShopName.includes("kaufland")) {
    return {
      key: "kupi:kaufland",
      label: "Kaufland (Kupi)",
    };
  }

  if (normalizedShopName.includes("lidl")) {
    return {
      key: "kupi:lidl",
      label: "Lidl (Kupi)",
    };
  }

  return {
    key: `kupi:${normalizeText(store.shopName)}`,
    label: `${store.shopName} (Kupi)`,
  };
}

function StoreBrand({ shopName }: { shopName: string }) {
  const logoPath = getStoreLogoPath(shopName);
  const isLidl = normalizeText(shopName).includes("lidl");

  if (logoPath) {
    return (
      <span className="inline-flex items-center justify-center">
        <Image
          src={logoPath}
          alt={`${shopName} logo`}
          width={isLidl ? 68 : 56}
          height={isLidl ? 68 : 56}
          className={isLidl ? "h-[4.25rem] w-[4.25rem] object-contain" : "h-14 w-14 object-contain"}
          unoptimized
        />
      </span>
    );
  }

  return (
    <>
      <span className="text-lg">{getStoreIcon(shopName)}</span>
      <span className="font-semibold text-zinc-800">{shopName}</span>
    </>
  );
}

function getFilterCount(products: Product[], filterKey: string) {
  if (filterKey === "all") return products.length;

  return products.filter((product) =>
    product.stores.some((store) => getStoreFilter(store).key === filterKey),
  ).length;
}

function LoadingCards() {
  return (
    <div className="grid gap-4">
      {Array.from({ length: 3 }).map((_, index) => (
        <article
          key={index}
          className="overflow-hidden rounded-[2rem] border border-emerald-100 bg-white/90 p-5 shadow-[0_20px_50px_-30px_rgba(16,185,129,0.4)]"
        >
          <div className="animate-pulse space-y-4">
            <div className="h-6 w-2/3 rounded-full bg-emerald-100" />
            <div className="h-4 w-40 rounded-full bg-zinc-100" />
            <div className="grid gap-3">
              {Array.from({ length: 3 }).map((_, storeIndex) => (
                <div
                  key={storeIndex}
                  className="flex items-center justify-between rounded-2xl border border-zinc-100 bg-zinc-50 px-4 py-4"
                >
                  <div className="space-y-2">
                    <div className="h-4 w-24 rounded-full bg-zinc-200" />
                    <div className="h-3 w-16 rounded-full bg-zinc-100" />
                  </div>
                  <div className="space-y-2">
                    <div className="h-4 w-20 rounded-full bg-emerald-100" />
                    <div className="h-3 w-24 rounded-full bg-zinc-100" />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </article>
      ))}
    </div>
  );
}

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

function EmptyState({ hasSearched }: { hasSearched: boolean }) {
  return (
    <div className="rounded-[2rem] border border-dashed border-emerald-200 bg-white/70 px-6 py-12 text-center shadow-[0_20px_40px_-35px_rgba(16,185,129,0.5)]">
      <div className="mx-auto mb-5 flex h-20 w-20 items-center justify-center rounded-full bg-emerald-100 text-4xl">
        {hasSearched ? "🧺" : "🥬"}
      </div>
      <h2 className="text-xl font-semibold text-emerald-950">
        {hasSearched ? "Nic jsme nenašli" : "Začněte hledat výhodnější nákup"}
      </h2>
      <p className="mx-auto mt-3 max-w-md text-sm leading-6 text-zinc-600">
        {hasSearched
          ? "Zkuste jiný název produktu nebo obecnější výraz. Výsledky taháme z aktuálních akčních letáků."
          : "Zadejte název potraviny a foodapka vám ukáže akční ceny napříč obchody seřazené od nejlevnější nabídky."}
      </p>
    </div>
  );
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

function readJsonSafely(text: string) {
  if (!text.trim()) return null;

  try {
    return JSON.parse(text) as unknown;
  } catch {
    return null;
  }
}

export default function Home({
  searchParams,
}: {
  searchParams: Promise<{ mode?: string; query?: string }>;
}) {
  // Mode
  const [mode, setMode] = useState<AppMode>("search");
  
  // Check URL params on mount
  useEffect(() => {
    void searchParams.then((params) => {
      if (params.mode === "recipes") {
        setMode("recipes");
      }
      // Auto-trigger search if query param exists
      if (params.query) {
        setMode("search");
        // Trigger search after a short delay to ensure components are mounted
        setTimeout(() => {
          const searchInput = document.querySelector('input[type="text"]') as HTMLInputElement;
          if (searchInput) {
            searchInput.value = params.query!;
            searchInput.dispatchEvent(new Event('input', { bubbles: true }));
            // Trigger the search
            const form = searchInput.closest('form');
            if (form) {
              form.dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }));
            }
          }
        }, 100);
      }
    });
  }, [searchParams]);
  
  // Search state
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);
  const [selectedFilter, setSelectedFilter] = useState("all");
  const [selectedSort, setSelectedSort] = useState<ProductSort>("relevance");
  
  // Recipe state
  const [activeRecipe, setActiveRecipe] = useState("");
  const [recipeLoading, setRecipeLoading] = useState(false);
  const [ingredients, setIngredients] = useState<string[]>([]);
  const [recipeResults, setRecipeResults] = useState<IngredientResult[]>([]);
  const [checkedIngredients, setCheckedIngredients] = useState<string[]>([]);
  const [shoppingMode, setShoppingMode] = useState<ShoppingMode>("cross_store");
  const [recipeError, setRecipeError] = useState<string | null>(null);
  const [shareMessage, setShareMessage] = useState<string | null>(null);
  const shoppingListRef = useRef<HTMLElement | null>(null);

  // Recipe computed values
  const itemsToBuy = recipeResults.filter(
    (item) => !checkedIngredients.includes(item.ingredient),
  );
  const singleStorePlans = buildSingleStorePlans(itemsToBuy);
  const bestSingleStorePlan = singleStorePlans[0] ?? null;
  const selectedSingleStoreName =
    shoppingMode === "single_store" ? bestSingleStorePlan?.shopName : undefined;

  const selectedResults = recipeResults.map((item) => {
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

  // Search handlers
  function handleResults(nextProducts: Product[]) {
    setProducts(nextProducts);
    setSelectedFilter("all");
    setSelectedSort("relevance");
  }

  function handleModeChange(newMode: AppMode) {
    setMode(newMode);
  }

  // Recipe handlers
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
    const payload = {
      recipe: activeRecipe,
      ingredients,
      results: recipeResults,
      checkedIngredients,
      shoppingMode,
    };

    window.localStorage.setItem("foodapka-shopping-list", JSON.stringify(payload));
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

    setRecipeLoading(true);
    setRecipeError(null);
    setActiveRecipe(recipeName);
    setRecipeResults([]);
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
          const fetchedProducts = Array.isArray(searchData?.products)
            ? searchData.products
            : [];
          const storeOptions = buildIngredientStoreOptions(fetchedProducts);
          const cheapestOption = storeOptions[0] ?? null;

          return {
            ingredient,
            product: cheapestOption?.product ?? null,
            store: cheapestOption?.store ?? null,
            storeOptions,
          };
        }),
      );

      setRecipeResults(ingredientResults);
      window.setTimeout(() => {
        shoppingListRef.current?.scrollIntoView({
          behavior: "smooth",
          block: "start",
        });
      }, 50);
    } catch (err) {
      setRecipeError(err instanceof Error ? err.message : "Něco se pokazilo.");
    } finally {
      setRecipeLoading(false);
    }
  }

  // Search filters
  const availableFilters = [...BASE_SOURCE_FILTERS];
  const seenFilters = new Set<string>(availableFilters.map((filter) => filter.key));

  products.forEach((product) => {
    product.stores.forEach((store) => {
      const filter = getStoreFilter(store);
      if (seenFilters.has(filter.key)) return;
      seenFilters.add(filter.key);
      availableFilters.push(filter);
    });
  });

  const visibleProducts =
    selectedFilter === "all"
      ? products
      : products
          .map((product) => ({
            ...product,
            stores: product.stores.filter(
              (store) => getStoreFilter(store).key === selectedFilter,
            ),
          }))
          .filter((product) => product.stores.length > 0);

  const sortedVisibleProducts = [...visibleProducts].sort((a, b) => {
    if (selectedSort === "cheapest") {
      const priceDelta =
        parsePrice(sortStoresByPrice(a.stores)[0]?.price || "") -
        parsePrice(sortStoresByPrice(b.stores)[0]?.price || "");
      if (priceDelta !== 0) return priceDelta;
    }

    if (selectedSort === "coverage") {
      const coverageDelta = b.stores.length - a.stores.length;
      if (coverageDelta !== 0) return coverageDelta;
    }

    return 0;
  });

  return (
    <>
      <AppHeader />
      <div className="flex pt-20 min-h-screen bg-[radial-gradient(circle_at_top,_rgba(110,231,183,0.18),_transparent_40%),linear-gradient(180deg,_#f5fbf5_0%,_#f8fafc_48%,_#f5f7f6_100%)]">
        <Sidebar currentPage={mode === "search" ? "search" : "recipes"} />
        
        <main className="flex-1 p-6 lg:p-10 overflow-y-auto text-zinc-900">
          {/* Hero Header */}
          <header className="mb-10 max-w-4xl">
            {/* Animated header text */}
            <div className={`transition-all duration-500 ease-out ${mode === "recipes" ? "max-h-0 overflow-hidden opacity-0" : "max-h-64 opacity-100 mb-6"}`}>
              <h1 className="text-4xl lg:text-5xl font-extrabold tracking-tight text-emerald-950 leading-tight">
                Najděte nejlevnější akční cenu <br />
                <span className="text-emerald-600 italic">dřív, než vyrazíte do obchodu</span>
              </h1>
            </div>
            
            {/* Recipe header */}
            <div className={`transition-all duration-500 ease-out ${mode === "search" ? "max-h-0 overflow-hidden opacity-0" : "max-h-64 opacity-100 mb-6"}`}>
              <h1 className="text-4xl lg:text-5xl font-extrabold tracking-tight text-emerald-950 leading-tight">
                Vyberte si recept a najdeme <br />
                <span className="text-emerald-600 italic">nejlevnější suroviny</span>
              </h1>
            </div>
            
            {/* Search bar with mode toggle */}
            <SearchBar
              onResults={handleResults}
              onLoading={setLoading}
              onSearchStart={() => setHasSearched(true)}
              mode={mode}
              onModeChange={handleModeChange}
            />
          </header>
            
          {/* Recipe cards - shown when in recipes mode */}
          <section className={`transition-all duration-500 ease-out mb-10 ${mode === "recipes" ? "max-h-[3000px] opacity-100" : "max-h-0 overflow-hidden opacity-0"}`}>
            <div className="grid gap-6 sm:grid-cols-2 xl:grid-cols-3">
              {RECIPE_PRESETS.map((recipe) => (
                <div
                  key={recipe.name}
                  onClick={() => void runRecipeSearch(recipe.name)}
                  className="group rounded-[1.25rem] bg-white border border-zinc-100 overflow-hidden text-left shadow-sm transition-all hover:shadow-xl hover:-translate-y-1 flex flex-col cursor-pointer"
                >
                  {recipe.image && (
                    <div className="h-44 overflow-hidden relative">
                      <Image
                        src={recipe.image}
                        alt={recipe.name}
                        fill
                        className="object-cover group-hover:scale-105 transition-transform duration-500"
                        unoptimized
                      />
                      <div className="absolute top-3 left-3">
                        <span className="bg-emerald-100/90 backdrop-blur-md text-emerald-800 text-[10px] uppercase tracking-widest font-bold px-3 py-1 rounded-full">
                          {recipe.tag}
                        </span>
                      </div>
                      <button
                        type="button"
                        className="absolute bottom-3 right-3 bg-white/90 backdrop-blur-md p-2 rounded-full shadow-md text-zinc-400 hover:text-red-500 transition-all"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <span className="material-symbols-outlined text-xl">favorite</span>
                      </button>
                    </div>
                  )}
                  <div className="p-5 flex-1 flex flex-col">
                    {!recipe.image && (
                      <span className="inline-block rounded-full bg-emerald-100 px-3 py-1 text-xs font-semibold text-emerald-700 w-fit mb-3">
                        {recipe.tag}
                      </span>
                    )}
                    <h3 className="text-lg font-bold text-zinc-900 group-hover:text-emerald-600 transition-colors">
                      {recipe.name}
                    </h3>
                    <p className="mt-2 text-sm text-zinc-500 line-clamp-2 flex-1">
                      {recipe.description}
                    </p>
                    <div className="mt-4 pt-4 border-t border-zinc-100">
                      <div className="flex items-center justify-between">
                        <div className="flex -space-x-2">
                          {recipe.ingredients.slice(0, 3).map((ing, i) => (
                            <div
                              key={ing}
                              className="w-7 h-7 rounded-full border-2 border-white bg-emerald-100 flex items-center justify-center text-[10px] font-bold text-emerald-700"
                            >
                              {ing.charAt(0).toUpperCase()}
                            </div>
                          ))}
                          {recipe.ingredients.length > 3 && (
                            <div className="w-7 h-7 rounded-full border-2 border-white bg-zinc-100 flex items-center justify-center text-[10px] font-bold text-zinc-500">
                              +{recipe.ingredients.length - 3}
                            </div>
                          )}
                        </div>
                        <span className="text-emerald-600 font-semibold text-sm flex items-center gap-1">
                          <span className="material-symbols-outlined text-sm">trending_down</span>
                          Najít ceny
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* Search Results Section */}
          {mode === "search" && (
            <section className="space-y-5">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
                <div>
                  <h2 className="text-2xl font-semibold tracking-tight text-emerald-950 sm:text-3xl">
                    Výsledky hledání
                  </h2>
                  <p className="mt-1 text-sm text-zinc-600">
                    Obchody jsou uvnitř každé karty řazené od nejlevnější ceny.
                  </p>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  {!loading && visibleProducts.length > 0 && (
                    <p className="rounded-full border border-emerald-200 bg-white px-4 py-2 text-sm font-medium text-emerald-800">
                      {visibleProducts.length} produktů
                    </p>
                  )}
                  {!loading && visibleProducts.length > 0 && (
                    <div className="flex flex-wrap gap-2">
                      {[
                        { key: "relevance", label: "Relevance" },
                        { key: "cheapest", label: "Nejlevnější" },
                        { key: "coverage", label: "Nejvíc obchodů" },
                      ].map((option) => {
                        const isActive = selectedSort === option.key;

                        return (
                          <button
                            key={option.key}
                            type="button"
                            onClick={() => setSelectedSort(option.key as ProductSort)}
                            className={`rounded-full border px-4 py-2 text-sm font-semibold transition ${
                              isActive
                                ? "border-emerald-600 bg-emerald-600 text-white"
                                : "border-emerald-200 bg-white text-emerald-900 hover:border-emerald-300 hover:bg-emerald-50"
                            }`}
                          >
                            {option.label}
                          </button>
                        );
                      })}
                  </div>
                )}
              </div>
            </div>

            {!loading && products.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {availableFilters.map((filter) => {
                  const count = getFilterCount(products, filter.key);
                  const isActive = selectedFilter === filter.key;
                  const isDisabled = filter.key !== "all" && count === 0;

                  return (
                    <button
                      key={filter.key}
                      type="button"
                      onClick={() => setSelectedFilter(filter.key)}
                      disabled={isDisabled}
                      className={`inline-flex items-center gap-2 rounded-full border px-4 py-2 text-sm font-semibold transition ${
                        isActive
                          ? "border-emerald-600 bg-emerald-600 text-white"
                          : isDisabled
                            ? "cursor-not-allowed border-zinc-200 bg-zinc-100 text-zinc-400"
                            : "border-emerald-200 bg-white text-emerald-900 hover:border-emerald-300 hover:bg-emerald-50"
                      }`}
                    >
                      <span>{filter.label}</span>
                      <span
                        className={`rounded-full px-2 py-0.5 text-xs ${
                          isActive
                            ? "bg-white/20 text-white"
                            : isDisabled
                              ? "bg-white text-zinc-400"
                              : "bg-emerald-100 text-emerald-700"
                        }`}
                      >
                        {count}
                      </span>
                    </button>
                  );
                })}
              </div>
            )}

            {loading && <LoadingCards />}

            {!loading && sortedVisibleProducts.length > 0 && (
              <div className="grid gap-4">
                {sortedVisibleProducts.map((product) => {
                  const stores = sortStoresByPrice(product.stores);

                  return (
                    <article
                      key={product.url}
                      className="rounded-[2rem] border border-emerald-100 bg-white/90 p-5 shadow-[0_25px_60px_-35px_rgba(16,185,129,0.45)] sm:p-6"
                    >
                      <div className="flex flex-col gap-5">
                        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                          <div className="space-y-2">
                            <h3 className="text-xl font-semibold text-zinc-950">
                              {cleanProductName(product.name)}
                            </h3>
                            <p className="text-sm text-zinc-500">
                              Dostupné v {stores.length} obchodech
                            </p>
                          </div>
                          <a
                            href={product.url}
                            target="_blank"
                            rel="noreferrer"
                            className="inline-flex items-center justify-center rounded-full border border-emerald-200 bg-emerald-50 px-4 py-2 text-sm font-semibold text-emerald-800 transition hover:border-emerald-300 hover:bg-emerald-100"
                          >
                            Detail nabídky
                          </a>
                        </div>

                        <ul className="grid gap-3">
                          {stores.map((item, index) => {
                            const cheapest = index === 0;

                            return (
                              <li
                                key={`${item.shopId}-${item.price}-${index}`}
                                className={`rounded-[1.5rem] border px-4 py-4 transition sm:px-5 ${
                                  cheapest
                                    ? "border-emerald-300 bg-emerald-50 shadow-[0_18px_35px_-28px_rgba(5,150,105,0.8)]"
                                    : "border-zinc-100 bg-zinc-50"
                                }`}
                              >
                                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                                  <div className="space-y-2">
                                    <div className="flex flex-wrap items-center gap-2">
                                      <StoreBrand shopName={item.shopName} />
                                      {item.sourceLabel && (
                                        <span className="rounded-full border border-zinc-200 bg-white px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.14em] text-zinc-500">
                                          {item.sourceLabel}
                                        </span>
                                      )}
                                      {cheapest && (
                                        <span className="rounded-full bg-emerald-600 px-3 py-1 text-xs font-semibold text-white">
                                          Nejlevnější
                                        </span>
                                      )}
                                    </div>
                                    {(item.validity || item.pricePerUnit) && (
                                      <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-zinc-500">
                                        {item.validity && (
                                          <span>Platnost: {item.validity}</span>
                                        )}
                                        {item.pricePerUnit && (
                                          <span>Jednotková cena: {item.pricePerUnit}</span>
                                        )}
                                      </div>
                                    )}
                                  </div>

                                  <div className="flex flex-col items-start gap-3 sm:items-end">
                                    <div className="text-left sm:text-right">
                                      <p
                                        className={`text-xl font-bold ${
                                          cheapest
                                            ? "text-emerald-700"
                                            : "text-zinc-900"
                                        }`}
                                      >
                                        {item.price}
                                      </p>
                                      {item.amount && (
                                        <p className="text-xs text-zinc-500">
                                          Sleva: {item.amount}
                                        </p>
                                      )}
                                    </div>

                                    {item.leafletUrl && (
                                      <a
                                        href={item.leafletUrl}
                                        target="_blank"
                                        rel="noreferrer"
                                        className="inline-flex items-center rounded-full border border-zinc-200 bg-white px-3 py-1.5 text-xs font-semibold text-zinc-700 transition hover:border-emerald-300 hover:text-emerald-700"
                                      >
                                        V letáku
                                      </a>
                                    )}
                                  </div>
                                </div>
                              </li>
                            );
                          })}
                        </ul>
                      </div>
                    </article>
                  );
                })}
              </div>
            )}

            {!loading && visibleProducts.length === 0 && (
              <EmptyState hasSearched={hasSearched} />
            )}
          </section>
        )}

        {/* Recipe Shopping List Section */}
        {mode === "recipes" && (
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
              {ingredients.length > 0 && !recipeLoading && (
                <p className="rounded-full border border-emerald-200 bg-white px-4 py-2 text-sm font-medium text-emerald-800">
                  {ingredients.length} ingrediencí
                </p>
              )}
            </div>

            {recipeError && (
              <div className="rounded-[1.5rem] border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                {recipeError}
              </div>
            )}

            {recipeLoading && <RecipeSkeleton />}

            {!recipeLoading && recipeResults.length > 0 && (
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
                        {checkedIngredients.length}/{recipeResults.length} položek máte
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
                        <span className="mr-3 inline-flex align-middle">
                          <StoreBrand shopName={bestSingleStorePlan.shopName} />
                        </span>
                        {!getStoreLogoPath(bestSingleStorePlan.shopName) && (
                          <>{bestSingleStorePlan.shopName} · </>
                        )}
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
                                        <StoreBrand shopName={item.selectedStore.shopName} />
                                        {!getStoreLogoPath(item.selectedStore.shopName) && (
                                          <span>{item.selectedStore.shopName}</span>
                                        )}
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

            {!recipeLoading && !recipeError && recipeResults.length === 0 && (
              <div className="rounded-[1.75rem] border border-dashed border-emerald-200 bg-white/70 px-6 py-12 text-center">
                <div className="mx-auto mb-5 flex h-20 w-20 items-center justify-center rounded-full bg-emerald-100 text-4xl">
                  🍲
                </div>
                <h2 className="text-xl font-semibold text-emerald-950">
                  Vyberte recept výše
                </h2>
                <p className="mx-auto mt-3 max-w-md text-sm leading-6 text-zinc-600">
                  Klikněte na některý z receptů a my vám najdeme nejlevnější ingredience.
                </p>
              </div>
            )}
          </section>
        )}
        </main>
      </div>
    </>
  );
}
