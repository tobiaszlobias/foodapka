export type RecipeIngredient = {
  name: string;
  searchQuery?: string;
  banned?: string[];
  /** Množství na základní počet porcí (baseServings) — např. "300 g", "1 lžíce". */
  amount?: string;
  /** Číselná hodnota množství, pokud je amount v jednotce, kterou lze přepočítat podle porcí (g, ks, lžíce...). */
  amountValue?: number;
  amountUnit?: string;
};

export type RecipeTiming = {
  prepMinutes: number;
  cookMinutes: number;
};

export type MealType = "noodles" | "pasta" | "rice" | "salad" | "other";
export type MainProtein = "chicken" | "beef" | "fish" | "pork" | "vegetarian";

export type RecipeNutrition = {
  /** Kalorie na porci */
  calories: number;
  /** Gramy bílkovin na porci */
  protein: number;
};

export type RecipePreset = {
  name: string;
  tag: string;
  description: string;
  ingredients: (string | RecipeIngredient)[];
  instructions?: string[];
  aliases?: string[];
  image?: string;
  nutrition?: RecipeNutrition;
  mealType?: MealType;
  mainProtein?: MainProtein;
  onePan?: boolean;
  timing?: RecipeTiming;
  /** Počet porcí, ke kterému se vztahuje amountValue u ingrediencí. */
  baseServings?: number;
};

