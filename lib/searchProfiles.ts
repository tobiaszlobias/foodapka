import {
  normalizeText,
  parsePrice,
  scoreProductMatch,
  sortStoresByPrice,
  type Product,
} from "@/lib/food";
import { resolveIngredientRuleConfig } from "@/lib/ingredientClasses";

type SearchProfile = {
  requiredGroups: string[][];
  /** Skupiny zděděné z třídy ingredience — fungují i jako synonyma pro substituci */
  classGroups: string[][];
  preferred: string[];
  banned: string[];
  /** Tokeny dotazu, které MUSÍ být v názvu — vynuceno, když byl kvůli dotazu zrušen ban (viz níže) */
  requiredAll: string[];
  strict: boolean;
  preferUnitPrice: boolean;
  preferredMaxPackageKg?: number;
};

const RAW_INGREDIENT_TOKENS = new Set([
  "avokado",
  "banan",
  "brokolice",
  "celer",
  "cesnek",
  "cibule",
  "cizrna",
  "cocka",
  "cuketa",
  "citron",
  "eidam",
  "fazole",
  "hovezi",
  "jahody",
  "jogurt",
  "kopr",
  "kureci",
  "losos",
  "maslo",
  "mleko",
  "mouka",
  "mrkev",
  "mozzarella",
  "okurka",
  "olej",
  "paprika",
  "parmazan",
  "passata",
  "pepr",
  "petrzel",
  "rajce",
  "rajcata",
  "rohlik",
  "rukola",
  "ryze",
  "salat",
  "slanina",
  "spagety",
  "spenat",
  "tahini",
  "testoviny",
  "tvaroh",
  "tortilla",
  "zampiony",
  "zazvor",
  "vejce",
]);

const RAW_INGREDIENT_BANNED = [
  "bageta",
  "buchta",
  "chips",
  "croissant",
  "dip",
  "dresink",
  "dzus",
  "hotove jidlo",
  "instantni",
  "juice",
  "kolac",
  "koreni",
  "napoj",
  "ochucene",
  "omacka",
  "pecivo",
  "polevka",
  "prichut",
  "protein",
  "pure",
  "ready",
  "salat",
  "sendvic",
  "smoothie",
  "smes",
  "stava",
  "susenka",
  "susenky",
  "zalevka",
];

