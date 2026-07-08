import type { SupabaseClient } from "@supabase/supabase-js";
import type { User } from "@supabase/supabase-js";
import { normalizeText } from "@/lib/food";

export const AVAILABLE_STORES = [
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

const PREFERENCE_TABLES = ["user_preferences", "user_preference", "preferences", "profiles"];

export function storeNameToChipKey(store: string) {
  return `chain:${normalizeText(store)}`;
}

/** Zpětné mapování chip key -> plný název obchodu (jak je uložený v favorite_stores). */
export function chipKeyToStoreName(key: string) {
  const normalizedKey = key.startsWith("chain:") ? key.slice("chain:".length) : key;
  return AVAILABLE_STORES.find((store) => normalizeText(store) === normalizedKey) ?? null;
}

/** Načte oblíbené obchody uživatele (nebo hosta) — stejný fallback řetěz jako v nastavení. */
export async function loadFavoriteStores(
  supabase: SupabaseClient,
  user: User | null,
): Promise<string[]> {
  if (!user) {
    const local = localStorage.getItem("guest_settings");
    if (local) {
      try {
        return JSON.parse(local).favorite_stores || [];
      } catch {
        return [];
      }
    }
    return [];
  }

  for (const table of PREFERENCE_TABLES) {
    const { data } = await supabase
      .from(table)
      .select("favorite_stores")
      .eq("user_id", user.id)
      .single();
    if (data?.favorite_stores) {
      return data.favorite_stores;
    }
  }

  const local = localStorage.getItem(`settings_fallback_${user.id}`);
  if (local) {
    try {
      return JSON.parse(local).favorite_stores || [];
    } catch {
      return [];
    }
  }
  return [];
}

/**
 * Uloží pouze favorite_stores (partial upsert — nesmí přepsat dietu/alergeny
 * uložené jinde). Stejný fallback řetěz tabulek + localStorage jako v nastavení.
 */
export async function saveFavoriteStores(
  supabase: SupabaseClient,
  user: User | null,
  stores: string[],
): Promise<void> {
  if (!user) {
    const local = localStorage.getItem("guest_settings");
    const existing = local ? JSON.parse(local) : {};
    localStorage.setItem("guest_settings", JSON.stringify({ ...existing, favorite_stores: stores }));
    return;
  }

  for (const table of PREFERENCE_TABLES) {
    const { error, status } = await supabase
      .from(table)
      .upsert({ user_id: user.id, favorite_stores: stores }, { onConflict: "user_id" });
    if (!error) return;
    if (status !== 404) return;
  }

  const localKey = `settings_fallback_${user.id}`;
  const local = localStorage.getItem(localKey);
  const existing = local ? JSON.parse(local) : {};
  localStorage.setItem(localKey, JSON.stringify({ ...existing, favorite_stores: stores }));
}
