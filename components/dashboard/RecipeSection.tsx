"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import Image from "next/image";
import { useBodyScrollLock } from "@/lib/useBodyScrollLock";
import SearchBar from "@/components/SearchBar";
import { RECIPE_PRESETS, type RecipeStep } from "@/lib/recipes";
import { normalizeSteps } from "@/components/CookingModeStepper";
import TestRecipeDetail from "@/components/TestRecipeDetail";
import { showToast } from "@/components/Toast";
import {
  cleanProductName,
  parsePrice,
  formatDiscountPercent,
  getStoreSavings,
  getUnitPriceLabel,
  sortStoresByPrice,
  type Product,
  type Store
} from "@/lib/food";
import { canonicalChainName } from "@/lib/storeLogos";
import { StoreBrand, RecipeSkeleton, SearchLoadingAnimation, LeafletViewer } from "./DashboardShared";

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

type CustomRecipe = {
  name: string;
  tag: string;
  description?: string;
  ingredients: string[];
  instructions?: string[];
  createdAt: string;
};

const CUSTOM_RECIPES_KEY = "foodappka-custom-recipes";

function pluralizePolozky(count: number) {
  if (count === 1) return "položka";
  if (count >= 2 && count <= 4) return "položky";
  return "položek";
}

function loadLocalCustomRecipes(): CustomRecipe[] {
  if (typeof window === "undefined") return [];
  try {
    return JSON.parse(localStorage.getItem(CUSTOM_RECIPES_KEY) || "[]");
  } catch {
    return [];
  }
}

function saveLocalCustomRecipes(recipes: CustomRecipe[]) {
  localStorage.setItem(CUSTOM_RECIPES_KEY, JSON.stringify(recipes));
}

// Přihlášený uživatel: recepty v Supabase (dostupné na všech zařízeních).
// Nepřihlášený: localStorage fallback — stejný vzor jako u oblíbených.
async function loadCustomRecipes(): Promise<{ recipes: CustomRecipe[]; usingCloud: boolean }> {
  try {
    const res = await fetch("/api/custom-recipes");
    if (res.status === 401) {
      return { recipes: loadLocalCustomRecipes(), usingCloud: false };
    }
    if (!res.ok) throw new Error();
    const data = await res.json();
    const recipes: CustomRecipe[] = (data.items ?? []).map((row: any) => ({
      name: row.name,
      tag: row.tag,
      description: row.description ?? undefined,
      ingredients: row.ingredients,
      instructions: row.instructions ?? undefined,
      createdAt: row.created_at,
    }));
    return { recipes, usingCloud: true };
  } catch {
    return { recipes: loadLocalCustomRecipes(), usingCloud: false };
  }
}

type RecipeSectionProps = {
  activeRecipe: string;
  recipeDetails?: {
    name: string;
    description?: string;
    instructions?: (string | RecipeStep)[];
  } | null;
  recipeLoading: boolean;
  ingredients: string[];
  recipeResults: IngredientResult[];
  checkedIngredients: string[];
  shoppingMode: ShoppingMode;
  recipeError: string | null;
  shareMessage: string | null;
  shoppingListRef: React.RefObject<HTMLElement | null>;
  isSaving?: boolean;
  toggleIngredient: (ing: string) => void;
  onReplaceProduct?: (ingredient: string, product: Product, store: Store) => void;
  runRecipeSearch: (name: string) => void;
  runCustomRecipeSearch?: (recipe: { name: string; description?: string; ingredients: string[]; instructions?: string[] }) => void;
  generateAIRecipe?: (prompt: string) => void;
  saveShoppingList: () => void;
  shareShoppingList: () => void;
  setShoppingMode: (mode: ShoppingMode) => void;
  handleModeChange: (mode: any) => void;
  setLoading: (l: boolean) => void;
  handleResults: (products: Product[]) => void;
  hasSearched: boolean;
  setHasSearched: (s: boolean) => void;
  hideHeader?: boolean;
  favorites: { id: string }[];
  onToggleFavorite: (item: any) => void;
  /** Vynutí jen nákupní sekci, bez celostránkového TestRecipeDetail layoutu —
   * používá se při vnořeném volání RecipeSection jako shoppingContent (viz níže). */
  forceShoppingOnly?: boolean;
};

