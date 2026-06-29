import {
  formatPrice,
  normalizeText,
  scoreProductMatch,
  type Product,
} from "@/lib/food";
import { absoluteUrl } from "@/lib/scrapers/shared";

const KAUFLAND_ORIGIN = "https://prodejny.kaufland.cz";
const LEAFLET_URL = `${KAUFLAND_ORIGIN}/nabidka/prehled.html?kloffer-week=current`;
const GOOGLEBOT_UA = "Mozilla/5.0 (compatible; Googlebot/2.1; +http://www.google.com/bot.html)";

type KauflandOffer = {
  title?: string;
  subtitle?: string;
  price?: number;
  formattedPrice?: string;
  formattedOldPrice?: string;
  discount?: number;
  unit?: string;
  dateFrom?: string;
  dateTo?: string;
  klNr?: string;
};

type KauflandSsrPayload = {
  component?: string;
  props?: {
    offerData?: {
      cycles?: {
        categories?: {
          offers?: KauflandOffer[];
        }[];
      }[];
    };
  };
};

let leafletCache: { offers: KauflandOffer[]; fetchedAt: number } | null = null;
const CACHE_TTL_MS = 15 * 60 * 1000; // 15 minut

async function fetchLeafletOffers(): Promise<KauflandOffer[]> {
  if (leafletCache && Date.now() - leafletCache.fetchedAt < CACHE_TTL_MS) {
    return leafletCache.offers;
  }

  const response = await fetch(LEAFLET_URL, {
    headers: {
      "User-Agent": GOOGLEBOT_UA,
      "Accept": "text/html,application/xhtml+xml",
      "Accept-Language": "cs-CZ,cs;q=0.9",
    },
    cache: "no-store",
  });

  if (!response.ok) {
    throw new Error(`Kaufland leták HTTP ${response.status}`);
  }

  const html = await response.text();

  const match = html.match(
    /window\.SSR\[[^\]]+\]\s*=\s*(\{"component":"OfferTemplate"[\s\S]*?)\s*<\/script>/,
  );
  if (!match) throw new Error("Kaufland: SSR payload nenalezen");

  const payload = JSON.parse(match[1]) as KauflandSsrPayload;
  const offers = (payload.props?.offerData?.cycles ?? []).flatMap((cycle) =>
    (cycle.categories ?? []).flatMap((cat) => cat.offers ?? []),
  );

  leafletCache = { offers, fetchedAt: Date.now() };
  return offers;
}

function buildOfferName(offer: KauflandOffer) {
  return [offer.title, offer.subtitle].filter(Boolean).join(" ").replace(/\s+/g, " ").trim();
}

function buildOfferUrl(offer: KauflandOffer, query: string) {
  if (offer.klNr) {
    return absoluteUrl(KAUFLAND_ORIGIN, `/nabidka/prehled.html?kloffer-articleID=${offer.klNr}`);
  }
  return absoluteUrl(KAUFLAND_ORIGIN, `/nabidka/prehled.html?kloffer-week=current&q=${encodeURIComponent(query)}`);
}

export async function searchKauflandProducts(query: string): Promise<Product[]> {
  const offers = await fetchLeafletOffers();
  const products: Product[] = [];

  for (const offer of offers) {
    const name = buildOfferName(offer);
    if (!name) continue;
    if (typeof offer.price !== "number" || !Number.isFinite(offer.price)) continue;

    const score = scoreProductMatch(name, query);
    if (score <= 0) continue;

    const url = buildOfferUrl(offer, query);

    // formattedOldPrice je string "89,90" — parsujeme ho
    const oldPriceNum = offer.formattedOldPrice
      ? Number(offer.formattedOldPrice.replace(",", ".").replace(/\s/g, ""))
      : null;
    const originalPrice =
      oldPriceNum && Number.isFinite(oldPriceNum) && oldPriceNum > offer.price
        ? formatPrice(oldPriceNum)
        : undefined;

    const validity = offer.dateTo
      ? `do ${new Date(offer.dateTo).toLocaleDateString("cs-CZ", { day: "numeric", month: "numeric" })}`
      : "";

    products.push({
      name,
      url,
      stores: [
        {
          shopId: "kaufland",
          shopName: "Kaufland",
          price: formatPrice(offer.price),
          originalPrice,
          pricePerUnit: offer.unit ?? "",
          amount: offer.discount ? `-${offer.discount}%` : "",
          validity,
          leafletUrl: url,
          source: "kaufland" as const,
          sourceLabel: "Kaufland",
          isSale: (offer.discount ?? 0) > 0,
        },
      ],
    });
  }

  return products
    .sort((a, b) => {
      const normA = normalizeText(a.name);
      const normB = normalizeText(b.name);
      return scoreProductMatch(normB, query) - scoreProductMatch(normA, query);
    })
    .slice(0, 15);
}
