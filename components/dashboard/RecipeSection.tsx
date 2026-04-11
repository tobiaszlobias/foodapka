"use client";

import { useMemo } from "react";
import Image from "next/image";
import SearchBar from "@/components/SearchBar";
import { RECIPE_PRESETS } from "@/lib/recipes";
import { 
  cleanProductName, 
  parsePrice, 
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
  shoppingListRef: any;
  isSaving?: boolean;
  toggleIngredient: (ing: string) => void;
  runRecipeSearch: (name: string) => void;
  saveShoppingList: () => void;
  shareShoppingList: () => void;
  setShoppingMode: (mode: ShoppingMode) => void;
  handleModeChange: (mode: any) => void;
  setLoading: (l: boolean) => void;
  handleResults: (r: any) => void;
  setHasSearched: (s: boolean) => void;
  hideHeader?: boolean;
  favorites: any[];
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

  const totalPrice = useMemo(() => {
    return recipeResults.reduce((sum, item) => {
      if (checkedIngredients.includes(item.ingredient) || !item.store) return sum;
      return sum + parsePrice(item.store.price);
    }, 0);
  }, [recipeResults, checkedIngredients]);

  return (
    <div className="space-y-8">
      {!hideHeader && (
        <header className="px-1 md:px-2">
          <h1 className="text-2xl md:text-4xl lg:text-5xl font-extrabold tracking-tight text-foodapka-950 dark:text-white leading-tight mb-4">
            Vyberte si recept a najdeme <br className="hidden md:block" />
            <span className="text-foodapka-600 dark:text-foodapka-400">nejlevnější suroviny</span>
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

      {/* Recipe Grid */}
      <section className="grid gap-4 grid-cols-1 sm:grid-cols-2">
        {RECIPE_PRESETS.map((recipe) => {
          const isFavorite = favorites.some(f => f.id === recipe.name);
          return (
            <div
              key={recipe.name}
              onClick={() => runRecipeSearch(recipe.name)}
              className="group relative rounded-2xl bg-white dark:bg-foodapka-950 border border-zinc-100 dark:border-zinc-800 overflow-hidden shadow-sm transition-all active:scale-[0.98] cursor-pointer"
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
              <div className="h-32 md:h-44 relative">
                <Image 
                  src={recipe.image} 
                  alt={recipe.name} 
                  fill 
                  className="object-cover" 
                  sizes="(max-width: 768px) 100vw, 33vw"
                />
                <div className="absolute top-2 left-2 px-2 py-0.5 rounded-full bg-foodapka-100/90 backdrop-blur-md text-[9px] font-black text-foodapka-800 uppercase tracking-widest">
                  {recipe.tag}
                </div>
              </div>
            )}
            <div className="p-4">
              <h3 className="text-base font-bold text-zinc-900 dark:text-white group-hover:text-foodapka-600">{recipe.name}</h3>
              <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400 line-clamp-2">{recipe.description}</p>
              <div className="mt-3 pt-3 border-t border-zinc-50 dark:border-zinc-800 flex items-center justify-between">
                <div className="flex -space-x-1.5">
                  {recipe.ingredients.slice(0, 3).map((ing, i) => (
                    <div key={i} className="w-6 h-6 rounded-full border-2 border-white dark:border-foodapka-900 bg-foodapka-100 dark:bg-foodapka-800 flex items-center justify-center text-[9px] font-bold text-foodapka-700 dark:text-foodapka-300">
                      {ing.charAt(0).toUpperCase()}
                    </div>
                  ))}
                </div>
                <span className="text-[11px] font-bold text-foodapka-600 dark:text-foodapka-400">Najít ceny</span>
              </div>
            </div>
          </div>
        );
      })}
    </section>

      {/* Shopping List */}
      <section ref={shoppingListRef} className="space-y-5 pt-4">
        {recipeLoading ? <SearchLoadingAnimation /> : recipeResults.length > 0 && (
          <div className="space-y-4">
            <div className="rounded-2xl border border-foodapka-100 dark:border-zinc-800 bg-white/95 dark:bg-foodapka-950 p-4 md:p-6 shadow-sm">
              <div className="flex flex-col gap-4 border-b border-foodapka-100 dark:border-zinc-800 pb-4 sm:flex-row sm:items-start sm:justify-between">
                <div>
                  <p className="text-[10px] font-black uppercase tracking-widest text-foodapka-700">Nákup pro</p>
                  <h3 className="text-xl md:text-2xl font-bold text-zinc-950 dark:text-white">{activeRecipe}</h3>
                </div>
                <div className="flex gap-2">
                  <button 
                    onClick={saveShoppingList} 
                    disabled={isSaving}
                    className="flex-1 sm:flex-none px-4 py-2 rounded-full bg-foodapka-500 text-white text-xs font-bold shadow-md hover:bg-foodapka-600 transition-all disabled:opacity-50 flex items-center justify-center gap-2"
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
                <div className="inline-flex rounded-full bg-foodapka-50 dark:bg-zinc-900 p-1">
                  <button onClick={() => setShoppingMode("cross_store")} className={`px-4 py-1.5 rounded-full text-[11px] font-bold transition-all ${shoppingMode === "cross_store" ? "bg-foodapka-600 text-white shadow-sm" : "text-foodapka-800 dark:text-foodapka-400"}`}>Všude</button>
                  <button onClick={() => setShoppingMode("single_store")} className={`px-4 py-1.5 rounded-full text-[11px] font-bold transition-all ${shoppingMode === "single_store" ? "bg-foodapka-600 text-white shadow-sm" : "text-foodapka-800 dark:text-foodapka-400"}`}>Jeden obchod</button>
                </div>
              </div>

              {shareMessage && <div className={`mt-4 p-3 rounded-xl text-xs font-bold border transition-all ${shareMessage.includes('✅') ? 'bg-green-50 border-green-100 text-green-800 dark:bg-green-900/20 dark:border-green-800 dark:text-green-400' : 'bg-foodapka-50 border-foodapka-100 text-foodapka-800 dark:bg-foodapka-900/20 dark:border-foodapka-800 dark:text-foodapka-300'}`}>{shareMessage}</div>}

              <ul className="mt-4 space-y-2">
                {recipeResults.map((item) => {
                  const isChecked = checkedIngredients.includes(item.ingredient);
                  return (
                    <li key={item.ingredient} className={`rounded-xl border px-3 py-3 transition-all ${isChecked ? "opacity-60 bg-zinc-50 dark:bg-zinc-900/30 grayscale" : "bg-white dark:bg-zinc-900/50"}`}>
                      <div className="flex gap-3">
                        <button onClick={() => toggleIngredient(item.ingredient)} className={`mt-0.5 w-5 h-5 shrink-0 rounded-full border flex items-center justify-center text-[10px] font-black ${isChecked ? "bg-foodapka-600 border-foodapka-600 text-white" : "border-zinc-300 dark:border-zinc-700 text-transparent"}`}>✓</button>
                        <div className="min-w-0 flex-1">
                          <div className="flex justify-between items-center gap-2">
                            <p className={`text-sm font-bold truncate ${isChecked ? "line-through text-zinc-500" : "text-zinc-900 dark:text-white"}`}>{item.ingredient}</p>
                            <p className="text-sm font-black text-foodapka-700 dark:text-foodapka-400">{item.store?.price || "—"}</p>
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

            <div className="rounded-2xl bg-foodapka-950 p-5 text-white shadow-lg border border-foodapka-800">
              <p className="text-[10px] font-black uppercase tracking-widest text-foodapka-400">Celkem za nákup</p>
              <p className="text-3xl font-black mt-1">{totalPrice.toFixed(2).replace(".", ",")} Kč</p>
            </div>
          </div>
        )}
      </section>
    </div>
  );
}
