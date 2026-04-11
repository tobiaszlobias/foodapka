import { load } from "cheerio";
import {
  formatDiscountPercent,
  formatPrice,
  normalizeText,
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

type KauflandDomOffer = KauflandOffer & {
  href?: string;
  validity?: string;
};

function isDomOffer(offer: KauflandOffer | KauflandDomOffer): offer is KauflandDomOffer {
  return "href" in offer || "validity" in offer;
}

function extractSsrPayload(html: string) {
  const matches = html.matchAll(
    /window\.SSR\[[^\]]+\]\s*=\s*(\{"component":"Offer(?:Search|Template)"[\s\S]*?\})<\/script>/g,
  );

  for (const match of matches) {
    const payload = match[1];
    if (!payload) continue;

    try {
      return JSON.parse(payload) as KauflandSsrPayload;
    } catch {
      continue;
    }
  }

  return null;
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

function parseNumericPrice(value: string) {
  const match = value.replace(/\s+/g, "").replace(",", ".").match(/\d+(?:\.\d+)?/);
  return match ? Number(match[0]) : null;
}

function extractPageValidity($: ReturnType<typeof load>) {
  const headline = $(".a-icon-tile-headline__subheadline h3").first().text().trim();
  return headline.replace(/\s+/g, " ").trim();
}

function parseDomOffers(html: string) {
  const $ = load(html);
  const validity = extractPageValidity($);

  return $(".k-product-tile")
    .toArray()
    .map<KauflandDomOffer | null>((element) => {
      const tile = $(element);
      const title = tile.find(".k-product-tile__title").first().text().trim();
      const subtitle = tile.find(".k-product-tile__subtitle").first().text().trim();
      const unit = tile.find(".k-product-tile__unit-price").first().text().trim();
      const basePrice = tile.find(".k-product-tile__base-price").first().text().trim();
      const rawPrice = tile.find(".k-price-tag__price").first().text().trim();
      const href = tile.attr("href")?.trim() || "";
      const price = parseNumericPrice(rawPrice);

      if (!title || !subtitle || !rawPrice || price === null) {
        return null;
      }

      return {
        title,
        subtitle,
        unit,
        basePrice,
        formattedBasePrice: basePrice,
        price,
        formattedPrice: formatPrice(price),
        href,
        validity,
      };
    })
    .filter((offer): offer is KauflandDomOffer => Boolean(offer));
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

function buildOfferUrlFromValue(query: string, value?: string) {
  if (!value) {
    return absoluteUrl(
      KAUFLAND_ORIGIN,
      `/vyhledat.html?q=${encodeURIComponent(query)}`,
    );
  }

  return absoluteUrl(KAUFLAND_ORIGIN, value);
}

function buildCategoryFallbackUrl(query: string) {
  const slug = normalizeText(query).replace(/\s+/g, "-");
  return absoluteUrl(
    KAUFLAND_ORIGIN,
    `/nabidka/aktualni-tyden/${slug}-v-akci.html`,
  );
}

function hasRelevantTokenMatch(text: string, query: string) {
  const queryTokens = normalizeText(query).split(" ").filter(Boolean);
  const textTokens = normalizeText(text).split(" ").filter(Boolean);

  if (queryTokens.length === 0 || textTokens.length === 0) return false;

  return queryTokens.every((queryToken) =>
    textTokens.some((textToken) => {
      if (textToken === queryToken) return true;

      const lengthDelta = Math.abs(textToken.length - queryToken.length);
      if (lengthDelta > 2) return false;

      return textToken.startsWith(queryToken) || queryToken.startsWith(textToken);
    }),
  );
}

export async function searchKauflandProducts(query: string) {
  const searchUrl = `${KAUFLAND_ORIGIN}/vyhledat.html?q=${encodeURIComponent(query)}`;
  const { html } = await fetchHtml(searchUrl);
  let offers = flattenOffers(extractSsrPayload(html));
  let domOffers: KauflandDomOffer[] = [];

  const hasRelevantOffers = offers.some((offer) =>
    hasRelevantTokenMatch(
      [offer.title, offer.subtitle, offer.detailTitle, offer.detailDescription]
        .filter(Boolean)
        .join(" "),
      query,
    ),
  );

  if (!hasRelevantOffers) {
    try {
      const fallbackUrl = buildCategoryFallbackUrl(query);
      const fallbackResponse = await fetchHtml(fallbackUrl);
      const fallbackOffers = flattenOffers(extractSsrPayload(fallbackResponse.html));
      if (fallbackOffers.length > 0) {
        offers = fallbackOffers;
      } else {
        domOffers = parseDomOffers(fallbackResponse.html);
      }
    } catch {
      // Ignore missing fallback categories and keep the original search results.
    }
  }

  const normalizedOffers =
    domOffers.length > 0
      ? domOffers
      : offers;

  return normalizedOffers
    .reduce<Product[]>((accumulator, offer) => {
      const name = buildOfferName(offer);
      const matchingText = [
        offer.title,
        offer.subtitle,
        offer.detailTitle,
        offer.detailDescription,
      ]
        .filter(Boolean)
        .join(" ");
      const numericPrice = offer.price ?? null;
      const formattedPrice =
        offer.formattedPrice ||
        (numericPrice !== null ? formatPrice(numericPrice) : "");

      if (!name || !formattedPrice || !hasRelevantTokenMatch(matchingText, query)) {
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
        url: isDomOffer(offer)
          ? buildOfferUrlFromValue(query, offer.href)
          : buildOfferUrl(query, offer),
        stores: [
          {
            shopId: "kaufland",
            shopName: "Kaufland",
            price: formattedPrice,
            originalPrice: offer.formattedOldPrice || undefined,
            pricePerUnit: offer.formattedBasePrice || offer.basePrice || offer.unit || "",
            amount,
            validity: isDomOffer(offer)
              ? offer.validity || ""
              : offer.dateFrom && offer.dateTo
                ? `${offer.dateFrom} - ${offer.dateTo}`
                : "",
            leafletUrl: isDomOffer(offer)
              ? buildOfferUrlFromValue(query, offer.href)
              : buildOfferUrl(query, offer),
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
