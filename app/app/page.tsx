"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useCallback, useEffect, useRef, useState } from "react";
import SearchSection from "@/components/dashboard/SearchSection";
import RecipeSection from "@/components/dashboard/RecipeSection";
import WatchdogSection from "@/components/dashboard/WatchdogSection";
import ListsSection from "@/components/dashboard/ListsSection";
import SearchBar from "@/components/SearchBar";
import { type Product, type Store, parsePrice } from "@/lib/food";
import { createClient } from "@/lib/supabase/client";
import type { User } from "@supabase/supabase-js";

type AppMode = "search" | "recipes" | "watchdog" | "lists" | "favorites" | "notifications";
type ShoppingMode = "cross_store" | "single_store";
type ProductSort = "relevance" | "cheapest" | "coverage";

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

type FavoriteItem = {
  id: string;
  name: string;
  addedAt: string;
  url?: string; // present for products
  stores?: Store[]; // present for products
  image?: string; // present for recipes
  description?: string; // present for recipes
};

function HomeContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const supabase = createClient();

  // Auth state
  const [user, setUser] = useState<User | null>(null);

  // Favorites state
  const [favorites, setFavorites] = useState<FavoriteItem[]>([]);

  // Mode derived from URL
  const mode = (searchParams.get("mode") as AppMode) || "search";
  const urlQuery = searchParams.get("query") || "";
  
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
  const [isSaving, setIsSaving] = useState(false);
  const shoppingListRef = useRef<HTMLElement | null>(null);

  // Animation state
  const [isChangingMode, setIsChangingMode] = useState(false);
  const [activeView, setActiveView] = useState(mode);

  // Fetch user and favorites on mount
  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getUser().then(({ data: { user } }) => {
      setUser(user);
      if (user) {
        // In a real app we'd fetch from DB, for now let's use localStorage for speed
        const saved = JSON.parse(localStorage.getItem(`favs_${user.id}`) || "[]");
        setFavorites(saved);
      }
    });
  }, []);

  // Handle mode transitions
  useEffect(() => {
    if (mode !== activeView) {
      const isSearchOrRecipe = (m: string) => m === "search" || m === "recipes";
      const shouldAnimate = isSearchOrRecipe(mode) && isSearchOrRecipe(activeView);

      if (shouldAnimate) {
        setIsChangingMode(true);
        const timer = setTimeout(() => {
          setActiveView(mode);
          setIsChangingMode(false);
        }, 200); // Duration of transition
        return () => clearTimeout(timer);
      } else {
        setActiveView(mode);
        setIsChangingMode(false);
      }
    }
  }, [mode, activeView]);

  // AUTO-SEARCH logic
  const triggerInitialSearch = useCallback(async (query: string) => {
    setLoading(true);
    setHasSearched(true);
    try {
      const res = await fetch(`/api/search?q=${encodeURIComponent(query)}`);
      const data = await res.json();
      setProducts(data.products || []);
    } catch (err) {
      console.error("Auto-search failed:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (urlQuery && mode === "search" && !hasSearched) {
      void triggerInitialSearch(urlQuery);
    }
  }, [urlQuery, mode, hasSearched, triggerInitialSearch]);

  // Handlers
  const handleResults = (nextProducts: Product[]) => {
    setProducts(nextProducts);
    setSelectedFilter("all");
    setSelectedSort("relevance");
  };

  const handleModeChange = (newMode: AppMode) => {
    const url = newMode === "search" ? "/app" : `/app?mode=${newMode}`;
    router.push(url, { scroll: false });
  };

  const toggleFavorite = (item: any) => {
    if (!user) {
      setShareMessage("Pro ukládání oblíbených se musíte přihlásit.");
      setTimeout(() => setShareMessage(null), 3000);
      return;
    }
    
    setFavorites(prev => {
      const itemId = item.url || item.name;
      const isFav = prev.find(f => f.id === itemId);
      let next;
      if (isFav) {
        next = prev.filter(f => f.id !== itemId);
      } else {
        const newItem: FavoriteItem = {
          id: itemId,
          name: item.name,
          addedAt: new Date().toISOString(),
          url: item.url,
          stores: item.stores,
          image: item.image,
          description: item.description
        };
        next = [...prev, newItem];
      }
      localStorage.setItem(`favs_${user.id}`, JSON.stringify(next));
      return next;
    });
  };

  const toggleIngredient = (ingredient: string) => {
    setCheckedIngredients((curr) =>
      curr.includes(ingredient) ? curr.filter((i) => i !== ingredient) : [...curr, ingredient]
    );
  };

  async function runRecipeSearch(recipeName: string) {
    if (!recipeName.trim()) return;
    setRecipeLoading(true);
    setRecipeError(null);
    setActiveRecipe(recipeName);
    setRecipeResults([]);
    setCheckedIngredients([]);

    // Scroll to results immediately to show skeleton
    setTimeout(() => {
      shoppingListRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    }, 100);

    try {
      const res = await fetch("/api/recipe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ recipe: recipeName }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      const parsedIngredients = data.ingredients || [];
      setIngredients(parsedIngredients);

      const results = await Promise.all(
        parsedIngredients.map(async (ing: string) => {
          try {
            const sRes = await fetch(`/api/search?q=${encodeURIComponent(ing)}`);
            const sData = await sRes.json();
            const products = sData.products || [];
            const store = products[0]?.stores?.sort((a: any, b: any) => parsePrice(a.price) - parsePrice(b.price))[0] || null;
            return { ingredient: ing, product: products[0] || null, store, storeOptions: [] };
          } catch {
            return { ingredient: ing, product: null, store: null, storeOptions: [] };
          }
        })
      );
      setRecipeResults(results);
    } catch (err: any) {
      setRecipeError(err.message);
    } finally {
      setRecipeLoading(false);
    }
  }

  const saveShoppingList = async () => {
    if (!user) {
      setShareMessage("Pro uložení se musíte přihlásit.");
      setTimeout(() => setShareMessage(null), 3000);
      return;
    }

    if (recipeResults.length === 0) return;

    setIsSaving(true);
    
    const totalPrice = recipeResults.reduce((sum, item) => {
      if (checkedIngredients.includes(item.ingredient) || !item.store) return sum;
      return sum + parsePrice(item.store.price);
    }, 0);

    const { error } = await supabase.from("shopping_lists").insert({
      user_id: user.id,
      recipe_name: activeRecipe || "Nákupní seznam",
      items: recipeResults.map(r => ({
        ingredient: r.ingredient,
        product_name: r.product?.name,
        price: r.store?.price,
        shop_name: r.store?.shopName,
        is_checked: checkedIngredients.includes(r.ingredient)
      })),
      total_price: totalPrice
    });

    setIsSaving(false);

    if (error) {
      console.error("Save error full object:", error);
      const errorDetail = error.message || error.details || "Neznámá chyba";
      setShareMessage(`❌ Chyba: ${errorDetail} (Kód: ${error.code || '?'})`);
    } else {
      setShareMessage("✅ Seznam byl uložen do vašich seznamů!");
      setTimeout(() => {
        setShareMessage(null);
      }, 3000);
    }
  };

  const shareShoppingList = () => {
    const text = recipeResults.map(r => `${r.ingredient}: ${r.store?.price || '—'} (${r.store?.shopName || '—'})`).join('\n');
    navigator.clipboard.writeText(`Můj nákupní seznam z foodapky:\n\n${text}`);
    setShareMessage("📋 Odkaz zkopírován!");
    setTimeout(() => setShareMessage(null), 2000);
  };

  return (
    <div className="max-w-5xl mx-auto px-4 md:px-6 pt-2 md:pt-4">
      {/* Persistent Header with SearchBar - Only shown in Search and Recipes modes */}
      {(mode === "search" || mode === "recipes") && (
        <header className="px-1 md:px-2 w-full mb-6">
          <h1 className="text-2xl md:text-4xl lg:text-5xl font-extrabold tracking-tight text-foodappka-950 dark:text-white leading-tight mb-4 transition-all duration-300">
            {mode === "search" ? (
              <>
                Najděte nejlevnější akční cenu <br className="hidden md:block" />
                <span className="text-foodappka-600 dark:text-foodappka-400">dřív, než vyrazíte nakoupit</span>
              </>
            ) : (
              <>
                Vyberte si recept a najdeme <br className="hidden md:block" />
                <span className="text-foodappka-600 dark:text-foodappka-400">nejlevnější suroviny</span>
              </>
            )}
          </h1>
          
          <div className="w-full">
            <SearchBar
              onResults={handleResults}
              onLoading={setLoading}
              onSearchStart={() => setHasSearched(true)}
              mode={mode === "recipes" ? "recipes" : "search"}
              onModeChange={(newMode) => handleModeChange(newMode as AppMode)}
              initialQuery={urlQuery}
            />
          </div>
        </header>
      )}

      {/* Animated Content Area */}
      <div className={`transition-all duration-300 ${isChangingMode ? "opacity-0 translate-y-4 scale-[0.98]" : "opacity-100 translate-y-0 scale-100"}`}>
        {activeView === "search" && (
          <SearchSection
            products={products}
            loading={loading}
            hasSearched={hasSearched}
            selectedFilter={selectedFilter}
            setSelectedFilter={setSelectedFilter}
            selectedSort={selectedSort}
            setSelectedSort={setSelectedSort}
            handleResults={handleResults}
            setLoading={setLoading}
            setHasSearched={setHasSearched}
            handleModeChange={handleModeChange}
            initialQuery={urlQuery}
            hideHeader
            favorites={favorites}
            onToggleFavorite={toggleFavorite}
          />
        )}

        {activeView === "recipes" && (
          <RecipeSection
            activeRecipe={activeRecipe}
            recipeLoading={recipeLoading}
            ingredients={ingredients}
            recipeResults={recipeResults}
            checkedIngredients={checkedIngredients}
            shoppingMode={shoppingMode}
            recipeError={recipeError}
            shareMessage={shareMessage}
            shoppingListRef={shoppingListRef}
            toggleIngredient={toggleIngredient}
            runRecipeSearch={runRecipeSearch}
            saveShoppingList={saveShoppingList}
            shareShoppingList={shareShoppingList}
            setShoppingMode={setShoppingMode}
            handleModeChange={handleModeChange}
            setLoading={setLoading}
            handleResults={handleResults}
            setHasSearched={setHasSearched}
            isSaving={isSaving}
            hideHeader
            favorites={favorites}
            onToggleFavorite={toggleFavorite}
          />
        )}

        {activeView === "watchdog" && <WatchdogSection />}
        {activeView === "lists" && <ListsSection user={user} onAddClick={() => handleModeChange("recipes")} />}
        
        {activeView === "favorites" && (
          <div className="space-y-6">
            <header className="px-1 md:px-2">
              <h1 className="text-3xl md:text-5xl font-extrabold tracking-tight text-foodappka-950 dark:text-white mb-2">Oblíbené ❤️</h1>
              <p className="text-sm md:text-lg text-zinc-600 dark:text-zinc-400">Vaše uložené recepty a produkty na jednom místě.</p>
            </header>
            
            {favorites.length > 0 ? (
              <div className="grid gap-4">
                {favorites.map((fav) => (
                  <article key={fav.id} className="rounded-2xl border border-foodappka-100 dark:border-zinc-800 bg-white/95 dark:bg-foodappka-950 p-4 shadow-sm flex items-center justify-between gap-4">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-xl bg-foodappka-100 dark:bg-foodappka-900/50 flex items-center justify-center text-2xl">
                        {fav.stores ? "🧺" : "🥘"}
                      </div>
                      <div>
                        <h4 className="font-bold text-zinc-900 dark:text-white">{fav.name}</h4>
                        <p className="text-xs text-zinc-500 dark:text-zinc-400">Přidáno {new Date(fav.addedAt).toLocaleDateString()}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <button 
                        onClick={() => toggleFavorite(fav)}
                        className="flex h-10 w-10 items-center justify-center rounded-full hover:bg-red-50 dark:hover:bg-red-900/20 text-red-500 transition-colors"
                      >
                        <span className="material-symbols-outlined text-xl" style={{ fontVariationSettings: "'FILL' 1" }}>favorite</span>
                      </button>
                      <button 
                        onClick={() => {
                          if (fav.stores) {
                            handleResults([fav as any]);
                            handleModeChange("search");
                          } else {
                            runRecipeSearch(fav.name);
                            handleModeChange("recipes");
                          }
                        }}
                        className="px-4 py-2 rounded-full bg-foodappka-500 text-white text-xs font-bold hover:bg-foodappka-600 transition-all"
                      >
                        Ukázat
                      </button>
                    </div>
                  </article>
                ))}
              </div>
            ) : (
              <div className="py-20 text-center rounded-2xl border border-dashed border-zinc-200 dark:border-zinc-800">
                <span className="material-symbols-outlined text-5xl text-zinc-300 mb-4 block">favorite</span>
                <p className="text-zinc-500 font-medium">Zatím nemáte žádné oblíbené položky.</p>
              </div>
            )}
          </div>
        )}

        {activeView === "notifications" && (
          <div className="space-y-6">
            <header className="px-1 md:px-2">
              <h1 className="text-3xl md:text-5xl font-extrabold tracking-tight text-foodappka-950 dark:text-white mb-2">Oznámení 🔔</h1>
              <p className="text-sm md:text-lg text-zinc-600 dark:text-zinc-400">Aktuální informace o slevách a novinkách.</p>
            </header>
            
            <div className="py-20 text-center rounded-2xl border border-dashed border-zinc-200 dark:border-zinc-800">
              <span className="material-symbols-outlined text-5xl text-zinc-300 mb-4 block">notifications_off</span>
              <p className="text-zinc-500 font-medium">Zatím nemáte žádná nová oznámení.</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default function Home() {
  return (
    <Suspense fallback={null}>
      <HomeContent />
    </Suspense>
  );
}
