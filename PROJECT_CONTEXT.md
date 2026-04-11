# 🥬 Foodappka - Projektový Kontext

Tento dokument slouží jako hlavní zdroj informací pro AI agenty pracující na projektu Foodappka. Obsahuje architektonické principy, technologický stack a konvence kódování.

## 🚀 O projektu
Foodappka je moderní srovnávač akčních cen potravin z českých letáků kombinovaný s chytrým vyhledávačem receptů. Umožňuje uživatelům najít nejlevnější ingredience pro konkrétní jídla napříč řetězci nebo v rámci jednoho konkrétního obchodu.

## 🛠 Technologický Stack
- **Framework:** Next.js 16 (App Router)
- **UI:** React 19, Tailwind CSS 4
- **Animace:** Framer Motion
- **Databáze & Auth:** Supabase (PostgreSQL)
- **Scraping:** Cheerio (pro parsování HTML z letáků)
- **Jazyk:** TypeScript

## 📂 Struktura složek
- `app/app/`: Hlavní dashboard aplikace (Search, Recipes, Watchdog, Favorites, Notifications, Lists, Settings).
- `app/api/`: API routy pro vyhledávání a recepty.
- `lib/scrapers/`: Implementace scrapování pro různé zdroje (Lidl, Kaufland, Foodora, Kupi).
- `lib/food.ts`: Jádro logiky – normalizace textu, scoring shody produktů, řazení obchodů.
- `components/ui/`: UI komponenty jako `AuroraBackground`.

## 🔍 Logika Vyhledávání & Receptů
### Scoring
V `lib/food.ts` je implementován **scoring systém** (`scoreProductMatch`), který normalizuje text a upřednostňuje přesné shody.
### Inkrementální hledání receptů
Recepty se vyhledávají položku po položce. Jakmile je nalezena cena pro jednu ingredienci, okamžitě se zobrazí v UI (není třeba čekat na dokončení celého receptu).
### Režim "Jeden obchod"
Aplikace umí analyzovat výsledky a najít jeden konkrétní řetězec, ve kterém lze nakoupit nejvíce položek z receptu za nejnižší celkovou cenu.

## 🎨 Design Systém
- **Logo:** Font **Gravitas One**.
- **Hero:** Animované pozadí `AuroraBackground` s plynulými zelenými světly.
- **Navbar:** Průhledný u Hero sekce, po scrollování získá efekt mléčného skla (bez ohraničení).
- **Konzistence:** Všechna tlačítka jsou `rounded-full`. Plovoucí karty mají `rounded-[2rem]`.

## ⚠️ Důležitá pravidla pro vývoj
1. **Typová bezpečnost:** Nepoužívej `any`. Vždy definuj rozhraní (např. `FavoriteItem`, `ShoppingList`).
2. **Výkon:** Náročné animace (jako Aurora) musí být optimalizované (bez `background-attachment: fixed`, s GPU akcelerací).
3. **UX:** Při hledání zobrazuj `SearchLoadingAnimation` s indikátorem konkrétního obchodu a reálným/psychologickým progress barem.
4. **Čeština:** Pozor na gramatiku (např. "z milionu položek").
