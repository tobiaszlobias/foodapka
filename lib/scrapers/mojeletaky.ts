import { normalizeText } from "@/lib/food";
import { fetchHtml } from "@/lib/scrapers/shared";

const MOJELETAKY_ORIGIN = "https://mojeletaky.cz";
const MOJELETAKY_IMAGE_ORIGIN = "https://app.mojeletaky.cz";

// mojeletaky.cz agreguje celé letáky (všechny stránky jako obrázky) veřejně,
// bez tokenu — appka to používá jen jako zdroj obrázku letáku, ceny/produkty
// pořád táhne z Kupi/Foodora/vlastních API scraperů.
const STORE_SLUGS: Record<string, string> = {
  tesco: "tesco",
  kaufland: "kaufland",
  penny: "penny",
  albert: "albert",
  billa: "billa",
  lidl: "lidl",
  globus: "globus",
};

function resolveStoreSlug(shopName: string) {
  const normalized = normalizeText(shopName);
  return Object.entries(STORE_SLUGS).find(([key]) => normalized.includes(key))?.[1];
}

type LeafletPagesCacheEntry = { pages: string[]; fetchedAt: number };
const leafletPagesCache = new Map<string, LeafletPagesCacheEntry>();
const CACHE_TTL_MS = 60 * 60 * 1000; // 1 hodina — letáky se mění max 1x týdně

type LeafletCandidate = {
  id: string;
  validFrom: Date;
  validTo: Date;
  numberOfPages: number;
  additionalInfo: string;
};

// Obchody (typicky Kaufland, Lidl) mívají na mojeletaky.cz souběžně i
// samostatný leták jen s nepotravinovým/spotřebním zbožím — appka ho vylučuje,
// jinak by mohla ukázat leták s nábytkem/elektronikou místo potravin.
function isNonFoodLeaflet(additionalInfo: string) {
  return normalizeText(additionalInfo).includes("spotrebni zbozi");
}

// Karta letáku je v HTML zapsaná jako JSON fragment tvaru:
// {"id":"kaufland-08-07-26-14-07-26-dwliv","uuid":null,"validFrom":"2026-07-08",
//  "validTo":"2026-07-14","numberOfPages":54,"additionalInfo":"Akční nabídka"
// additionalInfo bývá i null (holý string bez kategorie, např. u Penny).
function parseLeafletCandidates(html: string, storeSlug: string): LeafletCandidate[] {
  const pattern = new RegExp(
    `\\{\\\\"id\\\\":\\\\"(${storeSlug}-[a-z0-9-]+)\\\\",\\\\"uuid\\\\":null,\\\\"validFrom\\\\":\\\\"([^"]*)\\\\",\\\\"validTo\\\\":\\\\"([^"]*)\\\\",\\\\"numberOfPages\\\\":(\\d+),\\\\"additionalInfo\\\\":(null|\\\\"[^"]*\\\\")`,
    "g",
  );

  const candidates: LeafletCandidate[] = [];
  const seenIds = new Set<string>();

  for (const match of html.matchAll(pattern)) {
    const [, id, validFromStr, validToStr, numberOfPagesStr, additionalInfoRaw] = match;
    if (seenIds.has(id)) continue;
    seenIds.add(id);

    candidates.push({
      id,
      validFrom: new Date(`${validFromStr}T00:00:00`),
      validTo: new Date(`${validToStr}T23:59:59`),
      numberOfPages: Number(numberOfPagesStr),
      additionalInfo: additionalInfoRaw === "null" ? "" : additionalInfoRaw.slice(2, -2),
    });
  }

  return candidates;
}

function pickBestLeaflet(candidates: LeafletCandidate[]): LeafletCandidate | null {
  const foodCandidates = candidates.filter((c) => !isNonFoodLeaflet(c.additionalInfo));
  const pool = foodCandidates.length > 0 ? foodCandidates : candidates;
  if (pool.length === 0) return null;

  const now = Date.now();
  const current = pool.find((c) => now >= c.validFrom.getTime() && now <= c.validTo.getTime());
  if (current) return current;

  // Žádný aktuální — vezme nejbližší budoucí (nejmenší validFrom v budoucnu).
  const upcoming = pool
    .filter((c) => c.validFrom.getTime() > now)
    .sort((a, b) => a.validFrom.getTime() - b.validFrom.getTime());
  return upcoming[0] ?? pool[0];
}

async function findCurrentLeaflet(storeSlug: string): Promise<LeafletCandidate | null> {
  const { html } = await fetchHtml(
    `${MOJELETAKY_ORIGIN}/nejnovejsi-akci-letaky/1?store=${storeSlug}`,
  );

  const candidates = parseLeafletCandidates(html, storeSlug);
  return pickBestLeaflet(candidates);
}

function formatYYMMDD(date: Date) {
  const yy = String(date.getFullYear() % 100).padStart(2, "0");
  const mm = String(date.getMonth() + 1).padStart(2, "0");
  const dd = String(date.getDate()).padStart(2, "0");
  return `${yy}${mm}${dd}`;
}

// image00 je jen zmenšená rozmazaná obálka (~15× menší soubor než ostatní
// stránky) se stejným obsahem jako image01 — appka ji přeskakuje a rovnou
// začíná na první plnohodnotné stránce letáku.
function buildPageUrls(leaflet: LeafletCandidate, storeSlug: string): string[] {
  const hash = leaflet.id.slice(`${storeSlug}-`.length).split("-").pop();
  if (!hash) return [];

  const folder = `${formatYYMMDD(leaflet.validTo)}_${formatYYMMDD(leaflet.validFrom)}_${storeSlug}_${hash}`;

  return Array.from(
    { length: Math.max(0, leaflet.numberOfPages - 1) },
    (_, i) => `${MOJELETAKY_IMAGE_ORIGIN}/${folder}/image${String(i + 1).padStart(2, "0")}.jpg`,
  );
}

/** Vrátí URL všech stránek aktuálního (potravinového) letáku daného obchodu, nebo prázdné pole. */
export async function findLeafletPages(shopName: string): Promise<string[]> {
  const storeSlug = resolveStoreSlug(shopName);
  if (!storeSlug) return [];

  const cached = leafletPagesCache.get(storeSlug);
  if (cached && Date.now() - cached.fetchedAt < CACHE_TTL_MS) {
    return cached.pages;
  }

  const leaflet = await findCurrentLeaflet(storeSlug);
  if (!leaflet) return [];

  const pages = buildPageUrls(leaflet, storeSlug);
  if (pages.length === 0) return [];

  leafletPagesCache.set(storeSlug, { pages, fetchedAt: Date.now() });
  return pages;
}
