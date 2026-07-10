import { normalizeText, type Product, type Store } from "@/lib/food";
import { storeNameToChipKey } from "@/lib/favoriteStores";

/** Mapuje Store na chip klíč + čitelný název řetězce — sdíleno mezi vyhledáváním, oblíbenými obchody a hlídacím psem. */
export function getStoreFilter(store: Store) {
  const n = normalizeText(store.shopName);
  if (n.includes("albert")) return { key: "chain:albert", label: "Albert" };
  if (n.includes("globus")) return { key: "chain:globus", label: "Globus" };
  if (n.includes("billa")) return { key: "chain:billa", label: "Billa" };
  if (n.includes("tesco")) return { key: "chain:tesco", label: "Tesco" };
  if (n.includes("penny")) return { key: "chain:penny", label: "Penny" };
  if (n.includes("flop")) return { key: "chain:flop", label: "FLOP TOP" };
  if (n.includes("coop")) return { key: "chain:coop", label: "Coop" };
  if (n.includes("hruska") || n.includes("hruška")) return { key: "chain:hruska", label: "Hruška" };
  if (n.includes("kosik")) return { key: "chain:kosik", label: "Košík" };
  if (n.includes("tamda")) return { key: "chain:tamda", label: "TAMDA" };
  if (n.includes("bene")) return { key: "chain:bene", label: "Bene" };
  if (n.includes("cba")) return { key: "chain:cba", label: "CBA" };
  if (n.includes("ratio")) return { key: "chain:ratio", label: "Ratio" };
  if (n.includes("jip")) return { key: "chain:jip", label: "JIP" };
  if (n.includes("rohlik")) return { key: "chain:rohlik", label: "Rohlik.cz" };
  if (n.includes("makro")) return { key: "chain:makro", label: "Makro" };
  if (store.source === "kaufland") return { key: "chain:kaufland", label: "Kaufland" };
  if (store.source === "lidl") return { key: "chain:lidl", label: "Lidl" };
  return { key: `chain:${n}`, label: store.shopName };
}

/**
 * Ponechá u každého produktu jen obchody odpovídající vybraným řetězcům
 * (plná jména jako "Billa", "Lidl" — stejná jako AVAILABLE_STORES/store_filter
 * sloupec). Prázdný/null výběr = beze změny (hlídá se všude).
 */
export function filterProductsByStores(products: Product[], storeFilter: string[] | null | undefined): Product[] {
  if (!storeFilter || storeFilter.length === 0) return products;

  const allowedKeys = new Set(storeFilter.map(storeNameToChipKey));

  return products
    .map((product) => ({
      ...product,
      stores: product.stores.filter((store) => allowedKeys.has(getStoreFilter(store).key)),
    }))
    .filter((product) => product.stores.length > 0);
}
