import fs from "node:fs";
import path from "node:path";

const OUTPUT_PATH = path.join(process.cwd(), "data", "search_dictionary.json");

const CATEGORY_NEGATIVE_TERMS = {
  ovoce: ["semena", "osivo", "sazenice", "sadba", "substrat", "hnojivo"],
  zelenina: ["semena", "osivo", "sazenice", "sadba", "substrat", "hnojivo"],
  pecivo: ["krmivo", "pro psy", "pro kocky"],
  mlecne_vyrobky: ["sprchovy gel", "sampon", "telove mleko"],
  maso_a_drubez: [
    "pro psy",
    "pro kocky",
    "granule",
    "kapsicka",
    "krmivo",
    "pamlsy pro psy",
  ],
  ryby_a_morske_plody: [
    "pro psy",
    "pro kocky",
    "granule",
    "kapsicka",
    "krmivo",
  ],
  vejce: ["dekorace", "barva na vejce", "plastove"],
  ryze_a_obiloviny: ["krmivo", "pro ptaky"],
  testoviny: ["krmivo", "instantni polivka"],
  lusteniny: ["krmivo", "osivo", "semena"],
  mouky_a_peceni: ["smes pro psy", "krmivo"],
  oleje_a_tuky: ["motorovy olej", "masazni olej", "kosmetika"],
  koreni: ["vune do auta", "vonna svicka"],
  omacky_a_dochucovadla: ["kosmetika", "sampon"],
  konzervy_a_trvanlive: ["pro psy", "pro kocky", "krmivo"],
  mrazene: ["chladici vlozka"],
  napoje: ["sprchovy gel", "cistic", "aroma difuzer"],
  sladke: ["sampon", "sprchovy gel", "vonna svicka"],
  snacky: ["krmivo", "pro psy", "pro kocky"],
};

