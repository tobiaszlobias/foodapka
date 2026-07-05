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

// Slug má tvar "{store}-{DD-MM-RR}-{DD-MM-RR}-{hash}" (validFrom-validTo). Karty
// na stránce NEJSOU řazené chronologicky (i budoucí týdny se objevují první),
// takže je nutné vybrat ten slug, jehož rozsah platnosti obsahuje dnešek.
function parseSlugValidity(slug: string, storeSlug: string) {
  const rest = slug.slice(storeSlug.length + 1); // odstraní "{store}-" prefix
  const match = rest.match(/^(\d{2})-(\d{2})-(\d{2})-(\d{2})-(\d{2})-(\d{2})-/);
  if (!match) return null;

  const [, fromD, fromM, fromY, toD, toM, toY] = match;
  const validFrom = new Date(2000 + Number(fromY), Number(fromM) - 1, Number(fromD));
  const validTo = new Date(2000 + Number(toY), Number(toM) - 1, Number(toD), 23, 59, 59);
  return { validFrom, validTo };
}

async function findCurrentLeafletSlug(storeSlug: string): Promise<string | null> {
  const { html } = await fetchHtml(
    `${MOJELETAKY_ORIGIN}/nejnovejsi-akci-letaky/1?store=${storeSlug}`,
  );

  const slugs = Array.from(
    html.matchAll(new RegExp(`href="/akcni-letaky/${storeSlug}/([a-z0-9-]+)/1"`, "g")),
  ).map((m) => m[1]);
  const uniqueSlugs = Array.from(new Set(slugs));

  const now = new Date();
  const currentSlug = uniqueSlugs.find((slug) => {
    const validity = parseSlugValidity(slug, storeSlug);
    return validity && now >= validity.validFrom && now <= validity.validTo;
  });

  return currentSlug ?? uniqueSlugs[0] ?? null;
}

function escapeRegExp(value: string) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

// Obrázky stránek letáku NEjsou pod cestou odpovídající leafletSlug — mají
// vlastní interní adresář tvaru "{validFromYYMMDD}_{validToYYMMDD}_{store}_{hash}"
// (např. "260707_260701_kaufland_kzbce"), který se musí vytáhnout z HTML.
async function findLeafletImageFolder(storeSlug: string, leafletSlug: string): Promise<string[]> {
  const { html } = await fetchHtml(
    `${MOJELETAKY_ORIGIN}/akcni-letaky/${storeSlug}/${leafletSlug}/1`,
  );

  const folderMatch = html.match(/(\d{6}_\d{6}_[a-z-]+_[a-z0-9]+)\/image00\.jpg/);
  if (!folderMatch) return [];

  const folder = folderMatch[1];
  const pageNumbers = Array.from(
    html.matchAll(new RegExp(`${escapeRegExp(folder)}/image(\\d+)\\.jpg`, "g")),
  ).map((m) => Number(m[1]));
  const maxPage = pageNumbers.length > 0 ? Math.max(...pageNumbers) : -1;
  if (maxPage < 0) return [];

  return Array.from(
    { length: maxPage + 1 },
    (_, i) => `${MOJELETAKY_IMAGE_ORIGIN}/${folder}/image${String(i).padStart(2, "0")}.jpg`,
  );
}

/** Vrátí URL všech stránek aktuálního letáku daného obchodu (mojeletaky.cz), nebo prázdné pole. */
export async function findLeafletPages(shopName: string): Promise<string[]> {
  const storeSlug = resolveStoreSlug(shopName);
  if (!storeSlug) return [];

  const cached = leafletPagesCache.get(storeSlug);
  if (cached && Date.now() - cached.fetchedAt < CACHE_TTL_MS) {
    return cached.pages;
  }

  const leafletSlug = await findCurrentLeafletSlug(storeSlug);
  if (!leafletSlug) return [];

  const pages = await findLeafletImageFolder(storeSlug, leafletSlug);
  if (pages.length === 0) return [];

  leafletPagesCache.set(storeSlug, { pages, fetchedAt: Date.now() });
  return pages;
}
