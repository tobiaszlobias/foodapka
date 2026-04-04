export type PriceSource = "kupi" | "kaufland" | "foodora" | "lidl";

export type Store = {
  shopId: string;
  shopName: string;
  price: string;
  pricePerUnit: string;
  amount: string;
  validity: string;
  leafletUrl: string;
  source?: PriceSource;
  sourceLabel?: string;
  sources?: string[];
  isSale?: boolean;
};

export type Product = {
  name: string;
  url: string;
  stores: Store[];
};

export const STORE_META: Record<string, string> = {
  Lidl: "🟡",
  Penny: "🔴",
  Kaufland: "🔵",
  Albert: "🟢",
  Billa: "🔴",
  Tesco: "🔵",
  Globus: "🟣",
};

export function stripDiacritics(value: string) {
  return value.normalize("NFD").replace(/\p{Diacritic}+/gu, "");
}

export function normalizeText(value: string) {
  return stripDiacritics(value)
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

export function parsePrice(price: string) {
  const normalized = price.replace(/\s/g, "").replace(",", ".").match(/[\d.]+/);
  return normalized ? Number(normalized[0]) : Number.POSITIVE_INFINITY;
}

export function formatPrice(value: number) {
  return `${value.toFixed(2).replace(".", ",")} Kč`;
}

export function formatDiscountPercent(
  currentPrice: number,
  originalPrice?: number | null,
) {
  if (!originalPrice || !Number.isFinite(originalPrice) || originalPrice <= 0) {
    return "";
  }

  if (currentPrice >= originalPrice) return "";

  const percent = Math.round(((originalPrice - currentPrice) / originalPrice) * 100);
  return percent > 0 ? `-${percent}%` : "";
}

export function sortStoresByPrice(stores: Store[]) {
  return [...stores].sort((a, b) => parsePrice(a.price) - parsePrice(b.price));
}

export function cleanProductName(name: string) {
  return name.replace("Aktuální akční slevy ", "").trim();
}

export function dedupeStores(stores: Store[]) {
  const storeMap = new Map<string, Store>();

  stores.forEach((store) => {
    const key = [
      normalizeText(store.shopName),
      store.price,
      store.pricePerUnit,
      store.validity,
    ].join("|");

    const existing = storeMap.get(key);
    if (!existing) {
      storeMap.set(key, {
        ...store,
        sources: store.sourceLabel ? [store.sourceLabel] : store.sources,
      });
      return;
    }

    const sourceLabels = new Set<string>([
      ...(existing.sources ?? []),
      ...(existing.sourceLabel ? [existing.sourceLabel] : []),
      ...(store.sources ?? []),
      ...(store.sourceLabel ? [store.sourceLabel] : []),
    ]);

    existing.sources = Array.from(sourceLabels);
    existing.sourceLabel = existing.sources.join(" + ");
    existing.isSale = existing.isSale || store.isSale;
    if (!existing.leafletUrl && store.leafletUrl) {
      existing.leafletUrl = store.leafletUrl;
    }
  });

  return sortStoresByPrice(Array.from(storeMap.values()));
}

export function scoreProductMatch(name: string, query: string) {
  const normalizedName = normalizeText(cleanProductName(name));
  const normalizedQuery = normalizeText(query);

  if (!normalizedQuery) return 0;
  if (normalizedName === normalizedQuery) return 100;
  if (normalizedName.includes(normalizedQuery)) return 80;

  const nameTokens = normalizedName.split(" ").filter(Boolean);
  const queryTokens = normalizedQuery.split(" ").filter(Boolean);
  if (queryTokens.length === 0) return 0;

  let exactMatches = 0;
  let partialMatches = 0;

  queryTokens.forEach((queryToken) => {
    if (nameTokens.some((nameToken) => nameToken === queryToken)) {
      exactMatches += 1;
      return;
    }

    if (
      nameTokens.some(
        (nameToken) =>
          nameToken.startsWith(queryToken) || queryToken.startsWith(nameToken),
      )
    ) {
      partialMatches += 1;
    }
  });

  return exactMatches * 12 + partialMatches * 5 - Math.max(0, nameTokens.length - 6);
}

export function mergeProductsByName(products: Product[]) {
  const productMap = new Map<string, Product>();

  products.forEach((product) => {
    const key = normalizeText(cleanProductName(product.name));
    const existing = productMap.get(key);

    if (!existing) {
      productMap.set(key, {
        ...product,
        stores: dedupeStores(product.stores),
      });
      return;
    }

    existing.stores = dedupeStores([...existing.stores, ...product.stores]);
    if (product.url && !existing.url) {
      existing.url = product.url;
    }
  });

  return Array.from(productMap.values());
}

export function getStoreIcon(shopName: string) {
  return (
    Object.entries(STORE_META).find(([name]) => shopName.includes(name))?.[1] ??
    "🏪"
  );
}