export const RECIPE_PRESETS: RecipePreset[] = [
  {
    name: "Zdravé krabičkové kuře s rýží",
    tag: "Krabičkové",
    description:
      "Jednoduchý meal prep na více dní s kuřecím masem, rýží a zeleninou.",
    ingredients: [
      { name: "kuřecí prsa", searchQuery: "kuřecí prsa čerstvá", banned: ["mražené", "polotovar", "šunka"] },
      { name: "rýže", searchQuery: "rýže 1kg", banned: ["kaše", "chlebíčky", "mléčná"] },
      "brokolice",
      "mrkev",
      "paprika"
    ],
    aliases: ["krabickove kure", "meal prep", "kuře s rýží", "kure s ryzi"],
    image: "/krabickove kure.png",
  },
  {
    name: "Tortilla wrap s kuřetem",
    tag: "Něco na zub",
    description:
      "Rychlá slaná varianta do ruky vhodná na oběd i večerní hlad.",
    ingredients: [
      { name: "tortilla", searchQuery: "tortilla placky", banned: ["chips", "chipsy", "nachos"] },
      { name: "kuřecí prsa", searchQuery: "kuřecí prsa", banned: ["mražené", "šunka"] },
      "ledový salát",
      "rajčata",
      "eidam",
    ],
    aliases: ["wrap", "tortilla", "wrap s kuretem"],
    image: "/tortila kure.png",
  },
  {
    name: "Overnight oats s ovocem",
    tag: "Fit snídaně",
    description:
      "Levná a sytá snídaně z vloček, jogurtu nebo mléka a ovoce.",
    ingredients: [
      { name: "ovesné vločky", searchQuery: "ovesné vločky", banned: ["kaše", "tyčinka", "sušenky"] },
      { name: "řecký jogurt", searchQuery: "řecký jogurt bílý", banned: ["ochucený", "nápoj", "sladký"] },
      "banán",
      "jahody",
      "med"
    ],
    aliases: ["overnight oats", "ovesna kase", "fit snidane"],
    image: "/overnight oats.png",
  },
  {
    name: "Domácí hummus s pita chlebem",
    tag: "Snack",
    description:
      "Něco k televizi nebo pro návštěvu bez složité přípravy.",
    ingredients: [
      { name: "cizrna", searchQuery: "cizrna konzerva", banned: ["mouka", "křupky"] },
      { name: "tahini", searchQuery: "tahini pasta", banned: ["dresink", "omáčka"] },
      "česnek",
      "olivový olej",
      { name: "pita chléb", searchQuery: "pita chléb", banned: ["chips", "nachos"] }
    ],
    aliases: ["hummus", "snack", "neco na zub"],
    image: "/humus.png",
  },
  {
    name: "Těstovinový salát s mozzarellou",
    tag: "Lehká večeře",
    description:
      "Studená varianta do krabičky s těstovinami, zeleninou a sýrem.",
    ingredients: [
      { name: "těstoviny", searchQuery: "těstoviny penne", banned: ["hotové", "polévka"] },
      { name: "mozzarella", searchQuery: "mozzarella 125g", banned: ["strouhaná", "pizza", "tyčinky"] },
      "rajčata",
      "okurka",
      "rukola"
    ],
    aliases: ["testovinovy salat", "salat s mozzarellou"],
    image: "/hero-food.png",
  },
  {
    name: "Banánové lívance",
    tag: "Sladké",
    description:
      "Rychlá sladká klasika z pár surovin, vhodná na snídani i svačinu.",
    ingredients: [
      "banán",
      "vejce",
      { name: "ovesné vločky", searchQuery: "ovesné vločky jemné", banned: ["sušenky"] },
      "mléko",
      "skořice"
    ],
    aliases: ["livance", "bananove livance", "sladke"],
    image: "/livance.png",
  },
  {
    name: "Špagety carbonara",
    tag: "Klasika",
    description: "Oblíbená těstovinová klasika s pár základními surovinami. Klíčem je kvalitní slanina a parmazán.",
    ingredients: [
      { name: "špagety", searchQuery: "špagety semolinové", banned: ["hotové jídlo"] },
      { name: "slanina", searchQuery: "anglická slanina", banned: ["chips", "křupky"] },
      "vejce",
      { name: "parmazán", searchQuery: "parmazán blok", banned: ["omáčka", "chips", "strouhaný"] },
      "česnek"
    ],
    instructions: [
      "Dejte vařit špagety do osolené vody.",
      "Na pánvi orestujte nakrájenou slaninu s česnekem.",
      "V misce prošlehejte vejce s nastrouhaným parmazánem.",
      "Uvařené špagety přidejte k slanině, stáhněte z ohně a vmíchejte vaječnou směs.",
      "Míchejte, dokud omáčka nezhoustne díky zbytkovému teplu."
    ],
    aliases: ["carbonara", "spagety carbonara"],
    image: "/carbonara.png",
  },
  {
    name: "Svíčková",
    tag: "Klasika",
    description:
      "Tradiční české jídlo s hovězím masem, kořenovou zeleninou a smetanou.",
    ingredients: [
      { name: "hovězí maso", searchQuery: "hovězí zadní", banned: ["mleté", "mix", "kostky"] },
      "mrkev",
      { name: "celer", searchQuery: "celer bulva", banned: ["řapíkatý", "stonky"] },
      { name: "petržel", searchQuery: "petržel kořen", banned: ["nať", "sušená"] },
      { name: "smetana", searchQuery: "smetana 30%", banned: ["do kávy", "rostlinná"] },
    ],
    aliases: ["svickova"],
    image: "/svickova.png",
  },
  {
    name: "Studené nudle se sójovou omáčkou a kuřecím masem",
    tag: "Fit oběd",
    description:
      "Osvěžující studený pokrm s pikantním mletým kuřetem, hedvábným tofu a udon nudlemi — ideální na horké dny.",
    ingredients: [
      { name: "hedvábné tofu", searchQuery: "tofu hedvábné silken", banned: ["uzené", "smažené"], amount: "300 g", amountValue: 300, amountUnit: "g" },
      { name: "arašídové máslo", searchQuery: "arašídové máslo", banned: ["sušenky", "tyčinka"], amount: "1 lžíce", amountValue: 1, amountUnit: "lžíce" },
      { name: "sójová omáčka", searchQuery: "sójová omáčka", banned: ["kečup"], amount: "1 lžíce", amountValue: 1, amountUnit: "lžíce" },
      { name: "rybí omáčka", searchQuery: "rybí omáčka", banned: [], amount: "1 lžíce", amountValue: 1, amountUnit: "lžíce" },
      { name: "led", amount: "4 kostky", amountValue: 4, amountUnit: "kostky" },
      { name: "kuřecí mleté maso", searchQuery: "kuřecí mleté maso", banned: ["hotové", "karbanátky"], amount: "250 g", amountValue: 250, amountUnit: "g" },
      { name: "avokádový olej", searchQuery: "avokádový olej", banned: [], amount: "1 lžička", amountValue: 1, amountUnit: "lžička" },
      { name: "gochugaru", searchQuery: "gochugaru chilli koření", banned: [], amount: "1 lžíce", amountValue: 1, amountUnit: "lžíce" },
      { name: "tmavá sójová omáčka", searchQuery: "tmavá sójová omáčka", banned: [], amount: "1 lžíce", amountValue: 1, amountUnit: "lžíce" },
      { name: "sůl", amount: "1 lžička", amountValue: 1, amountUnit: "lžička" },
      { name: "sezamová semínka", searchQuery: "sezamová semínka", banned: ["olej", "tyčinka"], amount: "1 lžíce", amountValue: 1, amountUnit: "lžíce" },
      { name: "udon nudle", searchQuery: "udon nudle mražené", banned: ["instantní", "polévka"], amount: "400 g", amountValue: 400, amountUnit: "g" },
      { name: "vejce", amount: "2 ks", amountValue: 2, amountUnit: "ks" },
      { name: "okurka", amount: "1 ks", amountValue: 1, amountUnit: "ks" },
      { name: "jarní cibulka", amount: "podle chuti" },
    ],
    instructions: [
      "Rozmixujte hedvábné tofu s arašídovým máslem, sójovou a rybí omáčkou a ledem do hladké studené omáčky.",
      "Na pánvi orestujte kuřecí mleté maso na avokádovém oleji s gochugaru, tmavou sójovou omáčkou a solí do křupava, na závěr posypte sezamovými semínky.",
      "Uvařte udon nudle podle návodu, propláchněte studenou vodou.",
      "Uvařte vejce natvrdo/na měkko podle chuti, rozpulte.",
      "Nudle zalijte studenou sójovou omáčkou, přidejte kuřecí drť, nakrájenou okurku, jarní cibulku a vejce.",
    ],
    aliases: ["studene nudle", "soy chicken noodles", "cold soy noodles"],
    nutrition: { calories: 680, protein: 50 },
    mealType: "noodles",
    mainProtein: "chicken",
    onePan: false,
    timing: { prepMinutes: 15, cookMinutes: 15 },
    baseServings: 2,
  },
];

function normalize(value: string) {
  return value
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim();
}

export function recipeSlug(name: string) {
  return name
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export function findRecipeBySlug(slug: string) {
  return RECIPE_PRESETS.find((recipe) => recipeSlug(recipe.name) === slug);
}

export function findRecipeByName(query: string) {
  const normalized = normalize(query);

  return RECIPE_PRESETS.find((recipe) => {
    const names = [recipe.name, ...(recipe.aliases ?? [])].map(normalize);
    return names.some(
      (name) =>
        name === normalized ||
        name.includes(normalized) ||
        normalized.includes(name),
    );
  });
}
