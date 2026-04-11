# 🥬 Foodappka - Projektový Kontext

Tento dokument slouží jako hlavní zdroj informací pro AI agenty pracující na projektu Foodappka. Obsahuje architektonické principy, technologický stack a konvence kódování.

## 🚀 O projektu
Foodappka je moderní srovnávač akčních cen potravin z českých letáků kombinovaný s chytrým vyhledávačem receptů. Umožňuje uživatelům najít nejlevnější ingredience pro konkrétní jídla napříč řetězci.

## 🛠 Technologický Stack
- **Framework:** Next.js 16 (App Router)
- **UI:** React 19, Tailwind CSS 4
- **Databáze & Auth:** Supabase (PostgreSQL)
- **Scraping:** Cheerio (pro parsování HTML z letáků)
- **Jazyk:** TypeScript

## 📂 Struktura složek
- `app/app/`: Hlavní dashboard aplikace (Search, Recipes, Watchdog, Favorites, Notifications, Lists, Settings).
- `app/api/`: API routy pro vyhledávání a recepty.
- `lib/scrapers/`: Implementace scrapování pro různé zdroje (Lidl, Kaufland, Foodora, Kupi).
- `lib/food.ts`: Jádro logiky – normalizace textu, scoring shody produktů, řazení obchodů.
- `lib/ingredientClasses.ts`: Mapování ingrediencí na alternativní vyhledávací dotazy.
- `components/`: Znovu použitelné UI komponenty.

## 🔍 Logika Vyhledávání (Scoring)
Aplikace nepoužívá jen prostý fulltext. V `lib/food.ts` je implementován sofistikovaný **scoring systém** (`scoreProductMatch`), který:
1. Normalizuje text (odstraní diakritiku, převede na malá písmena).
2. Tokenizuje dotaz.
3. Penalizuje nepravděpodobná slova a ne-potraviny.
4. Upřednostňuje přesné shody a shody na začátku názvu.

## 🎨 Design Systém & Stylování
- **Logo:** Používá font **Gravitas One** (definováno jako `font-asset`).
- **Barevná paleta:** 
  - Primární: Custom Lime systém (`--foodappka-50` až `950`). Hlavní barva: `#84cc16`.
  - Akcentní: Žlutá `#e2ff3b` (použita pro slevové badge a důležité statistiky).
- **Dark Mode:** Implementován pomocí `data-theme="dark"`.
  - Černé pozadí (`bg-black`) nebo tmavě zelené (`foodappka-950`).
  - Prvky v headeru používají v dark modu `foodappka-800/50`.
- **Konvence:**
  - Zaoblení: `rounded-[3rem]` pro velké sekce na landing page, `rounded-2xl` pro karty, `rounded-full` pro všechna tlačítka a search bar.
  - Šířka obsahu: `max-w-5xl` pro hlavní dashboard.

## 💾 Datové Modely
### Product
```typescript
{
  name: string;
  url: string;
  stores: Store[];
}
```
### Store
```typescript
{
  shopName: string;
  price: string; // Formátováno jako string s Kč
  pricePerUnit: string;
  validity: string;
  source: PriceSource;
}
```

## 🔐 Supabase & Preference
Uživatelská data jsou uložena v tabulce `user_preferences`:
- `favorite_stores`: Pole oblíbených řetězců.
- `diet_type`: none, vegetarian, vegan, pescatarian.
- `allergens`: Pole zakázaných alergenů.
- `favorite_categories`: Pole oblíbených kategorií jídel.

## ⚠️ Důležitá pravidla pro vývoj
1. **Typová bezpečnost:** Důsledně se vyhýbej typu `any`. Vždy definuj rozhraní nebo typy pro data ze Supabase a API.
2. **React Hooks:** Vždy uváděj všechny závislosti v polích `useEffect` a `useCallback`.
3. **UI Konzistence:** Tlačítka musí být vždy `rounded-full`. Loga obchodů v aplikaci musí být dostatečně velká (min. `h-12`).
4. **UX:** Při načítání vyhledávání nebo receptů vždy zobrazuj `SearchLoadingAnimation` (Hlídací pes) a využij automatické scrollování k výsledkům.
5. **Scrapers:** Při úpravě scraperů v `lib/scrapers` vždy kontroluj typ `Store`.
6. **Normalizace:** Vždy používej `normalizeText` z `lib/food.ts` pro porovnávání řetězců.
