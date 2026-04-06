export type RecipePreset = {
  name: string;
  tag: string;
  description: string;
  ingredients: string[];
  aliases?: string[];
  image?: string;
};

export const RECIPE_PRESETS: RecipePreset[] = [
  {
    name: "Zdravé krabičkové kuře s rýží",
    tag: "Krabičkové",
    description:
      "Jednoduchý meal prep na více dní s kuřecím masem, rýží a zeleninou.",
    ingredients: ["kuřecí prsa", "rýže", "brokolice", "mrkev", "paprika"],
    aliases: ["krabickove kure", "meal prep", "kuře s rýží", "kure s ryzi"],
    image: "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=400&h=300&fit=crop",
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
    image: "https://images.unsplash.com/photo-1626700051175-6818013e1d4f?w=400&h=300&fit=crop",
  },
  {
    name: "Overnight oats s ovocem",
    tag: "Fit snídaně",
    description:
      "Levná a sytá snídaně z vloček, jogurtu nebo mléka a ovoce.",
    ingredients: ["ovesné vločky", "řecký jogurt", "banán", "jahody", "med"],
    aliases: ["overnight oats", "ovesna kase", "fit snidane"],
    image: "https://images.unsplash.com/photo-1517673400267-0251440c45dc?w=400&h=300&fit=crop",
  },
  {
    name: "Domácí hummus s pita chlebem",
    tag: "Snack",
    description:
      "Něco k televizi nebo pro návštěvu bez složité přípravy.",
    ingredients: ["cizrna", "tahini", "česnek", "olivový olej", "pita chléb"],
    aliases: ["hummus", "snack", "neco na zub"],
    image: "https://images.unsplash.com/photo-1577805947697-89e18249d767?w=400&h=300&fit=crop",
  },
  {
    name: "Těstovinový salát s mozzarellou",
    tag: "Lehká večeře",
    description:
      "Studená varianta do krabičky s těstovinami, zeleninou a sýrem.",
    ingredients: ["těstoviny", "mozzarella", "rajčata", "okurka", "rukola"],
    aliases: ["testovinovy salat", "salat s mozzarellou"],
    image: "https://images.unsplash.com/photo-1505253716362-afaea1d3d1af?w=400&h=300&fit=crop",
  },
  {
    name: "Banánové lívance",
    tag: "Sladké",
    description:
      "Rychlá sladká klasika z pár surovin, vhodná na snídani i svačinu.",
    ingredients: ["banán", "vejce", "ovesné vločky", "mléko", "skořice"],
    aliases: ["livance", "bananove livance", "sladke"],
    image: "https://images.unsplash.com/photo-1567620905732-2d1ec7ab7445?w=400&h=300&fit=crop",
  },
  {
    name: "Špagety carbonara",
    tag: "Klasika",
    description: "Oblíbená těstovinová klasika s pár základními surovinami.",
    ingredients: ["špagety", "slanina", "vejce", "parmazán", "česnek"],
    aliases: ["carbonara", "spagety carbonara"],
    image: "https://images.unsplash.com/photo-1612874742237-6526221588e3?w=400&h=300&fit=crop",
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
    image: "https://images.unsplash.com/photo-1544025162-d76694265947?w=400&h=300&fit=crop",
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
