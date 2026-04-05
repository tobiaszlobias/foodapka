import { normalizeText } from "@/lib/food";

export type IngredientRuleConfig = {
  requiredGroups?: string[][];
  preferred?: string[];
  banned?: string[];
  strict?: boolean;
  preferUnitPrice?: boolean;
  preferredMaxPackageKg?: number;
  queryAlternatives?: string[];
};

type IngredientContextRule = IngredientRuleConfig & {
  recipeIncludes: string[];
};

type IngredientClass = IngredientRuleConfig & {
  id: string;
  aliases: string[];
  families?: string[];
  contexts?: IngredientContextRule[];
};

const FAMILY_RULES: Record<string, IngredientRuleConfig> = {
  raw_ingredient: {
    banned: [
      "chips",
      "dip",
      "dresink",
      "dzus",
      "hotove jidlo",
      "instantni",
      "juice",
      "koreni",
      "napoj",
      "omacka",
      "polevka",
      "prichut",
      "pure",
      "ready",
      "salat",
      "sendvic",
      "smoothie",
      "smes",
      "stava",
      "zalevka",
    ],
  },
  raw_vegetable: {
    preferUnitPrice: true,
    strict: true,
    banned: ["dzus", "juice", "kubik", "napoj", "sirup", "smoothie", "mix", "zalevka"],
  },
  raw_meat: {
    preferUnitPrice: true,
    preferredMaxPackageKg: 1.2,
    banned: [
      "burger",
      "carpaccio",
      "gulasovka",
      "jerky",
      "klobasa",
      "konzerva",
      "kostka",
      "parek",
      "pastrami",
      "pastika",
      "ready",
      "salam",
      "sunka",
      "uzeniny",
      "vyvar",
      "gyros",
      "marinovane",
      "natrhani",
      "ochucene",
      "pomalu varena",
      "pomalu varene",
      "pyre",
      "sous vide",
      "trhane",
    ],
  },
  dairy_cooking: {
    preferUnitPrice: true,
  },
  bakery_wraps: {
    preferUnitPrice: true,
    strict: true,
    banned: ["chips", "nachos", "dort", "torty"],
  },
  dry_grain: {
    preferUnitPrice: true,
    strict: true,
    banned: ["hotove jidlo", "salat", "snidane", "tycinka"],
  },
  raw_fruit: {
    preferUnitPrice: true,
    strict: true,
    banned: ["dzus", "juice", "napoj", "sirup", "smoothie", "susene"],
  },
  fresh_dairy: {
    preferUnitPrice: true,
    strict: true,
    banned: ["dezert", "drink", "napoj", "ochucene", "protein", "puding"],
  },
  cheese: {
    preferUnitPrice: true,
    strict: true,
    banned: ["chips", "omacka", "pomazanka", "prichut"],
  },
  bakery_plain: {
    preferUnitPrice: true,
    strict: true,
    banned: ["chips", "nachos", "sendvic", "toast"],
  },
  condiment_raw_use: {
    preferUnitPrice: true,
    strict: true,
    banned: ["dip", "dresink", "omacka", "ready", "zalevka"],
  },
  fresh_herb: {
    strict: true,
    banned: ["koreni", "susene", "zalevka", "dresink", "mix"],
  },
  legume: {
    preferUnitPrice: true,
    strict: true,
    banned: ["chips", "krupky", "mouka", "snack", "tycinka"],
  },
};

