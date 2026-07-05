import { normalizeText } from "@/lib/food";

// Pořadí je důležité — první shoda vyhrává (musí odpovídat pravidlům v getStoreLogoPath).
const CHAIN_NAME_RULES: { match: string; canonical: string }[] = [
  { match: "kaufland", canonical: "Kaufland" },
  { match: "lidl", canonical: "Lidl" },
  { match: "albert", canonical: "Albert" },
  { match: "tesco", canonical: "Tesco" },
  { match: "globus", canonical: "Globus" },
  { match: "billa", canonical: "Billa" },
  { match: "penny", canonical: "Penny" },
  { match: "flop", canonical: "FLOP TOP" },
  { match: "jip", canonical: "JIP" },
  { match: "hruska", canonical: "Hruška" },
  { match: "coop", canonical: "Coop" },
  { match: "ratio", canonical: "Ratio" },
  { match: "bene", canonical: "Bene" },
  { match: "cba", canonical: "CBA" },
  { match: "tamda", canonical: "Tamda Foods" },
  { match: "kosik", canonical: "Košík.cz" },
];

/** Sloučí varianty téhož řetězce (např. "Albert supermarket"/"Albert hypermarket" → "Albert")
 * pod jeden zobrazovaný název — stejná fuzzy pravidla jako getStoreLogoPath. */
export function canonicalChainName(shopName: string) {
  const normalized = normalizeText(shopName);
  return CHAIN_NAME_RULES.find((rule) => normalized.includes(rule.match))?.canonical ?? shopName;
}

export function getStoreLogoPath(shopName: string) {
  const normalizedShopName = normalizeText(shopName);

  if (normalizedShopName.includes("kaufland")) {
    return "/kauflandlogo.png";
  }

  if (normalizedShopName.includes("lidl")) {
    return "/lidllogo.png";
  }

  if (normalizedShopName.includes("albert")) {
    return "/albertlogo.png";
  }

  if (normalizedShopName.includes("tesco")) {
    return "/tescologo.png";
  }

  if (normalizedShopName.includes("globus")) {
    return "/globuslogo.png";
  }

  if (normalizedShopName.includes("billa")) {
    return "/billalogo.png";
  }

  if (normalizedShopName.includes("penny")) {
    return "/pennylogo.png";
  }

  if (normalizedShopName.includes("flop")) {
    return "/logo-flop-top-web.png";
  }

  if (normalizedShopName.includes("jip")) {
    return "/jiplogo.png";
  }

  if (normalizedShopName.includes("hruska")) {
    return "/hruskalogo.png";
  }

  if (normalizedShopName.includes("coop")) {
    return "/coop_logo_transparent.png";
  }

  if (normalizedShopName.includes("ratio")) {
    return "/ratio_logo.png";
  }

  if (normalizedShopName.includes("bene")) {
    return "/benenapoje_logo.png";
  }

  if (normalizedShopName.includes("cba")) {
    return "/cba_logo.png";
  }

  if (normalizedShopName.includes("tamda")) {
    return "/tamdafoods_logo.png";
  }

  if (normalizedShopName.includes("kosik")) {
    return "/kosikcz_logo.png";
  }

  return null;
}
