import { formatPrice, scoreProductMatch, type Product } from "@/lib/food";

const POTRAVINKA_ORIGIN = "https://potravinka.cz";
const SEARCH_URL = `${POTRAVINKA_ORIGIN}/api/products/semantic-search`;
const UA =
  "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36";

type PotravinkaProduct = {
  id?: string;
  externalId?: string;
  name?: string;
  price?: number;
  currency?: string;
  amount?: string;
  store?: string;
  imageUrl?: string;
  validUntil?: string | null;
  lastUpdated?: string;
  similarity?: string;
  unitPrice?: number | null;
  unitPriceUnit?: string | null;
};

type PotravinkaSearchResponse = {
  products?: PotravinkaProduct[];
};

// Server má rate limit 60 požadavků / 60s (viz X-Ratelimit-* hlavičky).
// Appka umí spustit desítky souběžných dotazů (jeden recept = jeden dotaz
// na ingredienci, paralelně) — bez fronty by to snadno spustilo 429. Fronta
// omezuje počet SOUČASNĚ rozjetých požadavků a vynucuje minimální rozestup
// mezi jejich starty.
const MAX_CONCURRENT = 4;
const MIN_INTERVAL_MS = 300; // ~3.3 req/s << 60/60s limit i při plném vytížení

let activeCount = 0;
let lastStartedAt = 0;
const queue: (() => void)[] = [];

function runNext() {
  if (activeCount >= MAX_CONCURRENT || queue.length === 0) return;

  const now = Date.now();
  const wait = Math.max(0, lastStartedAt + MIN_INTERVAL_MS - now);

  setTimeout(() => {
    const next = queue.shift();
    if (!next) return;
    activeCount++;
    lastStartedAt = Date.now();
    next();
  }, wait);
}

function throttledFetch(url: string): Promise<Response> {
  return new Promise((resolve, reject) => {
    queue.push(() => {
      fetch(url, {
        headers: {
          "User-Agent": UA,
          "Accept": "application/json",
          "Referer": `${POTRAVINKA_ORIGIN}/`,
        },
        cache: "no-store",
      })
        .then(resolve, reject)
        .finally(() => {
          activeCount--;
          runNext();
        });
    });
    runNext();
  });
}

function buildProductUrl(product: PotravinkaProduct) {
  // Potravinka.cz nemá stabilní veřejnou produktovou stránku podle id —
  // odkaz vede na hledání téhož produktu na jejich webu.
  return `${POTRAVINKA_ORIGIN}/search?q=${encodeURIComponent(product.name ?? "")}`;
}

export async function searchPotravinkaProducts(query: string): Promise<Product[]> {
  const url = new URL(SEARCH_URL);
  url.searchParams.set("search", query);
  url.searchParams.set("limit", "300");
  url.searchParams.set("minSimilarity", "0.45");

  const response = await throttledFetch(url.toString());

  if (!response.ok) {
    throw new Error(`Potravinka API HTTP ${response.status}`);
  }

  const data = (await response.json()) as PotravinkaSearchResponse;
  const items = data.products ?? [];

  const products: Product[] = [];

  for (const item of items) {
    const name = item.name?.trim();
    if (!name) continue;
    if (typeof item.price !== "number" || !Number.isFinite(item.price)) continue;
    if (scoreProductMatch(name, query) <= 0) continue;

    // validUntil === null znamená běžnou katalogovou cenu (ne akci) —
    // právě tenhle typ dat appka dřív neměla. validUntil s hodnotou
    // znamená aktivní akci (zdroj ale nedává starou cenu, takže
    // originalPrice/discountPercent zůstávají neznámé i u akce).
    const isSale = Boolean(item.validUntil);

    const pricePerUnit =
      typeof item.unitPrice === "number" && item.unitPriceUnit
        ? `${formatPrice(item.unitPrice)} / ${item.unitPriceUnit}`
        : "";

    products.push({
      name,
      url: buildProductUrl(item),
      image: item.imageUrl || undefined,
      stores: [
        {
          shopId: `potravinka-${item.store ?? "unknown"}`,
          shopName: item.store?.trim() || "Potravinka.cz",
          price: formatPrice(item.price),
          originalPrice: undefined,
          pricePerUnit,
          amount: "",
          packageSize: item.amount?.trim() || undefined,
          validity: item.validUntil ?? "",
          leafletUrl: "",
          source: "potravinka" as const,
          sourceLabel: "Potravinka.cz",
          isSale,
        },
      ],
    });
  }

  return products
    .sort((a, b) => scoreProductMatch(b.name, query) - scoreProductMatch(a.name, query))
    .slice(0, 15);
}
