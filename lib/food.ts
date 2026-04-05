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

function normalizeSearchText(value: string) {
  return normalizeText(value)
    .replace(/\bbezlaktoz\w*/g, "bez laktoz")
    .replace(/\bbezlepk\w*/g, "bez lepk")
    .replace(/\bbezcukr\w*/g, "bez cukr")
    .replace(/\bpolotucn\w*/g, "polotucne")
    .replace(/\bplnotucn\w*/g, "plnotucne")
    .replace(/\btrvanliv\w*/g, "trvanlive")
    .replace(/\bcerstv\w*/g, "cerstve")
    .replace(/\s+/g, " ")
    .trim();
}

function tokenizeSearchText(value: string) {
  return normalizeSearchText(value).split(" ").filter(Boolean);
}

const GENERIC_QUERY_TOKENS = new Set([
  "bio",
  "cerstve",
  "jidlo",
  "maso",
  "mleko",
  "napoj",
  "potravina",
  "produkt",
  "syr",
  "testoviny",
  "trvanlive",
    "vyrobek",
  "zelenina",
  "ovoce",
]);

const IGNORE_QUERY_TOKENS = new Set([
  "a",
  "bez",
  "do",
  "na",
  "od",
  "po",
  "pro",
  "s",
  "u",
  "v",
  "z",
]);

const NON_FOOD_NAME_TOKENS = new Set([
  "baleni",
  "box",
  "detske",
  "doza",
  "dzungle",
  "hrnek",
  "kartac",
  "kryt",
  "lahev",
  "lahve",
  "latka",
  "mixér",
  "mixer",
  "mlekovar",
  "nerez",
  "obal",
  "penezenka",
  "pribor",
  "rukavice",
  "sklenice",
  "termo",
  "tricko",
]);

const RECIPE_MISMATCH_TOKENS = new Set([
  "aperitiv",
  "granule",
  "kapsicka",
  "koreni",
  "krmivo",
  "liker",
  "napoj",
  "omacka",
  "smes",
]);

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
  const normalizedName = normalizeSearchText(cleanProductName(name));
  const normalizedQuery = normalizeSearchText(query);

  if (!normalizedQuery) return 0;
  if (normalizedName === normalizedQuery) return 240;
  if (normalizedName.startsWith(normalizedQuery)) return 210;
  if (normalizedName.includes(normalizedQuery)) return 180;

  const nameTokens = tokenizeSearchText(normalizedName);
  const queryTokens = tokenizeSearchText(normalizedQuery);
  if (queryTokens.length === 0) return 0;

  if (nameTokens.some((token) => NON_FOOD_NAME_TOKENS.has(token))) {
    return 0;
  }

  let exactMatches = 0;
  let partialMatches = 0;
  let missingSpecificTokens = 0;
  let matchedSpecificTokens = 0;

  const specificQueryTokens = queryTokens.filter(
    (token) =>
      !IGNORE_QUERY_TOKENS.has(token) && !GENERIC_QUERY_TOKENS.has(token),
  );

  queryTokens.forEach((queryToken) => {
    const hasExactMatch = nameTokens.some((nameToken) => nameToken === queryToken);
    if (hasExactMatch) {
      exactMatches += 1;
      if (specificQueryTokens.includes(queryToken)) {
        matchedSpecificTokens += 1;
      }
      return;
    }

    const hasPartialMatch = nameTokens.some(
      (nameToken) =>
        nameToken.startsWith(queryToken) ||
        queryToken.startsWith(nameToken) ||
        (queryToken.length >= 5 && nameToken.includes(queryToken)) ||
        (nameToken.length >= 5 && queryToken.includes(nameToken)),
    );

    if (hasPartialMatch) {
      partialMatches += 1;
      if (specificQueryTokens.includes(queryToken)) {
        matchedSpecificTokens += 1;
      }
      return;
    }

    if (specificQueryTokens.includes(queryToken)) {
      missingSpecificTokens += 1;
    }
  });

  if (specificQueryTokens.length > 0 && matchedSpecificTokens === 0) {
    return 0;
  }

  if (queryTokens.length > 1 && exactMatches + partialMatches < 2) {
    return 0;
  }

  if (missingSpecificTokens > 0 && matchedSpecificTokens < specificQueryTokens.length) {
    if (matchedSpecificTokens === 0) return 0;
    if (queryTokens.length >= 2 && matchedSpecificTokens < Math.ceil(specificQueryTokens.length / 2)) {
      return 0;
    }
  }

  if (nameTokens.some((token) => RECIPE_MISMATCH_TOKENS.has(token))) {
    const queryHasMismatchToken = queryTokens.some((token) =>
      RECIPE_MISMATCH_TOKENS.has(token),
    );
    if (!queryHasMismatchToken && specificQueryTokens.length > 0) {
      return 0;
    }
  }

  const tokenCoverage = exactMatches + partialMatches;
  const extraTokensPenalty = Math.max(0, nameTokens.length - tokenCoverage - 4);

  return (
    exactMatches * 28 +
    partialMatches * 10 +
    matchedSpecificTokens * 18 -
    missingSpecificTokens * 14 -
    extraTokensPenalty * 3
  );
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
