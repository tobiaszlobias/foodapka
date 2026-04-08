"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense } from "react";
import SearchBar from "@/components/SearchBar";
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

type AppMode = "search" | "recipes" | "watchdog" | "lists";
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
          className={isLidl ? "h-[3.5rem] w-[3.5rem] md:h-[4.25rem] md:w-[4.25rem] object-contain" : "h-10 w-10 md:h-14 md:w-14 object-contain"}
          unoptimized
        />
      </span>
    );
  }

  return (
    <>
      <span className="text-lg">{getStoreIcon(shopName)}</span>
      <span className="font-semibold text-zinc-800 dark:text-zinc-200">{shopName}</span>
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
          className="overflow-hidden rounded-2xl border border-foodapka-100 dark:border-zinc-800 bg-white/90 dark:bg-foodapka-950 p-5 shadow-[0_20px_50px_-30px_rgba(132,204,22,0.2)]"
        >
          <div className="animate-pulse space-y-4">
            <div className="h-6 w-2/3 rounded-full bg-foodapka-100 dark:bg-zinc-800" />
            <div className="h-4 w-40 rounded-full bg-zinc-100 dark:bg-zinc-900" />
            <div className="grid gap-3">
              {Array.from({ length: 3 }).map((_, storeIndex) => (
                <div
                  key={storeIndex}
                  className="flex items-center justify-between rounded-xl border border-zinc-100 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900/50 px-4 py-4"
                >
                  <div className="space-y-2">
                    <div className="h-4 w-24 rounded-full bg-zinc-200 dark:bg-zinc-800" />
                    <div className="h-3 w-16 rounded-full bg-zinc-100 dark:bg-zinc-900" />
                  </div>
                  <div className="space-y-2">
                    <div className="h-4 w-20 rounded-full bg-foodapka-100 dark:bg-foodapka-900" />
                    <div className="h-3 w-24 rounded-full bg-zinc-100 dark:bg-zinc-900" />
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
          className="animate-pulse rounded-2xl border border-foodapka-100 dark:border-zinc-800 bg-white/85 dark:bg-foodapka-950 p-5 shadow-[0_20px_50px_-30px_rgba(132,204,22,0.2)]"
        >
          <div className="h-5 w-36 rounded-full bg-foodapka-100 dark:bg-zinc-800" />
          <div className="mt-4 h-20 rounded-xl bg-zinc-100 dark:bg-zinc-900" />
        </div>
      ))}
    </div>
  );
}

