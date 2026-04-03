export type RecipeIngredient = string | { name: string; searchQuery?: string };
export type ResolvedRecipeIngredient = { name: string; searchQuery: string };

export type RecipePreset = {
  name: string;
  tag: string;
  description: string;
  ingredients: RecipeIngredient[];
  aliases?: string[];
};

export const RECIPE_PRESETS: RecipePreset[] = [
  {
    name: "Zdravé krabičkové kuře s rýží",
    tag: "Krabičkové",
    description:
      "Jednoduchý meal prep na více dní s kuřecím masem, rýží a zeleninou.",
    ingredients: ["kuřecí prsa", "rýže", "brokolice", "mrkev", "paprika"],
    aliases: ["krabickove kure", "meal prep", "kuře s rýží", "kure s ryzi"],
  },
  {
    name: "Tortilla wrap s kuřetem",
    tag: "Něco na zub",
    description:
      "Rychlá slaná varianta do ruky vhodná na oběd i večerní hlad.",
    ingredients: [
      "tortilla",
      "kuřecí prsa",
      "ledový salát",
      "rajčata",
      "eidam",
    ],
    aliases: ["wrap", "tortilla", "wrap s kuretem"],
  },
  {
    name: "Overnight oats s ovocem",
    tag: "Fit snídaně",
    description:
      "Levná a sytá snídaně z vloček, jogurtu nebo mléka a ovoce.",
    ingredients: [
      "ovesné vločky",
      "řecký jogurt",
      "banán",
      "jahody",
      { name: "med", searchQuery: "včelí med" },
    ],
    aliases: ["overnight oats", "ovesna kase", "fit snidane"],
  },
  {
    name: "Domácí hummus s pita chlebem",
    tag: "Snack",
    description:
      "Něco k televizi nebo pro návštěvu bez složité přípravy.",
    ingredients: ["cizrna", "tahini", "česnek", "olivový olej", "pita chléb"],
    aliases: ["hummus", "snack", "neco na zub"],
  },
  {
    name: "Těstovinový salát s mozzarellou",
    tag: "Lehká večeře",
    description:
      "Studená varianta do krabičky s těstovinami, zeleninou a sýrem.",
    ingredients: ["těstoviny", "mozzarella", "rajčata", "okurka", "rukola"],
    aliases: ["testovinovy salat", "salat s mozzarellou"],
  },
  {
    name: "Banánové lívance",
    tag: "Sladké",
    description:
      "Rychlá sladká klasika z pár surovin, vhodná na snídani i svačinu.",
    ingredients: ["banán", "vejce", "ovesné vločky", "mléko", "skořice"],
    aliases: ["livance", "bananove livance", "sladke"],
  },
  {
    name: "Špagety carbonara",
    tag: "Klasika",
    description: "Oblíbená těstovinová klasika s pár základními surovinami.",
    ingredients: ["špagety", "slanina", "vejce", "parmazán", "česnek"],
    aliases: ["carbonara", "spagety carbonara"],
  },
  {
    name: "Svíčková",
    tag: "Česká klasika",
    description:
      "Tradiční české jídlo s hovězím masem, kořenovou zeleninou a smetanou.",
    ingredients: [
      "hovězí maso",
      "mrkev",
      "celer",
      "petržel",
      "smetana",
    ],
    aliases: ["svickova"],
  },
];

function normalize(value: string) {
  return value
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim();
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

export function resolveRecipeIngredient(
  ingredient: RecipeIngredient,
): ResolvedRecipeIngredient {
  if (typeof ingredient === "string") {
    return {
      name: ingredient,
      searchQuery: ingredient,
    };
  }

  return {
    name: ingredient.name,
    searchQuery: ingredient.searchQuery?.trim() || ingredient.name,
  };
}
