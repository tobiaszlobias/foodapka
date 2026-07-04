import { normalizeText } from "@/lib/food";

export type IngredientPreset = {
  id: string;
  label: string;
  icon: string; // material symbol name
  query: string; // dotaz pro vyhledávání — široký, ať pokryje všechny varianty dané suroviny
  matchTokens: string[]; // normalizované tokeny pro rozpoznání v názvu produktu (hashtag ve výsledcích)
};

// Základní sada nejčastěji hlídaných surovin. `query` cílí na už existující
// široké třídy v lib/ingredientClasses.ts (např. "kuřecí" matchuje chicken_meat
// requiredGroups: [["kureci"]]), takže presety najdou produkt libovolného
// obchodu/značky/řezu, ne jen jeden konkrétní kus. `matchTokens` slouží k tomu,
// aby appka u libovolného výsledku vyhledávání poznala, do které kategorie
// produkt patří (hashtag chip), bez nutnosti volat server.
export const INGREDIENT_PRESETS: IngredientPreset[] = [
  // Maso
  { id: "chicken", label: "Kuřecí", icon: "kebab_dining", query: "kuřecí", matchTokens: ["kureci"] },
  { id: "beef", label: "Hovězí", icon: "kebab_dining", query: "hovězí maso", matchTokens: ["hovezi"] },
  { id: "pork", label: "Vepřové", icon: "kebab_dining", query: "vepřové maso", matchTokens: ["veprove", "vepr"] },
  // Mléčné a vejce
  { id: "milk", label: "Mléko", icon: "water_full", query: "mléko trvanlivé", matchTokens: ["mleko"] },
  { id: "butter", label: "Máslo", icon: "egg", query: "máslo", matchTokens: ["maslo"] },
  { id: "eggs", label: "Vejce", icon: "egg", query: "vejce", matchTokens: ["vejce", "vajec"] },
  { id: "cheese", label: "Sýr", icon: "brunch_dining", query: "eidam", matchTokens: ["syr", "eidam", "gouda", "cheddar"] },
  // Základ / sacharidy
  { id: "rice", label: "Rýže", icon: "rice_bowl", query: "rýže", matchTokens: ["ryze"] },
  { id: "pasta", label: "Těstoviny", icon: "ramen_dining", query: "těstoviny", matchTokens: ["testoviny", "spagety"] },
  { id: "potatoes", label: "Brambory", icon: "nutrition", query: "brambory", matchTokens: ["brambor"] },
  // Zelenina
  { id: "onion", label: "Cibule", icon: "eco", query: "cibule", matchTokens: ["cibule"] },
  { id: "carrot", label: "Mrkev", icon: "eco", query: "mrkev", matchTokens: ["mrkev"] },
  { id: "tomato", label: "Rajčata", icon: "eco", query: "rajčata", matchTokens: ["rajce", "rajcat"] },
  { id: "cucumber", label: "Okurka", icon: "eco", query: "okurka", matchTokens: ["okurk"] },
  { id: "pepper", label: "Paprika", icon: "eco", query: "paprika", matchTokens: ["paprik"] },
  // Ovoce
  { id: "banana", label: "Banány", icon: "nutrition", query: "banán", matchTokens: ["banan"] },
  { id: "apple", label: "Jablka", icon: "nutrition", query: "jablka", matchTokens: ["jablk"] },
  // Základní zásoby / koření
  { id: "oil", label: "Olej", icon: "water_drop", query: "slunečnicový olej", matchTokens: ["olej"] },
  { id: "vinegar", label: "Ocet", icon: "water_drop", query: "ocet", matchTokens: ["ocet"] },
  { id: "flour", label: "Mouka", icon: "grain", query: "hladká mouka", matchTokens: ["mouka"] },
  { id: "sugar", label: "Cukr", icon: "grain", query: "cukr krystal", matchTokens: ["cukr"] },
];

/** Najde první preset, jehož matchTokens se objevují v (normalizovaném) názvu produktu. */
export function matchIngredientPreset(productName: string): IngredientPreset | null {
  const normalized = normalizeText(productName);
  return (
    INGREDIENT_PRESETS.find((preset) =>
      preset.matchTokens.some((token) => normalized.includes(token)),
    ) ?? null
  );
}