const INGREDIENT_CLASSES: IngredientClass[] = [
  {
    id: "chicken_meat",
    aliases: ["kuře", "kure", "kuřecí", "kureci", "kuřecí maso", "kureci maso"],
    families: ["raw_meat"],
    requiredGroups: [["kureci"]],
    queryAlternatives: ["kuřecí maso", "kuřecí"],
  },
  {
    id: "chicken_breast",
    aliases: ["kuřecí prsa", "kureci prsa", "kuřecí prsní", "kureci prsni"],
    families: ["raw_meat"],
    strict: true,
    requiredGroups: [["kureci"], ["prsa", "prsni", "rizky", "filet"]],
    preferred: ["cerstve", "chlazene"],
    banned: ["cele kure", "ctvrtky", "stehna", "kridla", "mrazene"],
    queryAlternatives: ["kuřecí prsa", "kuřecí prsní řízky", "kuřecí filet"],
    contexts: [
      {
        recipeIncludes: ["wrap", "tortilla"],
        banned: ["mrazene", "ready", "pyre"],
        preferred: ["cerstve", "chlazene"],
      },
    ],
  },
  {
    id: "beef_meat",
    aliases: ["hovězí", "hovezi", "hovězí maso", "hovezi maso"],
    families: ["raw_meat"],
    strict: true,
    requiredGroups: [["hovezi"], ["maso", "kostky", "kližka", "klizka", "plec", "zadni", "predni"]],
    preferred: ["kližka", "klizka", "plec", "zadni", "predni", "kostky"],
    banned: ["koreni", "mlete", "mix", "veprove"],
    queryAlternatives: ["hovězí zadní", "hovězí plec", "hovězí kližka"],
    contexts: [
      {
        recipeIncludes: ["svickova"],
        preferred: ["zadni", "plec"],
        queryAlternatives: ["hovězí zadní", "hovězí plec"],
      },
    ],
  },
  {
    id: "carrot",
    aliases: ["mrkev"],
    families: ["raw_ingredient", "raw_vegetable"],
    requiredGroups: [["mrkev"]],
    queryAlternatives: ["mrkev"],
  },
  {
    id: "rice",
    aliases: ["rýže", "ryze"],
    families: ["dry_grain"],
    requiredGroups: [["ryze"]],
    queryAlternatives: ["rýže", "dlouhozrnná rýže"],
  },
  {
    id: "broccoli",
    aliases: ["brokolice"],
    families: ["raw_ingredient", "raw_vegetable"],
    requiredGroups: [["brokolice"]],
    queryAlternatives: ["brokolice"],
  },
  {
    id: "paprika",
    aliases: ["paprika", "papriky"],
    families: ["raw_ingredient", "raw_vegetable"],
    requiredGroups: [["paprika"]],
    banned: ["koreni", "mleta", "chips", "pomazanka"],
    queryAlternatives: ["paprika", "čerstvá paprika"],
  },
  {
    id: "onion",
    aliases: ["cibule", "cibule žlutá", "cibule bila", "cibule červená", "cibule cervena"],
    families: ["raw_ingredient", "raw_vegetable"],
    requiredGroups: [["cibule"]],
    banned: ["susena", "smazená", "smazena", "koreni"],
    queryAlternatives: ["cibule", "žlutá cibule"],
  },
  {
    id: "potato",
    aliases: ["brambory", "brambora", "brambory varny typ a", "brambory varny typ b"],
    families: ["raw_ingredient", "raw_vegetable"],
    requiredGroups: [["brambor"]],
    banned: ["chips", "hranolky", "kaše", "kase", "salat"],
    queryAlternatives: ["brambory", "konzumní brambory"],
  },
  {
    id: "zucchini",
    aliases: ["cuketa"],
    families: ["raw_ingredient", "raw_vegetable"],
    requiredGroups: [["cuketa"]],
    banned: ["nakladana", "grilovana", "salat"],
    queryAlternatives: ["cuketa"],
  },
  {
    id: "spinach",
    aliases: ["špenát", "spenat"],
    families: ["raw_ingredient", "raw_vegetable"],
    requiredGroups: [["spenat"]],
    banned: ["protlak", "pyré", "pure", "hotovy"],
    queryAlternatives: ["čerstvý špenát", "baby špenát"],
  },
  {
    id: "mushroom",
    aliases: ["žampiony", "zampiony", "houby", "žampiony bílé", "zampiony bile"],
    families: ["raw_ingredient", "raw_vegetable"],
    requiredGroups: [["zampiony", "houby"]],
    banned: ["susene", "nakladane", "omacka"],
    queryAlternatives: ["žampiony", "čerstvé žampiony"],
  },
  {
    id: "tomato",
    aliases: ["rajče", "rajčata", "rajce", "rajcata"],
    families: ["raw_ingredient", "raw_vegetable"],
    requiredGroups: [["rajce", "rajcata"]],
    banned: ["protlak", "susena", "omacka", "kecup", "dzus"],
    queryAlternatives: ["rajčata", "čerstvá rajčata"],
  },
  {
    id: "celery_root",
    aliases: ["celer bulva", "bulvovy celer", "bulvový celer", "kořen celeru", "koren celeru"],
    families: ["raw_ingredient", "raw_vegetable"],
    strict: true,
    requiredGroups: [["celer"], ["bulva", "koren", "bulvovy", "root"]],
    preferred: ["bulva", "koren", "bulvovy"],
    banned: ["nat", "listy", "sul"],
    queryAlternatives: ["celer bulva", "bulvový celer"],
    contexts: [
      {
        recipeIncludes: ["svickova"],
        strict: true,
        requiredGroups: [["celer"], ["bulva", "koren", "bulvovy"]],
      },
    ],
  },
  {
    id: "celery_stalk",
    aliases: ["celer", "řapíkatý celer", "rapikaty celer", "celer řapíkatý", "celer rapikaty"],
    families: ["raw_ingredient", "raw_vegetable"],
    strict: true,
    requiredGroups: [["celer"], ["rapikaty", "stonek", "stonky", "řapíkatý"]],
    preferred: ["rapikaty", "stonky"],
    banned: ["bulva", "koren", "nat"],
    queryAlternatives: ["řapíkatý celer", "celer řapíkatý"],
  },
  {
    id: "parsley_root",
    aliases: ["kořen petržele", "koren petrzele", "petržel kořen", "petrzel koren", "kořenová petržel", "korenova petrzel"],
    families: ["raw_ingredient", "raw_vegetable"],
    strict: true,
    requiredGroups: [["petrzel"], ["koren", "korenova", "koren petrzele"]],
    preferred: ["koren", "koren petrzele"],
    banned: ["nat", "listy", "bylinky", "7 g", "10 g", "20 g"],
    queryAlternatives: ["kořen petržele", "petržel kořen"],
    contexts: [
      {
        recipeIncludes: ["svickova"],
        strict: true,
        requiredGroups: [["petrzel"], ["koren", "korenova", "koren petrzele"]],
      },
    ],
  },
  {
    id: "parsley_herb",
    aliases: ["petržel", "petrzel", "petržel nať", "petrzel nat", "hladkolistá petržel", "hladkolista petrzel"],
    families: ["fresh_herb"],
    strict: true,
    requiredGroups: [["petrzel"], ["nat", "cerstva", "hladkolista", "kudrnka"]],
    preferred: ["nat", "cerstva", "hladkolista"],
    banned: ["koren", "korenova", "susena", "koreni"],
    queryAlternatives: ["petržel nať", "čerstvá petržel"],
  },
  {
    id: "iceberg_lettuce",
    aliases: ["ledový salát", "ledovy salat"],
    families: ["raw_ingredient", "raw_vegetable"],
    strict: true,
    requiredGroups: [["salat"], ["ledovy", "ledovy salat"]],
    banned: ["s jogurtem", "s tunakem", "dresink", "mix", "zalevka"],
    queryAlternatives: ["ledový salát"],
  },
  {
    id: "cucumber",
    aliases: ["okurka", "okurky"],
    families: ["raw_ingredient", "raw_vegetable"],
    requiredGroups: [["okurka"]],
    banned: ["kysela", "nakladana", "salatova omacka", "zalevka"],
    queryAlternatives: ["okurka salátová", "čerstvá okurka"],
  },
  {
    id: "arugula",
    aliases: ["rukola"],
    families: ["raw_ingredient", "raw_vegetable"],
    strict: true,
    requiredGroups: [["rukola"]],
    banned: ["mix", "pesto", "salat s"],
    queryAlternatives: ["rukola"],
  },
  {
    id: "avocado",
    aliases: ["avokádo", "avokado"],
    families: ["raw_fruit"],
    strict: true,
    requiredGroups: [["avokado"]],
    banned: ["dip", "guacamole", "pomazanka", "sushi"],
    queryAlternatives: ["avokádo"],
  },
  {
    id: "spring_onion",
    aliases: ["jarní cibulka", "jarni cibulka", "lahůdková cibulka", "lahudkova cibulka"],
    families: ["fresh_herb"],
    strict: true,
    requiredGroups: [["cibulka"], ["jarni", "lahudkova"]],
    preferred: ["jarni", "lahudkova"],
    banned: ["smazena", "koreni"],
    queryAlternatives: ["jarní cibulka"],
  },
  {
    id: "chili",
    aliases: ["chilli", "čili", "chili paprička", "chilli papricka"],
    families: ["raw_ingredient", "raw_vegetable"],
    strict: true,
    requiredGroups: [["chilli", "chili", "cili"]],
    banned: ["omacka", "susene", "koreni", "pasta"],
    queryAlternatives: ["chilli paprička", "čerstvé chilli"],
  },
  {
    id: "ginger",
    aliases: ["zázvor", "zazvor"],
    families: ["raw_ingredient", "raw_vegetable"],
    strict: true,
    requiredGroups: [["zazvor"]],
    banned: ["napoj", "sirup", "shot", "suseny", "caj"],
    queryAlternatives: ["čerstvý zázvor", "zázvor"],
  },
  {
    id: "basil",
    aliases: ["bazalka", "čerstvá bazalka", "cerstva bazalka"],
    families: ["fresh_herb"],
    strict: true,
    requiredGroups: [["bazalka"]],
    banned: ["pesto", "susena", "koreni", "zalevka"],
    queryAlternatives: ["čerstvá bazalka", "bazalka"],
  },
  {
    id: "dill",
    aliases: ["kopr", "čerstvý kopr", "cerstvy kopr"],
    families: ["fresh_herb"],
    strict: true,
    requiredGroups: [["kopr"]],
    banned: ["suseny", "koreni", "zalevka"],
    queryAlternatives: ["čerstvý kopr", "kopr"],
  },
  {
    id: "cooking_cream",
    aliases: ["smetana", "smetana na vaření", "smetana na vareni"],
    families: ["dairy_cooking"],
    requiredGroups: [["smetana"]],
    banned: ["dekor", "kapsle", "susena", "zmrzlina", "ready"],
    queryAlternatives: ["smetana na vaření", "smetana 30%"],
    contexts: [
      {
        recipeIncludes: ["svickova", "omacka", "carbonara"],
        strict: true,
        requiredGroups: [["smetana"], ["na vareni", "12", "30", "31", "33"]],
        preferred: ["na vareni", "30", "31", "33"],
        banned: ["do kavy", "kava", "10x10"],
      },
    ],
  },
  {
    id: "sour_cream",
    aliases: ["zakysaná smetana", "zakysana smetana", "crème fraîche", "creme fraiche"],
    families: ["fresh_dairy"],
    strict: true,
    requiredGroups: [["smetana"], ["zakysana", "creme", "fraiche"]],
    preferred: ["zakysana", "creme fraiche"],
    banned: ["do kavy", "na slehani"],
    queryAlternatives: ["zakysaná smetana", "crème fraîche"],
  },
  {
    id: "milk",
    aliases: ["mléko", "mleko"],
    families: ["dairy_cooking"],
    strict: true,
    requiredGroups: [["mleko"]],
    banned: ["aperol", "cokolada", "dzus", "juice", "kofola", "krem", "kubik", "napoj", "nutella", "puding", "sirup", "smoothie", "susenky"],
    queryAlternatives: ["mléko", "trvanlivé mléko"],
  },
  {
    id: "yogurt",
    aliases: ["jogurt", "bílý jogurt", "bily jogurt"],
    families: ["fresh_dairy"],
    requiredGroups: [["jogurt"]],
    preferred: ["bily", "neslazeny"],
    banned: ["drink", "ochuceny", "protein", "vanilka", "jahoda", "boruvka"],
    queryAlternatives: ["bílý jogurt", "jogurt bílý"],
  },
  {
    id: "greek_yogurt",
    aliases: ["řecký jogurt", "recky jogurt", "jogurt řecký", "jogurt recky"],
    families: ["fresh_dairy"],
    strict: true,
    requiredGroups: [["jogurt"], ["recky"]],
    preferred: ["bily", "neslazeny"],
    banned: ["drink", "ochuceny", "protein", "vanilka", "jahoda", "boruvka"],
    queryAlternatives: ["řecký jogurt", "bílý řecký jogurt"],
  },
  {
    id: "mozzarella",
    aliases: ["mozzarella"],
    families: ["cheese"],
    requiredGroups: [["mozzarella"]],
    banned: ["strouhana", "chips", "omacka", "prichut"],
    queryAlternatives: ["mozzarella"],
  },
  {
    id: "feta",
    aliases: ["feta", "balkánský sýr", "balkansky syr"],
    families: ["cheese"],
    strict: true,
    requiredGroups: [["feta", "balkansky"]],
    banned: ["prichut", "pomazanka"],
    queryAlternatives: ["feta", "balkánský sýr"],
  },
  {
    id: "cheddar",
    aliases: ["cheddar", "čedar", "cedar"],
    families: ["cheese"],
    strict: true,
    requiredGroups: [["cheddar", "cedar"]],
    banned: ["omacka", "dip", "prichut"],
    queryAlternatives: ["cheddar"],
  },
  {
    id: "cream_cheese",
    aliases: ["lučina", "lucina", "cream cheese", "čerstvý sýr", "cerstvy syr"],
    families: ["fresh_dairy"],
    strict: true,
    requiredGroups: [["lucina", "cream cheese", "cerstvy syr"]],
    banned: ["ochuceny", "pazitka", "bylinky"],
    queryAlternatives: ["Lučina", "cream cheese"],
  },
  {
    id: "butter",
    aliases: ["máslo", "maslo"],
    families: ["fresh_dairy"],
    strict: true,
    requiredGroups: [["maslo"]],
    banned: ["pomazankove", "margarin", "prichut"],
    queryAlternatives: ["máslo", "máslo kostka"],
  },
  {
    id: "curd",
    aliases: ["tvaroh"],
    families: ["fresh_dairy"],
    strict: true,
    requiredGroups: [["tvaroh"]],
    banned: ["dezert", "ochuceny", "protein"],
    queryAlternatives: ["tvaroh", "měkký tvaroh"],
  },
  {
    id: "cottage",
    aliases: ["cottage", "cottage sýr", "cottage syr"],
    families: ["fresh_dairy"],
    strict: true,
    requiredGroups: [["cottage"]],
    banned: ["ochuceny", "ananas", "pazitka"],
    queryAlternatives: ["cottage", "cottage sýr"],
  },
  {
    id: "kefir",
    aliases: ["kefír", "kefir"],
    families: ["fresh_dairy"],
    strict: true,
    requiredGroups: [["kefir"]],
    banned: ["ochuceny", "drink", "protein"],
    queryAlternatives: ["kefír", "kefir"],
  },
  {
    id: "eidam",
    aliases: ["eidam"],
    families: ["cheese"],
    requiredGroups: [["eidam"]],
    banned: ["chips", "omacka", "pomazanka", "prichut"],
    queryAlternatives: ["eidam", "eidam plátky", "eidam blok"],
  },
  {
    id: "lactose_free_milk",
    aliases: ["bezlaktózové mléko", "bezlaktozove mleko", "mléko bez laktózy", "mleko bez laktozy"],
    families: ["dairy_cooking"],
    strict: true,
    requiredGroups: [["mleko"], ["laktoz", "bez laktoz"]],
    preferred: ["bez laktoz"],
    queryAlternatives: ["mléko bez laktózy", "bezlaktózové mléko"],
  },
  {
    id: "tortilla_wrap",
    aliases: ["tortilla", "wrap", "tortilla placky", "tortilla wrap"],
    families: ["bakery_wraps"],
    strict: true,
    requiredGroups: [["tortilla", "wrap"], ["placky", "ks", "6 ks", "8 ks", "psenicne", "mexicke"]],
    preferred: ["wrap", "placky", "psenicne"],
    banned: ["chio", "syrove", "paprikove"],
    queryAlternatives: ["tortilla placky", "tortilla wrap", "pšeničné tortilly"],
  },
  {
    id: "oats",
    aliases: ["ovesné vločky", "ovesne vlocky", "vločky", "vlocky"],
    families: ["dry_grain"],
    strict: true,
    requiredGroups: [["ovesne", "vločky", "vlocky"]],
    banned: ["mouka", "napoj", "protein", "susenky", "tycinka"],
    queryAlternatives: ["ovesné vločky", "jemné ovesné vločky"],
  },
  {
    id: "flour",
    aliases: ["mouka", "hladká mouka", "hladka mouka", "polohrubá mouka", "polohruba mouka", "hrubá mouka", "hruba mouka"],
    families: ["dry_grain"],
    requiredGroups: [["mouka"]],
    banned: ["smes", "hotova smes", "protein"],
    queryAlternatives: ["hladká mouka", "polohrubá mouka"],
  },
  {
    id: "spaghetti",
    aliases: ["špagety", "spagety"],
    families: ["dry_grain"],
    strict: true,
    requiredGroups: [["spagety"]],
    banned: ["hotove jidlo", "omacka", "polevka", "salat"],
    queryAlternatives: ["špagety", "spaghetti"],
  },
  {
    id: "pasta",
    aliases: ["těstoviny", "testoviny"],
    families: ["dry_grain"],
    requiredGroups: [["testoviny", "penne", "fusilli", "kolinka", "farfalle"]],
    banned: ["hotove jidlo", "omacka", "salat s", "polevka"],
    queryAlternatives: ["těstoviny", "penne", "fusilli"],
  },
  {
    id: "couscous",
    aliases: ["kuskus", "couscous"],
    families: ["dry_grain"],
    strict: true,
    requiredGroups: [["kuskus", "couscous"]],
    banned: ["salat", "hotovy", "smes"],
    queryAlternatives: ["kuskus", "couscous"],
  },
  {
    id: "bulgur",
    aliases: ["bulgur"],
    families: ["dry_grain"],
    strict: true,
    requiredGroups: [["bulgur"]],
    banned: ["salat", "hotovy", "smes"],
    queryAlternatives: ["bulgur"],
  },
  {
    id: "quinoa",
    aliases: ["quinoa", "quinioa", "kinoa"],
    families: ["dry_grain"],
    strict: true,
    requiredGroups: [["quinoa", "kinoa"]],
    banned: ["salat", "hotovy", "smes"],
    queryAlternatives: ["quinoa", "kinóa"],
  },
  {
    id: "bacon",
    aliases: ["slanina", "bacon", "anglická", "anglicka slanina"],
    families: ["raw_ingredient"],
    strict: true,
    preferUnitPrice: true,
    preferredMaxPackageKg: 0.6,
    requiredGroups: [["slanina", "bacon", "anglicka"]],
    banned: ["chips", "prichut", "tycinky", "dresink", "dip"],
    queryAlternatives: ["slanina", "anglická slanina", "bacon"],
  },
  {
    id: "garlic",
    aliases: ["česnek", "cesnek"],
    families: ["raw_ingredient", "raw_vegetable"],
    strict: true,
    requiredGroups: [["cesnek"]],
    preferred: ["cerstvy", "palicka", "strouzky"],
    banned: ["bageta", "dip", "dresink", "omacka", "s jogurtem", "suseny", "zalevka", "koreni"],
    queryAlternatives: ["čerstvý česnek", "česnek palička", "česnek"],
  },
  {
    id: "olive_oil",
    aliases: ["olivový olej", "olivovy olej"],
    families: ["condiment_raw_use"],
    strict: true,
    requiredGroups: [["olivovy"], ["olej"]],
    preferred: ["extra virgin", "panensky"],
    banned: ["sprej", "zalevka"],
    queryAlternatives: ["olivový olej", "extra virgin olivový olej"],
  },
  {
    id: "sunflower_oil",
    aliases: ["slunečnicový olej", "slunecnicovy olej"],
    families: ["condiment_raw_use"],
    strict: true,
    requiredGroups: [["slunecnicovy"], ["olej"]],
    banned: ["sprej", "zalevka"],
    queryAlternatives: ["slunečnicový olej"],
  },
  {
    id: "tahini",
    aliases: ["tahini", "sezamová pasta", "sezamova pasta"],
    families: ["condiment_raw_use"],
    strict: true,
    requiredGroups: [["tahini", "sezamova pasta"]],
    banned: ["dresink", "omacka", "zalevka"],
    queryAlternatives: ["tahini", "sezamová pasta"],
  },
  {
    id: "chickpeas",
    aliases: ["cizrna"],
    families: ["legume"],
    strict: true,
    requiredGroups: [["cizrna"]],
    preferred: ["konzerva", "sterilovana"],
    banned: ["chips", "krupky", "mouka", "snack"],
    queryAlternatives: ["cizrna", "cizrna konzerva"],
  },
  {
    id: "lentils",
    aliases: ["čočka", "cocka", "hnědá čočka", "hneda cocka"],
    families: ["legume"],
    strict: true,
    requiredGroups: [["cocka"]],
    preferred: ["hneda", "zelena"],
    banned: ["polevka", "chips"],
    queryAlternatives: ["čočka", "hnědá čočka"],
  },
  {
    id: "red_lentils",
    aliases: ["červená čočka", "cervena cocka"],
    families: ["legume"],
    strict: true,
    requiredGroups: [["cocka"], ["cervena"]],
    preferred: ["cervena"],
    banned: ["polevka", "chips"],
    queryAlternatives: ["červená čočka"],
  },
  {
    id: "beans",
    aliases: ["fazole", "červené fazole", "cervene fazole", "bílé fazole", "bile fazole"],
    families: ["legume"],
    strict: true,
    requiredGroups: [["fazole"]],
    preferred: ["konzerva", "sterilovane"],
    banned: ["chips", "snack"],
    queryAlternatives: ["fazole konzerva", "červené fazole"],
  },
  {
    id: "canned_tomatoes",
    aliases: ["krájená rajčata", "krajena rajcata", "rajčata v plechovce", "rajcata v plechovce", "loupaná rajčata", "loupana rajcata"],
    families: ["condiment_raw_use"],
    strict: true,
    requiredGroups: [["rajcata"], ["krajena", "loupana", "plechovce", "konzerva"]],
    preferred: ["krajena", "loupana", "konzerva"],
    banned: ["dzus", "kecup", "protlak"],
    queryAlternatives: ["krájená rajčata", "loupaná rajčata"],
  },
  {
    id: "passata",
    aliases: ["passata", "rajčatové pyré", "rajcatove pyre", "tomatová passata", "tomatova passata"],
    families: ["condiment_raw_use"],
    strict: true,
    requiredGroups: [["passata", "rajcatove pyre"]],
    banned: ["kecup", "dzus", "protlak"],
    queryAlternatives: ["passata", "rajčatové pyré"],
  },
  {
    id: "pita_bread",
    aliases: ["pita chléb", "pita chleb", "pita"],
    families: ["bakery_plain"],
    strict: true,
    requiredGroups: [["pita"]],
    banned: ["chips", "nachos", "sendvic", "toast"],
    queryAlternatives: ["pita chléb", "pita kapsa"],
  },
  {
    id: "bread",
    aliases: ["chléb", "chleb", "chleba"],
    families: ["bakery_plain"],
    requiredGroups: [["chleb", "chleba"]],
    banned: ["topinky", "toast", "chips"],
    queryAlternatives: ["chléb", "konzumní chléb"],
  },
  {
    id: "roll",
    aliases: ["rohlík", "rohlik", "rohlíky", "rohliky"],
    families: ["bakery_plain"],
    requiredGroups: [["rohlik", "rohliky"]],
    banned: ["sendvic", "toast"],
    queryAlternatives: ["rohlík", "rohlíky"],
  },
  {
    id: "eggs",
    aliases: ["vejce", "vajíčka", "vajicka"],
    families: ["raw_ingredient"],
    strict: true,
    preferUnitPrice: true,
    requiredGroups: [["vejce", "vajicka"]],
    preferred: ["cerstva", "6 ks", "10 ks", "12 ks", "m", "l"],
    banned: [
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
    ],
    queryAlternatives: ["vejce", "čerstvá vejce", "vejce 10 ks"],
  },
  {
    id: "parmesan",
    aliases: ["parmazán", "parmazan", "grana padano", "parmezan", "parmesan", "gran moravia"],
    families: ["cheese"],
    strict: true,
    requiredGroups: [["parmazan", "parmezan", "parmesan", "grana", "padano", "gran moravia"]],
    preferred: ["grana padano", "gran moravia", "parmazan"],
    banned: ["chips", "omacka", "pomazanka", "prichut", "strouhanka"],
    queryAlternatives: ["parmazán", "grana padano", "gran moravia"],
  },
  {
    id: "salmon",
    aliases: ["losos", "filet z lososa", "losos filet"],
    families: ["raw_meat"],
    strict: true,
    requiredGroups: [["losos"]],
    preferred: ["filet", "cerstvy", "chlazeny"],
    banned: ["pomazanka", "uzeny", "sushi", "teriyaki"],
    queryAlternatives: ["losos filet", "čerstvý losos"],
  },
  {
    id: "pork_meat",
    aliases: ["vepřové", "veprove", "vepřové maso", "veprove maso"],
    families: ["raw_meat"],
    strict: true,
    requiredGroups: [["veprove"], ["maso", "plec", "koste", "kytka", "panenka"]],
    preferred: ["plec", "koste", "kytka", "panenka"],
    banned: ["mlete", "mix", "uzeniny", "sunka"],
    queryAlternatives: ["vepřová plec", "vepřová kýta", "vepřová panenka"],
  },
  {
    id: "turkey_meat",
    aliases: ["krůtí", "kruti", "krůtí maso", "kruti maso"],
    families: ["raw_meat"],
    strict: true,
    requiredGroups: [["kruti"], ["maso", "prsa", "rizky", "filet"]],
    preferred: ["prsa", "rizky", "filet"],
    banned: ["uzeniny", "sunka", "ready"],
    queryAlternatives: ["krůtí prsa", "krůtí řízky"],
  },
  {
    id: "banana",
    aliases: ["banán", "banan"],
    families: ["raw_fruit"],
    requiredGroups: [["banan"]],
    banned: ["chips", "susene", "pyré", "pure", "smoothie"],
    queryAlternatives: ["banán"],
  },
  {
    id: "strawberries",
    aliases: ["jahody", "jahoda"],
    families: ["raw_fruit"],
    requiredGroups: [["jahody", "jahoda"]],
    banned: ["dzem", "jogurt", "napoj", "pyré", "pure", "sirup", "smoothie"],
    queryAlternatives: ["jahody"],
  },
  {
    id: "apple",
    aliases: ["jablko", "jablka"],
    families: ["raw_fruit"],
    requiredGroups: [["jablko", "jablka"]],
    banned: ["dzem", "juice", "napoj", "presnidavka", "susene"],
    queryAlternatives: ["jablka", "čerstvá jablka"],
  },
  {
    id: "lemon",
    aliases: ["citron", "citrón", "citrony", "citróny"],
    families: ["raw_fruit"],
    requiredGroups: [["citron", "citrony"]],
    banned: ["juice", "sirup", "napoj"],
    queryAlternatives: ["citron", "citrony"],
  },
  {
    id: "honey",
    aliases: ["med", "včelí med", "vceli med"],
    families: ["condiment_raw_use"],
    strict: true,
    requiredGroups: [["med"]],
    banned: ["medovina", "médium", "medium", "napoj", "sirup"],
    queryAlternatives: ["včelí med", "med"],
  },
  {
    id: "cinnamon",
    aliases: ["skořice", "skorice"],
    strict: true,
    requiredGroups: [["skorice"]],
    banned: ["napoj", "sirup"],
    queryAlternatives: ["skořice mletá", "skořice"],
  },
  {
    id: "salt",
    aliases: ["sůl", "sul"],
    strict: true,
    requiredGroups: [["sul"]],
    banned: ["solny karamel", "slané", "slane"],
    queryAlternatives: ["sůl", "kuchyňská sůl"],
  },
  {
    id: "pepper",
    aliases: ["pepř", "pepr", "černý pepř", "cerny pepr"],
    strict: true,
    requiredGroups: [["pepr"]],
    banned: ["paprika", "chips"],
    queryAlternatives: ["černý pepř", "pepř mletý"],
  },
];

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

