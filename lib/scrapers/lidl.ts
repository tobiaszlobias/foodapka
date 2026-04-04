import * as cheerio from "cheerio";
import {
  formatDiscountPercent,
  formatPrice,
  parsePrice,
  scoreProductMatch,
  type Product,
} from "@/lib/food";
import {
  absoluteUrl,
  decodeHtmlEntities,
  fetchHtml,
  isBlockedHtml,
} from "@/lib/scrapers/shared";

const LIDL_ORIGIN = "https://www.lidl.cz";

type LidlGridProductData = {
  canonicalPath?: string;
  canonicalUrl?: string;
  fullTitle?: string;
  keyfacts?: {
    fullTitle?: string;
    title?: string;
  };
  price?: {
    price?: number;
    oldPrice?: number;
    packaging?: {
      text?: string;
    };
  };
};

const LIDL_SEARCH_PATH = "/q/search";

function parseLidlGridProduct(rawValue: string) {
  const decoded = decodeHtmlEntities(rawValue);
  let data: LidlGridProductData;

  try {
    data = JSON.parse(decoded) as LidlGridProductData;
  } catch {
    return null;
  }

  const name = data.fullTitle ?? data.keyfacts?.fullTitle ?? data.keyfacts?.title ?? "";
  const currentPrice = data.price?.price;
  if (!name || typeof currentPrice !== "number") return null;

  const url = absoluteUrl(LIDL_ORIGIN, data.canonicalUrl ?? data.canonicalPath ?? "");
  const oldPrice =
    typeof data.price?.oldPrice === "number" && data.price.oldPrice > currentPrice
      ? data.price.oldPrice
      : null;
  const packaging = data.price?.packaging?.text ?? "";

  return {
    name,
    url,
    stores: [
      {
        shopId: "lidl",
        shopName: "Lidl",
        price: formatPrice(currentPrice),
        pricePerUnit: packaging,
        amount: formatDiscountPercent(currentPrice, oldPrice),
        validity: "",
        leafletUrl: url,
        source: "lidl" as const,
        sourceLabel: "Lidl",
        isSale: oldPrice !== null,
      },
    ],
  } satisfies Product;
}

export async function searchLidlProducts(query: string) {
  const { html } = await fetchHtml(
    `${LIDL_ORIGIN}${LIDL_SEARCH_PATH}?q=${encodeURIComponent(query)}`,
  );

  if (isBlockedHtml(html)) {
    return [];
  }

  const $ = cheerio.load(html);
  const products = new Map<string, Product>();

  $("[data-grid-data], [data-grid-data] [data-grid-data]").each((_, element) => {
    const rawValue = $(element).attr("data-grid-data");
    if (!rawValue) return;

    const product = parseLidlGridProduct(rawValue);
    if (!product) return;
    if (scoreProductMatch(product.name, query) <= 0) return;

    products.set(product.url || product.name, product);
  });

  return Array.from(products.values())
    .sort((a, b) => {
      const scoreDelta = scoreProductMatch(b.name, query) - scoreProductMatch(a.name, query);
      if (scoreDelta !== 0) return scoreDelta;
      return parsePrice(a.stores[0]!.price) - parsePrice(b.stores[0]!.price);
    })
    .slice(0, 12);
}
