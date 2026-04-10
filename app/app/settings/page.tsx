"use client";

import { useEffect, useState, Suspense } from "react";
import { createClient } from "@/lib/supabase/client";

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

function SettingsContent() {
  const supabase = createClient();
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [preferences, setPreferences] = useState<UserPreferences>({
    favorite_stores: [],
    diet_type: "none",
    allergens: [],
    favorite_categories: [],
  });

  useEffect(() => {
    void loadUserAndPreferences();
  }, []);

  // Auto-save when preferences change
  useEffect(() => {
    if (!loading && user) {
      const timer = setTimeout(() => {
        void savePreferences();
      }, 500); // Debounce save
      return () => clearTimeout(timer);
    }
  }, [preferences, loading, user]);

  // Scroll to hash on load
  useEffect(() => {
    if (typeof window !== "undefined" && window.location.hash) {
      const id = window.location.hash.substring(1);
      setTimeout(() => {
        const element = document.getElementById(id);
        if (element) {
          element.scrollIntoView({ behavior: "smooth", block: "start" });
        }
      }, 100);
    }
  }, [loading]);

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
      setSaving(false);
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
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
      <div className="flex items-center justify-center py-20 text-zinc-400">
        <span className="material-symbols-outlined animate-spin mr-2">progress_activity</span>
        <span>Načítání...</span>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="max-w-md mx-auto text-center py-20 px-4">
        <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-foodapka-100 dark:bg-foodapka-900/30 text-4xl">
          🔐
        </div>
        <h1 className="text-2xl font-bold text-zinc-900 dark:text-white mb-3">
          Přihlaste se
        </h1>
        <p className="text-zinc-600 dark:text-zinc-400 mb-6">
          Pro nastavení preferencí se musíte nejprve přihlásit.
        </p>
        <a
          href="/login"
          className="inline-flex items-center gap-2 rounded-full bg-foodapka-500 px-6 py-3 font-semibold text-white transition hover:bg-foodapka-600"
        >
          <span className="material-symbols-outlined">login</span>
          Přihlásit se
        </a>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <header className="mb-10 px-2 flex justify-between items-start">
        <div>
          <h1 className="text-3xl lg:text-5xl font-extrabold tracking-tight text-foodapka-950 dark:text-white leading-tight mb-2 md:mb-4">
            Nastavení ⚙️
          </h1>
          <p className="text-base md:text-lg text-zinc-600 dark:text-zinc-400">
            Upravte svoje preference pro lepší doporučení a personalizovaný zážitek.
          </p>
        </div>
        
        {/* Save Status Indicator */}
        <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-foodapka-50 dark:bg-foodapka-900/20 border border-foodapka-100 dark:border-foodapka-800 transition-all duration-500">
          {saving ? (
            <>
              <span className="material-symbols-outlined animate-spin text-sm text-foodapka-600">progress_activity</span>
              <span className="text-xs font-bold text-foodapka-700 dark:text-foodapka-300 uppercase tracking-widest">Ukládám</span>
            </>
          ) : (
            <>
              <span className="material-symbols-outlined text-sm text-foodapka-600">check_circle</span>
              <span className="text-xs font-bold text-foodapka-700 dark:text-foodapka-300 uppercase tracking-widest">Uloženo</span>
            </>
          )}
        </div>
      </header>

      <div className="space-y-6">
        {/* Oblíbené obchody */}
        <section className="rounded-2xl border border-foodapka-100 dark:border-zinc-800 bg-white/90 dark:bg-foodapka-950 p-6 shadow-sm">
          <div className="flex items-center gap-3 mb-5">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-foodapka-100 dark:bg-foodapka-900/50">
              <span className="material-symbols-outlined text-foodapka-600 dark:text-foodapka-400 text-2xl">
                store
              </span>
            </div>
            <div>
              <h2 className="text-lg font-bold text-zinc-900 dark:text-white">
                Oblíbené obchody
              </h2>
              <p className="text-sm text-zinc-500 dark:text-zinc-400">
                Označte obchody, které preferujete
              </p>
            </div>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            {AVAILABLE_STORES.map((store) => (
              <button
                key={store}
                onClick={() => toggleStore(store)}
                className={`p-4 rounded-full border-2 transition-all text-center font-bold text-sm md:text-base ${
                  preferences.favorite_stores.includes(store)
                    ? "border-foodapka-500 bg-foodapka-50 dark:bg-foodapka-900/30 text-foodapka-700 dark:text-foodapka-300 shadow-md shadow-foodapka-500/10"
                    : "border-zinc-100 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-900/50 text-zinc-500 dark:text-zinc-400 hover:border-foodapka-200 dark:hover:border-foodapka-700"
                }`}
              >
                {store}
              </button>
            ))}
          </div>
        </section>

        {/* Stravovací preference */}
        <section className="rounded-2xl border border-foodapka-100 dark:border-zinc-800 bg-white/90 dark:bg-foodapka-950 p-6 shadow-sm">
          <div className="flex items-center gap-3 mb-5">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-foodapka-100 dark:bg-foodapka-900/50">
              <span className="material-symbols-outlined text-foodapka-600 dark:text-foodapka-400 text-2xl">
                restaurant
              </span>
            </div>
            <div>
              <h2 className="text-lg font-bold text-zinc-900 dark:text-white">
                Stravovací preference
              </h2>
              <p className="text-sm text-zinc-500 dark:text-zinc-400">
                Vyberte typ stravy, který dodržujete
              </p>
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {[
              { value: "none", label: "Bez omezení", icon: "🍽️" },
              { value: "vegetarian", label: "Vegetariánská", icon: "🥬" },
              { value: "vegan", label: "Veganská", icon: "🌱" },
              { value: "pescatarian", label: "Pescatariánská", icon: "🐟" },
            ].map((diet) => (
              <button
                key={diet.value}
                onClick={() =>
                  setPreferences((prev) => ({
                    ...prev,
                    diet_type: diet.value as DietType,
                  }))
                }
                className={`p-4 rounded-full border-2 transition-all font-bold flex items-center justify-center gap-3 ${
                  preferences.diet_type === diet.value
                    ? "border-foodapka-500 bg-foodapka-50 dark:bg-foodapka-900/30 text-foodapka-700 dark:text-foodapka-300 shadow-md shadow-foodapka-500/10"
                    : "border-zinc-100 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-900/50 text-zinc-500 dark:text-zinc-400 hover:border-foodapka-200 dark:hover:border-foodapka-700"
                }`}
              >
                <span className="text-xl">{diet.icon}</span>
                {diet.label}
              </button>
            ))}
          </div>
        </section>

        {/* Alergeny */}
        <section className="rounded-2xl border border-red-100 dark:border-zinc-800 bg-white/90 dark:bg-foodapka-950 p-6 shadow-sm">
          <div className="flex items-center gap-3 mb-5">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-red-100 dark:bg-red-900/30">
              <span className="material-symbols-outlined text-red-600 dark:text-red-400 text-2xl">
                warning
              </span>
            </div>
            <div>
              <h2 className="text-lg font-bold text-zinc-900 dark:text-white">Alergeny</h2>
              <p className="text-sm text-zinc-500 dark:text-zinc-400">
                Označte alergeny, kterým se vyhýbáte
              </p>
            </div>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
            {ALLERGENS.map((allergen) => (
              <button
                key={allergen}
                onClick={() => toggleAllergen(allergen)}
                className={`p-3 rounded-full border-2 transition-all text-center font-bold text-xs md:text-sm ${
                  preferences.allergens.includes(allergen)
                    ? "border-red-500 bg-red-50 dark:bg-red-900/30 text-red-700 dark:text-red-300 shadow-md shadow-red-500/10"
                    : "border-zinc-100 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-900/50 text-zinc-500 dark:text-zinc-400 hover:border-red-200 dark:hover:border-red-700"
                }`}
              >
                {allergen}
              </button>
            ))}
          </div>
        </section>

        {/* Oblíbené kategorie jídel */}
        <section className="rounded-2xl border border-foodapka-100 dark:border-zinc-800 bg-white/90 dark:bg-foodapka-950 p-6 shadow-sm">
          <div className="flex items-center gap-3 mb-5">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-foodapka-100 dark:bg-foodapka-900/50">
              <span className="material-symbols-outlined text-foodapka-600 dark:text-foodapka-400 text-2xl">
                favorite
              </span>
            </div>
            <div>
              <h2 className="text-lg font-bold text-zinc-900 dark:text-white">
                Oblíbené kategorie
              </h2>
              <p className="text-sm text-zinc-500 dark:text-zinc-400">
                Vyberte typy jídel, které máte rádi
              </p>
            </div>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {FOOD_CATEGORIES.map((category) => (
              <button
                key={category}
                onClick={() => toggleCategory(category)}
                className={`p-4 rounded-full border-2 transition-all text-center font-bold text-sm md:text-base ${
                  preferences.favorite_categories.includes(category)
                    ? "border-foodapka-500 bg-foodapka-50 dark:bg-foodapka-900/30 text-foodapka-700 dark:text-foodapka-300 shadow-md shadow-foodapka-500/10"
                    : "border-zinc-100 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-900/50 text-zinc-500 dark:text-zinc-400 hover:border-foodapka-200 dark:hover:border-foodapka-700"
                }`}
              >
                {category}
              </button>
            ))}
          </div>
        </section>

        {/* Nápověda */}
        <section id="napoveda" className="rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white/90 dark:bg-foodapka-950 p-6 scroll-mt-32 shadow-sm">
          <div className="flex items-center gap-3 mb-5">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-blue-100 dark:bg-blue-900/30">
              <span className="material-symbols-outlined text-blue-600 dark:text-blue-400 text-2xl">
                help
              </span>
            </div>
            <div>
              <h2 className="text-lg font-bold text-zinc-900 dark:text-white">Nápověda</h2>
              <p className="text-sm text-zinc-500 dark:text-zinc-400">
                Jak používat Foodapku
              </p>
            </div>
          </div>
          <div className="space-y-4">
            <div className="flex gap-4 p-4 rounded-xl bg-zinc-50 dark:bg-zinc-800/50">
              <span className="material-symbols-outlined text-foodapka-500 text-xl mt-0.5">search</span>
              <div>
                <h3 className="font-semibold text-zinc-900 dark:text-white mb-1">Vyhledávání produktů</h3>
                <p className="text-sm text-zinc-600 dark:text-zinc-400">
                  Zadejte název produktu do vyhledávače a my vám najdeme nejlepší akční ceny ze všech obchodů.
                </p>
              </div>
            </div>
            <div className="flex gap-4 p-4 rounded-xl bg-zinc-50 dark:bg-zinc-800/50">
              <span className="material-symbols-outlined text-foodapka-500 text-xl mt-0.5">restaurant</span>
              <div>
                <h3 className="font-semibold text-zinc-900 dark:text-white mb-1">Recepty</h3>
                <p className="text-sm text-zinc-600 dark:text-zinc-400">
                  Vyberte si recept a my automaticky vyhledáme nejlevnější ingredience. Můžete nakupovat v jednom obchodě nebo kombinovat nabídky.
                </p>
              </div>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}

export default function SettingsPage() {
  return (
    <Suspense fallback={
      <div className="flex items-center justify-center py-20 text-zinc-400">
        <span className="material-symbols-outlined animate-spin mr-2">progress_activity</span>
        Načítání...
      </div>
    }>
      <SettingsContent />
    </Suspense>
  );
}
