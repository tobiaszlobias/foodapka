export type PriceSource = "kupi" | "kaufland" | "foodora" | "lidl" | "globus";

export type Store = {
  shopId: string;
  shopName: string;
  price: string;
  originalPrice?: string;
  pricePerUnit: string;
  amount: string;
  /** Přesné % slevy přímo ze zdroje (např. "–27 %"), na rozdíl od formatDiscountPercent, které je dopočítané z cen. */
  discountPercent?: string;
  /** Balení/gramáž/objem produktu (např. "250 g", "1 l"), odděleně od amount kvůli zpětné kompatibilitě. */
  packageSize?: string;
  /** Poznámka k akci ze zdroje (např. "max 10 ks/osoba/den"). */
  note?: string;
  /** Cena platí jen s věrnostní kartou (např. "Cena s Kaufland Card", "Jen pro Lidl Plus"). */
  loyaltyCardLabel?: string;
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
  image?: string;
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
  "vložky",
  "plenky",
  "ubrousky",
  "ponožky",
  "ponozky",
  "pantofle",
  "hracky",
  "hracky",
  "stelivo",
  "krmivo",
  "granule",
  "kapsicka",
  "sampon",
  "mýdlo",
  "mydlo",
  "pánské",
  "dámské",
  "panske",
  "damske",
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
  "nanuk",
  "zmrzlina",
  "dort",
  "dezert",
  "pomazanka",
  "pastika",
  // Hotová jídla / polotovary — nevhodné když hledáš surovinu
  "polevka",
  "polevkovy",
  "instantni",
  "vyvar",
  "bujón",
  "bujon",
  "hotove",
  "hotovy",
  "pripraven",
  "mikrovlnna",
  "konzervovany",
  "mrazene",
  "pyre",
  "nugety",
  "nuget",
  "stroganoff",
  "gulasova",
  "sekaná",
  "sekana",
  "karbanátek",
  "karbanek",
  "parizak",
  "salám",
  "salam",
  "párky",
  "parky",
  "klobasa",
  "sunka",
  "uzeny",
  "uzená",
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
  originalPriceValue?: number | null,
) {
  if (!originalPriceValue || !Number.isFinite(originalPriceValue) || originalPriceValue <= 0) {
    return "";
  }

  if (currentPrice >= originalPriceValue) return "";

  const percent = Math.round(((originalPriceValue - currentPrice) / originalPriceValue) * 100);
  return percent > 0 ? `-${percent}%` : "";
}

export function getSavings(currentPrice: number, originalPriceValue?: number | null) {
  if (!originalPriceValue || originalPriceValue <= currentPrice) return 0;
  return originalPriceValue - currentPrice;
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
  if (normalizedName === normalizedQuery) return 500; // Perfect match
  if (normalizedName.startsWith(normalizedQuery)) return 300;
  if (normalizedName.includes(normalizedQuery)) return 200;

  const nameTokens = tokenizeSearchText(normalizedName);
  const queryTokens = tokenizeSearchText(normalizedQuery);
  if (queryTokens.length === 0) return 0;

  if (nameTokens.some((token) => NON_FOOD_NAME_TOKENS.has(token))) {
    return -100; // Hard fail for non-food
  }

  let exactMatches = 0;
  let partialMatches = 0;
  let missingSpecificTokens = 0;
  let matchedSpecificTokens = 0;

  const specificQueryTokens = queryTokens.filter(
    (token) =>
      !IGNORE_QUERY_TOKENS.has(token) && !GENERIC_QUERY_TOKENS.has(token),
  );

  const ADJECTIVE_SUFFIXES = ["vy", "va", "ve", "vi", "vych", "vemu", "vemu", "ovi", "ovo", "ova"];

  queryTokens.forEach((queryToken) => {
    const hasExactMatch = nameTokens.some((nameToken) => nameToken === queryToken);
    if (hasExactMatch) {
      exactMatches += 1;
      if (specificQueryTokens.includes(queryToken)) {
        matchedSpecificTokens += 1;
      }
      return;
    }

    const hasForwardPartial = nameTokens.some((nameToken) => {
      if (!nameToken.startsWith(queryToken)) return false;
      const suffix = nameToken.slice(queryToken.length);
      // Block adjectival suffixes: "maslo" should not match "maslovy"
      if (suffix.length > 0 && ADJECTIVE_SUFFIXES.some((s) => suffix === s || suffix.startsWith(s))) return false;
      return true;
    });

    const hasBackwardPartial = nameTokens.some(
      (nameToken) =>
        queryToken.startsWith(nameToken) ||
        (queryToken.length >= 5 && nameToken.includes(queryToken)) ||
        (nameToken.length >= 5 && queryToken.includes(nameToken)),
    );

    if (hasForwardPartial || hasBackwardPartial) {
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

  // Penalizace za "hotové výrobky" když hledáš surovinu — nevyhazovat, jen sunout dolů
  if (nameTokens.some((token) => RECIPE_MISMATCH_TOKENS.has(token))) {
    const queryHasMismatchToken = queryTokens.some((token) =>
      RECIPE_MISMATCH_TOKENS.has(token),
    );
    if (!queryHasMismatchToken && specificQueryTokens.length > 0) {
      return -50;
    }
  }

  if (specificQueryTokens.length > 0 && matchedSpecificTokens === 0) {
    return 0;
  }

  if (queryTokens.length > 1 && exactMatches + partialMatches < 1) {
    return 0;
  }

  const tokenCoverage = exactMatches + partialMatches;
  const extraTokensPenalty = Math.max(0, nameTokens.length - tokenCoverage);

  // Bonus if the product name starts with one of the query tokens (e.g. "Máslo XY" when searching "máslo")
  const firstNameToken = nameTokens[0] ?? "";
  const positionBonus = specificQueryTokens.some((t) => firstNameToken === t) ? 100 : 0;

  return (
    exactMatches * 50 +
    partialMatches * 10 +
    matchedSpecificTokens * 40 +
    positionBonus -
    missingSpecificTokens * 50 -
    extraTokensPenalty * 30
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
    if (product.url && !existing.url) existing.url = product.url;
    if (product.image && !existing.image) existing.image = product.image;
  });

  return Array.from(productMap.values());
}

export function getStoreIcon(shopName: string) {
  return (
    Object.entries(STORE_META).find(([name]) => shopName.includes(name))?.[1] ??
    "🏪"
  );
}
