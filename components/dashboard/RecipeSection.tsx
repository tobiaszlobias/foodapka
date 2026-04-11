"use client";

import { useMemo } from "react";
import Image from "next/image";
import SearchBar from "@/components/SearchBar";
import { RECIPE_PRESETS } from "@/lib/recipes";
import { 
  cleanProductName, 
  parsePrice, 
  formatDiscountPercent,
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

type RecipeSectionProps = {
  activeRecipe: string;
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
  saveShoppingList: () => void;
  shareShoppingList: () => void;
  setShoppingMode: (mode: ShoppingMode) => void;
  handleModeChange: (mode: any) => void;
  setLoading: (l: boolean) => void;
  handleResults: (products: Product[]) => void;
  setHasSearched: (s: boolean) => void;
  hideHeader?: boolean;
  favorites: { id: string }[];
  onToggleFavorite: (item: any) => void;
};

export default function RecipeSection({
  activeRecipe,
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
  saveShoppingList,
  shareShoppingList,
  setShoppingMode,
  handleModeChange,
  setLoading,
  handleResults,
  setHasSearched,
  hideHeader,
  favorites,
  onToggleFavorite,
}: RecipeSectionProps) {

  // SINGLE STORE LOGIC: Find which shop has the most ingredients for the lowest price
  const effectiveResults = useMemo(() => {
    if (shoppingMode === "cross_store") return recipeResults;

    // 1. Find all unique shop names
    const allShops = new Set<string>();
    recipeResults.forEach(r => r.storeOptions.forEach(opt => allShops.add(opt.store.shopName)));

    // 2. Score each shop
    const shopScores = Array.from(allShops).map(shopName => {
      let totalItems = 0;
      let totalPrice = 0;
      const items = recipeResults.map(res => {
        const option = res.storeOptions.find(opt => opt.store.shopName === shopName);
        if (option) {
          totalItems++;
          totalPrice += parsePrice(option.store.price);
          return { ...res, store: option.store, product: option.product };
        }
        return { ...res, store: null, product: null };
      });

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
  }, [recipeResults, shoppingMode]);

  const totalPrice = useMemo(() => {
    return effectiveResults.reduce((sum, item) => {
      if (checkedIngredients.includes(item.ingredient) || !item.store) return sum;
      return sum + parsePrice(item.store.price);
    }, 0);
  }, [effectiveResults, checkedIngredients]);

  return (
    <div className="space-y-8">
      {!hideHeader && !activeRecipe && !recipeLoading && (
        <header className="px-1 md:px-2">
          <h1 className="text-2xl md:text-4xl lg:text-5xl font-extrabold tracking-tight text-foodappka-950 dark:text-white leading-tight mb-4">
            Vyberte si recept a najdeme <br className="hidden md:block" />
            <span className="text-foodappka-600 dark:text-foodappka-400">nejlevnější suroviny</span>
          </h1>
          
          <SearchBar
            onResults={handleResults}
            onLoading={setLoading}
            onSearchStart={() => setHasSearched(true)}
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
            className="flex items-center gap-2 text-zinc-500 hover:text-foodappka-600 transition-colors font-bold text-sm mb-6"
          >
            <span className="material-symbols-outlined text-lg">arrow_back</span>
            Zpět na výběr receptů
          </button>
        </div>
      )}

      {/* Recipe Grid - Only shown when NOT searching */}
      {!activeRecipe && !recipeLoading && (
        <section className="grid gap-4 grid-cols-1 sm:grid-cols-2">
        {RECIPE_PRESETS.map((recipe) => {
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
                  {recipe.tag}
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
                  <div className="flex items-center gap-3">
                    <h3 className="text-xl md:text-2xl font-bold text-zinc-950 dark:text-white">{activeRecipe}</h3>
                    {recipeLoading && (
                      <span className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-foodappka-50 dark:bg-foodappka-900/30 text-[10px] font-black text-foodappka-600 animate-pulse border border-foodappka-100 dark:border-foodappka-800">
                        <span className="w-1 h-1 rounded-full bg-foodappka-500 animate-bounce"></span>
                        ČMUCHÁM...
                      </span>
                    )}
                  </div>
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
                  return (
                    <li key={item.ingredient} className={`rounded-xl border px-3 py-3 transition-all ${isChecked ? "opacity-60 bg-zinc-50 dark:bg-zinc-900/30 grayscale" : "bg-white dark:bg-zinc-900/50"}`}>
                      <div className="flex gap-3">
                        <button onClick={() => toggleIngredient(item.ingredient)} className={`mt-0.5 w-5 h-5 shrink-0 rounded-full border flex items-center justify-center text-[10px] font-black ${isChecked ? "bg-foodappka-600 border-foodappka-600 text-white" : "border-zinc-300 dark:border-zinc-700 text-transparent"}`}>✓</button>
                        <div className="min-w-0 flex-1">
                          <div className="flex justify-between items-start gap-2">
                            <p className={`text-sm font-bold truncate ${isChecked ? "line-through text-zinc-500" : "text-zinc-900 dark:text-white"}`}>{item.ingredient}</p>
                            <div className="text-right shrink-0">
                              {item.store?.originalPrice && parsePrice(item.store.originalPrice) > parsePrice(item.store.price) && !isChecked && (
                                <span className="text-[10px] text-zinc-400 line-through font-bold block leading-none mb-0.5">
                                  {item.store.originalPrice}
                                </span>
                              )}
                              <p className="text-sm font-black text-foodappka-700 dark:text-foodappka-400 leading-none">{item.store?.price || "—"}</p>
                              {item.store && !isChecked && formatDiscountPercent(parsePrice(item.store.price), item.store.originalPrice ? parsePrice(item.store.originalPrice) : null) && (
                                <span className="text-[9px] text-red-500 font-bold mt-1 bg-red-50 px-1 rounded block">
                                  {formatDiscountPercent(parsePrice(item.store.price), item.store.originalPrice ? parsePrice(item.store.originalPrice) : null)}
                                </span>
                              )}
                            </div>
                          </div>
                          {!isChecked && item.store && (
                            <div className="flex items-center gap-2 mt-1 opacity-80">
                              <StoreBrand shopName={item.store.shopName} small />
                              <span className="text-[10px] text-zinc-500 dark:text-zinc-400 truncate">{cleanProductName(item.product?.name || "")}</span>
                            </div>
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
          </div>
        )}
      </section>
    </div>
  );
}
