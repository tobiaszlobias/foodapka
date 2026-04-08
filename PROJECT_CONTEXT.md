# 🥬 Foodapka - Projektový Kontext

Tento dokument slouží jako hlavní zdroj informací pro AI agenty pracující na projektu Foodapka. Obsahuje architektonické principy, technologický stack a konvence kódování.

## 🚀 O projektu
Foodapka je moderní srovnávač akčních cen potravin z českých letáků kombinovaný s chytrým vyhledávačem receptů. Umožňuje uživatelům najít nejlevnější ingredience pro konkrétní jídla napříč řetězci.

## 🛠 Technologický Stack
- **Framework:** Next.js 16 (App Router)
- **UI:** React 19, Tailwind CSS 4
- **Databáze & Auth:** Supabase (PostgreSQL)
- **Scraping:** Cheerio (pro parsování HTML z letáků)
- **Jazyk:** TypeScript

## 📂 Struktura složek
- `app/app/`: Hlavní dashboard aplikace (Search, Watchdog, Lists, Settings).
- `app/api/`: API routy pro vyhledávání a recepty.
- `lib/scrapers/`: Implementace scrapování pro různé zdroje (Lidl, Kaufland, Foodora, Kupi).
- `lib/food.ts`: Jádro logiky – normalizace textu, scoring shody produktů, řazení obchodů.
- `lib/ingredientClasses.ts`: Mapování ingrediencí na alternativní vyhledávací dotazy (např. "máslo" -> "máslo čerstvé").
- `components/`: Znovu použitelné UI komponenty.

## 🔍 Logika Vyhledávání (Scoring)
Aplikace nepoužívá jen prostý fulltext. V `lib/food.ts` je implementován sofistikovaný **scoring systém** (`scoreProductMatch`), který:
1. Normalizuje text (odstraní diakritiku, převede na malá písmena).
2. Tokenizuje dotaz.
3. Penalizuje nepravděpodobná slova a ne-potraviny (box, pexeso...).
4. Upřednostňuje přesné shody a shody na začátku názvu.

## 🎨 Design Systém & Stylování
- **Barevná paleta:** Custom Lime systém (`--foodapka-50` až `950`). Hlavní barva: `#84cc16`.
- **Dark Mode:** Implementován pomocí `data-theme="dark"` na tagu `<html>`.
- **Konvence:**
  - Černé pozadí (`bg-black`) v dark modu pro celou stránku.
  - Karty a boxy mají v dark modu tmavě zelenou barvu (deriváty `foodapka-950`).
  - Zaoblení: Standardně `rounded-2xl` pro hlavní karty, `rounded-full` pro tlačítka.
  - Šířka obsahu: V hlavním dashboardu fixní `max-w-4xl` pro konzistenci se stránkou nastavení.

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

## ⚠️ Důležitá pravidla pro vývoj
1. **Změny v UI:** Vždy udržuj konzistenci s `max-w-4xl` kontejnerem v `/app`.
2. **Karty:** Obsahové karty v dark modu nesmí "přetékat" bílou/zelenou barvou mimo své ohraničení na černé pozadí stránky.
3. **Scrapers:** Při úpravě scraperů v `lib/scrapers` vždy kontroluj typ `Store`.
4. **Normalizace:** Vždy používej `normalizeText` z `lib/food.ts` pro porovnávání řetězců.
