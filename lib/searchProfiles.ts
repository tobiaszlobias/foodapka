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
  preferred: string[];
  banned: string[];
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
  "chips",
  "dip",
  "dresink",
  "dzus",
  "hotove jidlo",
  "instantni",
  "juice",
  "koreni",
  "napoj",
  "ochucene",
  "omacka",
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
  "zalevka",
];

const RAW_MEAT_BANNED = [
  "burger",
  "carpaccio",
  "gulasovka",
  "jerky",
  "klobasa",
  "konzerva",
  "kostka",
  "mlete",
  "parek",
  "pastrami",
  "pastika",
  "ready",
  "salam",
  "sunka",
  "uzeniny",
  "vyvar",
];

const PREPARED_MEAT_BANNED = [
  "gyros",
  "marinovane",
  "natrhani",
  "ochucene",
  "pomalu varena",
  "pomalu varene",
  "pyre",
  "sous vide",
  "trhane",
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

function addPreferred(profile: SearchProfile, values: string[]) {
  profile.preferred.push(...values.map((value) => normalizePattern(value)).filter(Boolean));
}

function addBanned(profile: SearchProfile, values: string[]) {
  profile.banned.push(...values.map((value) => normalizePattern(value)).filter(Boolean));
}

function buildSearchProfile(query: string, recipe?: string) {
  const normalizedQuery = normalizePattern(query);
  const queryTokens = tokenize(query);
  const recipeText = normalizePattern(recipe ?? "");

  const profile: SearchProfile = {
    requiredGroups: [],
    preferred: [],
    banned: [],
    strict: false,
    preferUnitPrice: false,
    preferredMaxPackageKg: undefined,
  };

  const resolvedClassConfig = resolveIngredientRuleConfig(query, recipe);
  profile.requiredGroups.push(...(resolvedClassConfig.requiredGroups ?? []));
  profile.preferred.push(...(resolvedClassConfig.preferred ?? []));
  profile.banned.push(...(resolvedClassConfig.banned ?? []));
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

  if (normalizedQuery.includes("mleko")) {
    profile.strict = true;
    profile.preferUnitPrice = true;
    addGroup(profile, ["mleko"]);
    addBanned(profile, [
      "aperol",
      "cokolada",
      "dzus",
      "juice",
      "kofola",
      "krem",
      "kubik",
      "napoj",
      "nutella",
      "puding",
      "sirup",
      "smoothie",
      "susenky",
    ]);
  }

  if (normalizedQuery.includes("laktoz")) {
    profile.strict = true;
    addGroup(profile, ["laktoz", "bez laktoz"]);
    addPreferred(profile, ["bez laktoz"]);
  }

  if (normalizedQuery.includes("hovezi")) {
    profile.strict = true;
    profile.preferUnitPrice = true;
    profile.preferredMaxPackageKg = 1.2;
    addGroup(profile, ["hovezi"]);
    addGroup(profile, ["maso", "kostky", "kližka", "klizka", "plec", "zadni", "predni"]);
    addPreferred(profile, ["kližka", "klizka", "plec", "zadni", "predni", "kostky"]);
    addBanned(profile, [...RAW_MEAT_BANNED, "koreni"]);
  }

  if (normalizedQuery.includes("mrkev")) {
    profile.strict = true;
    profile.preferUnitPrice = true;
    addGroup(profile, ["mrkev"]);
    addBanned(profile, ["dzus", "juice", "kubik", "napoj", "sirup", "smoothie"]);
  }

  if (normalizedQuery.includes("salat")) {
    profile.strict = true;
    profile.preferUnitPrice = true;
    addGroup(profile, ["salat"]);
    addBanned(profile, ["s jogurtem", "s tunakem", "dresink", "mix", "zalevka"]);
  }

  if (normalizedQuery.includes("smetana")) {
    profile.preferUnitPrice = true;
    addGroup(profile, ["smetana"]);
    addBanned(profile, ["dekor", "kapsle", "susena", "zmrzlina", "ready"]);

    if (recipeText.includes("svickova") || recipeText.includes("omacka")) {
      profile.strict = true;
      addGroup(profile, ["na vareni", "12", "30", "31", "33"]);
      addPreferred(profile, ["na vareni", "30", "31", "33"]);
      addBanned(profile, ["do kavy", "kava", "10x10"]);
    }
  }

  if (normalizedQuery.includes("tortilla")) {
    profile.strict = true;
    profile.preferUnitPrice = true;
    addGroup(profile, ["tortilla", "wrap"]);
    addGroup(profile, ["placky", "ks", "6 ks", "8 ks", "psenicne", "mexicke"]);
    addPreferred(profile, ["wrap", "placky", "psenicne"]);
    addBanned(profile, ["chips", "nachos", "dort", "torty", "chio", "syrove", "paprikove"]);
  }

  if (normalizedQuery.includes("kureci")) {
    profile.preferUnitPrice = true;
    profile.preferredMaxPackageKg = 1.2;
    addGroup(profile, ["kureci"]);
    addBanned(profile, [
      "bujon",
      "granule",
      "kapsicka",
      "krmivo",
      "polevka",
      "vyvar",
      ...RAW_MEAT_BANNED,
      ...PREPARED_MEAT_BANNED,
    ]);
  }

  if (normalizedQuery.includes("prsa") || normalizedQuery.includes("prsni")) {
    profile.strict = true;
    profile.preferUnitPrice = true;
    profile.preferredMaxPackageKg = 1.2;
    addGroup(profile, ["prsa", "prsni", "rizky", "filet"]);
    addPreferred(profile, ["cerstve", "chlazene"]);
    addBanned(profile, ["cele kure", "ctvrtky", "stehna", "kridla", "mrazene", "ready"]);
  }

  if (normalizedQuery.includes("slanina")) {
    profile.strict = true;
    profile.preferUnitPrice = true;
    profile.preferredMaxPackageKg = 0.6;
    addGroup(profile, ["slanina", "bacon", "anglicka"]);
    addBanned(profile, ["chips", "prichut", "tycinky", "dresink", "dip"]);
  }

  if (normalizedQuery.includes("cesnek")) {
    profile.strict = true;
    profile.preferUnitPrice = true;
    addGroup(profile, ["cesnek"]);
    addPreferred(profile, ["cerstvy", "palicka", "strouzky"]);
    addBanned(profile, [
      "bageta",
      "dip",
      "dresink",
      "omacka",
      "s jogurtem",
      "suseny",
      "zalevka",
      "koreni",
    ]);
  }

  if (normalizedQuery.includes("vejce")) {
    profile.strict = true;
    profile.preferUnitPrice = true;
    addGroup(profile, ["vejce", "vajicka"]);
    addPreferred(profile, ["cerstva", "6 ks", "10 ks", "12 ks", "m", "l"]);
    addBanned(profile, [
      "aspik",
      "cokolada",
      "dekorace",
      "figurka",
      "motivy",
      "pomazanka",
      "prekvapeni",
      "rapernik",
      "salat",
      "sladkost",
      "velikonocni",
    ]);
  }

  if (normalizedQuery.includes("parmaz") || normalizedQuery.includes("parmez") || normalizedQuery.includes("grana")) {
    profile.strict = true;
    profile.preferUnitPrice = true;
    addGroup(profile, ["parmazan", "parmezan", "parmesan", "grana", "padano", "gran moravia"]);
    addPreferred(profile, ["grana padano", "gran moravia", "parmazan"]);
    addBanned(profile, ["chips", "omacka", "pomazanka", "prichut", "strouhanka"]);
  }

  if (normalizedQuery.includes("spagety")) {
    profile.strict = true;
    profile.preferUnitPrice = true;
    addGroup(profile, ["spagety"]);
    addBanned(profile, ["hotove jidlo", "omacka", "polevka", "salat"]);
  }

  if (recipeText.includes("wrap")) {
    if (normalizedQuery.includes("kureci")) {
      profile.strict = true;
      addGroup(profile, ["prsa", "prsni", "rizky", "filet"]);
      addPreferred(profile, ["cerstve", "chlazene"]);
      addBanned(profile, [
        "mrazene",
        "cele kure",
        "ctvrtky",
        "stehna",
        "kridla",
        "ready",
        ...PREPARED_MEAT_BANNED,
      ]);
    }

    if (normalizedQuery.includes("tortilla")) {
      profile.strict = true;
      addGroup(profile, ["placky", "wrap", "psenicne"]);
      addPreferred(profile, ["wrap", "placky", "psenicne"]);
    }
  }

  profile.preferred = Array.from(new Set(profile.preferred));
  profile.banned = Array.from(new Set(profile.banned));
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

function scoreProductWithProfile(product: Product, query: string, recipe?: string) {
  const profile = buildSearchProfile(query, recipe);
  const normalizedName = normalizePattern(product.name);
  const nameTokens = tokenize(product.name);
  const baseScore = scoreProductMatch(product.name, query);

  if (baseScore <= 0) return Number.NEGATIVE_INFINITY;

  if (profile.banned.some((pattern) => matchesPattern(normalizedName, nameTokens, pattern))) {
    return Number.NEGATIVE_INFINITY;
  }

  const matchedGroups = profile.requiredGroups.filter((group) =>
    matchesGroup(normalizedName, nameTokens, group),
  ).length;

  if (profile.requiredGroups.length > 0 && matchedGroups === 0) {
    return Number.NEGATIVE_INFINITY;
  }

  if (profile.strict && matchedGroups < profile.requiredGroups.length) {
    return Number.NEGATIVE_INFINITY;
  }

  const matchedPreferred = profile.preferred.filter((pattern) =>
    matchesPattern(normalizedName, nameTokens, pattern),
  ).length;
  const cheapestStore = sortStoresByPrice(product.stores)[0];
  const bestPrice = parsePrice(cheapestStore?.price || "");
  const comparableUnitPrice = parseComparableUnitPrice(cheapestStore?.pricePerUnit || "");
  const packageWeightKg = parsePackageWeightKg(product.name);
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
    packagePenalty
  );
}

export function filterProductsForQuery(
  products: Product[],
  query: string,
  options?: { recipe?: string },
) {
  const profile = buildSearchProfile(query, options?.recipe);
  const scored = products
    .map((product) => ({
      product,
      score: scoreProductWithProfile(product, query, options?.recipe),
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