function normalizeAscii(value) {
  return value
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

function uniq(values) {
  return [...new Set(values.map((value) => value.trim()).filter(Boolean))];
}

function withAsciiVariants(values) {
  const expanded = [];

  for (const value of values) {
    expanded.push(value);

    const ascii = normalizeAscii(value);
    if (ascii && ascii !== value) {
      expanded.push(ascii);
    }
  }

  return uniq(expanded);
}

function entry(
  key,
  label,
  category,
  aliases = [],
  searchTerms = [],
  negativeTerms = [],
) {
  return [
    key,
    {
      label,
      category,
      aliases: withAsciiVariants([label, ...aliases]),
      search_terms: uniq(searchTerms.length > 0 ? searchTerms : [label, ...aliases]),
      negative_terms: withAsciiVariants([
        ...(CATEGORY_NEGATIVE_TERMS[category] ?? []),
        ...negativeTerms,
      ]),
    },
  ];
}

function categoryEntries(category, rows) {
  return rows.map(([key, label, aliases, searchTerms, negativeTerms = []]) =>
    entry(key, label, category, aliases, searchTerms, negativeTerms),
  );
}

const entries = [
  ...categoryEntries("ovoce", [
    ["jablko", "Jablka", ["jablko", "jablka"], ["jablka", "cerstva jablka", "volna jablka"], ["most", "presnidavka"]],
    ["hruska", "Hrušky", ["hruska", "hruška", "hrusky", "hrušky"], ["hrušky", "čerstvé hrušky", "volné hrušky"]],
    ["banan", "Banány", ["banan", "banány", "banany"], ["banány", "čerstvé banány", "svazek banánů"], ["bananovy chips", "bananove pyré"]],
    ["pomeranc", "Pomeranče", ["pomeranc", "pomeranč", "pomerance", "pomeranče"], ["pomeranče", "čerstvé pomeranče", "volné pomeranče"], ["dzus", "sirup"]],
    ["mandarinka", "Mandarinky", ["mandarinka", "mandarinky"], ["mandarinky", "čerstvé mandarinky", "volné mandarinky"]],
    ["citron", "Citrony", ["citron", "citrón", "citrony"], ["citrony", "čerstvé citrony", "žluté citrony"], ["caj", "sirup"]],
    ["limetka", "Limetky", ["limetka", "limetky"], ["limetky", "čerstvé limetky", "zelené limetky"], ["sirup"]],
    ["hrozny", "Hroznové víno", ["hrozny", "hrozno", "vino hroznove"], ["hroznové víno", "bílé hrozny", "červené hrozny"], ["vino bile", "vino cervene", "rozinky"]],
    ["jahoda", "Jahody", ["jahoda", "jahody"], ["jahody", "čerstvé jahody", "vanička jahod"], ["dzem", "sirup"]],
    ["boruvka", "Borůvky", ["boruvka", "borůvka", "boruvky", "borůvky"], ["borůvky", "čerstvé borůvky", "lesní borůvky"], ["dzem", "sirup"]],
    ["malina", "Maliny", ["malina", "maliny"], ["maliny", "čerstvé maliny", "vanička malin"], ["sirup", "dzem"]],
    ["ananas", "Ananas", ["ananas"], ["ananas", "čerstvý ananas", "ananas celý"], ["dzus", "kompot"]],
    ["kiwi", "Kiwi", ["kiwi"], ["kiwi", "zelené kiwi", "žluté kiwi"]],
    ["mango", "Mango", ["mango"], ["mango", "čerstvé mango", "zralé mango"], ["lassi", "pyré"]],
    ["avokado", "Avokádo", ["avokado", "avokádo"], ["avokádo", "hass avokádo", "zralé avokádo"], ["pomazanka", "guacamole"]],
    ["merunka", "Meruňky", ["merunka", "meruňka", "merunky", "meruňky"], ["meruňky", "čerstvé meruňky", "volné meruňky"], ["dzem", "kompot"]],
  ]),
  ...categoryEntries("zelenina", [
    ["brambory", "Brambory", ["brambora", "brambory"], ["brambory", "konzumní brambory", "volné brambory"], ["chipsy", "salat bramborovy"]],
    ["cibule", "Cibule", ["cibule", "cibulka"], ["cibule", "žlutá cibule", "cibule kuchyňská"], ["sazenice", "semena"]],
    ["cesnek", "Česnek", ["cesnek", "česnek"], ["česnek", "čerstvý česnek", "palička česneku"], ["granulovany", "sazenice"]],
    ["mrkev", "Mrkev", ["mrkev", "mrkev obecná"], ["mrkev", "čerstvá mrkev", "svazek mrkve"], ["stava"]],
    ["petrzel_koren", "Petržel kořen", ["petrzel koren", "petržel kořen", "korenova petrzel"], ["petržel kořen", "kořenová petržel", "čerstvá petržel kořen"]],
    ["celer", "Celer", ["celer bulva", "celer"], ["celer", "bulvový celer", "čerstvý celer"], ["nat", "semena"]],
    ["rajce", "Rajčata", ["rajce", "rajče", "rajcata", "rajčata"], ["rajčata", "čerstvá rajčata", "salátová rajčata"], ["protlak", "passata", "kečup"]],
    ["cherry_rajce", "Cherry rajčata", ["cherry rajce", "cherry rajčata", "koktejlova rajcata"], ["cherry rajčata", "koktejlová rajčata", "mini rajčata"], ["protlak", "passata"]],
    ["okurka_salad", "Okurka salátová", ["okurka", "okurka salatova", "okurka salátová"], ["okurka salátová", "salátová okurka", "čerstvá okurka"], ["okurky sterilovane", "maska"]],
    ["paprika", "Paprika", ["paprika", "papriky"], ["paprika", "červená paprika", "mix paprik"], ["paprika sladka", "paprika paliva", "koreni"]],
    ["brokolice", "Brokolice", ["brokolice"], ["brokolice", "čerstvá brokolice", "brokolice kus"]],
    ["kvetak", "Květák", ["kvetak", "květák"], ["květák", "čerstvý květák", "květák kus"]],
    ["cuketa", "Cuketa", ["cuketa", "cukety"], ["cuketa", "čerstvá cuketa", "zelená cuketa"]],
    ["lilek", "Lilek", ["lilek"], ["lilek", "čerstvý lilek", "baklažán"]],
    ["salat_ledovy", "Ledový salát", ["ledovy salat", "ledový salát"], ["ledový salát", "hlávka ledového salátu", "čerstvý ledový salát"]],
    ["rukola", "Rukola", ["rukola"], ["rukola", "salát rukola", "čerstvá rukola"]],
    ["spenat", "Špenát", ["spenat", "špenát"], ["špenát", "čerstvý špenát", "baby špenát"], ["mrazeny spenat"]],
    ["bile_zeli", "Bílé zelí", ["bile zeli", "bílé zelí"], ["bílé zelí", "hlávkové zelí bílé", "čerstvé bílé zelí"], ["kysane zeli"]],
    ["redkvicky", "Ředkvičky", ["redkvicka", "ředkvička", "redkvicky", "ředkvičky"], ["ředkvičky", "svazek ředkviček", "čerstvé ředkvičky"]],
    ["porek", "Pórek", ["porek", "pórek"], ["pórek", "čerstvý pórek", "pórek kus"]],
  ]),
  ...categoryEntries("pecivo", [
    ["chleb", "Chléb", ["chleb", "chléb", "chleba"], ["chléb", "konzumní chléb", "čerstvý chléb"], ["toast", "knackebrot"]],
    ["toastovy_chleb", "Toastový chléb", ["toastovy chleb", "toastovy chleba", "toast"], ["toastový chléb", "toastový chlebík", "světlý toastový chléb"], ["topinka hotova"]],
    ["rohlik", "Rohlík", ["rohlik", "rohlík", "rohliky", "rohlíky"], ["rohlík", "běžný rohlík", "čerstvé rohlíky"]],
    ["houska", "Housky", ["houska", "housky"], ["housky", "čerstvé housky", "tukové housky"]],
    ["dalamanek", "Dalamánek", ["dalamanek", "dalamánek"], ["dalamánek", "celozrnný dalamánek", "čerstvý dalamánek"]],
    ["bageta", "Bageta", ["bageta", "bagety"], ["bageta", "světlá bageta", "francouzská bageta"], ["sendvic hotovy"]],
    ["ciabatta", "Ciabatta", ["ciabatta", "čabata"], ["ciabatta", "italská ciabatta", "čerstvá ciabatta"]],
    ["pita", "Pita chléb", ["pita", "pita chleb", "pita chleba"], ["pita chléb", "pita kapsa", "pita placky"]],
    ["tortilla", "Tortilla", ["tortilla", "tortilly", "wrap"], ["tortilla", "tortilla placky", "pšeničné tortilly"], ["chips", "nachos", "doritos"]],
    ["burger_bulka", "Hamburgerová bulka", ["burger bulka", "hamburgerova bulka", "hamburgerová bulka"], ["hamburgerová bulka", "bulka na burger", "burger houska"]],
    ["knackebrot", "Knäckebrot", ["knackebrot", "knäckebrot", "krehky chlebik"], ["knäckebrot", "křehký chléb", "žitný knäckebrot"]],
  ]),
  ...categoryEntries("mlecne_vyrobky", [
    ["mleko_polotucne", "Mléko polotučné", ["mleko polotucne", "mléko polotučné", "polotucne mleko"], ["mléko polotučné", "čerstvé mléko polotučné", "polotučné mléko 1,5 %"]],
    ["mleko_plnotucne", "Mléko plnotučné", ["mleko plnotucne", "mléko plnotučné", "plnotucne mleko"], ["mléko plnotučné", "čerstvé plnotučné mléko", "plnotučné mléko 3,5 %"]],
    ["mleko_trvanlive", "Mléko trvanlivé", ["mleko trvanlive", "mléko trvanlivé", "trvanlive mleko"], ["trvanlivé mléko", "uht mléko", "mléko trvanlivé"]],
    ["bezlaktozove_mleko", "Mléko bez laktózy", ["bezlaktozove mleko", "bezlaktózové mléko"], ["bezlaktózové mléko", "mléko bez laktózy", "trvanlivé bezlaktózové mléko"]],
    ["jogurt_bily", "Bílý jogurt", ["bily jogurt", "bíly jogurt", "jogurt bily"], ["bílý jogurt", "jogurt bílý", "klasický bílý jogurt"]],
    ["jogurt_recky", "Řecký jogurt", ["recky jogurt", "řecký jogurt", "grecky jogurt"], ["řecký jogurt", "jogurt řecký", "krémový řecký jogurt"]],
    ["kefir", "Kefír", ["kefir", "kefír"], ["kefír", "mléčný kefír", "kefírové mléko"]],
    ["tvaroh", "Tvaroh", ["tvaroh"], ["tvaroh", "měkký tvaroh", "polotučný tvaroh"]],
    ["cottage", "Cottage", ["cottage", "cottage cheese"], ["cottage", "cottage cheese", "cottage sýr"]],
    ["zakysana_smetana", "Zakysaná smetana", ["zakysana smetana", "zakysaná smetana"], ["zakysaná smetana", "smetana zakysaná", "kysaná smetana"]],
    ["smetana_na_vareni", "Smetana na vaření", ["smetana na vareni", "smetana na vaření"], ["smetana na vaření", "cooking cream", "smetana 12 %"]],
    ["maslo", "Máslo", ["maslo", "máslo"], ["máslo", "čerstvé máslo", "máslo kostka"], ["arasidove maslo", "ghí"]],
    ["eidam", "Eidam", ["eidam", "eidamsky syr"], ["eidam", "eidamský sýr", "eidam plátky"]],
    ["mozzarella", "Mozzarella", ["mozzarella"], ["mozzarella", "mozzarella classic", "mozzarella light"]],
    ["hermelin", "Hermelín", ["hermelin", "hermelín"], ["hermelín", "sýr hermelín", "plnotučný hermelín"]],
    ["parmezan", "Parmezán", ["parmezan", "parmezán", "parmesan"], ["parmezán", "parmesan", "strouhaný parmezán"]],
  ]),
  ...categoryEntries("maso_a_drubez", [
    ["kureci_prsa", "Kuřecí prsa", ["kureci prsa", "kuřecí prsa", "kureci prsni rizky"], ["kuřecí prsa", "kuřecí prsní řízky", "chlazená kuřecí prsa"], ["nugety", "granule"]],
    ["kureci_stehna", "Kuřecí stehna", ["kureci stehna", "kuřecí stehna"], ["kuřecí stehna", "chlazená kuřecí stehna", "horní kuřecí stehna"], ["nugety"]],
    ["cele_kure", "Celé kuře", ["cele kure", "celé kuře", "kure cele"], ["celé kuře", "chlazené celé kuře", "kuře celé"], ["vyvar hotovy"]],
    ["mlete_kureci", "Mleté kuřecí", ["mlete kureci", "mleté kuřecí"], ["mleté kuřecí", "kuřecí mleté maso", "mleté kuřecí maso"]],
    ["kruti_prsa", "Krůtí prsa", ["kruti prsa", "krůtí prsa"], ["krůtí prsa", "krůtí prsní řízky", "chlazená krůtí prsa"]],
    ["veprova_plec", "Vepřová plec", ["veprova plec", "vepřová plec"], ["vepřová plec", "chlazená vepřová plec", "vepřová plec bez kosti"]],
    ["veprova_krkovice", "Vepřová krkovice", ["veprova krkovice", "vepřová krkovice"], ["vepřová krkovice", "krkovice bez kosti", "chlazená vepřová krkovice"]],
    ["veprova_panenka", "Vepřová panenka", ["veprova panenka", "vepřová panenka"], ["vepřová panenka", "chlazená vepřová panenka", "panenka z vepřového"]],
    ["mlete_veprove", "Mleté vepřové", ["mlete veprove", "mleté vepřové"], ["mleté vepřové", "vepřové mleté maso", "mleté vepřové maso"]],
    ["hovezi_mlete", "Mleté hovězí", ["mlete hovezi", "mleté hovězí", "hovezi mlete"], ["mleté hovězí", "hovězí mleté maso", "mleté hovězí maso"]],
    ["hovezi_zadni", "Hovězí zadní", ["hovezi zadni", "hovězí zadní"], ["hovězí zadní", "chlazené hovězí zadní", "hovězí maso zadní"]],
    ["hovezi_steak", "Hovězí steak", ["hovezi steak", "hovězí steak"], ["hovězí steak", "steakové hovězí", "hovězí na steak"]],
    ["slanina", "Slanina", ["slanina"], ["slanina", "anglická slanina", "uzená slanina"]],
    ["sunka", "Šunka", ["sunka", "šunka"], ["šunka", "šunka od kosti", "dušená šunka"], ["pizza sunka", "krmivo"]],
    ["parky", "Párky", ["parky", "párky"], ["párky", "jemné párky", "vídeňské párky"], ["hotdog hotovy"]],
    ["klobasa", "Klobása", ["klobasa", "klobása"], ["klobása", "uzená klobása", "papriková klobása"]],
    ["kacena", "Kachna", ["kacena", "kachna"], ["kachna", "chlazená kachna", "celá kachna"]],
    ["kralik", "Králík", ["kralik", "králík"], ["králík", "králičí maso", "chlazený králík"], ["granule", "kapsicka"]],
  ]),
  ...categoryEntries("ryby_a_morske_plody", [
    ["losos", "Losos", ["losos"], ["losos", "filet z lososa", "čerstvý losos"]],
    ["tunak", "Tuňák", ["tunak", "tuňák"], ["tuňák", "steak z tuňáka", "čerstvý tuňák"], ["kocka", "kapsicka"]],
    ["treska", "Treska", ["treska"], ["treska", "filet z tresky", "treska porce"], ["pomazanka"]],
    ["pangasius", "Pangasius", ["pangasius"], ["pangasius", "filet pangasius", "pangasius porce"]],
    ["pstruh", "Pstruh", ["pstruh"], ["pstruh", "čerstvý pstruh", "pstruh filet"]],
    ["makrela", "Makrela", ["makrela"], ["makrela", "uzená makrela", "filet z makrely"]],
    ["sardinky", "Sardinky", ["sardinky", "sardinka"], ["sardinky", "čerstvé sardinky", "sardinky filet"]],
    ["krevety", "Krevety", ["krevety", "kreveta"], ["krevety", "loupané krevety", "koktejlové krevety"]],
    ["surimi", "Surimi", ["surimi", "krabi tycinky"], ["surimi", "krabí tyčinky", "surimi tyčinky"]],
    ["rybi_prsty", "Rybí prsty", ["rybi prsty", "rybí prsty"], ["rybí prsty", "mražené rybí prsty", "obalené rybí prsty"]],
  ]),
  ...categoryEntries("vejce", [
    ["vejce", "Vejce", ["vejce", "vajicka", "vajíčka"], ["vejce", "slepičí vejce", "čerstvá vejce"]],
    ["vejce_m", "Vejce M", ["vejce m", "vajicka m", "vajíčka m"], ["vejce M", "slepičí vejce velikost M", "čerstvá vejce M"]],
    ["vejce_l", "Vejce L", ["vejce l", "vajicka l", "vajíčka l"], ["vejce L", "slepičí vejce velikost L", "čerstvá vejce L"]],
    ["bilky", "Vaječné bílky", ["bilky", "bílky", "vaječné bílky"], ["vaječné bílky", "tekuté bílky", "bílek"]],
  ]),
  ...categoryEntries("ryze_a_obiloviny", [
    ["ryze", "Rýže", ["ryze", "rýže"], ["rýže", "dlouhozrnná rýže", "bílá rýže"], ["ryzovy napoj"]],
    ["basmati", "Rýže basmati", ["basmati", "basmati ryze"], ["basmati rýže", "rýže basmati", "dlouhozrnná basmati"]],
    ["jasminova_ryze", "Jasmínová rýže", ["jasminova ryze", "jasmínová rýže"], ["jasmínová rýže", "thai jasmine rice", "voňavá rýže"]],
    ["arborio", "Rýže arborio", ["arborio", "arborio ryze"], ["rýže arborio", "arborio", "rizotová rýže"]],
    ["natural_ryze", "Natural rýže", ["natural ryze", "ryze natural"], ["natural rýže", "hnědá rýže", "celozrnná rýže"]],
    ["kuskus", "Kuskus", ["kuskus", "couscous"], ["kuskus", "jemný kuskus", "celozrnný kuskus"]],
    ["bulgur", "Bulgur", ["bulgur"], ["bulgur", "jemný bulgur", "celozrnný bulgur"]],
    ["quinoa", "Quinoa", ["quinoa", "quinoua", "quinua"], ["quinoa", "bílá quinoa", "tricolor quinoa"]],
    ["pohanka", "Pohanka", ["pohanka"], ["pohanka", "loupaná pohanka", "pohanka lámanka"]],
    ["ovesne_vlocky", "Ovesné vločky", ["ovesne vlocky", "ovesné vločky"], ["ovesné vločky", "jemné ovesné vločky", "ovesné vločky celé"]],
    ["krupice", "Krupice", ["krupice", "detska krupice", "dětská krupice"], ["krupice", "pšeničná krupice", "dětská krupice"]],
  ]),
  ...categoryEntries("testoviny", [
    ["spagety", "Špagety", ["spagety", "špagety"], ["špagety", "spaghetti", "těstoviny špagety"]],
    ["penne", "Penne", ["penne"], ["penne", "penne rigate", "těstoviny penne"]],
    ["fusilli", "Fusilli", ["fusilli"], ["fusilli", "vrtule", "těstoviny fusilli"]],
    ["kolinka", "Kolínka", ["kolinka", "kolínka"], ["kolínka", "těstoviny kolínka", "krátké kolínka"]],
    ["tagliatelle", "Tagliatelle", ["tagliatelle"], ["tagliatelle", "vaječné tagliatelle", "nudle tagliatelle"]],
    ["lasagne", "Lasagne pláty", ["lasagne", "lasagne platy", "lasagne pláty"], ["lasagne pláty", "těstoviny lasagne", "pláty na lasagne"]],
    ["nudle", "Nudle", ["nudle"], ["nudle", "vaječné nudle", "polévkové nudle"]],
    ["makarony", "Makarony", ["makarony", "macaroni"], ["makarony", "macaroni", "těstoviny makarony"]],
    ["tortellini", "Tortellini", ["tortellini"], ["tortellini", "čerstvé tortellini", "plněné tortellini"]],
    ["gnocchi", "Gnocchi", ["gnocchi", "noky"], ["gnocchi", "bramborové gnocchi", "italské noky"]],
  ]),
  ...categoryEntries("lusteniny", [
    ["cervena_cocka", "Červená čočka", ["cervena cocka", "červená čočka"], ["červená čočka", "čočka červená loupaná", "červená čočka loupaná"]],
    ["zelena_cocka", "Zelená čočka", ["zelena cocka", "zelená čočka"], ["zelená čočka", "čočka zelená", "klasická zelená čočka"]],
    ["cizrna", "Cizrna", ["cizrna"], ["cizrna", "suchá cizrna", "cizrna v sáčku"]],
    ["hrach_loupany", "Hrách loupaný", ["hrach loupany", "hrách loupaný"], ["hrách loupaný", "loupaný žlutý hrách", "suchý hrách"]],
    ["fazole_bile", "Bílé fazole", ["bile fazole", "bílé fazole"], ["bílé fazole", "suché bílé fazole", "fazole bílé"]],
    ["fazole_cervene", "Červené fazole", ["cervene fazole", "červené fazole"], ["červené fazole", "kidney fazole", "fazole červené"]],
    ["fazole_cerne", "Černé fazole", ["cerne fazole", "černé fazole"], ["černé fazole", "black beans", "fazole černé"]],
    ["mungo", "Mungo", ["mungo", "fazole mungo"], ["mungo", "fazole mungo", "zelené mungo"]],
    ["sojove_boby", "Sójové boby", ["sojove boby", "sójové boby", "soja"], ["sójové boby", "soy beans", "suché sójové boby"]],
    ["cocka_beluga", "Čočka beluga", ["cocka beluga", "čočka beluga"], ["čočka beluga", "černá čočka beluga", "beluga čočka"]],
  ]),
  ...categoryEntries("mouky_a_peceni", [
    ["mouka_hladka", "Mouka hladká", ["mouka hladka", "hladka mouka"], ["mouka hladká", "pšeničná mouka hladká", "hladká mouka"]],
    ["mouka_polohruba", "Mouka polohrubá", ["mouka polohruba", "polohruba mouka"], ["mouka polohrubá", "pšeničná mouka polohrubá", "polohrubá mouka"]],
    ["mouka_hruba", "Mouka hrubá", ["mouka hruba", "hruba mouka"], ["mouka hrubá", "pšeničná mouka hrubá", "hrubá mouka"]],
    ["mouka_celozrnna", "Mouka celozrnná", ["mouka celozrnna", "celozrnna mouka"], ["mouka celozrnná", "celozrnná pšeničná mouka", "celozrnná mouka"]],
    ["mouka_zitna", "Mouka žitná", ["mouka zitna", "zitna mouka", "mouka žitná"], ["mouka žitná", "žitná mouka", "celozrnná žitná mouka"]],
    ["mouka_spaldova", "Mouka špaldová", ["mouka spaldova", "spaldova mouka", "mouka špaldová"], ["mouka špaldová", "špaldová mouka", "jemná špaldová mouka"]],
    ["cukr_krystal", "Cukr krystal", ["cukr krystal", "krystal"], ["cukr krystal", "bílý cukr krystal", "krystalový cukr"]],
    ["cukr_moucka", "Cukr moučka", ["cukr moucka", "mouckovy cukr", "moučkový cukr"], ["cukr moučka", "moučkový cukr", "cukr moučkový"]],
    ["vanilkovy_cukr", "Vanilkový cukr", ["vanilkovy cukr", "vanilinovy cukr"], ["vanilkový cukr", "vanilinový cukr", "cukr vanilkový"]],
    ["prasek_do_peciva", "Prášek do pečiva", ["prasek do peciva", "prášek do pečiva"], ["prášek do pečiva", "kypřicí prášek do pečiva", "prášek do pečení"]],
    ["jedla_soda", "Jedlá soda", ["jedla soda"], ["jedlá soda", "soda bicarbona", "hydrogenuhličitan sodný"]],
    ["kakao", "Kakao", ["kakao"], ["kakao", "kakaový prášek", "holandské kakao"]],
  ]),
  ...categoryEntries("oleje_a_tuky", [
    ["slunecnicovy_olej", "Slunečnicový olej", ["slunecnicovy olej", "slunečnicový olej"], ["slunečnicový olej", "olej slunečnicový", "rostlinný slunečnicový olej"]],
    ["repkovy_olej", "Řepkový olej", ["repkovy olej", "řepkový olej"], ["řepkový olej", "olej řepkový", "rostlinný řepkový olej"]],
    ["olivovy_olej", "Olivový olej", ["olivovy olej", "olivový olej"], ["olivový olej", "extra panenský olivový olej", "olive oil"]],
    ["kokosovy_olej", "Kokosový olej", ["kokosovy olej", "kokosový olej"], ["kokosový olej", "panenský kokosový olej", "coconut oil"], ["telove maslo"]],
    ["sezamovy_olej", "Sezamový olej", ["sezamovy olej", "sezamový olej"], ["sezamový olej", "olej sezamový", "asian sesame oil"]],
    ["sadlo", "Sádlo", ["sadlo", "veprove sadlo", "vepřové sádlo"], ["sádlo", "vepřové sádlo", "domácí sádlo"]],
    ["margarin", "Margarín", ["margarin", "margarín"], ["margarín", "rostlinný margarín", "margarín na pečení"]],
    ["ghee", "Ghí", ["ghee", "ghi", "ghí"], ["ghí", "ghee", "přepuštěné máslo"]],
  ]),
  ...categoryEntries("koreni", [
    ["sul", "Sůl", ["sul", "sůl"], ["sůl", "kuchyňská sůl", "jemná sůl"]],
    ["pepr_cerny", "Pepř černý", ["pepr cerny", "pepř černý", "cerny pepr"], ["pepř černý", "mletý černý pepř", "celý černý pepř"]],
    ["paprika_sladka", "Paprika sladká", ["paprika sladka", "paprika sladká"], ["paprika sladká", "mletá sladká paprika", "sladká paprika koření"]],
    ["paprika_paliva", "Paprika pálivá", ["paprika paliva", "paprika pálivá"], ["paprika pálivá", "mletá pálivá paprika", "pálivá paprika koření"]],
    ["kmin", "Kmín", ["kmin", "kmín"], ["kmín", "celý kmín", "mletý kmín"]],
    ["majoranka", "Majoránka", ["majoranka", "majoránka"], ["majoránka", "sušená majoránka", "majoránka koření"]],
    ["oregano", "Oregano", ["oregano"], ["oregano", "sušené oregano", "oregano koření"]],
    ["bazalka", "Bazalka", ["bazalka"], ["bazalka", "sušená bazalka", "bazalka koření"]],
    ["tymian", "Tymián", ["tymian", "tymián"], ["tymián", "sušený tymián", "tymián koření"]],
    ["kari", "Kari", ["kari", "curry"], ["kari", "kari koření", "curry powder"]],
    ["kurkuma", "Kurkuma", ["kurkuma"], ["kurkuma", "mletá kurkuma", "kurkuma koření"]],
    ["skorice", "Skořice", ["skorice", "skořice"], ["skořice", "mletá skořice", "skořice cejlonská"]],
  ]),
  ...categoryEntries("omacky_a_dochucovadla", [
    ["kecup", "Kečup", ["kecup", "kečup"], ["kečup", "rajčatový kečup", "jemný kečup"]],
    ["horcice", "Hořčice", ["horcice", "hořčice"], ["hořčice", "plnotučná hořčice", "kremžská hořčice"]],
    ["majoneza", "Majonéza", ["majoneza", "majonéza"], ["majonéza", "klasická majonéza", "majoneza light"]],
    ["tatarska_omacka", "Tatarská omáčka", ["tatarska omacka", "tatarská omáčka"], ["tatarská omáčka", "tatarka", "tatarská omáčka klasická"]],
    ["sojova_omacka", "Sójová omáčka", ["sojova omacka", "sójová omáčka"], ["sójová omáčka", "soy sauce", "tmavá sójová omáčka"]],
    ["worcester", "Worcester", ["worcester", "worcesterska omacka", "worcesterská omáčka"], ["worcester", "worcesterská omáčka", "worcestershire sauce"]],
    ["bbq_omacka", "BBQ omáčka", ["bbq omacka", "barbecue omacka"], ["BBQ omáčka", "barbecue omáčka", "grilovací omáčka bbq"]],
    ["sweet_chilli", "Sweet chilli omáčka", ["sweet chilli", "sweet chilli omacka"], ["sweet chilli omáčka", "sladká chilli omáčka", "thai sweet chilli"]],
    ["rajcatovy_protlak", "Rajčatový protlak", ["rajcatovy protlak", "rajčatový protlak"], ["rajčatový protlak", "protlak rajčatový", "tomato paste"]],
    ["passata", "Passata", ["passata", "rajcatove pyre", "rajčatové pyré"], ["passata", "rajčatové pyré", "tomato passata"]],
    ["pesto", "Pesto", ["pesto"], ["pesto", "bazalkové pesto", "pesto genovese"]],
    ["hummus", "Hummus", ["hummus", "humus"], ["hummus", "cizrnový hummus", "pomazánka hummus"]],
    ["balsamico", "Balzamikový ocet", ["balsamico", "balzamikovy ocet", "balzamikový ocet"], ["balzamikový ocet", "balsamico", "aceto balsamico"]],
  ]),
  ...categoryEntries("konzervy_a_trvanlive", [
    ["tunak_konzerva", "Tuňák v konzervě", ["tunak v konzerve", "tuňák v konzervě"], ["tuňák v konzervě", "tuna chunks", "tuňák kousky"], ["kapsicka", "pro kocky"]],
    ["kukurice_konzerva", "Kukuřice v konzervě", ["kukurice v konzerve", "kukuřice v konzervě"], ["kukuřice v konzervě", "sterilovaná kukuřice", "sladká kukuřice konzerva"]],
    ["hrasek_konzerva", "Hrášek v konzervě", ["hrasek v konzerve", "hrášek v konzervě"], ["hrášek v konzervě", "sterilovaný hrášek", "zelený hrášek konzerva"]],
    ["fazole_konzerva", "Fazole v konzervě", ["fazole v konzerve", "fazole konzerva"], ["fazole v konzervě", "sterilované fazole", "fazole konzerva"]],
    ["cizrna_konzerva", "Cizrna v konzervě", ["cizrna v konzerve", "cizrna konzerva"], ["cizrna v konzervě", "sterilovaná cizrna", "cizrna konzerva"]],
    ["rajcata_loupana", "Loupaná rajčata", ["loupana rajcata", "loupaná rajčata"], ["loupaná rajčata", "rajčata loupaná v plechu", "peeled tomatoes"]],
    ["rajcata_krajena", "Krájená rajčata", ["krajena rajcata", "krájená rajčata"], ["krájená rajčata", "rajčata krájená v plechu", "diced tomatoes"]],
    ["kokosove_mleko", "Kokosové mléko", ["kokosove mleko", "kokosové mléko"], ["kokosové mléko", "coconut milk", "kokosové mléko konzerva"]],
    ["okurky_sterilovane", "Sterilované okurky", ["sterilovane okurky", "okurky sterilované"], ["sterilované okurky", "okurky ve sladkokyselém nálevu", "kyselé okurky"]],
    ["cervena_repa_sterilovana", "Červená řepa sterilovaná", ["cervena repa sterilovana", "červená řepa sterilovaná"], ["červená řepa sterilovaná", "sterilovaná řepa", "červená řepa ve sklenici"]],
    ["dzem_jahodovy", "Džem jahodový", ["dzem jahodovy", "džem jahodový", "jahodovy dzem"], ["džem jahodový", "jahodový džem", "extra džem jahoda"]],
    ["med", "Med", ["med", "vceli med", "včelí med"], ["med", "včelí med", "květový med"], ["medium", "medove pivo", "medvidci"]],
  ]),
  ...categoryEntries("mrazene", [
    ["mrazena_zelenina", "Mražená zelenina", ["mrazena zelenina", "mražená zelenina"], ["mražená zelenina", "zeleninová směs mražená", "frozen vegetables"]],
    ["mrazeny_hrasek", "Mražený hrášek", ["mrazeny hrasek", "mražený hrášek"], ["mražený hrášek", "frozen peas", "zelený hrášek mražený"]],
    ["mrazena_kukurice", "Mražená kukuřice", ["mrazena kukurice", "mražená kukuřice"], ["mražená kukuřice", "frozen corn", "kukuřice mražená"]],
    ["mrazena_brokolice", "Mražená brokolice", ["mrazena brokolice", "mražená brokolice"], ["mražená brokolice", "brokolice růžičky mražené", "frozen broccoli"]],
    ["mrazene_jahody", "Mražené jahody", ["mrazene jahody", "mražené jahody"], ["mražené jahody", "jahody mražené", "frozen strawberries"]],
    ["mrazene_hranolky", "Mražené hranolky", ["mrazene hranolky", "mražené hranolky"], ["mražené hranolky", "french fries frozen", "hranolky do trouby"]],
    ["mrazena_pizza", "Mražená pizza", ["mrazena pizza", "mražená pizza"], ["mražená pizza", "pizza frozen", "chlazená pizza"]],
    ["mrazene_nugety", "Mražené nugety", ["mrazene nugety", "mražené nugety"], ["mražené nugety", "kuřecí nugety mražené", "chicken nuggets frozen"]],
  ]),
  ...categoryEntries("napoje", [
    ["voda_neperliva", "Voda neperlivá", ["voda neperliva", "neperliva voda"], ["neperlivá voda", "voda neperlivá", "stolní voda neperlivá"]],
    ["voda_jemne_perliva", "Voda jemně perlivá", ["voda jemne perliva", "jemne perliva voda"], ["jemně perlivá voda", "voda jemně perlivá", "stolní voda jemně perlivá"]],
    ["voda_perliva", "Voda perlivá", ["voda perliva", "perliva voda"], ["perlivá voda", "voda perlivá", "stolní voda perlivá"]],
    ["cola", "Cola", ["cola", "kola"], ["cola", "cola original", "cola klasická"]],
    ["cola_zero", "Cola zero", ["cola zero", "kola zero", "cola light"], ["cola zero", "cola bez cukru", "cola light"]],
    ["citronada", "Citronáda", ["citronada", "citronáda", "limonada"], ["citronáda", "limonáda citron", "sycená citronáda"]],
    ["pomerancovy_dzus", "Pomerančový džus", ["pomerancovy dzus", "pomerančový džus"], ["pomerančový džus", "100% pomerančová šťáva", "orange juice"]],
    ["jablecny_dzus", "Jablečný džus", ["jablecny dzus", "jablečný džus"], ["jablečný džus", "100% jablečná šťáva", "apple juice"]],
    ["ledeny_caj", "Ledový čaj", ["ledeny caj", "ledový čaj", "ice tea"], ["ledový čaj", "ice tea", "broskvový ledový čaj"]],
    ["energeticky_napoj", "Energetický nápoj", ["energeticky napoj", "energetický nápoj", "energy drink"], ["energetický nápoj", "energy drink", "energetický drink"]],
    ["kava_mleta", "Káva mletá", ["kava mleta", "káva mletá"], ["káva mletá", "mletá káva", "pražená mletá káva"]],
    ["kava_zrnkova", "Káva zrnková", ["kava zrnkova", "káva zrnková"], ["káva zrnková", "zrnková káva", "coffee beans"]],
    ["cerny_caj", "Černý čaj", ["cerny caj", "černý čaj"], ["černý čaj", "sáčkový černý čaj", "earl grey"]],
    ["zeleny_caj", "Zelený čaj", ["zeleny caj", "zelený čaj"], ["zelený čaj", "sáčkový zelený čaj", "green tea"]],
    ["ovocny_caj", "Ovocný čaj", ["ovocny caj", "ovocný čaj"], ["ovocný čaj", "lesní ovoce čaj", "sáčkový ovocný čaj"]],
    ["instantni_kava", "Káva instantní", ["instantni kava", "instantní káva"], ["instantní káva", "rozpustná káva", "instant coffee"]],
  ]),
  ...categoryEntries("sladke", [
    ["cokolada_mlecna", "Čokoláda mléčná", ["cokolada mlecna", "čokoláda mléčná"], ["mléčná čokoláda", "čokoláda mléčná", "tabulka mléčné čokolády"]],
    ["cokolada_horka", "Čokoláda hořká", ["cokolada horka", "čokoláda hořká"], ["hořká čokoláda", "čokoláda hořká", "dark chocolate"]],
    ["susenky", "Sušenky", ["susenky", "sušenky"], ["sušenky", "máslové sušenky", "kakaové sušenky"]],
    ["oplatky", "Oplatky", ["oplatky", "oplatka"], ["oplatky", "čokoládové oplatky", "plněné oplatky"]],
    ["bonbony", "Bonbony", ["bonbony", "bonbony tvrde"], ["bonbony", "tvrdé bonbony", "ovocné bonbony"]],
    ["zele_bonbony", "Želé bonbony", ["zele bonbony", "želé bonbony", "gumove bonbony"], ["želé bonbony", "gumové bonbony", "ovocné želé bonbony"]],
    ["pernik", "Perník", ["pernik", "perník"], ["perník", "perník plátky", "medový perník"]],
    ["piskoty", "Piškoty", ["piskoty", "piškoty"], ["piškoty", "dětské piškoty", "cukrářské piškoty"]],
    ["nugatovy_krem", "Nugátový krém", ["nugatovy krem", "nugátový krém", "cokoladova pomazanka"], ["nugátový krém", "čokoládovo-oříškový krém", "lískooříškový krém"]],
    ["musli_tycinka", "Müsli tyčinka", ["musli tycinka", "müsli tyčinka"], ["müsli tyčinka", "cereální tyčinka", "ovocná müsli tyčinka"]],
  ]),
  ...categoryEntries("snacky", [
    ["chipsy", "Chipsy", ["chipsy", "bramburky"], ["chipsy", "bramborové chipsy", "slané chipsy"]],
    ["tortillove_chipsy", "Tortillové chipsy", ["tortillove chipsy", "tortilla chips"], ["tortillové chipsy", "nachos chips", "kukuřičné tortilla chips"]],
    ["popcorn", "Popcorn", ["popcorn"], ["popcorn", "mikrovlnný popcorn", "slaný popcorn"]],
    ["slane_tycky", "Slané tyčky", ["slane tycky", "slané tyčky"], ["slané tyčky", "preclíkové tyčky", "slaný snack tyčky"]],
    ["precliky", "Preclíky", ["precliky", "preclíky"], ["preclíky", "slaný preclík", "mini preclíky"]],
    ["crackers", "Crackers", ["crackers", "krekry"], ["crackers", "slané krekry", "cheese crackers"]],
    ["arasidy", "Arašídy", ["arasidy", "arašídy"], ["arašídy", "pražené arašídy", "solené arašídy"]],
    ["kesu", "Kešu", ["kesu", "kešu"], ["kešu", "kešu natural", "pražené kešu"]],
    ["mandle", "Mandle", ["mandle", "mandli"], ["mandle", "mandle natural", "loupané mandle"]],
    ["pistacie", "Pistácie", ["pistacie", "pistácie"], ["pistácie", "pražené pistácie", "solené pistácie"]],
    ["studentska_smes", "Studentská směs", ["studentska smes", "studentská směs"], ["studentská směs", "ořechovo-ovocná směs", "mix ořechů a rozinek"]],
    ["ryzove_chlebicky", "Rýžové chlebíčky", ["ryzove chlebicky", "rýžové chlebíčky"], ["rýžové chlebíčky", "rice cakes", "extrudované rýžové chlebíčky"]],
    ["dynova_seminka", "Dýňová semínka", ["dynova seminka", "dýňová semínka"], ["dýňová semínka", "loupaná dýňová semínka", "pumpkin seeds"]],
    ["slunecnicova_seminka", "Slunečnicová semínka", ["slunecnicova seminka", "slunečnicová semínka"], ["slunečnicová semínka", "loupaná slunečnicová semínka", "sunflower seeds"]],
    ["proteinova_tycinka", "Proteinová tyčinka", ["proteinova tycinka", "proteinová tyčinka"], ["proteinová tyčinka", "high protein bar", "protein bar"]],
  ]),
];

const dictionary = Object.fromEntries(entries);

fs.writeFileSync(OUTPUT_PATH, JSON.stringify(dictionary, null, 2) + "\n", "utf8");
console.log(`search_dictionary.json generated with ${entries.length} entries`);
