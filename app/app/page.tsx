"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useEffect, useRef, useState } from "react";
import SearchSection from "@/components/dashboard/SearchSection";
import RecipeSection from "@/components/dashboard/RecipeSection";
import WatchdogSection from "@/components/dashboard/WatchdogSection";
import ListsSection from "@/components/dashboard/ListsSection";
import { type Product, type Store } from "@/lib/food";

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
  const shoppingListRef = useRef<HTMLElement | null>(null);

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
          // Simple pick cheapest for now, similar to original
          const store = products[0]?.stores?.sort((a: any, b: any) => parseFloat(a.price) - parseFloat(b.price))[0] || null;
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

  const saveShoppingList = () => {
    setShareMessage("Seznam uložen!");
    setTimeout(() => setShareMessage(null), 2000);
  };

  const shareShoppingList = () => {
    setShareMessage("Odkaz zkopírován!");
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
        />
      )}

      {mode === "watchdog" && <WatchdogSection />}
      {mode === "lists" && <ListsSection />}
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
