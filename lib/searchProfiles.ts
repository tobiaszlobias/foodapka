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
  /** Alternativní znění dotazu z třídy ingredience — produkt se skóruje i proti nim, ne jen proti původnímu textu */
  queryAlternatives: string[];
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
  "horalky",
  "hotove jidlo",
  "instantni",
  "juice",
  "kolac",
  "koreni",
  "napoj",
  "napolitank",
  "ochucene",
  "omacka",
  "oplatk",
  "pecivo",
  "polevka",
  "prichut",
  "protein",
  "pure",
  "pyre",
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

// Konzervativní český stemmer nad už normalizovaným textem (bez diakritiky,
// lowercase). Ořízne jednu pádovou/adjektivní koncovku z konce — ne aby stem byl
// lingvisticky "správný", ale aby "mražené"/"mražená"/"mražený" nebo "hotového"/
// "hotové" spadly na stejný základ. Ořízne se jen tehdy, když po odseknutí zbydou
// aspoň 4 znaky — jinak by se krátká slova (typu "máslo" vs. "máslový") srážela
// falešně dohromady. Koncovka "-i" má práh přísnější (6 znaků): "příchutí" se má
// srazit s "příchuť", ale "koření" se NESMÍ srazit s "kořen" — jinak by ban
// "koreni" u syrových surovin falešně vyřadil produkty typu "Zázvor kořen".
function stemToken(token: string): string {
  const endings: Array<[string, number]> = [
    ["eho", 4],
    ["emu", 4],
    ["ych", 4],
    ["ymi", 4],
    ["iho", 4],
    ["imu", 4],
    ["ou", 4],
    ["a", 4],
    ["e", 4],
    ["i", 6],
    ["y", 4],
    ["u", 4],
    ["o", 4],
  ];
  for (const [ending, minStemLength] of endings) {
    if (token.endsWith(ending) && token.length - ending.length >= minStemLength) {
      return token.slice(0, token.length - ending.length);
    }
  }
  return token;
}

