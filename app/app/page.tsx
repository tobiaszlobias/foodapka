"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useEffect, useRef, useState } from "react";
import SearchSection from "@/components/dashboard/SearchSection";
import RecipeSection from "@/components/dashboard/RecipeSection";
import WatchdogSection from "@/components/dashboard/WatchdogSection";
import ListsSection from "@/components/dashboard/ListsSection";
import { type Product, type Store, parsePrice } from "@/lib/food";
import { createClient } from "@/lib/supabase/client";

type AppMode = "search" | "recipes" | "watchdog" | "lists";
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

function HomeContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const supabase = createClient();
  
  // Auth state
  const [user, setUser] = useState<any>(null);
  
  // Mode derived from URL
  const mode = (searchParams.get("mode") as AppMode) || "search";
  
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

  // Fetch user on mount
  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      setUser(user);
    });
  }, []);

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
          const sRes = await fetch(`/api/search?q=${encodeURIComponent(ing)}`);
          const sData = await sRes.json();
          const products = sData.products || [];
          const store = products[0]?.stores?.sort((a: any, b: any) => parsePrice(a.price) - parsePrice(b.price))[0] || null;
          return { ingredient: ing, product: products[0] || null, store, storeOptions: [] };
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
      // Optional: switch to lists mode after a delay
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
    <div className="pb-10">
      {mode === "search" && (
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
        />
      )}

      {mode === "recipes" && (
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
        />
      )}

      {mode === "watchdog" && <WatchdogSection />}
      {mode === "lists" && <ListsSection user={user} onAddClick={() => handleModeChange("recipes")} />}
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
