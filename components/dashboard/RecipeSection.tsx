"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Image from "next/image";
import SearchBar from "@/components/SearchBar";
import { RECIPE_PRESETS } from "@/lib/recipes";
import { showToast } from "@/components/Toast";
import {
  cleanProductName,
  parsePrice,
  formatDiscountPercent,
  getSavings,
  type Product,
  type Store
} from "@/lib/food";
import { StoreBrand, RecipeSkeleton, SearchLoadingAnimation } from "./DashboardShared";

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

function loadCustomRecipes(): CustomRecipe[] {
  if (typeof window === "undefined") return [];
  try {
    return JSON.parse(localStorage.getItem(CUSTOM_RECIPES_KEY) || "[]");
  } catch {
    return [];
  }
}

type RecipeSectionProps = {
  activeRecipe: string;
  recipeDetails?: {
    name: string;
    description?: string;
    instructions?: string[];
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
}: RecipeSectionProps) {
  // Vlastní recepty + kategorie
  const [customRecipes, setCustomRecipes] = useState<CustomRecipe[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [showCreateForm, setShowCreateForm] = useState(false);

  useEffect(() => {
    setCustomRecipes(loadCustomRecipes());
  }, []);

  const categories = useMemo(() => {
    const tags = new Set<string>();
    RECIPE_PRESETS.forEach(r => tags.add(r.tag));
    customRecipes.forEach(r => tags.add(r.tag));
    return ["all", ...Array.from(tags)];
  }, [customRecipes]);

  const visiblePresets = useMemo(
    () => selectedCategory === "all" ? RECIPE_PRESETS : RECIPE_PRESETS.filter(r => r.tag === selectedCategory),
    [selectedCategory]
  );
  const visibleCustom = useMemo(
    () => selectedCategory === "all" ? customRecipes : customRecipes.filter(r => r.tag === selectedCategory),
    [customRecipes, selectedCategory]
  );

  const saveCustomRecipe = (recipe: CustomRecipe) => {
    const next = [recipe, ...customRecipes.filter(r => r.name !== recipe.name)];
    setCustomRecipes(next);
    localStorage.setItem(CUSTOM_RECIPES_KEY, JSON.stringify(next));
    setShowCreateForm(false);
    showToast("✅ Recept uložen!", "success");
    runCustomRecipeSearch?.(recipe);
  };

  const deleteCustomRecipe = (name: string) => {
    const next = customRecipes.filter(r => r.name !== name);
    setCustomRecipes(next);
    localStorage.setItem(CUSTOM_RECIPES_KEY, JSON.stringify(next));
  };

  // SINGLE STORE LOGIC: Find which shop has the most ingredients for the lowest price
  const effectiveResults = useMemo(() => {
    if (shoppingMode === "cross_store") return recipeResults;

    // 1. Find all unique shop names
    const allShops = new Set<string>();
    recipeResults.forEach(r => {
      if (r?.storeOptions) {
        r.storeOptions.forEach(opt => {
          if (opt?.store?.shopName) allShops.add(opt.store.shopName);
        });
      }
    });

    // 2. Score each shop — vyřazené (odškrtnuté) položky se do výběru obchodu nepočítají
    const shopScores = Array.from(allShops).map(shopName => {
      let totalItems = 0;
      let totalPrice = 0;
      const items = recipeResults.map(res => {
        if (!res) return null;
        const isExcluded = checkedIngredients.includes(res.ingredient);
        const option = res.storeOptions?.find(opt => opt?.store?.shopName === shopName);
        if (option) {
          if (!isExcluded) {
            totalItems++;
            totalPrice += parsePrice(option.store.price);
          }
          return { ...res, store: option.store, product: option.product };
        }
        return { ...res, store: null, product: null };
      }).filter((x): x is NonNullable<typeof x> => x !== null);

      return { shopName, totalItems, totalPrice, items };
    });

    // 3. Pick the "best" shop (most items, then lowest price)
    const bestShop = shopScores.sort((a, b) => {
      if (b.totalItems !== a.totalItems) return b.totalItems - a.totalItems;
      return a.totalPrice - b.totalPrice;
    })[0];

    console.log("🏪 Single Store Analysis:", {
      totalIngredients: recipeResults.length,
      availableShops: allShops.size,
      bestShop: bestShop?.shopName,
      coveredItems: bestShop?.totalItems,
      totalPrice: bestShop?.totalPrice
    });

    return bestShop?.items || recipeResults;
  }, [recipeResults, shoppingMode, checkedIngredients]);

  const totalPrice = useMemo(() => {
    return (effectiveResults || []).reduce((sum, item) => {
      if (!item || !item.ingredient || checkedIngredients.includes(item.ingredient) || !item.store) return sum;
      return sum + parsePrice(item.store.price);
    }, 0);
  }, [effectiveResults, checkedIngredients]);

  return (
    <div className="space-y-8">
      {!hideHeader && !activeRecipe && !recipeLoading && !hasSearched && (
        <header className="px-1 md:px-2">
          <h1 className="text-2xl md:text-4xl lg:text-5xl font-display font-extrabold tracking-tight text-foodappka-950 dark:text-white leading-tight mb-4">
            Vyberte si recept a najdeme <br className="hidden md:block" />
            <span className="text-foodappka-600 dark:text-foodappka-400">nejlevnější suroviny</span>
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
                className={`shrink-0 rounded-full px-4 py-2 text-xs font-bold transition-all ${
                  selectedCategory === cat
                    ? "bg-foodappka-600 text-white shadow-md"
                    : "bg-white dark:bg-zinc-800 text-zinc-600 dark:text-zinc-300 border border-zinc-100 dark:border-zinc-700 hover:border-foodappka-300"
                }`}
              >
                {cat === "all" ? "Vše" : `#${cat}`}
              </button>
            ))}
          </div>

          <section className="grid gap-4 grid-cols-1 sm:grid-cols-2">
          {/* Karta: vytvořit vlastní recept */}
          <button
            onClick={() => setShowCreateForm(true)}
            className="group flex flex-col items-center justify-center gap-3 rounded-2xl border-2 border-dashed border-foodappka-300 dark:border-foodappka-800 bg-foodappka-50/50 dark:bg-foodappka-950/50 p-8 min-h-[180px] transition-all hover:border-foodappka-500 hover:bg-foodappka-50 dark:hover:bg-foodappka-900/30 active:scale-[0.98] cursor-pointer"
          >
            <div className="flex h-14 w-14 items-center justify-center rounded-full bg-foodappka-100 dark:bg-foodappka-900/50 transition-transform group-hover:scale-110">
              <span className="material-symbols-outlined text-foodappka-600 text-3xl">add</span>
            </div>
            <div className="text-center">
              <p className="font-black text-foodappka-800 dark:text-foodappka-300">Vytvořit vlastní recept</p>
              <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">Sestavte si recept od začátku — bez AI</p>
            </div>
          </button>

          {/* Vlastní recepty */}
          {visibleCustom.map((recipe) => (
            <div
              key={`custom-${recipe.name}`}
              onClick={() => runCustomRecipeSearch?.(recipe)}
              className="group relative rounded-2xl bg-white dark:bg-foodappka-950 border border-zinc-100 dark:border-zinc-800 overflow-hidden shadow-sm transition-all active:scale-[0.98] cursor-pointer p-5"
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
              <div className="mb-3 inline-flex items-center gap-1 px-3 py-1 rounded-full bg-foodappka-100 dark:bg-foodappka-900/50 text-[10px] font-black text-foodappka-800 dark:text-foodappka-300 uppercase tracking-widest">
                <span className="material-symbols-outlined text-[12px]">edit_note</span>
                #{recipe.tag}
              </div>
              <h3 className="text-xl font-black text-zinc-900 dark:text-white leading-tight group-hover:text-foodappka-600 transition-colors">
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
              className="group relative rounded-2xl bg-white dark:bg-foodappka-950 border border-zinc-100 dark:border-zinc-800 overflow-hidden shadow-sm transition-all active:scale-[0.98] cursor-pointer"
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
                <div className="absolute top-3 left-3 px-3 py-1 rounded-full bg-white/90 backdrop-blur-md text-[10px] font-black text-foodappka-800 uppercase tracking-widest shadow-sm">
                  #{recipe.tag}
                </div>
              </div>
            )}
            <div className="p-5">
              <h3 className="text-xl font-black text-zinc-900 dark:text-white leading-tight group-hover:text-foodappka-600 transition-colors">
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
            <div className="rounded-2xl border border-foodappka-100 dark:border-zinc-800 bg-white/95 dark:bg-foodappka-950 p-4 md:p-6 shadow-sm">
              <div className="flex flex-col gap-4 border-b border-foodappka-100 dark:border-zinc-800 pb-4 sm:flex-row sm:items-start sm:justify-between">
                <div>
                  <p className="text-[10px] font-black uppercase tracking-widest text-foodappka-700">Nákup pro</p>
                  <div className="flex items-center gap-3 flex-wrap">
                    <h3 className="text-xl md:text-2xl font-bold text-zinc-950 dark:text-white">{activeRecipe}</h3>
                    {totalPrice > 0 && (
                      <span className="shrink-0 rounded-full bg-foodappka-100 dark:bg-foodappka-900/50 px-3 py-1 text-sm font-black text-foodappka-800 dark:text-foodappka-300">
                        {totalPrice.toFixed(2).replace(".", ",")} Kč
                      </span>
                    )}
                  </div>
                  {recipeDetails?.description && (
                    <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400 italic">
                      &quot;{recipeDetails.description}&quot;
                    </p>
                  )}
                </div>
                <div className="flex gap-2">
                  <button 
                    onClick={saveShoppingList} 
                    disabled={isSaving}
                    className="flex-1 sm:flex-none px-4 py-2 rounded-full bg-foodappka-500 text-white text-xs font-bold shadow-md hover:bg-foodappka-600 transition-all disabled:opacity-50 flex items-center justify-center gap-2"
                  >
                    {isSaving ? (
                      <>
                        <span className="material-symbols-outlined animate-spin text-sm">progress_activity</span>
                        Ukládám...
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

              <div className="mt-4 flex items-center gap-2">
                <div className="inline-flex rounded-full bg-foodappka-50 dark:bg-zinc-900 p-1">
                  <button onClick={() => setShoppingMode("cross_store")} className={`px-4 py-1.5 rounded-full text-[11px] font-bold transition-all ${shoppingMode === "cross_store" ? "bg-foodappka-600 text-white shadow-sm" : "text-foodappka-800 dark:text-foodappka-400"}`}>Všude</button>
                  <button onClick={() => setShoppingMode("single_store")} className={`px-4 py-1.5 rounded-full text-[11px] font-bold transition-all ${shoppingMode === "single_store" ? "bg-foodappka-600 text-white shadow-sm" : "text-foodappka-800 dark:text-foodappka-400"}`}>Jeden obchod</button>
                </div>
              </div>

              {shareMessage && <div className={`mt-4 p-3 rounded-xl text-xs font-bold border transition-all ${shareMessage.includes('✅') ? 'bg-green-50 border-green-100 text-green-800 dark:bg-green-900/20 dark:border-green-800 dark:text-green-400' : 'bg-foodappka-50 border-foodappka-100 text-foodappka-800 dark:bg-foodappka-900/20 dark:border-foodappka-800 dark:text-foodappka-300'}`}>{shareMessage}</div>}

              <ul className="mt-4 space-y-2">
                {effectiveResults.map((item) => {
                  const isChecked = checkedIngredients.includes(item.ingredient);
                  const price = item.store ? parsePrice(item.store.price) : null;
                  const originalPrice = item.store?.originalPrice ? parsePrice(item.store.originalPrice) : null;
                  const isSale = price !== null && originalPrice !== null && originalPrice > price;
                  const discount = isSale ? formatDiscountPercent(price!, originalPrice) : "";
                  const savings = isSale ? getSavings(price!, originalPrice) : 0;

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
                            isChecked ? "bg-foodappka-600 border-foodappka-600 text-white" : "border-zinc-300 dark:border-zinc-700 text-transparent"
                          }`}
                        >
                          ✓
                        </button>

                        {/* Obrázek produktu nebo logo obchodu */}
                        <div className="shrink-0">
                          {item.product?.image ? (
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
                          ) : item.store ? (
                            <StoreBrand shopName={item.store.shopName} small />
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
                            <div className="flex items-center gap-1.5 mt-0.5 min-w-0">
                              <span className="text-[10px] text-zinc-400 truncate">{cleanProductName(item.product?.name || "")}</span>
                              {(item.store.leafletUrl || item.product?.url) && (
                                <a
                                  href={item.store.leafletUrl || item.product?.url}
                                  target="_blank"
                                  rel="noreferrer"
                                  onClick={(e) => e.stopPropagation()}
                                  className="shrink-0 inline-flex items-center gap-0.5 text-[10px] font-bold text-foodappka-600 hover:text-foodappka-700 transition-colors whitespace-nowrap"
                                >
                                  <span className="material-symbols-outlined text-[11px]">
                                    {item.store.leafletUrl ? "menu_book" : "open_in_new"}
                                  </span>
                                  {item.store.leafletUrl ? "Leták" : "Zdroj"}
                                </a>
                              )}
                            </div>
                          )}
                          {!item.store && (
                            <p className="text-[10px] text-zinc-400 mt-0.5">Nenalezeno</p>
                          )}
                        </div>

                        {/* Cena vpravo */}
                        <div className="shrink-0 text-right flex flex-col items-end">
                          <div className="flex items-baseline gap-1.5">
                            {isSale && discount && (
                              <span className="bg-red-500 text-[9px] font-black text-white px-1.5 py-0.5 rounded-full leading-none">
                                {discount}
                              </span>
                            )}
                            <span className="text-base font-black text-zinc-900 dark:text-white leading-none">
                              {item.store?.price || "—"}
                            </span>
                          </div>
                          {isSale && (
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

            <div className="rounded-2xl bg-foodappka-950 p-5 text-white shadow-lg border border-foodappka-800">
              <p className="text-[10px] font-black uppercase tracking-widest text-foodappka-400">Celkem za nákup</p>
              <p className="text-3xl font-black mt-1">{totalPrice.toFixed(2).replace(".", ",")} Kč</p>
            </div>

            {/* Preparation Steps */}
            {recipeDetails?.instructions && recipeDetails.instructions.length > 0 && (
              <div className="mt-8 pt-8 border-t border-zinc-100 dark:border-zinc-800 text-left">
                <h3 className="text-xl font-bold text-zinc-900 dark:text-white mb-6 flex items-center gap-2">
                  <span className="material-symbols-outlined text-foodappka-600">restaurant_menu</span>
                  Postup přípravy
                </h3>
                <div className="space-y-4">
                  {recipeDetails.instructions.map((step, index) => (
                    <div key={index} className="flex gap-4">
                      <div className="flex-shrink-0 w-8 h-8 rounded-full bg-foodappka-100 dark:bg-foodappka-900/40 text-foodappka-700 dark:text-foodappka-300 flex items-center justify-center font-black text-sm border border-foodappka-200 dark:border-foodappka-800">
                        {index + 1}
                      </div>
                      <p className="text-zinc-700 dark:text-zinc-300 leading-relaxed pt-1">
                        {step}
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
    </div>
  );
}

type CreateRecipeDialogProps = {
  existingCategories: string[];
  onClose: () => void;
  onSave: (recipe: CustomRecipe) => void;
};

function CreateRecipeDialog({ existingCategories, onClose, onSave }: CreateRecipeDialogProps) {
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

  return (
    <div
      className="fixed inset-0 z-[200] flex items-end sm:items-center justify-center bg-black/50 backdrop-blur-sm p-0 sm:p-4"
      onClick={onClose}
    >
      <div
        className="w-full sm:max-w-lg max-h-[85dvh] overflow-y-auto overscroll-contain rounded-t-[2rem] sm:rounded-[2rem] bg-white dark:bg-zinc-900 p-6 md:p-8 pb-safe shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
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
              className="w-full h-12 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-black px-4 text-zinc-900 dark:text-white outline-none transition focus:border-foodappka-500 focus:ring-2 focus:ring-foodappka-500/20"
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
                        ? "bg-foodappka-600 text-white shadow-md"
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
                  className="rounded-full px-4 py-2 text-xs font-bold bg-white dark:bg-zinc-900 border border-dashed border-zinc-300 dark:border-zinc-700 text-zinc-500 hover:border-foodappka-400 transition-all"
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
                  className="flex-1 h-11 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-black px-4 text-sm text-zinc-900 dark:text-white outline-none transition focus:border-foodappka-500 focus:ring-2 focus:ring-foodappka-500/20"
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
              className="w-full h-12 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-black px-4 text-zinc-900 dark:text-white outline-none transition focus:border-foodappka-500 focus:ring-2 focus:ring-foodappka-500/20"
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
                    className="flex-1 h-11 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-black px-4 text-sm text-zinc-900 dark:text-white outline-none transition focus:border-foodappka-500 focus:ring-2 focus:ring-foodappka-500/20"
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
              className="mt-2 inline-flex items-center gap-1 text-sm font-bold text-foodappka-600 hover:text-foodappka-700 transition-colors"
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
              className="w-full rounded-xl border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-black px-4 py-3 text-sm text-zinc-900 dark:text-white outline-none transition focus:border-foodappka-500 focus:ring-2 focus:ring-foodappka-500/20 resize-none"
            />
          </div>

          <button
            onClick={handleSave}
            className="w-full h-12 rounded-full bg-foodappka-600 text-white font-black transition hover:bg-foodappka-700 shadow-lg shadow-foodappka-600/20 active:scale-95"
          >
            Uložit a najít ceny
          </button>
        </div>
      </div>
    </div>
  );
}