export default function RecipeSection({
  activeRecipe,
  recipeDetails,
  recipeLoading,
  ingredients,
  recipeResults,
  checkedIngredients,
  shoppingMode,
  recipeError,
  shareMessage,
  shoppingListRef,
  isSaving,
  toggleIngredient,
  onReplaceProduct,
  runRecipeSearch,
  runCustomRecipeSearch,
  generateAIRecipe,
  saveShoppingList,
  shareShoppingList,
  setShoppingMode,
  handleModeChange,
  setLoading,
  handleResults,
  hasSearched,
  setHasSearched,
  hideHeader,
  favorites,
  onToggleFavorite,
  forceShoppingOnly,
}: RecipeSectionProps) {
  // Vlastní recepty + kategorie
  const [customRecipes, setCustomRecipes] = useState<CustomRecipe[]>([]);
  const [usingCloudRecipes, setUsingCloudRecipes] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [leafletDialog, setLeafletDialog] = useState<{ url: string; shopName: string } | null>(null);
  const [selectedStore, setSelectedStore] = useState<string | null>(null);
  const [storePickerOpen, setStorePickerOpen] = useState(false);
  const [replacingIngredient, setReplacingIngredient] = useState<string | null>(null);
  // Experimentální celostránkový layout (taby Nákup/Ingredience/Postup/Nutriční
  // hodnoty) zatím jen pro recepty se strukturovanými kroky (RecipeStep s
  // ingredientIndexes) — v praxi jen testovací recept.
  const [showFullRecipeView, setShowFullRecipeView] = useState(true);
  const activeRecipePreset = useMemo(
    () => RECIPE_PRESETS.find((r) => r.name === activeRecipe),
    [activeRecipe],
  );
  const hasNewLayout = useMemo(
    () =>
      normalizeSteps(activeRecipePreset?.instructions ?? []).some(
        (s) => s.ingredientIndexes.length > 0,
      ),
    [activeRecipePreset],
  );

  useEffect(() => {
    loadCustomRecipes().then(({ recipes, usingCloud }) => {
      setCustomRecipes(recipes);
      setUsingCloudRecipes(usingCloud);
    });
  }, []);

  useEffect(() => {
    setSelectedStore(null);
    setShowFullRecipeView(true);
  }, [activeRecipe]);

  const categories = useMemo(() => {
    const tags = new Set<string>();
    RECIPE_PRESETS.forEach(r => tags.add(r.tag));
    customRecipes.forEach(r => tags.add(r.tag));
    return ["all", "favorites", ...Array.from(tags)];
  }, [customRecipes]);

  const visiblePresets = useMemo(() => {
    if (selectedCategory === "favorites") {
      return RECIPE_PRESETS.filter(r => favorites.some(f => f.id === r.name));
    }
    return selectedCategory === "all" ? RECIPE_PRESETS : RECIPE_PRESETS.filter(r => r.tag === selectedCategory);
  }, [selectedCategory, favorites]);
  const visibleCustom = useMemo(() => {
    if (selectedCategory === "favorites") return [];
    return selectedCategory === "all" ? customRecipes : customRecipes.filter(r => r.tag === selectedCategory);
  }, [customRecipes, selectedCategory]);

  const saveCustomRecipe = async (recipe: CustomRecipe) => {
    const next = [recipe, ...customRecipes.filter(r => r.name !== recipe.name)];
    setCustomRecipes(next);
    setShowCreateForm(false);

    if (usingCloudRecipes) {
      try {
        const res = await fetch("/api/custom-recipes", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(recipe),
        });
        if (!res.ok) throw new Error();
      } catch {
        showToast("Recept se nepodařilo uložit na server, zůstává jen lokálně.", "error");
      }
    } else {
      saveLocalCustomRecipes(next);
    }

    showToast("✅ Recept uložen!", "success");
    runCustomRecipeSearch?.(recipe);
  };

  const deleteCustomRecipe = async (name: string) => {
    const next = customRecipes.filter(r => r.name !== name);
    setCustomRecipes(next);

    if (usingCloudRecipes) {
      await fetch(`/api/custom-recipes?name=${encodeURIComponent(name)}`, { method: "DELETE" });
    } else {
      saveLocalCustomRecipes(next);
    }
  };

  // SINGLE STORE LOGIC: skóre pro každý řetězec (počet pokrytých ingrediencí + cena),
  // použité jak pro automatický výběr nejlepšího, tak pro ruční výběr z dropdownu.
  // Varianty téhož řetězce (Albert supermarket/hypermarket, BILLA/Billa…) se slučují
  // pod jeden kanonický název — appka bere z nich vždy tu levnější nabídku.
  const shopScores = useMemo(() => {
    if (shoppingMode === "cross_store") return [];

    const chainVariants = new Map<string, Set<string>>();
    recipeResults.forEach(r => {
      if (r?.storeOptions) {
        r.storeOptions.forEach(opt => {
          if (!opt?.store?.shopName) return;
          const chain = canonicalChainName(opt.store.shopName);
          if (!chainVariants.has(chain)) chainVariants.set(chain, new Set());
          chainVariants.get(chain)!.add(opt.store.shopName);
        });
      }
    });

    // vyřazené (odškrtnuté) položky se do výběru obchodu nepočítají
    const scores = Array.from(chainVariants.entries()).map(([chain, variants]) => {
      let totalItems = 0;
      let totalPrice = 0;
      let missingCount = 0;
      // "Kolik by mě to reálně stálo": cena obchodu + doplnění chybějících položek
      // za jejich nejlevnější cenu odjinud. Zabraňuje tomu, aby vyhrál obchod
      // s jednou levnou položkou jen proto, že "chybí" položky se nepočítaly.
      let completionCost = 0;
      const items = recipeResults.map(res => {
        if (!res) return null;
        const isExcluded = checkedIngredients.includes(res.ingredient);
        const candidates = (res.storeOptions ?? []).filter(
          opt => opt?.store?.shopName && variants.has(opt.store.shopName),
        );
        const option = candidates.sort((a, b) => parsePrice(a.store.price) - parsePrice(b.store.price))[0];
        if (option) {
          if (!isExcluded) {
            totalItems++;
            const optionPrice = parsePrice(option.store.price);
            if (Number.isFinite(optionPrice)) {
              totalPrice += optionPrice;
              completionCost += optionPrice;
            }
          }
          return { ...res, store: option.store, product: option.product };
        }
        if (!isExcluded) {
          missingCount++;
          const fallbackPrice = res.store ? parsePrice(res.store.price) : Number.POSITIVE_INFINITY;
          if (Number.isFinite(fallbackPrice)) completionCost += fallbackPrice;
        }
        return { ...res, store: null, product: null };
      }).filter((x): x is NonNullable<typeof x> => x !== null);

      return {
        shopName: chain,
        variants: Array.from(variants),
        totalItems,
        totalPrice,
        missingCount,
        completionCost,
        items,
      };
    });

    return scores.sort((a, b) => {
      if (a.completionCost !== b.completionCost) return a.completionCost - b.completionCost;
      return b.totalItems - a.totalItems;
    });
  }, [recipeResults, shoppingMode, checkedIngredients]);

  const effectiveResults = useMemo(() => {
    if (shoppingMode === "cross_store") return recipeResults;
    if (shopScores.length === 0) return recipeResults;

    const chosen = selectedStore
      ? shopScores.find(s => s.shopName === selectedStore) ?? shopScores[0]
      : shopScores[0];

    return chosen.items;
  }, [recipeResults, shoppingMode, shopScores, selectedStore]);

  const totalPrice = useMemo(() => {
    return (effectiveResults || []).reduce((sum, item) => {
      if (!item || !item.ingredient || checkedIngredients.includes(item.ingredient) || !item.store) return sum;
      const price = parsePrice(item.store.price);
      return Number.isFinite(price) ? sum + price : sum;
    }, 0);
  }, [effectiveResults, checkedIngredients]);

  const totalSavings = useMemo(() => {
    return (effectiveResults || []).reduce((sum, item) => {
      if (!item || !item.ingredient || checkedIngredients.includes(item.ingredient) || !item.store) return sum;
      return sum + getStoreSavings(item.store);
    }, 0);
  }, [effectiveResults, checkedIngredients]);

  const saleItemsCount = useMemo(() => {
    return (effectiveResults || []).reduce((count, item) => {
      if (!item || !item.ingredient || checkedIngredients.includes(item.ingredient) || !item.store) return count;
      return getStoreSavings(item.store) > 0 ? count + 1 : count;
    }, 0);
  }, [effectiveResults, checkedIngredients]);

  if (
    !forceShoppingOnly &&
    hasNewLayout &&
    showFullRecipeView &&
    activeRecipePreset &&
    (recipeLoading || effectiveResults.length > 0)
  ) {
    return (
      <TestRecipeDetail
        recipe={activeRecipePreset}
        backHref="#"
        onFindIngredients={() => setShowFullRecipeView(false)}
        shoppingContent={
          <RecipeSection
            activeRecipe={activeRecipe}
            recipeDetails={recipeDetails}
            recipeLoading={recipeLoading}
            ingredients={ingredients}
            recipeResults={recipeResults}
            checkedIngredients={checkedIngredients}
            shoppingMode={shoppingMode}
            recipeError={recipeError}
            shareMessage={shareMessage}
            shoppingListRef={shoppingListRef}
            isSaving={isSaving}
            toggleIngredient={toggleIngredient}
            onReplaceProduct={onReplaceProduct}
            runRecipeSearch={runRecipeSearch}
            runCustomRecipeSearch={runCustomRecipeSearch}
            generateAIRecipe={generateAIRecipe}
            saveShoppingList={saveShoppingList}
            shareShoppingList={shareShoppingList}
            setShoppingMode={setShoppingMode}
            handleModeChange={handleModeChange}
            setLoading={setLoading}
            handleResults={handleResults}
            hasSearched={hasSearched}
            setHasSearched={setHasSearched}
            hideHeader
            favorites={favorites}
            onToggleFavorite={onToggleFavorite}
            forceShoppingOnly
          />
        }
      />
    );
  }

  return (
    <div className="space-y-8">
      {!hideHeader && !activeRecipe && !recipeLoading && !hasSearched && (
        <header className="px-1 md:px-2">
          <h1 className="text-2xl md:text-4xl lg:text-5xl font-display font-extrabold tracking-tight text-mnamio-950 dark:text-white leading-tight mb-4">
            Vyberte si recept a najdeme <br className="hidden md:block" />
            <span className="text-mnamio-600 dark:text-mnamio-400">nejlevnější suroviny</span>
          </h1>
          
          <SearchBar
            onResults={handleResults}
            onLoading={setLoading}
            onSearchStart={() => setHasSearched(true)}
            onFocus={() => setHasSearched(true)}
            onAIGenerate={generateAIRecipe}
            mode="recipes"
            onModeChange={handleModeChange}
          />
        </header>
      )}

      {!hideHeader && !activeRecipe && !recipeLoading && hasSearched && (
        <header className="px-1 md:px-2 pt-2">
          <SearchBar
            onResults={handleResults}
            onLoading={setLoading}
            onSearchStart={() => setHasSearched(true)}
            onAIGenerate={generateAIRecipe}
            mode="recipes"
            onModeChange={handleModeChange}
          />
        </header>
      )}

      {/* Back button when in results mode */}
      {(activeRecipe || recipeLoading) && (
        <div className="px-1">
          <button 
            onClick={() => {
              window.location.href = "/app?mode=recipes"; 
            }}
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-white dark:bg-zinc-800 hover:bg-zinc-50 dark:hover:bg-zinc-700 text-zinc-600 dark:text-zinc-300 transition-all font-bold text-sm rounded-full mb-8 shadow-md border border-zinc-100 dark:border-zinc-700 active:scale-95"
          >
            <span className="material-symbols-outlined text-lg">arrow_back</span>
            Zpět na výběr receptů
          </button>
        </div>
      )}

      {/* Recipe Grid - Only shown when NOT searching */}
      {!activeRecipe && !recipeLoading && (
        <div className="space-y-6">
          {/* Kategorie */}
          <div className="flex gap-2 overflow-x-auto no-scrollbar px-1">
            {categories.map((cat) => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`shrink-0 inline-flex items-center gap-1 rounded-full px-4 py-2 text-xs font-bold transition-all ${
                  selectedCategory === cat
                    ? "bg-mnamio-600 text-white shadow-md"
                    : "bg-white dark:bg-zinc-800 text-zinc-600 dark:text-zinc-300 border border-zinc-100 dark:border-zinc-700 hover:border-mnamio-300"
                }`}
              >
                {cat === "favorites" && (
                  <span
                    className="material-symbols-outlined text-sm"
                    style={selectedCategory === cat ? { fontVariationSettings: "'FILL' 1" } : undefined}
                  >
                    favorite
                  </span>
                )}
                {cat === "all" ? "Vše" : cat === "favorites" ? "Oblíbené" : `#${cat}`}
              </button>
            ))}
          </div>

          <section className="grid gap-4 grid-cols-1 sm:grid-cols-2">
          {/* Karta: vytvořit vlastní recept */}
          <button
            onClick={() => setShowCreateForm(true)}
            className="group flex flex-col items-center justify-center gap-3 rounded-2xl border-2 border-mnamio-400 dark:border-mnamio-700 bg-mnamio-50 dark:bg-mnamio-900/30 p-8 min-h-[180px] shadow-sm transition-all hover:border-mnamio-500 hover:shadow-md active:scale-[0.98] cursor-pointer"
          >
            <div className="flex h-14 w-14 items-center justify-center rounded-full bg-mnamio-500 shadow-md shadow-mnamio-500/30 transition-transform group-hover:scale-110">
              <span className="material-symbols-outlined text-white text-3xl">add</span>
            </div>
            <div className="text-center">
              <p className="font-black text-mnamio-800 dark:text-mnamio-300">Vytvořit vlastní recept</p>
              <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">Sestavte si recept přesně podle sebe</p>
            </div>
          </button>

          {/* Vlastní recepty */}
          {visibleCustom.map((recipe) => (
            <div
              key={`custom-${recipe.name}`}
              onClick={() => runCustomRecipeSearch?.(recipe)}
              className="group relative rounded-2xl bg-white dark:bg-mnamio-950 border border-zinc-100 dark:border-zinc-800 overflow-hidden shadow-sm transition-all active:scale-[0.98] cursor-pointer p-5"
            >
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  deleteCustomRecipe(recipe.name);
                }}
                className="absolute top-3 right-3 z-10 flex h-9 w-9 items-center justify-center rounded-full bg-white/80 dark:bg-zinc-800/80 backdrop-blur text-zinc-400 hover:text-red-500 transition-all shadow-sm"
                title="Smazat recept"
              >
                <span className="material-symbols-outlined text-lg">delete</span>
              </button>
              <div className="mb-3 inline-flex items-center gap-1 px-3 py-1 rounded-full bg-mnamio-100 dark:bg-mnamio-900/50 text-[10px] font-black text-mnamio-800 dark:text-mnamio-300 uppercase tracking-widest">
                <span className="material-symbols-outlined text-[12px]">edit_note</span>
                #{recipe.tag}
              </div>
              <h3 className="text-xl font-black text-zinc-900 dark:text-white leading-tight group-hover:text-mnamio-600 transition-colors">
                {recipe.name}
              </h3>
              <p className="mt-2 text-sm text-zinc-500 dark:text-zinc-400 line-clamp-2 font-medium">
                {recipe.description || `${recipe.ingredients.length} ingrediencí`}
              </p>
            </div>
          ))}

          {visiblePresets.map((recipe) => {
          const isFavorite = favorites.some(f => f.id === recipe.name);
          return (
            <div
              key={recipe.name}
              onClick={() => runRecipeSearch(recipe.name)}
              className="group relative rounded-2xl bg-white dark:bg-mnamio-950 border border-zinc-100 dark:border-zinc-800 overflow-hidden shadow-sm transition-all active:scale-[0.98] cursor-pointer"
            >
              {/* Favorite Button */}
              <button 
                onClick={(e) => {
                  e.stopPropagation();
                  onToggleFavorite(recipe);
                }}
                className={`absolute top-3 right-3 z-10 flex h-10 w-10 items-center justify-center rounded-full transition-all duration-200 shadow-sm ${
                  isFavorite 
                    ? "text-red-500 bg-white/90 backdrop-blur dark:bg-red-900/40" 
                    : "text-zinc-400 bg-white/80 backdrop-blur hover:text-red-400 dark:bg-zinc-800/80"
                }`}
                title={isFavorite ? "Odebrat z oblíbených" : "Přidat do oblíbených"}
              >
                <span 
                  className="material-symbols-outlined text-xl"
                  style={isFavorite ? { fontVariationSettings: "'FILL' 1" } : undefined}
                >
                  favorite
                </span>
              </button>
            {recipe.image && (
              <div className="h-48 md:h-60 relative">
                <Image 
                  src={recipe.image} 
                  alt={recipe.name} 
                  fill 
                  className="object-cover transition-transform duration-500 group-hover:scale-105" 
                  sizes="(max-width: 768px) 100vw, 33vw"
                />
                <div className="absolute top-3 left-3 px-3 py-1 rounded-full bg-white/90 backdrop-blur-md text-[10px] font-black text-mnamio-800 uppercase tracking-widest shadow-sm">
                  #{recipe.tag}
                </div>
              </div>
            )}
            <div className="p-5">
              {recipe.nutrition && (
                <div className="flex items-center gap-4 mb-2">
                  <div>
                    <span className="block text-[9px] font-black uppercase tracking-widest text-zinc-400">Kalorie</span>
                    <span className="text-sm font-black text-zinc-800 dark:text-zinc-200">{recipe.nutrition.calories}</span>
                  </div>
                  <div>
                    <span className="block text-[9px] font-black uppercase tracking-widest text-zinc-400">Bílkoviny</span>
                    <span className="text-sm font-black text-zinc-800 dark:text-zinc-200">{recipe.nutrition.protein}g</span>
                  </div>
                </div>
              )}
              <h3 className="text-xl font-black text-zinc-900 dark:text-white leading-tight group-hover:text-mnamio-600 transition-colors">
                {recipe.name}
              </h3>
              <p className="mt-2 text-sm text-zinc-500 dark:text-zinc-400 line-clamp-2 font-medium">
                {recipe.description}
              </p>
            </div>
          </div>
        );
      })}
    </section>

          {selectedCategory === "favorites" && visiblePresets.length === 0 && (
            <div className="py-16 text-center rounded-2xl border border-dashed border-zinc-200 dark:border-zinc-800">
              <span className="material-symbols-outlined text-5xl text-zinc-300 mb-4 block">favorite</span>
              <p className="text-zinc-500 font-medium">Zatím nemáte žádné oblíbené recepty.</p>
              <p className="text-sm text-zinc-400 mt-1">Klikněte na srdíčko u receptu, který se vám líbí.</p>
            </div>
          )}
        </div>
      )}

      {/* Shopping List / Results - Shown prominently when active */}
      <section ref={shoppingListRef} className="space-y-5">
        {recipeLoading && effectiveResults.length === 0 ? (
          <div className="py-10">
            <SearchLoadingAnimation progress={(recipeResults.length / (ingredients.length || 1)) * 100} />
          </div>
        ) : (recipeLoading || effectiveResults.length > 0) && (
          <div className="space-y-4">
            <div className="rounded-2xl border border-mnamio-100 dark:border-zinc-800 bg-white/95 dark:bg-mnamio-950 p-4 md:p-6 shadow-sm">
              <div className="flex flex-col gap-4 border-b border-mnamio-100 dark:border-zinc-800 pb-4 sm:flex-row sm:items-start sm:justify-between">
                <div>
                  <p className="text-[10px] font-black uppercase tracking-widest text-mnamio-700">Nákup pro</p>
                  <h3 className="text-xl md:text-2xl font-bold text-zinc-950 dark:text-white">{activeRecipe}</h3>
                  {totalPrice > 0 && (
                    <div className="mt-1.5 flex items-baseline gap-2 flex-wrap">
                      <span className="text-2xl font-black text-zinc-950 dark:text-white">
                        {totalPrice.toFixed(2).replace(".", ",")} Kč
                      </span>
                      {totalSavings > 0 && (
                        <span className="inline-flex items-center gap-1 text-sm font-black text-green-600 dark:text-green-400">
                          <span className="material-symbols-outlined text-base">trending_down</span>
                          s Mnamio ušetříte {totalSavings.toFixed(0)} Kč
                          {saleItemsCount > 0 && ` (${saleItemsCount} ${pluralizePolozky(saleItemsCount)} v akci)`}
                        </span>
                      )}
                    </div>
                  )}
                  {recipeDetails?.description && (
                    <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400 italic">
                      &quot;{recipeDetails.description}&quot;
                    </p>
                  )}
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={saveShoppingList}
                    disabled={isSaving || recipeLoading}
                    className="flex-1 sm:flex-none px-4 py-2 rounded-full bg-mnamio-500 text-white text-xs font-bold shadow-md hover:bg-mnamio-600 transition-all disabled:opacity-50 flex items-center justify-center gap-2"
                  >
                    {isSaving ? (
                      <>
                        <span className="material-symbols-outlined animate-spin text-sm">progress_activity</span>
                        Ukládám...
                      </>
                    ) : recipeLoading ? (
                      <>
                        <span className="material-symbols-outlined animate-spin text-sm">progress_activity</span>
                        Načítám ceny...
                      </>
                    ) : (
                      <>
                        <span className="material-symbols-outlined text-sm">save</span>
                        Uložit
                      </>
                    )}
                  </button>
                  <button 
                    onClick={shareShoppingList} 
                    className="flex items-center justify-center w-10 h-10 rounded-full bg-zinc-900 dark:bg-white text-white dark:text-black hover:scale-105 active:scale-95 transition-all shadow-md"
                    title="Sdílet"
                  >
                    <span className="material-symbols-outlined text-lg">ios_share</span>
                  </button>
                </div>
              </div>

              <div className="mt-4 flex items-center gap-2 relative">
                <div className="inline-flex rounded-full bg-mnamio-50 dark:bg-zinc-900 p-1">
                  <button
                    onClick={() => {
                      setShoppingMode("cross_store");
                      setStorePickerOpen(false);
                    }}
                    className={`px-4 py-1.5 rounded-full text-[11px] font-bold transition-all ${shoppingMode === "cross_store" ? "bg-mnamio-600 text-white shadow-sm" : "text-mnamio-800 dark:text-mnamio-400"}`}
                  >
                    Všude
                  </button>
                  <button
                    onClick={() => {
                      if (shoppingMode === "single_store") {
                        setStorePickerOpen(o => !o);
                      } else {
                        setShoppingMode("single_store");
                      }
                    }}
                    className={`flex items-center gap-1 px-4 py-1.5 rounded-full text-[11px] font-bold transition-all ${shoppingMode === "single_store" ? "bg-mnamio-600 text-white shadow-sm" : "text-mnamio-800 dark:text-mnamio-400"}`}
                  >
                    {shoppingMode === "single_store" ? (selectedStore ?? shopScores[0]?.shopName ?? "Jeden obchod") : "Jeden obchod"}
                    {shoppingMode === "single_store" && shopScores.length > 1 && (
                      <span className="material-symbols-outlined text-[14px]">expand_more</span>
                    )}
                  </button>
                </div>

                {storePickerOpen && shoppingMode === "single_store" && (
                  <>
                    <div className="fixed inset-0 z-10" onClick={() => setStorePickerOpen(false)} />
                    <div className="absolute top-full left-0 mt-1 z-20 w-72 max-h-80 overflow-y-auto rounded-2xl bg-white dark:bg-zinc-900 shadow-lg border border-zinc-100 dark:border-zinc-800 divide-y divide-zinc-100 dark:divide-zinc-800">
                      {shopScores.map((shop, idx) => {
                        const isActive = (selectedStore ?? shopScores[0]?.shopName) === shop.shopName;
                        const hasMultipleVariants = shop.variants.length > 1;

                        return (
                          <button
                            key={shop.shopName}
                            onClick={() => {
                              setSelectedStore(shop.shopName);
                              setStorePickerOpen(false);
                            }}
                            className={`w-full flex items-center gap-3 px-3 py-2.5 text-left transition-colors ${isActive ? "bg-mnamio-50 dark:bg-zinc-800" : "hover:bg-zinc-50 dark:hover:bg-zinc-800/50"}`}
                          >
                            <div className="shrink-0 w-9 flex items-center justify-center">
                              <StoreBrand shopName={shop.shopName} small />
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-1.5 flex-wrap">
                                <span className="text-xs font-bold text-zinc-800 dark:text-zinc-100">{shop.shopName}</span>
                                {idx === 0 && (
                                  <span className="text-[9px] text-mnamio-600 font-bold uppercase tracking-wide">doporučeno</span>
                                )}
                              </div>
                              {hasMultipleVariants && (
                                <p className="text-[9px] text-zinc-400 mt-0.5">zahrnuje hypermarket i supermarket</p>
                              )}
                            </div>
                            <div className="shrink-0 flex flex-col items-end gap-0.5">
                              <span className="text-xs font-black text-zinc-800 dark:text-zinc-100">
                                {shop.totalPrice.toFixed(2).replace(".", ",")} Kč
                              </span>
                              {shop.missingCount > 0 ? (
                                <span className="text-[9px] font-bold text-amber-600 dark:text-amber-500">
                                  chybí {shop.missingCount}
                                </span>
                              ) : (
                                <span className="text-[9px] font-bold text-green-600 dark:text-green-400">
                                  kompletní
                                </span>
                              )}
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  </>
                )}
              </div>

              {shareMessage && <div className={`mt-4 p-3 rounded-xl text-xs font-bold border transition-all ${shareMessage.includes('✅') ? 'bg-green-50 border-green-100 text-green-800 dark:bg-green-900/20 dark:border-green-800 dark:text-green-400' : 'bg-mnamio-50 border-mnamio-100 text-mnamio-800 dark:bg-mnamio-900/20 dark:border-mnamio-800 dark:text-mnamio-300'}`}>{shareMessage}</div>}

              <ul className="mt-4 space-y-2">
                {effectiveResults.map((item) => {
                  const isChecked = checkedIngredients.includes(item.ingredient);
                  const price = item.store ? parsePrice(item.store.price) : null;
                  const originalPrice = item.store?.originalPrice ? parsePrice(item.store.originalPrice) : null;
                  const hasRealOriginalPrice = price !== null && originalPrice !== null && originalPrice > price;
                  const savings = item.store ? getStoreSavings(item.store) : 0;
                  const discount = savings > 0
                    ? (item.store?.discountPercent || (hasRealOriginalPrice ? formatDiscountPercent(price!, originalPrice) : ""))
                    : "";

                  return (
                    <li
                      key={item.ingredient}
                      className={`rounded-2xl border overflow-hidden transition-all ${
                        isChecked
                          ? "opacity-60 grayscale border-zinc-100 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900/30"
                          : "border-zinc-100 dark:border-zinc-800 bg-white dark:bg-zinc-900"
                      }`}
                    >
                      <div className="flex items-center gap-3 px-4 py-3">
                        <button
                          onClick={() => toggleIngredient(item.ingredient)}
                          className={`shrink-0 w-5 h-5 rounded-full border flex items-center justify-center text-[10px] font-black transition-colors ${
                            isChecked ? "bg-mnamio-600 border-mnamio-600 text-white" : "border-zinc-300 dark:border-zinc-700 text-transparent"
                          }`}
                        >
                          ✓
                        </button>

                        {/* Obrázek produktu (s logem obchodu v rohu), nebo jednotný
                            rámeček s logem/ikonou obchodu, když fotka chybí. */}
                        <div className="shrink-0">
                          {item.product?.image ? (
                            <div className="relative w-12 h-12">
                              <div className="w-12 h-12 rounded-xl overflow-hidden bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center">
                                <Image
                                  src={item.product.image}
                                  alt={item.product.name}
                                  width={48}
                                  height={48}
                                  className="w-full h-full object-contain"
                                  unoptimized
                                />
                              </div>
                              {item.store && (
                                <div className="absolute -bottom-1.5 -right-1.5 flex h-6 w-6 items-center justify-center rounded-full bg-white dark:bg-zinc-900 shadow-md ring-2 ring-white dark:ring-zinc-900">
                                  <StoreBrand shopName={item.store.shopName} badge />
                                </div>
                              )}
                            </div>
                          ) : item.store ? (
                            <div className="w-12 h-12 rounded-xl bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center">
                              <StoreBrand shopName={item.store.shopName} compact />
                            </div>
                          ) : (
                            <div className="w-12 h-12 rounded-xl bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center">
                              <span className="material-symbols-outlined text-zinc-300 text-xl">help</span>
                            </div>
                          )}
                        </div>

                        {/* Název + hashtag/zdroj */}
                        <div className="min-w-0 flex-1">
                          <h3 className={`text-sm font-semibold leading-tight truncate ${isChecked ? "line-through text-zinc-500" : "text-zinc-800 dark:text-zinc-100"}`}>
                            {item.ingredient}
                          </h3>
                          {!isChecked && item.store && (
                            <>
                              <div className="flex items-center gap-1.5 mt-0.5 min-w-0">
                                <span className="text-[10px] text-zinc-400 truncate">{cleanProductName(item.product?.name || "")}</span>
                                {item.store.packageSize && (
                                  <span className="shrink-0 text-[10px] text-zinc-400">{item.store.packageSize}</span>
                                )}
                                {(() => {
                                  const unitLabel = getUnitPriceLabel(item.store!, item.product?.name || "");
                                  return unitLabel && (
                                    <span className="shrink-0 text-[10px] text-zinc-400">{unitLabel}</span>
                                  );
                                })()}
                                {/* Foodora je živý e-shop feed — u položek bez skutečné slevy
                                    (běžná katalogová cena) žádný odpovídající leták neexistuje. */}
                                {(item.store.source !== "foodora" || item.store.isSale) && (
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      setLeafletDialog({ url: item.store!.leafletUrl, shopName: item.store!.shopName });
                                    }}
                                    className="shrink-0 inline-flex items-center gap-0.5 text-[10px] font-bold text-mnamio-600 hover:text-mnamio-700 transition-colors whitespace-nowrap"
                                  >
                                    <span className="material-symbols-outlined text-[11px]">menu_book</span>
                                    Leták
                                  </button>
                                )}
                              </div>
                              {item.store.loyaltyCardLabel && (
                                <p className="inline-flex items-center gap-0.5 text-[9px] font-bold text-red-600 dark:text-red-400 mt-0.5 w-fit">
                                  <span className="material-symbols-outlined text-[11px]">card_membership</span>
                                  {item.store.loyaltyCardLabel}
                                </p>
                              )}
                              {item.store.note && (
                                <p className="text-[9px] text-amber-600 dark:text-amber-500 mt-0.5">{item.store.note}</p>
                              )}
                            </>
                          )}
                          {!item.store && (
                            <div className="flex items-center gap-2 mt-1 flex-wrap">
                              <button
                                onClick={() => toggleIngredient(item.ingredient)}
                                className="text-[10px] font-bold text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300 transition-colors underline underline-offset-2"
                              >
                                Mám doma / nepotřebuji
                              </button>
                              {onReplaceProduct && (
                                <button
                                  onClick={() => setReplacingIngredient(item.ingredient)}
                                  className="inline-flex items-center gap-0.5 text-[10px] font-bold text-mnamio-600 hover:text-mnamio-700 transition-colors"
                                >
                                  <span className="material-symbols-outlined text-[12px]">search</span>
                                  Najít náhradu
                                </button>
                              )}
                            </div>
                          )}
                        </div>

                        {/* Cena vpravo */}
                        <div className="shrink-0 text-right flex flex-col items-end">
                          <div className="flex items-center gap-1">
                            <div className="flex items-baseline gap-1.5">
                              {discount && (
                                <span className="bg-red-500 text-[9px] font-black text-white px-1.5 py-0.5 rounded-full leading-none">
                                  {discount}
                                </span>
                              )}
                              {item.store && !Number.isFinite(price) ? (
                                <span className="text-xs font-bold text-zinc-400 leading-none">
                                  cena neznámá
                                </span>
                              ) : (
                                <span className="text-base font-black text-zinc-900 dark:text-white leading-none">
                                  {item.store?.price || "—"}
                                </span>
                              )}
                            </div>
                            {item.store && onReplaceProduct && (
                              <button
                                onClick={() => setReplacingIngredient(item.ingredient)}
                                title="Nahradit jiným produktem"
                                className="shrink-0 flex h-6 w-6 items-center justify-center rounded-full text-zinc-400 hover:text-mnamio-600 hover:bg-mnamio-50 dark:hover:bg-mnamio-900/30 transition-colors"
                              >
                                <span className="material-symbols-outlined text-[15px]">swap_horiz</span>
                              </button>
                            )}
                          </div>
                          {hasRealOriginalPrice && (
                            <span className="text-[10px] text-zinc-400 line-through mt-0.5">
                              {item.store?.originalPrice}
                            </span>
                          )}
                          {savings > 0 && (
                            <span className="text-[9px] text-green-600 dark:text-green-400 font-bold mt-0.5">
                              ušetříš {savings.toFixed(0)} Kč
                            </span>
                          )}
                        </div>
                      </div>
                    </li>
                  );
                })}
              </ul>
            </div>

            <div className="rounded-2xl bg-mnamio-950 p-5 text-white shadow-lg border border-mnamio-800">
              <p className="text-[10px] font-black uppercase tracking-widest text-mnamio-400">Celkem za nákup</p>
              <p className="text-3xl font-black mt-1">{totalPrice.toFixed(2).replace(".", ",")} Kč</p>
              {totalSavings > 0 && (
                <p className="mt-1 text-xs font-bold text-mnamio-300">
                  ušetřeno {totalSavings.toFixed(0)} Kč oproti běžným cenám
                </p>
              )}
            </div>

            {/* Preparation Steps — recepty s novým tab layoutem mají postup v tabu "Postup" */}
            {!hasNewLayout && recipeDetails?.instructions && recipeDetails.instructions.length > 0 && (
              <div className="mt-8 pt-8 border-t border-zinc-100 dark:border-zinc-800 text-left">
                <h3 className="text-xl font-bold text-zinc-900 dark:text-white mb-6 flex items-center gap-2">
                  <span className="material-symbols-outlined text-mnamio-600">restaurant_menu</span>
                  Postup přípravy
                </h3>
                <div className="space-y-4">
                  {recipeDetails.instructions.map((step, index) => (
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
              </div>
            )}
          </div>
        )}
      </section>

      {/* Modal: vytvoření vlastního receptu */}
      {showCreateForm && (
        <CreateRecipeDialog
          existingCategories={categories.filter(c => c !== "all")}
          onClose={() => setShowCreateForm(false)}
          onSave={saveCustomRecipe}
        />
      )}

      {leafletDialog && (
        <LeafletViewer
          leafletUrl={leafletDialog.url}
          shopName={leafletDialog.shopName}
          onClose={() => setLeafletDialog(null)}
        />
      )}

      {replacingIngredient && onReplaceProduct && (
        <ReplaceProductDialog
          ingredient={replacingIngredient}
          onClose={() => setReplacingIngredient(null)}
          onSelect={(product, store) => {
            onReplaceProduct(replacingIngredient, product, store);
            setReplacingIngredient(null);
          }}
        />
      )}
    </div>
  );
}

type ReplaceProductDialogProps = {
  ingredient: string;
  onClose: () => void;
  onSelect: (product: Product, store: Store) => void;
};

function ReplaceProductDialog({ ingredient, onClose, onSelect }: ReplaceProductDialogProps) {
  useBodyScrollLock();
  const [query, setQuery] = useState(ingredient);
  const [results, setResults] = useState<Product[]>([]);
  const [searching, setSearching] = useState(false);
  const [searched, setSearched] = useState(false);

  const runSearch = async (q: string) => {
    const trimmed = q.trim();
    if (!trimmed) return;
    setSearching(true);
    setSearched(true);
    try {
      const res = await fetch(`/api/search?q=${encodeURIComponent(trimmed)}`);
      const data = await res.json();
      setResults((data.products || []).slice(0, 10));
    } catch {
      setResults([]);
    } finally {
      setSearching(false);
    }
  };

  useEffect(() => {
    runSearch(ingredient);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return createPortal(
    <div
      className="fixed inset-0 z-[200] flex items-end sm:items-center justify-center bg-black/50 backdrop-blur-sm p-0 sm:p-4"
      onClick={onClose}
    >
      <div
        className="w-full sm:max-w-lg max-h-[85dvh] overflow-hidden rounded-t-[2rem] sm:rounded-[2rem] bg-white dark:bg-zinc-900 shadow-2xl flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="p-6 md:p-8 pb-4 shrink-0">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-xl font-black text-zinc-900 dark:text-white">Najít náhradu</h3>
            <button
              onClick={onClose}
              className="flex h-9 w-9 items-center justify-center rounded-full bg-zinc-100 dark:bg-zinc-800 text-zinc-500 hover:text-zinc-900 dark:hover:text-white transition-colors"
            >
              <span className="material-symbols-outlined text-lg">close</span>
            </button>
          </div>
          <div className="flex gap-2">
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && runSearch(query)}
              placeholder="Hledejte produkt…"
              className="flex-1 h-11 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-black px-4 text-sm text-zinc-900 dark:text-white outline-none transition focus:border-mnamio-500 focus:ring-2 focus:ring-mnamio-500/20"
            />
            <button
              onClick={() => runSearch(query)}
              className="h-11 px-5 rounded-xl bg-mnamio-600 text-white text-sm font-bold hover:bg-mnamio-700 transition-colors"
            >
              Hledat
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto overscroll-contain px-6 md:px-8 pb-6 md:pb-8 pb-safe">
          {searching ? (
            <div className="py-10 flex justify-center">
              <span className="material-symbols-outlined animate-spin text-2xl text-mnamio-500">progress_activity</span>
            </div>
          ) : results.length > 0 ? (
            <ul className="space-y-2">
              {results.map((product) => {
                const cheapestStore = sortStoresByPrice(product.stores)[0];
                if (!cheapestStore) return null;
                return (
                  <li key={product.url || product.name}>
                    <button
                      onClick={() => onSelect(product, cheapestStore)}
                      className="w-full flex items-center gap-3 p-2.5 rounded-xl hover:bg-zinc-50 dark:hover:bg-zinc-800/50 transition-colors text-left"
                    >
                      <div className="shrink-0 w-11 h-11 rounded-lg overflow-hidden bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center">
                        {product.image ? (
                          <Image src={product.image} alt={product.name} width={44} height={44} className="w-full h-full object-contain" unoptimized />
                        ) : (
                          <span className="material-symbols-outlined text-zinc-300 text-xl">image</span>
                        )}
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-semibold text-zinc-800 dark:text-zinc-100 truncate">{cleanProductName(product.name)}</p>
                        <p className="text-[11px] text-zinc-400 truncate">{cheapestStore.shopName}</p>
                      </div>
                      <span className="shrink-0 text-sm font-black text-zinc-900 dark:text-white">{cheapestStore.price}</span>
                    </button>
                  </li>
                );
              })}
            </ul>
          ) : searched ? (
            <p className="py-10 text-center text-sm text-zinc-400">Nic jsme nenašli, zkuste jiný název.</p>
          ) : null}
        </div>
      </div>
    </div>,
    document.body,
  );
}

type CreateRecipeDialogProps = {
  existingCategories: string[];
  onClose: () => void;
  onSave: (recipe: CustomRecipe) => void;
};

function CreateRecipeDialog({ existingCategories, onClose, onSave }: CreateRecipeDialogProps) {
  useBodyScrollLock();
  const categoryOptions = useMemo(
    () => Array.from(new Set(["Vlastní", ...existingCategories])),
    [existingCategories],
  );
  const [name, setName] = useState("");
  const [tag, setTag] = useState<string>("Vlastní");
  const [customTag, setCustomTag] = useState("");
  const [showCustomTagInput, setShowCustomTagInput] = useState(false);
  const [description, setDescription] = useState("");
  const [ingredients, setIngredients] = useState<string[]>(["", "", ""]);
  const [instructions, setInstructions] = useState("");
  const ingredientRefs = useRef<(HTMLInputElement | null)[]>([]);
  const pendingFocusIndex = useRef<number | null>(null);

  useEffect(() => {
    if (pendingFocusIndex.current !== null) {
      ingredientRefs.current[pendingFocusIndex.current]?.focus();
      pendingFocusIndex.current = null;
    }
  }, [ingredients]);

  const addIngredientField = () => {
    pendingFocusIndex.current = ingredients.length;
    setIngredients((prev) => [...prev, ""]);
  };

  const handleSave = () => {
    const trimmedName = name.trim();
    const cleanedIngredients = ingredients.map((i) => i.trim()).filter(Boolean);
    const finalTag = (showCustomTagInput ? customTag : tag).trim() || "Vlastní";

    if (!trimmedName) {
      showToast("Zadejte název receptu.", "error");
      return;
    }
    if (cleanedIngredients.length === 0) {
      showToast("Přidejte alespoň jednu ingredienci.", "error");
      return;
    }

    onSave({
      name: trimmedName,
      tag: finalTag,
      description: description.trim() || undefined,
      ingredients: cleanedIngredients,
      instructions: instructions.trim()
        ? instructions.split("\n").map((l) => l.trim()).filter(Boolean)
        : undefined,
      createdAt: new Date().toISOString(),
    });
  };

  return createPortal(
    <div
      className="fixed inset-0 z-[200] flex items-end sm:items-center justify-center bg-black/50 backdrop-blur-sm p-0 sm:p-4"
      onClick={onClose}
    >
      <div
        className="w-full sm:max-w-lg max-h-[85dvh] overflow-hidden rounded-t-[2rem] sm:rounded-[2rem] bg-white dark:bg-zinc-900 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
      <div className="max-h-[85dvh] overflow-y-auto overscroll-contain p-6 md:p-8 pb-safe">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-xl font-black text-zinc-900 dark:text-white">Nový recept</h3>
          <button
            onClick={onClose}
            className="flex h-9 w-9 items-center justify-center rounded-full bg-zinc-100 dark:bg-zinc-800 text-zinc-500 hover:text-zinc-900 dark:hover:text-white transition-colors"
          >
            <span className="material-symbols-outlined text-lg">close</span>
          </button>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-bold text-zinc-700 dark:text-zinc-300 mb-2">Název receptu *</label>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="např. Babiččin guláš"
              className="w-full h-12 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-black px-4 text-zinc-900 dark:text-white outline-none transition focus:border-mnamio-500 focus:ring-2 focus:ring-mnamio-500/20"
            />
          </div>

          <div>
            <label className="block text-sm font-bold text-zinc-700 dark:text-zinc-300 mb-2">Kategorie</label>
            {!showCustomTagInput ? (
              <div className="flex flex-wrap gap-2">
                {categoryOptions.map((cat) => (
                  <button
                    key={cat}
                    type="button"
                    onClick={() => setTag(cat)}
                    className={`rounded-full px-4 py-2 text-xs font-bold transition-all ${
                      tag === cat
                        ? "bg-mnamio-600 text-white shadow-md"
                        : "bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-300 hover:bg-zinc-200 dark:hover:bg-zinc-700"
                    }`}
                  >
                    #{cat}
                  </button>
                ))}
                <button
                  type="button"
                  onClick={() => {
                    setShowCustomTagInput(true);
                    setCustomTag("");
                  }}
                  className="rounded-full px-4 py-2 text-xs font-bold bg-white dark:bg-zinc-900 border border-dashed border-zinc-300 dark:border-zinc-700 text-zinc-500 hover:border-mnamio-400 transition-all"
                >
                  + Vlastní
                </button>
              </div>
            ) : (
              <div className="flex gap-2">
                <input
                  autoFocus
                  value={customTag}
                  onChange={(e) => setCustomTag(e.target.value)}
                  placeholder="např. Česká klasika"
                  className="flex-1 h-11 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-black px-4 text-sm text-zinc-900 dark:text-white outline-none transition focus:border-mnamio-500 focus:ring-2 focus:ring-mnamio-500/20"
                />
                <button
                  type="button"
                  onClick={() => setShowCustomTagInput(false)}
                  className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-zinc-100 dark:bg-zinc-800 text-zinc-400 hover:text-zinc-700 transition-colors"
                >
                  <span className="material-symbols-outlined text-lg">check</span>
                </button>
              </div>
            )}
          </div>

          <div>
            <label className="block text-sm font-bold text-zinc-700 dark:text-zinc-300 mb-2">Popis</label>
            <input
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Krátký popis receptu (nepovinné)"
              className="w-full h-12 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-black px-4 text-zinc-900 dark:text-white outline-none transition focus:border-mnamio-500 focus:ring-2 focus:ring-mnamio-500/20"
            />
          </div>

          <div>
            <label className="block text-sm font-bold text-zinc-700 dark:text-zinc-300 mb-2">Ingredience *</label>
            <div className="space-y-2">
              {ingredients.map((ing, i) => (
                <div key={i} className="flex gap-2">
                  <input
                    ref={(el) => { ingredientRefs.current[i] = el; }}
                    value={ing}
                    onChange={(e) => {
                      const next = [...ingredients];
                      next[i] = e.target.value;
                      setIngredients(next);
                    }}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault();
                        addIngredientField();
                      }
                    }}
                    placeholder={`Ingredience ${i + 1}`}
                    className="flex-1 h-11 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-black px-4 text-sm text-zinc-900 dark:text-white outline-none transition focus:border-mnamio-500 focus:ring-2 focus:ring-mnamio-500/20"
                  />
                  {ingredients.length > 1 && (
                    <button
                      type="button"
                      onClick={() => setIngredients(ingredients.filter((_, j) => j !== i))}
                      className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-zinc-100 dark:bg-zinc-800 text-zinc-400 hover:text-red-500 transition-colors"
                    >
                      <span className="material-symbols-outlined text-lg">remove</span>
                    </button>
                  )}
                </div>
              ))}
            </div>
            <button
              type="button"
              onClick={addIngredientField}
              className="mt-2 inline-flex items-center gap-1 text-sm font-bold text-mnamio-600 hover:text-mnamio-700 transition-colors"
            >
              <span className="material-symbols-outlined text-lg">add</span>
              Přidat ingredienci
            </button>
          </div>

          <div>
            <label className="block text-sm font-bold text-zinc-700 dark:text-zinc-300 mb-2">Postup (každý krok na nový řádek)</label>
            <textarea
              value={instructions}
              onChange={(e) => setInstructions(e.target.value)}
              placeholder={"Orestujte cibuli.\nPřidejte maso a osmahněte.\n…"}
              rows={4}
              className="w-full rounded-xl border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-black px-4 py-3 text-sm text-zinc-900 dark:text-white outline-none transition focus:border-mnamio-500 focus:ring-2 focus:ring-mnamio-500/20 resize-none"
            />
          </div>

          <button
            onClick={handleSave}
            className="w-full h-12 rounded-full bg-mnamio-600 text-white font-black transition hover:bg-mnamio-700 shadow-lg shadow-mnamio-600/20 active:scale-95"
          >
            Uložit a najít ceny
          </button>
        </div>
      </div>
      </div>
    </div>,
    document.body,
  );
}
