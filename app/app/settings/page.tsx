"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import AppHeader from "@/components/AppHeader";
import Sidebar from "@/components/Sidebar";

type DietType = "none" | "vegetarian" | "vegan" | "pescatarian";

type UserPreferences = {
  favorite_stores: string[];
  diet_type: DietType;
  allergens: string[];
  favorite_categories: string[];
};

const AVAILABLE_STORES = [
  "Lidl",
  "Kaufland",
  "Albert",
  "Tesco",
  "Penny",
  "Billa",
  "Globus",
  "JIP",
  "Hruška",
];

const ALLERGENS = [
  "Gluten",
  "Laktóza",
  "Vejce",
  "Ořechy",
  "Sója",
  "Ryby",
  "Slávky",
  "Celery",
  "Hořčice",
  "Sezam",
];

const FOOD_CATEGORIES = [
  "Krabičkové",
  "Něco na zub",
  "Fit snídaně",
  "Snack",
  "Lehká večeře",
  "Sladké",
  "Klasika",
  "Česká klasika",
];

export default function SettingsPage() {
  const supabase = createClient();
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [preferences, setPreferences] = useState<UserPreferences>({
    favorite_stores: [],
    diet_type: "none",
    allergens: [],
    favorite_categories: [],
  });

  useEffect(() => {
    void loadUserAndPreferences();
  }, []);

  async function loadUserAndPreferences() {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    setUser(user);

    if (user) {
      const { data, error } = await supabase
        .from("user_preferences")
        .select("*")
        .eq("user_id", user.id)
        .single();

      if (data && !error) {
        setPreferences({
          favorite_stores: data.favorite_stores || [],
          diet_type: data.diet_type || "none",
          allergens: data.allergens || [],
          favorite_categories: data.favorite_categories || [],
        });
      }
    }
    setLoading(false);
  }

  async function savePreferences() {
    if (!user) return;

    setSaving(true);
    const { error } = await supabase.from("user_preferences").upsert({
      user_id: user.id,
      favorite_stores: preferences.favorite_stores,
      diet_type: preferences.diet_type,
      allergens: preferences.allergens,
      favorite_categories: preferences.favorite_categories,
      updated_at: new Date().toISOString(),
    });

    if (!error) {
      setTimeout(() => setSaving(false), 500);
    } else {
      console.error("Save error:", error);
      setSaving(false);
    }
  }

  function toggleStore(store: string) {
    setPreferences((prev) => ({
      ...prev,
      favorite_stores: prev.favorite_stores.includes(store)
        ? prev.favorite_stores.filter((s) => s !== store)
        : [...prev.favorite_stores, store],
    }));
  }

  function toggleAllergen(allergen: string) {
    setPreferences((prev) => ({
      ...prev,
      allergens: prev.allergens.includes(allergen)
        ? prev.allergens.filter((a) => a !== allergen)
        : [...prev.allergens, allergen],
    }));
  }

  function toggleCategory(category: string) {
    setPreferences((prev) => ({
      ...prev,
      favorite_categories: prev.favorite_categories.includes(category)
        ? prev.favorite_categories.filter((c) => c !== category)
        : [...prev.favorite_categories, category],
    }));
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-zinc-50">
        <AppHeader />
        <div className="flex pt-20">
          <Sidebar />
          <main className="flex-1 p-12">
            <div className="text-center">
              <span className="text-zinc-400">Načítání...</span>
            </div>
          </main>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-zinc-50">
        <AppHeader />
        <div className="flex pt-20">
          <Sidebar />
          <main className="flex-1 p-12">
            <div className="text-center">
              <h1 className="text-2xl font-bold text-zinc-800">
                Přihlaste se pro nastavení preferencí
              </h1>
            </div>
          </main>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-zinc-50">
      <AppHeader />
      <div className="flex pt-20">
        <Sidebar />
        <main className="flex-1 p-12 max-w-4xl">
          <header className="mb-8">
            <h1 className="text-4xl font-bold text-zinc-900 mb-2">Nastavení</h1>
            <p className="text-zinc-500">
              Upravte svoje preference pro lepší doporučení
            </p>
          </header>

          <div className="space-y-8">
            {/* Oblíbené obchody */}
            <section className="bg-white rounded-2xl p-8 shadow-sm">
              <div className="flex items-center gap-3 mb-6">
                <span className="material-symbols-outlined text-emerald-600 text-3xl">
                  store
                </span>
                <div>
                  <h2 className="text-xl font-bold text-zinc-900">
                    Oblíbené obchody
                  </h2>
                  <p className="text-sm text-zinc-500">
                    Označte obchody, které preferujete
                  </p>
                </div>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                {AVAILABLE_STORES.map((store) => (
                  <button
                    key={store}
                    onClick={() => toggleStore(store)}
                    className={`p-4 rounded-xl border-2 transition-all text-left font-semibold ${
                      preferences.favorite_stores.includes(store)
                        ? "border-emerald-500 bg-emerald-50 text-emerald-700"
                        : "border-zinc-200 bg-white text-zinc-600 hover:border-emerald-300"
                    }`}
                  >
                    {store}
                  </button>
                ))}
              </div>
            </section>

            {/* Stravovací preference */}
            <section className="bg-white rounded-2xl p-8 shadow-sm">
              <div className="flex items-center gap-3 mb-6">
                <span className="material-symbols-outlined text-emerald-600 text-3xl">
                  restaurant
                </span>
                <div>
                  <h2 className="text-xl font-bold text-zinc-900">
                    Stravovací preference
                  </h2>
                  <p className="text-sm text-zinc-500">
                    Vyberte typ stravy, který dodržujete
                  </p>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                {[
                  { value: "none", label: "Bez omezení" },
                  { value: "vegetarian", label: "Vegetariánská" },
                  { value: "vegan", label: "Veganská" },
                  { value: "pescatarian", label: "Pescatariánská" },
                ].map((diet) => (
                  <button
                    key={diet.value}
                    onClick={() =>
                      setPreferences((prev) => ({
                        ...prev,
                        diet_type: diet.value as DietType,
                      }))
                    }
                    className={`p-4 rounded-xl border-2 transition-all font-semibold ${
                      preferences.diet_type === diet.value
                        ? "border-emerald-500 bg-emerald-50 text-emerald-700"
                        : "border-zinc-200 bg-white text-zinc-600 hover:border-emerald-300"
                    }`}
                  >
                    {diet.label}
                  </button>
                ))}
              </div>
            </section>

            {/* Alergeny */}
            <section className="bg-white rounded-2xl p-8 shadow-sm">
              <div className="flex items-center gap-3 mb-6">
                <span className="material-symbols-outlined text-red-600 text-3xl">
                  warning
                </span>
                <div>
                  <h2 className="text-xl font-bold text-zinc-900">Alergeny</h2>
                  <p className="text-sm text-zinc-500">
                    Označte alergeny, kterým se vyhýbáte
                  </p>
                </div>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                {ALLERGENS.map((allergen) => (
                  <button
                    key={allergen}
                    onClick={() => toggleAllergen(allergen)}
                    className={`p-4 rounded-xl border-2 transition-all text-left font-semibold ${
                      preferences.allergens.includes(allergen)
                        ? "border-red-500 bg-red-50 text-red-700"
                        : "border-zinc-200 bg-white text-zinc-600 hover:border-red-300"
                    }`}
                  >
                    {allergen}
                  </button>
                ))}
              </div>
            </section>

            {/* Oblíbené kategorie jídel */}
            <section className="bg-white rounded-2xl p-8 shadow-sm">
              <div className="flex items-center gap-3 mb-6">
                <span className="material-symbols-outlined text-emerald-600 text-3xl">
                  favorite
                </span>
                <div>
                  <h2 className="text-xl font-bold text-zinc-900">
                    Oblíbené kategorie
                  </h2>
                  <p className="text-sm text-zinc-500">
                    Vyberte typy jídel, které máte rádi
                  </p>
                </div>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                {FOOD_CATEGORIES.map((category) => (
                  <button
                    key={category}
                    onClick={() => toggleCategory(category)}
                    className={`p-4 rounded-xl border-2 transition-all text-left font-semibold ${
                      preferences.favorite_categories.includes(category)
                        ? "border-emerald-500 bg-emerald-50 text-emerald-700"
                        : "border-zinc-200 bg-white text-zinc-600 hover:border-emerald-300"
                    }`}
                  >
                    {category}
                  </button>
                ))}
              </div>
            </section>

            {/* Uložit tlačítko */}
            <div className="sticky bottom-6">
              <button
                onClick={() => void savePreferences()}
                disabled={saving}
                className="w-full py-4 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {saving ? "Ukládám..." : "Uložit nastavení"}
              </button>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