const STOPWORDS = new Set([
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

function normalizePattern(value: string) {
  return normalizeText(value)
    .replace(/\bbezlaktoz\w*/g, "bez laktoz")
    .replace(/\bbezlepk\w*/g, "bez lepk")
    .replace(/\bpolotucn\w*/g, "polotucne")
    .replace(/\bplnotucn\w*/g, "plnotucne")
    .replace(/\btrvanliv\w*/g, "trvanlive")
    .replace(/\bcerstv\w*/g, "cerstve")
    .replace(/\blaktoz\w*/g, "laktoz")
    .replace(/\brizek\b/g, "rizky")
    .replace(/\s+/g, " ")
    .trim();
}

function tokenize(value: string) {
  return normalizePattern(value).split(" ").filter(Boolean);
}

function matchesPattern(normalizedName: string, nameTokens: string[], pattern: string) {
  const normalizedPattern = normalizePattern(pattern);
  if (!normalizedPattern) return false;

  if (normalizedPattern.includes(" ")) {
    return normalizedName.includes(normalizedPattern);
  }

  return nameTokens.some(
    (token) =>
      token === normalizedPattern ||
      (normalizedPattern.length >= 5 && token.startsWith(normalizedPattern)),
  );
}

function matchesGroup(normalizedName: string, nameTokens: string[], group: string[]) {
  return group.some((pattern) => matchesPattern(normalizedName, nameTokens, pattern));
}

function addGroup(profile: SearchProfile, group: string[]) {
  const normalized = Array.from(
    new Set(group.map((value) => normalizePattern(value)).filter(Boolean)),
  );
  if (normalized.length > 0) {
    profile.requiredGroups.push(normalized);
  }
}

function addBanned(profile: SearchProfile, values: string[]) {
  profile.banned.push(...values.map((value) => normalizePattern(value)).filter(Boolean));
}

function buildSearchProfile(query: string, options?: { recipe?: string; banned?: string[] }) {
  const queryTokens = tokenize(query);

  const profile: SearchProfile = {
    requiredGroups: [],
    classGroups: [],
    preferred: [],
    banned: [],
    requiredAll: [],
    strict: false,
    preferUnitPrice: false,
    preferredMaxPackageKg: undefined,
  };

  const resolvedClassConfig = resolveIngredientRuleConfig(query, options?.recipe);
  profile.requiredGroups.push(...(resolvedClassConfig.requiredGroups ?? []));
  profile.classGroups = resolvedClassConfig.requiredGroups ?? [];
  profile.preferred.push(...(resolvedClassConfig.preferred ?? []));
  profile.banned.push(...(resolvedClassConfig.banned ?? []));
  
  if (options?.banned && Array.isArray(options.banned)) {
    profile.banned.push(...options.banned.map(b => normalizePattern(b)));
  }

  profile.strict = profile.strict || Boolean(resolvedClassConfig.strict);
  profile.preferUnitPrice =
    profile.preferUnitPrice || Boolean(resolvedClassConfig.preferUnitPrice);
  profile.preferredMaxPackageKg =
    resolvedClassConfig.preferredMaxPackageKg ?? profile.preferredMaxPackageKg;

  const specificTokens = queryTokens.filter((token) => !STOPWORDS.has(token));
  if (specificTokens.length > 0) {
    addGroup(profile, specificTokens);
  }

  addBanned(profile, [
    "granule",
    "kapsicka",
    "krmivo",
    "lahev",
    "mlekovar",
    "nerez",
    "termo",
  ]);

  if (queryTokens.some((token) => RAW_INGREDIENT_TOKENS.has(token))) {
    addBanned(profile, RAW_INGREDIENT_BANNED);
  }

  profile.preferred = Array.from(new Set(profile.preferred));
  profile.banned = Array.from(new Set(profile.banned));

  // Explicitní dotaz má přednost: pokud uživatel hledá výraz, který třída zakazuje
  // (např. "hovězí carpaccio" vs. ban "carpaccio" u syrového masa), zákaz se ruší.
  // Zrušení banu ale nesmí otevřít dveře produktům, které neodpovídají zbytku dotazu
  // (např. lososové carpaccio při hledání "hovězí carpaccio") — proto se zbytek
  // konkrétních tokenů dotazu vynutí jako AND podmínka (requiredAll).
  const normalizedQuery = normalizePattern(query);
  const cancelledBans = profile.banned.filter((pattern) =>
    matchesPattern(normalizedQuery, queryTokens, pattern),
  );
  if (cancelledBans.length > 0) {
    profile.requiredAll = specificTokens;
  }
  profile.banned = profile.banned.filter((pattern) => !cancelledBans.includes(pattern));
  profile.requiredGroups = profile.requiredGroups.filter(
    (group, index, groups) =>
      groups.findIndex((candidate) => candidate.join("|") === group.join("|")) === index,
  );

  return profile;
}

function parsePackageWeightKg(name: string) {
  const normalized = normalizePattern(name);
  const kgMatch = normalized.match(/(\d+(?:\.\d+)?)\s*kg\b/);
  if (kgMatch) {
    const value = Number(kgMatch[1]);
    return Number.isFinite(value) ? value : null;
  }

  const gramMatch = normalized.match(/(\d+(?:\.\d+)?)\s*g\b/);
  if (gramMatch) {
    const value = Number(gramMatch[1]);
    return Number.isFinite(value) ? value / 1000 : null;
  }

  return null;
}

function parseComparableUnitPrice(value: string) {
  const normalized = normalizePattern(value);
  const rawNumber = normalized.match(/\d+(?:\.\d+)?/);
  if (!rawNumber) return Number.POSITIVE_INFINITY;

  const price = Number(rawNumber[0]);
  if (!Number.isFinite(price)) return Number.POSITIVE_INFINITY;

  if (normalized.includes("/ kg") || normalized.includes("=1 kg")) {
    return price;
  }

  if (normalized.includes("/ g")) {
    return price * 1000;
  }

  if (normalized.includes("/ l") || normalized.includes("=1 l")) {
    return price;
  }

  if (normalized.includes("/ ml")) {
    return price * 1000;
  }

  if (normalized.includes("/ kus")) {
    return price;
  }

  return Number.POSITIVE_INFINITY;
}

function scoreProductWithProfile(product: Product, query: string, options?: { recipe?: string; banned?: string[] }) {
  const profile = buildSearchProfile(query, options);
  const normalizedName = normalizePattern(product.name);
  const nameTokens = tokenize(product.name);
  const rawBaseScore = scoreProductMatch(product.name, query);

  if (profile.banned.some((pattern) => matchesPattern(normalizedName, nameTokens, pattern))) {
    return Number.NEGATIVE_INFINITY;
  }

  if (
    profile.requiredAll.length > 0 &&
    !profile.requiredAll.every((pattern) => matchesPattern(normalizedName, nameTokens, pattern))
  ) {
    return Number.NEGATIVE_INFINITY;
  }

  const matchedGroups = profile.requiredGroups.filter((group) =>
    matchesGroup(normalizedName, nameTokens, group),
  ).length;

  // Substituce: název neodpovídá textu dotazu (skóre 0, ne hard-fail), ale produkt
  // splňuje všechny synonymní skupiny třídy ingredience — např. dotaz "parmazán"
  // a produkt "Parmigiano Reggiano". Řadí se pod přímé shody.
  const matchedClassGroups = profile.classGroups.filter((group) =>
    matchesGroup(normalizedName, nameTokens, group),
  ).length;
  const isSubstitute =
    rawBaseScore === 0 &&
    profile.classGroups.length > 0 &&
    matchedClassGroups === profile.classGroups.length;

  if (rawBaseScore <= 0 && !isSubstitute) return Number.NEGATIVE_INFINITY;

  // Silná frázová shoda: název obsahuje celý dotaz — class pravidla (required/strict)
  // nesmí takový produkt vyřadit (např. "hovězí carpaccio" vs. třída syrového hovězího).
  // Hranice slova, ať to nechytá shodu uprostřed jiného tokenu.
  const normalizedQuery = normalizePattern(query);
  const phraseMatch =
    normalizedQuery.length > 0 &&
    ` ${normalizedName} `.includes(` ${normalizedQuery} `);

  if (!isSubstitute && !phraseMatch) {
    if (profile.requiredGroups.length > 0 && matchedGroups === 0) {
      return Number.NEGATIVE_INFINITY;
    }

    if (profile.strict && matchedGroups < profile.requiredGroups.length) {
      return Number.NEGATIVE_INFINITY;
    }
  }

  const baseScore = isSubstitute ? 100 : rawBaseScore;

  const matchedPreferred = profile.preferred.filter((pattern) =>
    matchesPattern(normalizedName, nameTokens, pattern),
  ).length;
  const cheapestStore = sortStoresByPrice(product.stores)[0];
  const bestPrice = parsePrice(cheapestStore?.price || "");
  const comparableUnitPrice = parseComparableUnitPrice(cheapestStore?.pricePerUnit || "");
  const packageWeightKg = parsePackageWeightKg(product.name);
  // Produkt bez jediné platné ceny se nefiltruje (může to být validní substituce),
  // ale musí skončit až za všemi produkty, které cenu mají.
  const noPricePenalty = Number.isFinite(bestPrice) ? 0 : 10000;
  const pricePenalty = Number.isFinite(bestPrice) ? Math.min(bestPrice / 12, 35) : 0;
  const unitPricePenalty =
    profile.preferUnitPrice && Number.isFinite(comparableUnitPrice)
      ? Math.min(comparableUnitPrice / 14, 45)
      : 0;
  const packagePenalty =
    profile.preferredMaxPackageKg &&
    packageWeightKg &&
    packageWeightKg > profile.preferredMaxPackageKg
      ? Math.min((packageWeightKg - profile.preferredMaxPackageKg) * 45, 70)
      : 0;

  return (
    baseScore +
    matchedGroups * 26 +
    matchedPreferred * 18 -
    Math.max(0, profile.requiredGroups.length - matchedGroups) * 16 -
    pricePenalty -
    unitPricePenalty -
    packagePenalty -
    noPricePenalty
  );
}

export function filterProductsForQuery(
  products: Product[],
  query: string,
  options?: { recipe?: string; banned?: string[] },
) {
  const profile = buildSearchProfile(query, options);
  const scored = products
    .map((product) => ({
      product,
      score: scoreProductWithProfile(product, query, options),
    }))
    .filter((entry) => Number.isFinite(entry.score))
    .sort((left, right) => {
      if (right.score !== left.score) {
        return right.score - left.score;
      }

      if (profile.preferUnitPrice) {
        const leftUnitPrice = parseComparableUnitPrice(
          sortStoresByPrice(left.product.stores)[0]?.pricePerUnit || "",
        );
        const rightUnitPrice = parseComparableUnitPrice(
          sortStoresByPrice(right.product.stores)[0]?.pricePerUnit || "",
        );

        if (leftUnitPrice !== rightUnitPrice) {
          return leftUnitPrice - rightUnitPrice;
        }
      }

      if (profile.preferredMaxPackageKg) {
        const leftPackageWeight = parsePackageWeightKg(left.product.name) ?? Number.POSITIVE_INFINITY;
        const rightPackageWeight = parsePackageWeightKg(right.product.name) ?? Number.POSITIVE_INFINITY;

        const leftOverflow = Math.max(0, leftPackageWeight - profile.preferredMaxPackageKg);
        const rightOverflow = Math.max(0, rightPackageWeight - profile.preferredMaxPackageKg);

        if (leftOverflow !== rightOverflow) {
          return leftOverflow - rightOverflow;
        }
      }

      return (
        parsePrice(sortStoresByPrice(left.product.stores)[0]?.price || "") -
        parsePrice(sortStoresByPrice(right.product.stores)[0]?.price || "")
      );
    })
    .map((entry) => entry.product);

  if (scored.length > 0) {
    return scored;
  }

  return profile.strict ? [] : products;
}