function EmptyState({ hasSearched }: { hasSearched: boolean }) {
  return (
    <div className="rounded-2xl border border-dashed border-foodapka-200 dark:border-zinc-800 bg-white/70 dark:bg-foodapka-950 px-6 py-12 text-center shadow-[0_20px_40px_-35px_rgba(132,204,22,0.5)]">
      <div className="mx-auto mb-5 flex h-20 w-20 items-center justify-center rounded-full bg-foodapka-100 dark:bg-zinc-800 text-4xl">
        {hasSearched ? "🧺" : "🥬"}
      </div>
      <h2 className="text-xl font-semibold text-foodapka-950 dark:text-white">
        {hasSearched ? "Nic jsme nenašli" : "Začněte hledat výhodnější nákup"}
      </h2>
      <p className="mx-auto mt-3 max-w-md text-sm leading-6 text-zinc-600 dark:text-zinc-400">
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

// Inner component that uses useSearchParams
function HomeContent({
  serverSearchParams,
}: {
  serverSearchParams: Promise<{ mode?: string; query?: string }>;
}) {
  const router = useRouter();
  const searchParams = useSearchParams();
  
  // Mode derived from URL params (reactive)
  const urlMode = searchParams.get("mode");
  const mode: AppMode = 
    urlMode === "recipes" ? "recipes" : 
    urlMode === "watchdog" ? "watchdog" :
    urlMode === "lists" ? "lists" : 
    "search";
  
  // Check URL params on mount for query auto-search
  useEffect(() => {
    void serverSearchParams.then((params) => {
      // Auto-trigger search if query param exists
      if (params.query) {
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
  }, [serverSearchParams]);
  
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
    // Navigate via URL - mode is derived from URL params
    const url = newMode === "recipes" ? "/app?mode=recipes" : "/app";
    router.push(url, { scroll: false });
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
      {/* Watchdog Page */}
      {mode === "watchdog" && (
        <div className="space-y-6">
          <header className="mb-6 md:mb-10 px-1 md:px-2">
            <h1 className="text-2xl md:text-4xl lg:text-5xl font-extrabold tracking-tight text-foodapka-950 dark:text-white leading-tight mb-2">
              Hlídací pes 🐕
            </h1>
            <p className="text-sm md:text-lg text-zinc-600 dark:text-zinc-400">
              Upozorníme vás, když cena klesne.
            </p>
          </header>
          
          <div className="rounded-2xl border border-dashed border-foodapka-300 dark:border-foodapka-800 bg-white/90 dark:bg-foodapka-950 p-6 md:p-8 text-center shadow-sm">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-foodapka-100 dark:bg-zinc-800 text-3xl">
              🔔
            </div>
            <h2 className="text-lg md:text-xl font-semibold text-foodapka-950 dark:text-white mb-2">
              Zatím nemáte žádné produkty
            </h2>
            <p className="text-sm text-zinc-600 dark:text-zinc-400 mb-6 max-w-xs mx-auto">
              Vyhledejte produkt a klikněte na &quot;Hlídat cenu&quot;.
            </p>
            <button
              onClick={() => router.push("/app")}
              className="inline-flex items-center gap-2 rounded-full bg-foodapka-500 px-6 py-2.5 font-semibold text-white transition hover:bg-foodapka-600 text-sm"
            >
              <span className="material-symbols-outlined text-lg">search</span>
              Vyhledat produkty
            </button>
          </div>
          
          <div className="rounded-2xl border border-foodapka-100 dark:border-zinc-800 bg-white/90 dark:bg-foodapka-950 p-5 md:p-6 shadow-sm">
            <h3 className="font-semibold text-zinc-900 dark:text-white mb-4 flex items-center gap-2 text-sm md:text-base">
              <span className="material-symbols-outlined text-foodapka-500 text-lg">info</span>
              Jak to funguje?
            </h3>
            <ul className="space-y-3 text-sm text-zinc-600 dark:text-zinc-400">
              <li className="flex items-start gap-3">
                <span className="text-foodapka-500 font-bold">1.</span>
                Vyhledejte produkt
              </li>
              <li className="flex items-start gap-3">
                <span className="text-foodapka-500 font-bold">2.</span>
                Nastavte cílovou cenu
              </li>
              <li className="flex items-start gap-3">
                <span className="text-foodapka-500 font-bold">3.</span>
                Dostanete notifikaci
              </li>
            </ul>
          </div>
        </div>
      )}
      
      {/* Shopping Lists Page */}
      {mode === "lists" && (
        <div className="space-y-6">
          <header className="mb-6 md:mb-10 px-1 md:px-2">
            <h1 className="text-2xl md:text-4xl lg:text-5xl font-extrabold tracking-tight text-foodapka-950 dark:text-white leading-tight mb-2">
              Nákupní seznamy 📝
            </h1>
            <p className="text-sm md:text-lg text-zinc-600 dark:text-zinc-400">
              Vytvářejte a spravujte své seznamy.
            </p>
          </header>
          
          <div className="flex gap-4 px-1 md:px-2">
            <button className="inline-flex items-center gap-2 rounded-full bg-foodapka-500 px-5 py-2.5 font-semibold text-white transition hover:bg-foodapka-600 text-sm">
              <span className="material-symbols-outlined text-lg">add</span>
              Nový seznam
            </button>
          </div>
          
          <div className="rounded-2xl border border-dashed border-foodapka-300 dark:border-foodapka-800 bg-white/90 dark:bg-foodapka-950 p-6 md:p-8 text-center shadow-sm">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-foodapka-100 dark:bg-zinc-800 text-3xl">
              📋
            </div>
            <h2 className="text-lg md:text-xl font-semibold text-foodapka-950 dark:text-white mb-2">
              Zatím žádné seznamy
            </h2>
            <p className="text-sm text-zinc-600 dark:text-zinc-400 max-w-xs mx-auto">
              Vytvořte si nový seznam a přidávejte produkty.
            </p>
          </div>
        </div>
      )}
      
      {/* Search/Recipes content - only show when in search or recipes mode */}
      {(mode === "search" || mode === "recipes") && (
        <div className="space-y-6 md:space-y-8">
          <header className="px-1 md:px-2">
            {/* Animated header text */}
            <div className={`transition-all duration-500 ease-out ${mode === "recipes" ? "max-h-0 overflow-hidden opacity-0" : "max-h-64 opacity-100 mb-4"}`}>
              <h1 className="text-2xl md:text-4xl lg:text-5xl font-extrabold tracking-tight text-foodapka-950 dark:text-white leading-tight">
                Najděte nejlevnější akční cenu <br className="hidden md:block" />
                <span className="text-foodapka-600 dark:text-foodapka-400">dřív, než vyrazíte do obchodu</span>
              </h1>
            </div>
            
            {/* Recipe header */}
            <div className={`transition-all duration-500 ease-out ${mode === "search" ? "max-h-0 overflow-hidden opacity-0" : "max-h-64 opacity-100 mb-4"}`}>
              <h1 className="text-2xl md:text-4xl lg:text-5xl font-extrabold tracking-tight text-foodapka-950 dark:text-white leading-tight">
                Vyberte si recept a najdeme <br className="hidden md:block" />
                <span className="text-foodapka-600 dark:text-foodapka-400">nejlevnější suroviny</span>
              </h1>
            </div>
            
            <SearchBar
              onResults={handleResults}
              onLoading={setLoading}
              onSearchStart={() => setHasSearched(true)}
              mode={mode === "recipes" ? "recipes" : "search"}
              onModeChange={handleModeChange}
            />
          </header>
        
      {/* Recipe cards - shown when in recipes mode */}
      <section className={`transition-all duration-500 ease-out mb-6 md:mb-10 ${mode === "recipes" ? "max-h-[3000px] opacity-100" : "max-h-0 overflow-hidden opacity-0"}`}>
        <div className="grid gap-4 md:gap-6 grid-cols-1 sm:grid-cols-2">
          {RECIPE_PRESETS.map((recipe) => (
            <div
              key={recipe.name}
              onClick={() => void runRecipeSearch(recipe.name)}
              className="group rounded-2xl bg-white dark:bg-foodapka-950 border border-zinc-100 dark:border-zinc-800 overflow-hidden text-left shadow-sm transition-all hover:shadow-lg flex flex-col cursor-pointer active:scale-[0.98]"
            >
              {recipe.image && (
                <div className="h-36 md:h-44 overflow-hidden relative">
                  <Image
                    src={recipe.image}
                    alt={recipe.name}
                    fill
                    className="object-cover group-hover:scale-105 transition-transform duration-500"
                    unoptimized
                  />
                  <div className="absolute top-2 left-2">
                    <span className="bg-foodapka-100/90 backdrop-blur-md text-foodapka-800 text-[9px] md:text-[10px] uppercase tracking-widest font-bold px-2 py-0.5 rounded-full">
                      {recipe.tag}
                    </span>
                  </div>
                </div>
              )}
              <div className="p-4 md:p-5 flex-1 flex flex-col">
                <h3 className="text-base md:text-lg font-bold text-zinc-900 dark:text-white group-hover:text-foodapka-600 transition-colors">
                  {recipe.name}
                </h3>
                <p className="mt-1 text-xs md:text-sm text-zinc-500 dark:text-zinc-400 line-clamp-2 flex-1">
                  {recipe.description}
                </p>
                <div className="mt-3 pt-3 border-t border-zinc-100 dark:border-zinc-800 flex items-center justify-between">
                  <div className="flex -space-x-1.5 md:-space-x-2">
                    {recipe.ingredients.slice(0, 3).map((ing) => (
                      <div
                        key={ing}
                        className="w-6 h-6 md:w-7 md:h-7 rounded-full border-2 border-white dark:border-foodapka-900 bg-foodapka-100 dark:bg-foodapka-800 flex items-center justify-center text-[9px] md:text-[10px] font-bold text-foodapka-700 dark:text-foodapka-300"
                      >
                        {ing.charAt(0).toUpperCase()}
                      </div>
                    ))}
                  </div>
                  <span className="text-foodapka-600 dark:text-foodapka-400 font-semibold text-xs flex items-center gap-1">
                    Najít ceny
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Search Results Section */}
      {mode === "search" && (
        <section className="space-y-4 md:space-y-5">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between px-1 md:px-2">
            <div>
              <h2 className="text-xl md:text-2xl font-semibold tracking-tight text-foodapka-950 dark:text-white">
                Výsledky hledání
              </h2>
              <p className="mt-0.5 text-xs md:text-sm text-zinc-600 dark:text-zinc-400">
                Řazeno od nejlevnějšího.
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-2 overflow-x-auto pb-1 no-scrollbar">
              {!loading && visibleProducts.length > 0 && (
                <div className="flex gap-2">
                  {[
                    { key: "relevance", label: "Relevance" },
                    { key: "cheapest", label: "Nejlevnější" },
                  ].map((option) => {
                    const isActive = selectedSort === option.key;

                    return (
                      <button
                        key={option.key}
                        type="button"
                        onClick={() => setSelectedSort(option.key as ProductSort)}
                        className={`whitespace-nowrap rounded-full border px-3 py-1.5 text-xs font-semibold transition ${
                          isActive
                            ? "border-foodapka-600 bg-foodapka-600 text-white"
                            : "border-foodapka-200 dark:border-zinc-800 bg-white dark:bg-foodapka-950 text-foodapka-900 dark:text-zinc-100 hover:border-foodapka-300"
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
          <div className="flex flex-wrap gap-2 px-1 md:px-2 overflow-x-auto pb-1 no-scrollbar">
            {availableFilters.slice(0, 6).map((filter) => {
              const count = getFilterCount(products, filter.key);
              const isActive = selectedFilter === filter.key;
              const isDisabled = filter.key !== "all" && count === 0;

              return (
                <button
                  key={filter.key}
                  type="button"
                  onClick={() => setSelectedFilter(filter.key)}
                  disabled={isDisabled}
                  className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-semibold transition whitespace-nowrap ${
                    isActive
                      ? "border-foodapka-600 bg-foodapka-600 text-white"
                      : isDisabled
                        ? "opacity-40 cursor-not-allowed border-zinc-200 dark:border-zinc-800"
                        : "border-foodapka-200 dark:border-zinc-800 bg-white dark:bg-foodapka-950 text-foodapka-900 dark:text-zinc-100"
                  }`}
                >
                  <span>{filter.label}</span>
                  <span className={`rounded-full px-1.5 py-0.5 text-[10px] ${isActive ? "bg-white/20 text-white" : "bg-foodapka-100 dark:bg-foodapka-900/50 text-foodapka-700"}`}>
                    {count}
                  </span>
                </button>
              );
            })}
          </div>
        )}

        {loading && <LoadingCards />}

        {!loading && sortedVisibleProducts.length > 0 && (
          <div className="grid gap-3 md:gap-4">
            {sortedVisibleProducts.map((product) => {
              const stores = sortStoresByPrice(product.stores);

              return (
                <article
                  key={product.url}
                  className="rounded-2xl border border-foodapka-100 dark:border-zinc-800 bg-white/90 dark:bg-foodapka-950 p-4 shadow-sm"
                >
                  <div className="flex flex-col gap-4">
                    <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                      <div className="space-y-1">
                        <h3 className="text-base md:text-xl font-semibold text-zinc-950 dark:text-white leading-snug">
                          {cleanProductName(product.name)}
                        </h3>
                        <p className="text-[11px] md:text-sm text-zinc-500 dark:text-zinc-400">
                          V {stores.length} {stores.length === 1 ? "obchodě" : "obchodech"}
                        </p>
                      </div>
                      <a
                        href={product.url}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center justify-center rounded-full border border-foodapka-200 dark:border-zinc-800 bg-foodapka-50 dark:bg-zinc-900 px-3 py-1.5 text-xs font-semibold text-foodapka-800 dark:text-foodapka-300 transition hover:bg-foodapka-100 self-start sm:self-auto"
                      >
                        Detail nabídky
                      </a>
                    </div>

                    <ul className="grid gap-2">
                      {stores.map((item, index) => {
                        const cheapest = index === 0;

                        return (
                          <li
                            key={`${item.shopId}-${item.price}-${index}`}
                            className={`rounded-xl border px-3 py-3 transition ${
                              cheapest
                                ? "border-foodapka-300 dark:border-foodapka-800 bg-foodapka-50 dark:bg-foodapka-900/30"
                                : "border-zinc-100 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900/50"
                            }`}
                          >
                            <div className="flex items-center justify-between gap-2">
                              <div className="flex flex-col gap-1">
                                <div className="flex items-center gap-2">
                                  <StoreBrand shopName={item.shopName} />
                                  {cheapest && (
                                    <span className="rounded-full bg-foodapka-600 px-2 py-0.5 text-[10px] font-semibold text-white">
                                      TOP
                                    </span>
                                  )}
                                </div>
                                {item.validity && (
                                  <span className="text-[10px] text-zinc-500 dark:text-zinc-400">
                                    Do {item.validity.split(" - ")[1] || item.validity}
                                  </span>
                                )}
                              </div>

                              <div className="text-right">
                                <p className={`text-lg font-bold ${cheapest ? "text-foodapka-700 dark:text-foodapka-400" : "text-zinc-900 dark:text-white"}`}>
                                  {item.price}
                                </p>
                                {item.amount && (
                                  <p className="text-[10px] text-zinc-500 dark:text-zinc-400">
                                    {item.amount}
                                  </p>
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
      <section ref={shoppingListRef} className="space-y-5 px-1 md:px-2">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h2 className="text-xl md:text-2xl font-semibold tracking-tight text-foodapka-950 dark:text-white">
              Nákupní list
            </h2>
          </div>
          {ingredients.length > 0 && !recipeLoading && (
            <p className="rounded-full border border-foodapka-200 dark:border-zinc-800 bg-white dark:bg-foodapka-950 px-3 py-1.5 text-xs font-medium text-foodapka-800 dark:text-foodapka-300 w-fit">
              {ingredients.length} ingrediencí
            </p>
          )}
        </div>

        {recipeError && (
          <div className="rounded-xl border border-red-200 bg-red-50 dark:bg-red-900/30 px-4 py-3 text-xs text-red-700 dark:text-red-300">
            {recipeError}
          </div>
        )}

        {recipeLoading && <RecipeSkeleton />}

        {!recipeLoading && recipeResults.length > 0 && (
          <div className="grid gap-4">
            <div className="rounded-2xl border border-foodapka-100 dark:border-zinc-800 bg-white/95 dark:bg-foodapka-950 p-4 md:p-6 shadow-sm">
              <div className="flex flex-col gap-4 border-b border-foodapka-100 dark:border-zinc-800 pb-4 sm:flex-row sm:items-start sm:justify-between">
                <div>
                  <p className="text-[10px] font-semibold uppercase tracking-widest text-foodapka-700 dark:text-foodapka-400">
                    Nákup pro
                  </p>
                  <h3 className="mt-1 text-xl md:text-2xl font-semibold text-zinc-950 dark:text-white">
                    {activeRecipe}
                  </h3>
                </div>

                <div className="flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={saveShoppingList}
                    className="inline-flex items-center rounded-full border border-foodapka-200 dark:border-zinc-800 bg-foodapka-50 dark:bg-zinc-900 px-3 py-1.5 text-xs font-semibold text-foodapka-800 dark:text-foodapka-300 transition hover:bg-foodapka-100"
                  >
                    Uložit
                  </button>
                  <button
                    type="button"
                    onClick={() => void shareShoppingList()}
                    className="inline-flex items-center rounded-full border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 px-3 py-1.5 text-xs font-semibold text-zinc-700 dark:text-zinc-300 transition hover:bg-zinc-100"
                  >
                    Sdílet
                  </button>
                </div>
              </div>

              <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div className="inline-flex rounded-full border border-foodapka-200 dark:border-zinc-800 bg-foodapka-50 dark:bg-zinc-900 p-1 w-fit">
                  <button
                    type="button"
                    onClick={() => setShoppingMode("cross_store")}
                    className={`rounded-full px-3 py-1.5 text-xs font-semibold transition ${
                      shoppingMode === "cross_store"
                        ? "bg-foodapka-600 text-white"
                        : "text-foodapka-800 dark:text-foodapka-400"
                    }`}
                  >
                    Všude
                  </button>
                  <button
                    type="button"
                    onClick={() => setShoppingMode("single_store")}
                    className={`rounded-full px-3 py-1.5 text-xs font-semibold transition ${
                      shoppingMode === "single_store"
                        ? "bg-foodapka-600 text-white"
                        : "text-foodapka-800 dark:text-foodapka-400"
                    }`}
                  >
                    Jeden obchod
                  </button>
                </div>
              </div>

              <ul className="mt-4 grid gap-2">
                {selectedResults.map((item) => {
                  const isChecked = checkedIngredients.includes(item.ingredient);

                  return (
                    <li
                      key={item.ingredient}
                      className={`rounded-xl border px-3 py-3 transition ${
                        isChecked
                          ? "border-foodapka-200 dark:border-zinc-800 bg-foodapka-50/70 dark:bg-foodapka-900/20"
                          : "border-zinc-100 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900/50"
                      }`}
                    >
                      <div className="flex gap-3">
                        <button
                          type="button"
                          onClick={() => toggleIngredient(item.ingredient)}
                          className={`mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full border text-[10px] font-bold transition ${
                            isChecked
                              ? "border-foodapka-600 bg-foodapka-600 text-white"
                              : "border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-transparent"
                          }`}
                        >
                          ✓
                        </button>

                        <div className="min-w-0 flex-1">
                          <div className="flex items-center justify-between gap-2">
                            <p className={`text-sm md:text-base font-semibold truncate ${isChecked ? "text-zinc-500 line-through" : "text-zinc-950 dark:text-white"}`}>
                              {item.ingredient}
                            </p>
                            <p className={`text-base font-bold whitespace-nowrap ${isChecked ? "text-zinc-400" : "text-foodapka-700 dark:text-foodapka-400"}`}>
                              {item.selectedStore?.price || "—"}
                            </p>
                          </div>
                          {!isChecked && item.selectedStore && (
                            <div className="flex items-center gap-2 mt-1">
                              <StoreBrand shopName={item.selectedStore.shopName} />
                              <span className="text-[10px] text-zinc-500 dark:text-zinc-400 truncate">
                                {cleanProductName(item.selectedProduct?.name || "")}
                              </span>
                            </div>
                          )}
                        </div>
                      </div>
                    </li>
                  );
                })}
              </ul>
            </div>

            <div className="rounded-2xl border border-foodapka-200 dark:border-zinc-800 bg-foodapka-950 px-5 py-5 text-white shadow-lg">
              <p className="text-[10px] uppercase tracking-widest text-foodapka-200">
                Celková cena
              </p>
              <p className="mt-1 text-2xl font-bold">
                {totalPrice.toFixed(2).replace(".", ",")} Kč
              </p>
            </div>
          </div>
        )}
      </section>
    )}
    </div>
  );
}


// Wrapper component with Suspense for useSearchParams
export default function Home({
  searchParams,
}: {
  searchParams: Promise<{ mode?: string; query?: string }>;
}) {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950 flex items-center justify-center">
        <span className="text-zinc-400">Načítání...</span>
      </div>
    }>
      <HomeContent serverSearchParams={searchParams} />
    </Suspense>
  );
}