function matchesPattern(normalizedName: string, nameTokens: string[], pattern: string) {
  const normalizedPattern = normalizePattern(pattern);
  if (!normalizedPattern) return false;

  if (normalizedPattern.includes(" ")) {
    if (normalizedName.includes(normalizedPattern)) return true;

    // Fallback přes stemy pro víceslovné patterny — "hotové jídlo" má chytit i
    // "hotového jídla" atd. Stemované tokeny patternu musí tvořit souvislou
    // podsekvenci stemovaných tokenů názvu (sliding window), aby se nechytaly
    // shody v náhodném pořadí nebo přes jiná slova.
    const patternStems = normalizedPattern.split(" ").filter(Boolean).map(stemToken);
    const nameStems = nameTokens.map(stemToken);
    if (patternStems.length === 0) return false;

    for (let start = 0; start <= nameStems.length - patternStems.length; start += 1) {
      let allMatch = true;
      for (let offset = 0; offset < patternStems.length; offset += 1) {
        if (nameStems[start + offset] !== patternStems[offset]) {
          allMatch = false;
          break;
        }
      }
      if (allMatch) return true;
    }
    return false;
  }

  const patternStem = stemToken(normalizedPattern);
  return nameTokens.some(
    (token) =>
      token === normalizedPattern ||
      (normalizedPattern.length >= 5 && token.startsWith(normalizedPattern)) ||
      stemToken(token) === patternStem,
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
    queryAlternatives: [],
    strict: false,
    preferUnitPrice: false,
    preferredMaxPackageKg: undefined,
  };

  const resolvedClassConfig = resolveIngredientRuleConfig(query, options?.recipe);
  profile.requiredGroups.push(...(resolvedClassConfig.requiredGroups ?? []));
  profile.classGroups = resolvedClassConfig.requiredGroups ?? [];
  profile.preferred.push(...(resolvedClassConfig.preferred ?? []));
  profile.banned.push(...(resolvedClassConfig.banned ?? []));
  profile.queryAlternatives = resolvedClassConfig.queryAlternatives ?? [];

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

/**
 * Vrátí cenu přepočtenou na Kč/kg (nebo Kč/l, Kč/kus) ze syrového textu jako
 * "8,95 Kč / 100 g" nebo "24,90 Kč / kg" — musí pracovat na PŮVODNÍM textu
 * (ne po normalizeText/normalizePattern), protože ta odstraňuje lomítka i
 * mezery mezi číslem a jednotkou, takže by se "100 g" nedalo od "kg" odlišit.
 */
function parseComparableUnitPrice(value: string) {
  // nezlomitelná mezera ( ) se v datech zdrojů běžně vyskytuje místo běžné
  const withNbspAsSpace = value.replace(/ /g, " ");
  const match = withNbspAsSpace.match(
    /([\d.,]+)\s*Kč\s*\/\s*([\d.,]+)?\s*(kg|g|l|ml|kus|ks)\b/i,
  );
  if (!match) return Number.POSITIVE_INFINITY;

  const price = Number(match[1].replace(",", "."));
  if (!Number.isFinite(price)) return Number.POSITIVE_INFINITY;

  const unitAmount = match[2] ? Number(match[2].replace(",", ".")) : 1;
  if (!Number.isFinite(unitAmount) || unitAmount <= 0) return Number.POSITIVE_INFINITY;

  const unit = match[3].toLowerCase();
  const pricePerBaseUnit = price / unitAmount;

  if (unit === "kg" || unit === "l" || unit === "kus" || unit === "ks") {
    return pricePerBaseUnit;
  }
  // g nebo ml — přepočet na kg/l (× 1000)
  return pricePerBaseUnit * 1000;
}

function scoreProductWithProfile(product: Product, query: string, options?: { recipe?: string; banned?: string[] }) {
  const profile = buildSearchProfile(query, options);
  const normalizedName = normalizePattern(product.name);
  const nameTokens = tokenize(product.name);
  // Produkty nalezené přes alternativní znění dotazu (viz queryAlternatives u třídy
  // ingredience) se musí skórovat i proti tomuto znění, jinak vypadnou jen proto,
  // že jejich název neodpovídá původnímu textu dotazu.
  const rawBaseScore = profile.queryAlternatives.reduce(
    (best, alt) => Math.max(best, scoreProductMatch(product.name, alt)),
    scoreProductMatch(product.name, query),
  );

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

  // Substituce: název neodpovídá textu dotazu (skóre 0 nebo záporné, ne hard-fail),
  // ale produkt splňuje všechny synonymní skupiny třídy ingredience — např. dotaz
  // "parmazán" a produkt "Parmigiano Reggiano". Řadí se pod přímé shody.
  const matchedClassGroups = profile.classGroups.filter((group) =>
    matchesGroup(normalizedName, nameTokens, group),
  ).length;
  const isSubstitute =
    rawBaseScore <= 0 &&
    profile.classGroups.length > 0 &&
    matchedClassGroups === profile.classGroups.length;

  if (rawBaseScore <= 0 && !isSubstitute) return Number.NEGATIVE_INFINITY;

  // Silná frázová shoda: název obsahuje celý dotaz (nebo některou z jeho alternativ)
  // — class pravidla (required/strict) nesmí takový produkt vyřadit (např. "hovězí
  // carpaccio" vs. třída syrového hovězího). Hranice slova, ať to nechytá shodu
  // uprostřed jiného tokenu.
  const normalizedQuery = normalizePattern(query);
  const phraseMatch =
    (normalizedQuery.length > 0 &&
      ` ${normalizedName} `.includes(` ${normalizedQuery} `)) ||
    profile.queryAlternatives.some((alt) => {
      const normalizedAlt = normalizePattern(alt);
      return (
        normalizedAlt.length > 0 &&
        ` ${normalizedName} `.includes(` ${normalizedAlt} `)
      );
    });

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
  // Cena za jednotku (Kč/kg, Kč/l...) je realističtější srovnání napříč
  // různými velikostmi balení než absolutní cena — bere se jako hlavní
  // cenové kritérium vždy, když ji zdroj dodal (preferUnitPrice u třídy
  // ingredience penaltu jen zesiluje pro případy, kde na tom extra záleží).
  const unitPricePenalty = Number.isFinite(comparableUnitPrice)
    ? Math.min(comparableUnitPrice / (profile.preferUnitPrice ? 14 : 20), 45)
    : 0;
  const pricePenalty = !Number.isFinite(comparableUnitPrice) && Number.isFinite(bestPrice)
    ? Math.min(bestPrice / 12, 35)
    : 0;
  const packagePenalty =
    profile.preferredMaxPackageKg &&
    packageWeightKg &&
    packageWeightKg > profile.preferredMaxPackageKg
      ? Math.min((packageWeightKg - profile.preferredMaxPackageKg) * 45, 70)
      : 0;
  // Appka má primárně šetřit peníze — mezi produkty s podobnou textovou
  // relevancí musí vyhrát ten v akci, i kdyby měl o něco horší cenu za
  // jednotku (penalta srovnatelná se stropem unitPricePenalty/pricePenalty
  // výše). Skutečně nerelevantní produkty to nezachrání — ty padají na
  // hard-failu (NEGATIVE_INFINITY) dřív, tahle penalta se k nim nedostane.
  const salePenalty = cheapestStore?.isSale ? 0 : 50;

  return (
    baseScore +
    matchedGroups * 26 +
    matchedPreferred * 18 -
    Math.max(0, profile.requiredGroups.length - matchedGroups) * 16 -
    pricePenalty -
    unitPricePenalty -
    packagePenalty -
    salePenalty -
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

      const leftCheapest = sortStoresByPrice(left.product.stores)[0];
      const rightCheapest = sortStoresByPrice(right.product.stores)[0];
      const leftUnitPrice = parseComparableUnitPrice(leftCheapest?.pricePerUnit || "");
      const rightUnitPrice = parseComparableUnitPrice(rightCheapest?.pricePerUnit || "");

      if (Number.isFinite(leftUnitPrice) && Number.isFinite(rightUnitPrice) && leftUnitPrice !== rightUnitPrice) {
        return leftUnitPrice - rightUnitPrice;
      }

      if (!!leftCheapest?.isSale !== !!rightCheapest?.isSale) {
        return leftCheapest?.isSale ? -1 : 1;
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

  // Poctivé prázdno je lepší než vracet nesouvisející produkty — po opravě
  // scraperů (kupi gate) a dotažení required/strict pravidel už "nic
  // neskórovalo" znamená skutečně žádnou shodu, ne díru k zalepení.
  return scored;
}
