"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useCallback, useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import SearchSection from "@/components/dashboard/SearchSection";
import RecipeSection from "@/components/dashboard/RecipeSection";
import WatchdogSection from "@/components/dashboard/WatchdogSection";
import ListsSection from "@/components/dashboard/ListsSection";
import LoginWall from "@/components/LoginWall";
import SearchBar from "@/components/SearchBar";
import { type Product, type Store, parsePrice, cleanProductName } from "@/lib/food";
import { createClient } from "@/lib/supabase/client";
import { showToast } from "@/components/Toast";
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

const VIEW_ORDER: AppMode[] = ["search", "recipes", "watchdog", "favorites", "notifications", "lists"];

function HomeContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const supabase = createClient();

  // 1. STATE DECLARATIONS
  const [user, setUser] = useState<User | null>(null);
  const [authLoaded, setAuthLoaded] = useState(false);
  const [favorites, setFavorites] = useState<FavoriteItem[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);
  const [selectedFilter, setSelectedFilter] = useState<string[]>(["all"]);
  const [selectedSort, setSelectedSort] = useState<ProductSort>("relevance");
  const [activeRecipe, setActiveRecipe] = useState("");
  const [recipeDetails, setRecipeDetails] = useState<any>(null);
  const [recipeLoading, setRecipeLoading] = useState(false);
  const [ingredients, setIngredients] = useState<string[]>([]);
  const [recipeResults, setRecipeResults] = useState<IngredientResult[]>([]);
  const [checkedIngredients, setCheckedIngredients] = useState<string[]>([]);
  const [shoppingMode, setShoppingMode] = useState<ShoppingMode>("cross_store");
  const [recipeError, setRecipeError] = useState<string | null>(null);
  const [shareMessage, setShareMessage] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const shoppingListRef = useRef<HTMLElement | null>(null);
  const [isChangingMode, setIsChangingMode] = useState(false);

  // Derived
  const mode = (searchParams.get("mode") as AppMode) || "search";
  const urlQuery = searchParams.get("query") || "";
  const [activeView, setActiveView] = useState<AppMode>(mode);

  // 2. HELPER FUNCTIONS (Declared before effects to avoid initialization errors)
  
  const handleResults = useCallback((nextProducts: Product[]) => {
    setProducts(nextProducts);
    setSelectedFilter(["all"]);
    setSelectedSort("relevance");
  }, []);

  const handleModeChange = useCallback((newMode: AppMode) => {
    const url = newMode === "search" ? "/app" : `/app?mode=${newMode}`;
    router.push(url, { scroll: false });
  }, [router]);

  // Handle navigation reset (clicking active tab)
  useEffect(() => {
    const handleReset = (e: any) => {
      const targetMode = e.detail?.mode;
      if (targetMode === "recipes") {
        setActiveRecipe("");
        setHasSearched(false);
        setRecipeResults([]);
      } else if (targetMode === "search") {
        setHasSearched(false);
        setProducts([]);
      }
    };
    window.addEventListener("nav-reset", handleReset as EventListener);
    return () => window.removeEventListener("nav-reset", handleReset as EventListener);
  }, []);

  const triggerInitialSearch = useCallback(async (query: string) => {
    setLoading(true);
    setHasSearched(true);
    try {
      const res = await fetch(`/api/search?q=${encodeURIComponent(query)}`);
      const data = await res.json();
      handleResults(data.products || []);
    } catch (err) {
      console.error("Auto-search failed:", err);
    } finally {
      setLoading(false);
    }
  }, [handleResults]);

  const generateAIRecipe = useCallback(async (prompt: string) => {
    if (!prompt.trim()) return;
    setHasSearched(true);
    setRecipeLoading(true);
    setRecipeError(null);
    setActiveRecipe("Generuji AI Recept...");
    setRecipeResults([]);
    setCheckedIngredients([]);

    setTimeout(() => {
      shoppingListRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    }, 100);

    try {
      // 1. Generate recipe via AI
      const aiRes = await fetch("/api/generate-recipe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt }),
      });
      const aiData = await aiRes.json();
      if (!aiRes.ok) throw new Error(aiData.error || "Nepodařilo se vygenerovat recept.");

      const recipeName = aiData.name;
      setActiveRecipe(recipeName);
      setRecipeDetails(aiData);

      const parsedIngredients = aiData.ingredients || [];
      const ingredientNames = parsedIngredients.map((ing: any) => typeof ing === 'string' ? ing : ing.name);
      setIngredients(ingredientNames);

      // 2. Search for the generated ingredients
      const results: IngredientResult[] = ingredientNames.map((name: string) => ({
        ingredient: name, product: null, store: null, storeOptions: []
      }));
      setRecipeResults([...results]);

      await Promise.all(
        parsedIngredients.map(async (ing: any, index: number) => {
          try {
            const ingName = typeof ing === 'string' ? ing : ing.name;
            const searchQuery = typeof ing === 'string' ? ing : (ing.searchQuery || ing.name);
            const bannedTerms = typeof ing === 'string' ? [] : (ing.banned || []);
            
            const searchParams = new URLSearchParams();
            searchParams.append("q", searchQuery);
            searchParams.append("recipe", recipeName);
            bannedTerms.forEach((term: string) => searchParams.append("banned", term));

            const sRes = await fetch(`/api/search?${searchParams.toString()}`);
            const sData = await sRes.json();
            const products: Product[] = sData.products || [];
            
            const storeOptions: IngredientStoreOption[] = products.flatMap(p => 
              p.stores.map(s => ({ product: p, store: s }))
            );

            const bestStore = storeOptions.length > 0 
              ? [...storeOptions].sort((a, b) => parsePrice(a.store.price) - parsePrice(b.store.price))[0].store
              : null;
            
            const bestProduct = storeOptions.length > 0
              ? [...storeOptions].sort((a, b) => parsePrice(a.store.price) - parsePrice(b.store.price))[0].product
              : null;

            const result: IngredientResult = { 
              ingredient: ingName, 
              product: bestProduct, 
              store: bestStore, 
              storeOptions 
            };
            
            setRecipeResults(prev => {
              // Ensure we have a correctly sized array to update
              const next = prev.length >= ingredientNames.length 
                ? [...prev] 
                : ingredientNames.map((name: string) => ({
                    ingredient: name, product: null, store: null, storeOptions: []
                  }));
              next[index] = result;
              return next;
            });
          } catch (err) {
            console.error(`Failed to search for ingredient: ${typeof ing === 'string' ? ing : ing.name}`, err);
          }
        })
      );
    } catch (err: any) {
      setRecipeError(err.message);
      setActiveRecipe(""); // Reset on error
    } finally {
      setRecipeLoading(false);
    }
  }, []);

  const runRecipeSearch = useCallback(async (recipeName: string) => {
    if (!recipeName.trim()) return;
    setHasSearched(true);
    setRecipeLoading(true);
    setRecipeError(null);
    setActiveRecipe(recipeName);
    setRecipeResults([]);
    setCheckedIngredients([]);

    // Scroll to results immediately to show skeleton/loading
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

      setRecipeDetails(data);
      const parsedIngredients = data.ingredients || [];
      const ingredientNames = parsedIngredients.map((ing: any) => typeof ing === 'string' ? ing : ing.name);
      setIngredients(ingredientNames);

      // PARALLEL INCREMENTAL SEARCH: Start all at once, update UI as each finishes
      // Initialize with placeholders
      const results: IngredientResult[] = ingredientNames.map((name: string) => ({
        ingredient: name, product: null, store: null, storeOptions: []
      }));
      setRecipeResults([...results]);

      await Promise.all(
        parsedIngredients.map(async (ing: any, index: number) => {
          try {
            const ingName = typeof ing === 'string' ? ing : ing.name;
            const searchQuery = typeof ing === 'string' ? ing : (ing.searchQuery || ing.name);
            const bannedTerms = typeof ing === 'string' ? [] : (ing.banned || []);

            // Pass the recipe name to the search API for better context filtering
            const searchParams = new URLSearchParams();
            searchParams.append("q", searchQuery);
            searchParams.append("recipe", recipeName);
            bannedTerms.forEach((term: string) => searchParams.append("banned", term));

            const sRes = await fetch(`/api/search?${searchParams.toString()}`);
            const sData = await sRes.json();
            const products: Product[] = sData.products || [];
            
            const storeOptions: IngredientStoreOption[] = products.flatMap(p => 
              p.stores.map(s => ({ product: p, store: s }))
            );

            const bestStore = storeOptions.length > 0 
              ? [...storeOptions].sort((a, b) => parsePrice(a.store.price) - parsePrice(b.store.price))[0].store
              : null;
            
            const bestProduct = storeOptions.length > 0
              ? [...storeOptions].sort((a, b) => parsePrice(a.store.price) - parsePrice(b.store.price))[0].product
              : null;

            const result: IngredientResult = { 
              ingredient: ingName, 
              product: bestProduct, 
              store: bestStore, 
              storeOptions 
            };
            
            // Update the specific index in the results array
            setRecipeResults(prev => {
              // Ensure we have a correctly sized array to update
              const next = prev.length >= ingredientNames.length 
                ? [...prev] 
                : ingredientNames.map((name: string) => ({
                    ingredient: name, product: null, store: null, storeOptions: []
                  }));
              next[index] = result;
              return next;
            });
          } catch (err) {
            console.error(`Failed to search for ingredient: ${typeof ing === 'string' ? ing : ing.name}`, err);
          }
        })
      );
    } catch (err: any) {
      setRecipeError(err.message);
    } finally {
      setRecipeLoading(false);
    }
  }, []);

  const toggleFavorite = useCallback(async (item: any) => {
    if (!user) {
      showToast("Pro ukládání oblíbených se musíte přihlásit.", "info");
      return;
    }

    const itemId = item.url || item.name;
    const isFav = favorites.find(f => f.id === itemId);

    if (isFav) {
      setFavorites(prev => prev.filter(f => f.id !== itemId));
      await supabase.from("favorites").delete().eq("user_id", user.id).eq("item_id", itemId);
    } else {
      const newItem: FavoriteItem = {
        id: itemId,
        name: item.name,
        addedAt: new Date().toISOString(),
        url: item.url,
        stores: item.stores,
        image: item.image,
        description: item.description,
      };
      setFavorites(prev => [...prev, newItem]);
      await supabase.from("favorites").upsert({
        user_id: user.id,
        item_id: itemId,
        name: item.name,
        url: item.url ?? null,
        stores: item.stores ?? null,
        image: item.image ?? null,
        description: item.description ?? null,
      });
    }
  }, [user, favorites, supabase]);

  const toggleIngredient = useCallback((ingredient: string) => {
    setCheckedIngredients((curr) =>
      curr.includes(ingredient) ? curr.filter((i) => i !== ingredient) : [...curr, ingredient]
    );
  }, []);

  const saveShoppingList = async () => {
    if (!user) {
      showToast("Pro uložení se musíte přihlásit.", "info");
      return;
    }

    if (recipeResults.length === 0) return;

    setIsSaving(true);
    
    const totalPrice = recipeResults.reduce((sum, item) => {
      if (!item || checkedIngredients.includes(item.ingredient) || !item.store) return sum;
      return sum + parsePrice(item.store.price);
    }, 0);

    const { error } = await supabase.from("shopping_lists").insert({
      user_id: user.id,
      name: activeRecipe || "Nákupní seznam",
      items: recipeResults.map(r => ({
        ingredient: r.ingredient,
        product_name: r.product?.name,
        price: r.store?.price,
        shop_name: r.store?.shopName,
        is_checked: checkedIngredients.includes(r.ingredient)
      })),
    });

    if (!error) {
      showToast("✅ Seznam uložen!", "success");
    } else {
      showToast("❌ Nepodařilo se uložit.", "error");
    }
    setIsSaving(false);
  };

  const shareShoppingList = () => {
    const text = recipeResults.map(r => `${r.ingredient}: ${r.store?.price || '—'} (${r.store?.shopName || '—'})`).join('\n');
    navigator.clipboard.writeText(`Můj nákupní seznam z foodappky:\n\n${text}`);
    showToast("Odkaz zkopírován!", "success");
  };

  // 3. EFFECTS (Placed after functions to ensure they are initialized)
  
  useEffect(() => {
    supabase.auth.getUser().then(async ({ data: { user } }) => {
      setUser(user);
      setAuthLoaded(true);
      if (user) {
        const { data } = await supabase
          .from("favorites")
          .select("*")
          .eq("user_id", user.id)
          .order("added_at", { ascending: false });
        if (data) {
          setFavorites(data.map(row => ({
            id: row.item_id,
            name: row.name,
            addedAt: row.added_at,
            url: row.url,
            stores: row.stores,
            image: row.image,
            description: row.description,
          })));
        }
      }
    });
  }, [supabase]);

  useEffect(() => {
    if (mode !== activeView) {
      setActiveView(mode);
      setIsChangingMode(false);
      window.scrollTo({ top: 0, behavior: "instant" });
    }
  }, [mode, activeView]);

  useEffect(() => {
    if (urlQuery && !hasSearched) {
      if (mode === "search") {
        void triggerInitialSearch(urlQuery);
      } else if (mode === "recipes") {
        void runRecipeSearch(urlQuery);
      }
    }
  }, [urlQuery, mode, hasSearched, triggerInitialSearch, runRecipeSearch]);

  return (
    <div className="max-w-5xl mx-auto px-4 md:px-6 pt-2 md:pt-4">
      {/* Persistent Header with SearchBar - Only shown in Search and Recipes modes */}
      {(activeView === "search" || activeView === "recipes") && (
        <header className="px-1 md:px-2 w-full mb-6">
          <AnimatePresence mode="wait">
            {!hasSearched && (
              <motion.h1 
                key="header-text"
                initial={{ opacity: 0, height: 0, y: -20 }}
                animate={{ opacity: 1, height: "auto", y: 0 }}
                exit={{ opacity: 0, height: 0, y: -20 }}
                transition={{ duration: 0.3, ease: "easeInOut" }}
                className="text-xl md:text-3xl lg:text-4xl font-display font-extrabold tracking-tight text-foodappka-950 dark:text-white leading-tight mb-4 text-left overflow-hidden"
              >
                {activeView === "search" ? (
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
              </motion.h1>
            )}
          </AnimatePresence>
          
          <div className={`w-full transition-all duration-300 ${hasSearched ? "pt-2" : ""}`}>
            <SearchBar
              onResults={handleResults}
              onLoading={setLoading}
              onSearchStart={() => setHasSearched(true)}
              onFocus={() => setHasSearched(true)}
              onBlur={() => {
                // Return header if input is empty and no results are shown
                const input = document.getElementById("product-search") as HTMLInputElement;
                if ((!input || !input.value) && products.length === 0 && !activeRecipe && !recipeLoading) {
                  setHasSearched(false);
                }
              }}
              onAIGenerate={generateAIRecipe}
              mode={activeView === "recipes" ? "recipes" : "search"}
              onModeChange={(newMode) => handleModeChange(newMode as AppMode)}
              initialQuery={urlQuery}
            />
          </div>
        </header>
      )}

      {/* Animated Content Area with Swipe Support (Enabled for touch only to avoid mouse interference on PC) */}
      <motion.div 
        drag="x"
        dragConstraints={{ left: 0, right: 0 }}
        dragElastic={0.05}
        dragListener={typeof window !== "undefined" && "ontouchstart" in window}
        onDragEnd={(e, info) => {
          const threshold = 100;
          const currentIndex = VIEW_ORDER.indexOf(activeView);
          
          if (info.offset.x > threshold && currentIndex > 0) {
            // Swipe Right -> Previous
            handleModeChange(VIEW_ORDER[currentIndex - 1]);
          } else if (info.offset.x < -threshold && currentIndex < VIEW_ORDER.length - 1) {
            // Swipe Left -> Next
            handleModeChange(VIEW_ORDER[currentIndex + 1]);
          }
        }}
        className={`transition-all duration-300 ${isChangingMode ? "opacity-0 translate-y-4 scale-[0.98]" : "opacity-100 translate-y-0 scale-100"}`}
      >
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
            recipeDetails={recipeDetails}
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
            generateAIRecipe={generateAIRecipe}
            saveShoppingList={saveShoppingList}
            shareShoppingList={shareShoppingList}
            setShoppingMode={setShoppingMode}
            handleModeChange={handleModeChange}
            setLoading={setLoading}
            handleResults={handleResults}
            hasSearched={hasSearched}
            setHasSearched={setHasSearched}
            isSaving={isSaving}
            hideHeader
            favorites={favorites}
            onToggleFavorite={toggleFavorite}
          />
        )}

        {activeView === "watchdog" && (
          user ? (
            <WatchdogSection />
          ) : authLoaded ? (
            <LoginWall
              icon="visibility"
              title="Hlídač cen je jen pro přihlášené"
              description="Přihlaste se, abychom mohli hlídat ceny vašich oblíbených produktů a upozornit vás na slevy."
            />
          ) : null
        )}

        {activeView === "lists" && (
          user ? (
            <ListsSection user={user} onAddClick={() => handleModeChange("recipes")} />
          ) : authLoaded ? (
            <LoginWall
              icon="list_alt"
              title="Nákupní seznamy jsou jen pro přihlášené"
              description="Přihlaste se, abyste si mohli ukládat nákupní seznamy a mít je dostupné na všech zařízeních."
            />
          ) : null
        )}

        {activeView === "favorites" && (
          !user ? (
            authLoaded ? (
            <LoginWall
              icon="favorite"
              title="Oblíbené jsou jen pro přihlášené"
              description="Přihlaste se, abyste si mohli ukládat oblíbené recepty a produkty na jedno místo."
            />
            ) : null
          ) : (
          <div className="space-y-6">
            <header className="px-1 md:px-2 text-left">
              <h1 className="text-2xl md:text-4xl font-extrabold tracking-tight text-foodappka-950 dark:text-white mb-2">Oblíbené</h1>
              <p className="text-sm md:text-lg text-zinc-600 dark:text-zinc-400">Vaše uložené recepty a produkty na jednom místě.</p>
            </header>
            
            {favorites.length > 0 ? (
              <div className="grid gap-4">
                {favorites.map((fav) => (
                  <article key={fav.id} className="rounded-2xl border border-foodappka-100 dark:border-zinc-800 bg-white/95 dark:bg-foodappka-950 p-4 shadow-sm flex items-center justify-between gap-4">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-xl bg-foodappka-100 dark:bg-foodappka-900/50 flex items-center justify-center">
                        <span className="material-symbols-outlined text-foodappka-600">
                          {fav.stores ? "shopping_basket" : "restaurant"}
                        </span>
                      </div>
                      <div className="text-left">
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
          )
        )}

        {activeView === "notifications" && (
          !user ? (
            authLoaded ? (
            <LoginWall
              icon="notifications"
              title="Oznámení jsou jen pro přihlášené"
              description="Přihlaste se, abyste dostávali upozornění na akce a cenové změny u vašich produktů."
            />
            ) : null
          ) : (
          <div className="space-y-6 text-left">
            <header className="px-1 md:px-2">
              <h1 className="text-xl md:text-3xl lg:text-4xl font-display font-extrabold tracking-tight text-foodappka-950 dark:text-white mb-2">Oznámení</h1>
              <p className="text-sm md:text-lg text-zinc-600 dark:text-zinc-400">Aktuální informace o slevách a novinkách.</p>
            </header>

            <div className="py-20 text-center rounded-2xl border border-dashed border-zinc-200 dark:border-zinc-800">
              <span className="material-symbols-outlined text-5xl text-zinc-300 mb-4 block">notifications_off</span>
              <p className="text-zinc-500 font-medium">Zatím nemáte žádná nová oznámení.</p>
            </div>
          </div>
          )
        )}
      </motion.div>
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