function mergeStringLists(...lists: Array<string[] | undefined>) {
  return Array.from(
    new Set(lists.flatMap((list) => (list ?? []).map((value) => normalizePattern(value)).filter(Boolean))),
  );
}

function mergeGroupLists(...lists: Array<string[][] | undefined>) {
  const groups = lists.flatMap((list) => list ?? []);

  return groups
    .map((group) => Array.from(new Set(group.map((value) => normalizePattern(value)).filter(Boolean))))
    .filter((group) => group.length > 0)
    .filter(
      (group, index, allGroups) =>
        allGroups.findIndex((candidate) => candidate.join("|") === group.join("|")) === index,
    );
}

function matchesAlias(normalizedQuery: string, alias: string) {
  const normalizedAlias = normalizePattern(alias);
  if (!normalizedAlias) return false;

  return (
    normalizedQuery === normalizedAlias ||
    normalizedQuery.includes(normalizedAlias) ||
    normalizedAlias.includes(normalizedQuery)
  );
}

export function resolveIngredientRuleConfig(query: string, recipe?: string): IngredientRuleConfig {
  const normalizedQuery = normalizePattern(query);
  const normalizedRecipe = normalizePattern(recipe ?? "");
  const matchingClasses = INGREDIENT_CLASSES.filter((ingredientClass) =>
    ingredientClass.aliases.some((alias) => matchesAlias(normalizedQuery, alias)),
  );

  const contextRules = matchingClasses.flatMap((ingredientClass) =>
    (ingredientClass.contexts ?? []).filter((context) =>
      context.recipeIncludes.some((token) => normalizedRecipe.includes(normalizePattern(token))),
    ),
  );

  const familyRules = matchingClasses.flatMap((ingredientClass) =>
    (ingredientClass.families ?? []).map((family) => FAMILY_RULES[family]).filter(Boolean),
  );

  return {
    requiredGroups: mergeGroupLists(
      ...matchingClasses.map((item) => item.requiredGroups),
      ...familyRules.map((item) => item.requiredGroups),
      ...contextRules.map((item) => item.requiredGroups),
    ),
    preferred: mergeStringLists(
      ...matchingClasses.map((item) => item.preferred),
      ...familyRules.map((item) => item.preferred),
      ...contextRules.map((item) => item.preferred),
    ),
    banned: mergeStringLists(
      ...matchingClasses.map((item) => item.banned),
      ...familyRules.map((item) => item.banned),
      ...contextRules.map((item) => item.banned),
    ),
    strict:
      matchingClasses.some((item) => item.strict) ||
      familyRules.some((item) => item.strict) ||
      contextRules.some((item) => item.strict),
    preferUnitPrice:
      matchingClasses.some((item) => item.preferUnitPrice) ||
      familyRules.some((item) => item.preferUnitPrice) ||
      contextRules.some((item) => item.preferUnitPrice),
    preferredMaxPackageKg:
      contextRules.find((item) => typeof item.preferredMaxPackageKg === "number")
        ?.preferredMaxPackageKg ??
      matchingClasses.find((item) => typeof item.preferredMaxPackageKg === "number")
        ?.preferredMaxPackageKg ??
      familyRules.find((item) => typeof item.preferredMaxPackageKg === "number")
        ?.preferredMaxPackageKg,
    queryAlternatives: mergeStringLists(
      ...matchingClasses.map((item) => item.queryAlternatives),
      ...contextRules.map((item) => item.queryAlternatives),
    ),
  };
}

export function getIngredientQueryAlternatives(query: string, recipe?: string) {
  const ruleConfig = resolveIngredientRuleConfig(query, recipe);
  return Array.from(
    new Set(
      [query, ...(ruleConfig.queryAlternatives ?? [])]
        .map((value) => value.trim())
        .filter(Boolean),
    ),
  ).slice(0, 4);
}
