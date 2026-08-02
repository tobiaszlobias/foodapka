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
  /** Gramy tuku na porci */
  fat?: number;
  /** Gramy sacharidů na porci */
  carbs?: number;
  /** Gramy vlákniny na porci */
  fiber?: number;
};

export type RecipeStep = {
  text: string;
  /** Indexy do pole ingredients, které se v tomto kroku používají (pro chips pod textem kroku). */
  ingredientIndexes?: number[];
};

export type RecipePreset = {
  name: string;
  tags: string[];
  description: string;
  ingredients: (string | RecipeIngredient)[];
  instructions?: (string | RecipeStep)[];
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
    tags: ["Kuřecí", "Krabičkové", "Rýže"],
    description:
      "Jednoduchý meal prep na více dní s kuřecím masem, rýží a zeleninou.",
    ingredients: [
      { name: "kuřecí prsa", searchQuery: "kuřecí prsa", banned: ["mražené", "polotovar", "šunka"] },
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
    tags: ["Kuřecí", "Rychlé"],
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
    tags: ["Snídaně"],
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
    tags: ["Rychlé", "Bez masa"],
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
    tags: ["Studené", "Bez masa"],
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
    tags: ["Snídaně", "Sladké"],
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
    tags: ["Klasika", "Rychlé"],
    description: "Oblíbená těstovinová klasika s pár základními surovinami. Klíčem je kvalitní slanina a parmazán.",
    ingredients: [
      { name: "špagety", searchQuery: "špagety semolinové", banned: ["hotové jídlo"] },
      { name: "slanina", searchQuery: "anglická slanina", banned: ["chips", "křupky"] },
      "vejce",
      { name: "parmazán", searchQuery: "parmazán", banned: ["omáčka", "chips", "strouhaný"] },
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
    tags: ["Klasika"],
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
    tags: ["Kuřecí", "Studené"],
    description:
      "Osvěžující studený pokrm s pikantním mletým kuřetem, hedvábným tofu a udon nudlemi — ideální na horké dny.",
    ingredients: [
      { name: "hedvábné tofu", searchQuery: "hedvábné tofu", banned: ["uzené", "smažené"], amount: "300 g", amountValue: 300, amountUnit: "g" }, // 0
      { name: "arašídové máslo", searchQuery: "arašídové máslo", banned: ["sušenky", "tyčinka"], amount: "1 lžíce", amountValue: 1, amountUnit: "lžíce" }, // 1
      { name: "sójová omáčka", searchQuery: "sójová omáčka", banned: ["kečup"], amount: "1 lžíce", amountValue: 1, amountUnit: "lžíce" }, // 2
      { name: "rybí omáčka", searchQuery: "rybí omáčka", banned: [], amount: "1 lžíce", amountValue: 1, amountUnit: "lžíce" }, // 3
      { name: "led", amount: "4 kostky", amountValue: 4, amountUnit: "kostky" }, // 4
      { name: "okurka", amount: "1 ks", amountValue: 1, amountUnit: "ks" }, // 5
      { name: "sůl", amount: "1 lžička", amountValue: 1, amountUnit: "lžička" }, // 6
      { name: "avokádový olej", searchQuery: "avokádový olej", banned: [], amount: "1 lžička", amountValue: 1, amountUnit: "lžička" }, // 7
      { name: "kuřecí mleté maso", searchQuery: "kuřecí mleté maso", banned: ["hotové", "karbanátky"], amount: "250 g", amountValue: 250, amountUnit: "g" }, // 8
      { name: "gochugaru", searchQuery: "gochugaru", banned: [], amount: "1 lžíce", amountValue: 1, amountUnit: "lžíce" }, // 9
      { name: "tmavá sójová omáčka", searchQuery: "tmavá sójová omáčka", banned: [], amount: "1 lžíce", amountValue: 1, amountUnit: "lžíce" }, // 10
      { name: "sezamová semínka", searchQuery: "sezamová semínka", banned: ["olej", "tyčinka"], amount: "1 lžíce", amountValue: 1, amountUnit: "lžíce" }, // 11
      { name: "udon nudle", searchQuery: "udon nudle", banned: ["instantní", "polévka"], amount: "400 g", amountValue: 400, amountUnit: "g" }, // 12
      { name: "jarní cibulka", amount: "1 ks", amountValue: 1, amountUnit: "ks" }, // 13
      { name: "smažená cibulka", searchQuery: "smažená cibulka", banned: [], amount: "1 lžíce", amountValue: 1, amountUnit: "lžíce" }, // 14
      { name: "vejce", amount: "2 ks", amountValue: 2, amountUnit: "ks" }, // 15
    ],
    instructions: [
      {
        text: "Sójovou omáčku připravte tak, že vše smícháte v mixéru a rozmixujete do hladka a vychladíte. Dejte stranou do lednice.",
        ingredientIndexes: [0, 1, 2, 3, 4],
      },
      {
        text: "Okurku najemno nakrájejte a smíchejte se solí. Dejte do lednice, než připravíte kuře.",
        ingredientIndexes: [5, 6],
      },
      {
        text: "Na velké pánvi na vysokém plameni rozehřejte avokádový olej a kuřecí mleté maso. Restujte dozlatova, poté přidejte gochugaru, tmavou sójovou omáčku, sůl a sezamová semínka.",
        ingredientIndexes: [7, 8, 9, 10, 6, 11],
      },
      {
        text: "Uvařte nudle, propláchněte studenou vodou nebo ponořte do ledové vody. Vyždímejte přebytečnou vodu z okurky.",
        ingredientIndexes: [12],
      },
      {
        text: "Na servírování dejte studené nudle, zalijte omáčkou, přidejte kuřecí drť, okurku, nakrájenou jarní cibulku, smaženou cibulku a vejce uvařené na měkko.",
        ingredientIndexes: [13, 14, 15],
      },
    ],
    aliases: ["studene nudle", "soy chicken noodles", "cold soy noodles"],
    nutrition: { calories: 680, protein: 50, fat: 22, carbs: 71, fiber: 3 },
    mealType: "noodles",
    mainProtein: "chicken",
    onePan: false,
    timing: { prepMinutes: 15, cookMinutes: 15 },
    baseServings: 2,
  },
  {
    name: "Pečený losos se špenátem a quinoou",
    tags: ["Rybí", "Zdravé"],
    description:
      "Lehký a výživný oběd s rybou, listovým špenátem a quinoou místo klasické přílohy.",
    ingredients: [
      { name: "losos", searchQuery: "losos", banned: ["konzerva", "uzený", "paštika"] },
      { name: "quinoa", searchQuery: "quinoa", banned: ["kaše", "chipsy"] },
      "spenát",
      "citron",
      "olivový olej",
    ],
    instructions: [
      "Troubu předehřejte na 200 °C.",
      "Lososa osolte, pokapejte olivovým olejem a citronovou šťávou, pečte 12–15 minut.",
      "Quinou uvařte podle návodu na obalu.",
      "Špenát krátce orestujte na oleji, dokud nezvadne.",
      "Podávejte lososa na quinoe se špenátem, dozdobte citronem.",
    ],
    aliases: ["losos", "pečený losos", "losos se spenatem"],
    mealType: "other",
    mainProtein: "fish",
    onePan: false,
    timing: { prepMinutes: 10, cookMinutes: 15 },
    baseServings: 2,
  },
  {
    name: "Cizrnové kari s rýží",
    tags: ["Bez masa", "Klasika"],
    description:
      "Sytý vegetariánský oběd s cizrnou, rajčaty a kořením, hotový na jedné pánvi.",
    ingredients: [
      { name: "cizrna", searchQuery: "cizrna konzerva", banned: ["mouka", "křupky"] },
      { name: "rajčata", searchQuery: "rajčata", banned: ["sušená", "sušenka"] },
      "cibule",
      "česnek",
      { name: "rýže", searchQuery: "rýže 1kg", banned: ["kaše", "mléčná"] },
    ],
    instructions: [
      "Na oleji orestujte nakrájenou cibuli a česnek dozlatova.",
      "Přidejte cizrnu a rajčata, podlijte trochou vody a duste 15 minut.",
      "Dochuťte kořením podle chuti (kari, kmín, chilli).",
      "Podávejte s vařenou rýží.",
    ],
    aliases: ["cizrnove kari", "kari s cizrnou", "vegetariánské kari"],
    mealType: "rice",
    mainProtein: "vegetarian",
    onePan: true,
    timing: { prepMinutes: 10, cookMinutes: 20 },
    baseServings: 2,
  },
  {
    name: "Řecký salát s fetou",
    tags: ["Studené", "Bez masa"],
    description:
      "Klasický studený salát s okurkou, rajčaty, olivami a fetou — hotový za pár minut.",
    ingredients: [
      { name: "feta", searchQuery: "feta", banned: ["light", "sýrová pomazánka"] },
      "okurka",
      "rajčata",
      "cibule",
      "olivový olej",
    ],
    aliases: ["recky salat", "salat s fetou", "greek salad"],
    mealType: "salad",
    mainProtein: "vegetarian",
    onePan: false,
    timing: { prepMinutes: 10, cookMinutes: 0 },
    baseServings: 2,
  },
  {
    name: "Krůtí burger s avokádem",
    tags: ["Rychlé", "Krůtí"],
    description:
      "Lehčí varianta burgeru s krůtím masem, avokádem a čerstvou zeleninou.",
    ingredients: [
      { name: "krůtí maso", searchQuery: "krůtí mleté maso", banned: ["šunka", "párky"] },
      { name: "houska", searchQuery: "houska", banned: ["strouhanka", "housky mražené"] },
      "avokádo",
      "rajčata",
      "ledový salát",
    ],
    instructions: [
      "Z krůtího mletého masa vytvarujte placičky, osolte a opepřete.",
      "Opečte na pánvi z obou stran dozlatova, cca 4–5 minut na stranu.",
      "Housku rozpulte a opečte na sucho.",
      "Naskládejte salát, placičku, plátky avokáda a rajčete.",
    ],
    aliases: ["krutí burger", "turkey burger", "burger s avokadem"],
    mealType: "other",
    mainProtein: "chicken",
    onePan: false,
    timing: { prepMinutes: 10, cookMinutes: 10 },
    baseServings: 2,
  },
  {
    name: "Čočková polévka se zeleninou",
    tags: ["Klasika", "Bez masa"],
    description:
      "Hutná zahřívací polévka z čočky, mrkve a celeru — levná a sytá varianta k obědu.",
    ingredients: [
      { name: "čočka", searchQuery: "čočka", banned: ["konzerva sladká", "polévka instantní"] },
      "mrkev",
      { name: "celer", searchQuery: "celer bulva", banned: ["řapíkatý", "stonky"] },
      "cibule",
      "česnek",
    ],
    instructions: [
      "Na oleji orestujte nakrájenou cibuli, mrkev a celer.",
      "Přidejte čočku a zalijte vodou, přiveďte k varu.",
      "Duste na mírném ohni 25–30 minut, dokud čočka nezměkne.",
      "Dochuťte solí, pepřem a případně kmínem.",
    ],
    aliases: ["cockova polevka", "polevka z cocky", "lentil soup"],
    mealType: "other",
    mainProtein: "vegetarian",
    onePan: true,
    timing: { prepMinutes: 10, cookMinutes: 30 },
    baseServings: 3,
  },
  {
    name: "Tvarohové palačinky s jahodami",
    tags: ["Snídaně", "Sladké"],
    description:
      "Nadýchané palačinky s tvarohovou náplní a čerstvým ovocem, ideální na víkendovou snídani.",
    ingredients: [
      { name: "tvaroh", searchQuery: "tvaroh", banned: ["pomazánkové máslo", "tvarohový dezert"] },
      "vejce",
      "mléko",
      { name: "hladká mouka", searchQuery: "hladká mouka", banned: ["kukuřičná", "bezlepková"] },
      "jahody",
    ],
    instructions: [
      "Ze všech surovin kromě jahod a tvarohu vyšlehejte hladké těsto.",
      "Na pánvi upečte tenké palačinky z obou stran dozlatova.",
      "Palačinky naplňte tvarohem a nakrájenými jahodami, zarolujte.",
    ],
    aliases: ["tvarohove palacinky", "palacinky s jahodami", "sladke palacinky"],
    mealType: "other",
    mainProtein: "vegetarian",
    onePan: false,
    timing: { prepMinutes: 15, cookMinutes: 15 },
    baseServings: 2,
  },
  {
    name: "Vepřová panenka s bramborami",
    tags: ["Klasika", "Krabičkové"],
    description:
      "Jednoduchý nedělní oběd — pečená vepřová panenka s opečenými brambory a zeleninou.",
    ingredients: [
      { name: "vepřová panenka", searchQuery: "vepřová panenka", banned: ["mleté", "uzené", "párky"] },
      { name: "brambory", searchQuery: "brambory", banned: ["hranolky", "kaše instantní"] },
      "česnek",
      "paprika",
      "olivový olej",
    ],
    instructions: [
      "Troubu předehřejte na 200 °C.",
      "Panenku osolte, opepřete a orestujte na pánvi ze všech stran dozlatova.",
      "Brambory nakrájejte na kostky, promíchejte s olejem a kořením.",
      "Vše dejte do trouby a pečte 20–25 minut, dokud maso není propečené.",
    ],
    aliases: ["veprova panenka", "peceni brambory", "nedelni obed"],
    mealType: "other",
    mainProtein: "pork",
    onePan: true,
    timing: { prepMinutes: 10, cookMinutes: 25 },
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
