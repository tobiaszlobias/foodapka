# Foodappka — CLAUDE.md

Česká aplikace pro porovnání cen potravin napříč supermarkety. Zobrazuje aktuální akční ceny z Lidlu, Kauflandu, Alberta, Tesca, Penny, Billy a Globusu a umožňuje nakupovat ingredience na recepty co nejlevněji.

## Git workflow

Po každé dokončené změně (build/lint prošly) automaticky `git add` + `commit` + `push` na `main`, bez ptaní o svolení.

## Příkazy

```bash
npm run dev     # dev server (NODE_OPTIONS pro velké cookies)
npm run build   # produkční build
npm run lint    # ESLint
```

## Tech stack

- **Next.js 16 App Router** + React 19, TypeScript 5 (strict)
- **Tailwind CSS 4** + Framer Motion 12
- **Supabase** (auth + shopping lists)
- **Cheerio** (web scraping)
- **Anthropic Claude** (`claude-haiku-4-5`) — generování receptů
- Balíčky `openai` a Google Gemini nejsou aktivně používány — kandidáti na odstranění

## Struktura projektu

```
app/
  (auth)/login, signup/     # auth stránky
  app/                      # chráněná část (dashboard)
    layout.tsx              # obaluje Sidebar + BottomNav
    page.tsx                # hlavní dashboard (módy: search, recipes, watchdog, lists…)
    settings/page.tsx
  api/
    search/route.ts         # GET — hledá produkt ve všech zdrojích
    recipe/route.ts         # POST — načte preset recept
    generate-recipe/route.ts # POST — AI generování přes Gemini
  layout.tsx                # root layout (fonty, ThemeScript, Toast, HelpModal)
  page.tsx                  # landing page
lib/
  food.ts                   # jádro: parsování cen, scoring, normalizace, deduplikace
  recipes.ts                # preset recepty (8 ks, hardcoded)
  ingredientClasses.ts      # klasifikační pravidla pro ingredience
  searchProfiles.ts         # filterProductsForQuery — hlavní filtrovací logika
  storeLogos.ts             # mapování ikon obchodů
  supabase/                 # client / server / middleware
  scrapers/
    index.ts                # orchestrátor (spustí všechny zdroje paralelně)
    kupi.ts                 # Kupi.cz (Albert, Tesco, Billa, Globus, Penny…)
    kaufland.ts
    lidl.ts
    foodora.ts              # Foodora GraphQL (Albert, Billa, Globus, Tesco)
    shared.ts               # sdílené utility, User-Agent, retry
components/
  dashboard/                # SearchSection, RecipeSection, WatchdogSection, ListsSection
  ui/aurora-background.tsx  # animovaný hero gradient
  AppHeader, Sidebar, BottomNav, SearchBar, Toast, HelpModal, ThemeToggle…
```

## Klíčová business logika

### Scrapery (lib/scrapers/)
- Běží **paralelně** přes `Promise.allSettled()` — výpadek jednoho zdroje neblokuje ostatní
- 4 zdroje: kupi, kaufland, lidl, foodora

### Vyhledávání (lib/food.ts)
Normalizace ve 3 vrstvách:
1. `stripDiacritics()` — odstraní diakritiku
2. `normalizeText()` — lowercase + speciální znaky
3. `normalizeSearchText()` — české varianty (ě→e atd.)

Scoring (`scoreProductMatch`):
- Přesná shoda: +500, začíná dotazem: +300, obsahuje: +200
- Penalizace za chybějící tokeny (−50), přebytečné tokeny (−15), non-food produkty (−100), špatná kategorie (−200)

### API routes

**GET /api/search**
- params: `q`, `recipe?`, `banned[]?`, `debug?`
- vrací `{ products: Product[], count, debug }`

**POST /api/recipe**
- body: `{ recipe: string }`
- lookup v RECIPE_PRESETS; 404 pokud nenalezeno

**POST /api/generate-recipe**
- body: `{ prompt: string }`
- volá Anthropic Claude, vrací strukturovaný JSON s ingrediencemi + search queries

## Módy dashboardu

| Mód | Stav |
|-----|------|
| search | funkční |
| recipes | funkční (8 preset + AI generování) |
| watchdog | UI placeholder, bez backendu |
| favorites | localStorage per user ID |
| notifications | UI placeholder |
| lists | Supabase (shopping_lists tabulka) |

## Design systém

**Brand barva:** lime / foodappka-green
- 500: `#84cc16`, 600: `#65a30d`, 700: `#4d7c0f`

**Fonty:** Manrope (body), Plus Jakarta Sans (display), Gravitas One (logo)

**Border radius:** buttons `rounded-full`, cards `rounded-[2rem]`

**Dark mode:** `data-theme="dark"` na `<html>`, persistence v localStorage. Landing page si vynucuje light mode.

## Prostředí

```env
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
ANTHROPIC_API_KEY=
```

`middleware.ts` běží na všech routes (kromě statiky) — obnovuje Supabase session.

## Výkon & konvence

- Lazy loading obrázků
- Suspense boundaries pro Sidebar/BottomNav
- `useSearchParams()` pro URL-based přepínání módů
- Emoji prefixy v console logu: 🚀 ❌ ✅ 💥
- `NODE_OPTIONS='--max-http-header-size=65536'` — pro velké cookies z více store sessions

## Co ještě není hotové

- Watchdog (hlídač cen) — jen UI, žádný backend
- Notifikace — jen UI placeholder
- Žádné infinite scroll na výsledcích hledání
- Recepty jsou hardcoded (8 ks), bez CMS
