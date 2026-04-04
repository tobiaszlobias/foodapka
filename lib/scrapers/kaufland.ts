import * as cheerio from "cheerio";
import {
  formatDiscountPercent,
  formatPrice,
  scoreProductMatch,
  type Product,
} from "@/lib/food";
import { absoluteUrl, fetchHtml } from "@/lib/scrapers/shared";

const KAUFLAND_ORIGIN = "https://prodejny.kaufland.cz";

type KauflandOffer = {
  title?: string;
  subtitle?: string;
  detailTitle?: string;
  detailDescription?: string;
  price?: number;
  formattedPrice?: string;
  formattedOldPrice?: string;
  formattedBasePrice?: string;
  basePrice?: string;
  discount?: number;
  unit?: string;
  dateFrom?: string;
  dateTo?: string;
  klNr?: string;
};

type KauflandSsrPayload = {
  component?: string;
  props?: {
    offerData?:
      | KauflandOffer[]
      | {
          cycles?: {
            categories?: {
              offers?: KauflandOffer[];
            }[];
          }[];
        };
  };
};

function extractSsrPayload(html: string) {
  const $ = cheerio.load(html);
  let payload: KauflandSsrPayload | null = null;

  $("script").each((_, element) => {
    if (payload) return;

    const content = $(element).html() || "";
    if (
      !content.includes('"component":"OfferSearch"') &&
      !content.includes('"component":"OfferTemplate"')
    ) {
      return;
    }

    const start = content.indexOf('{"component":');
    const end = content.lastIndexOf("}");
    if (start === -1 || end === -1) return;

    try {
      payload = JSON.parse(content.slice(start, end + 1)) as KauflandSsrPayload;
    } catch {
      payload = null;
    }
  });

  return payload;
}

function flattenOffers(payload: KauflandSsrPayload | null) {
  if (!payload?.props?.offerData) return [];

  if (Array.isArray(payload.props.offerData)) {
    return payload.props.offerData;
  }

  return (payload.props.offerData.cycles ?? []).flatMap((cycle) =>
    (cycle.categories ?? []).flatMap((category) => category.offers ?? []),
  );
}

function buildOfferName(offer: KauflandOffer) {
  return [offer.title, offer.subtitle].filter(Boolean).join(" ").replace(/\s+/g, " ").trim();
}

function buildOfferUrl(query: string, offer: KauflandOffer) {
  if (offer.klNr) {
    return absoluteUrl(
      KAUFLAND_ORIGIN,
      `/nabidka/prehled.html?kloffer-articleID=${offer.klNr}`,
    );
  }

  return absoluteUrl(
    KAUFLAND_ORIGIN,
    `/vyhledat.html?q=${encodeURIComponent(query)}`,
  );
}

export async function searchKauflandProducts(query: string) {
  const { html } = await fetchHtml(
    `${KAUFLAND_ORIGIN}/vyhledat.html?q=${encodeURIComponent(query)}`,
  );
  const offers = flattenOffers(extractSsrPayload(html));

  return offers
    .reduce<Product[]>((accumulator, offer) => {
      const name = buildOfferName(offer);
      const numericPrice = offer.price ?? null;
      const formattedPrice =
        offer.formattedPrice ||
        (numericPrice !== null ? formatPrice(numericPrice) : "");

      if (!name || !formattedPrice) {
        return accumulator;
      }

      const amount =
        typeof offer.discount === "number" && offer.discount > 0
          ? `-${offer.discount}%`
          : numericPrice !== null
            ? formatDiscountPercent(numericPrice, Number.parseFloat(offer.formattedOldPrice?.replace(",", ".") || ""))
            : "";

      accumulator.push({
        name,
        url: buildOfferUrl(query, offer),
        stores: [
          {
            shopId: "kaufland",
            shopName: "Kaufland",
            price: formattedPrice,
            pricePerUnit: offer.formattedBasePrice || offer.basePrice || offer.unit || "",
            amount,
            validity:
              offer.dateFrom && offer.dateTo
                ? `${offer.dateFrom} - ${offer.dateTo}`
                : "",
            leafletUrl: buildOfferUrl(query, offer),
            source: "kaufland" as const,
            sourceLabel: "Kaufland",
            isSale: true,
          },
        ],
      } satisfies Product);

      return accumulator;
    }, [])
    .filter((product) => scoreProductMatch(product.name, query) > 0)
    .slice(0, 8);
}
