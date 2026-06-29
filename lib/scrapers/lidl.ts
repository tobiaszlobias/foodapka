import * as cheerio from "cheerio";
import {
  formatDiscountPercent,
  formatPrice,
  parsePrice,
  scoreProductMatch,
  type Product,
} from "@/lib/food";
import { absoluteUrl } from "@/lib/scrapers/shared";

const LIDL_ORIGIN = "https://www.lidl.cz";
const GOOGLEBOT_UA = "Mozilla/5.0 (compatible; Googlebot/2.1; +http://www.google.com/bot.html)";

type LidlPrice = {
  price?: number;
  oldPrice?: number;
  discount?: {
    percentageDiscount?: number;
    showDiscount?: boolean;
  };
  basePrice?: {
    text?: string;
  };
};

type LidlGridProduct = {
  fullTitle?: string;
  canonicalUrl?: string;
  canonicalPath?: string;
  price?: LidlPrice;
  keyfacts?: {
    fullTitle?: string;
    title?: string;
  };
};

async function fetchLidlSearch(query: string): Promise<string> {
  const url = `${LIDL_ORIGIN}/search?query=${encodeURIComponent(query)}`;
  const response = await fetch(url, {
    headers: {
      "User-Agent": GOOGLEBOT_UA,
      "Accept": "text/html",
      "Accept-Language": "cs-CZ,cs;q=0.9",
    },
    cache: "no-store",
  });

  if (!response.ok) {
    throw new Error(`Lidl search HTTP ${response.status}`);
  }

  return response.text();
}

function parseLidlGridProduct(rawValue: string): Product | null {
  let data: LidlGridProduct;

  try {
    data = JSON.parse(rawValue) as LidlGridProduct;
  } catch {
    return null;
  }

  const name =
    data.fullTitle ??
    data.keyfacts?.fullTitle ??
    data.keyfacts?.title ??
    "";
  const currentPrice = data.price?.price;

  if (!name || typeof currentPrice !== "number") return null;

  const url = absoluteUrl(LIDL_ORIGIN, data.canonicalUrl ?? data.canonicalPath ?? "");
  const oldPrice =
    typeof data.price?.oldPrice === "number" && data.price.oldPrice > currentPrice
      ? data.price.oldPrice
      : null;
  const pricePerUnit = data.price?.basePrice?.text ?? "";

  return {
    name,
    url,
    stores: [
      {
        shopId: "lidl",
        shopName: "Lidl",
        price: formatPrice(currentPrice),
        originalPrice: oldPrice ? formatPrice(oldPrice) : undefined,
        pricePerUnit,
        amount: formatDiscountPercent(currentPrice, oldPrice),
        validity: "",
        leafletUrl: url,
        source: "lidl" as const,
        sourceLabel: "Lidl",
        isSale: oldPrice !== null,
      },
    ],
  };
}

export async function searchLidlProducts(query: string): Promise<Product[]> {
  const html = await fetchLidlSearch(query);
  const $ = cheerio.load(html);
  const products = new Map<string, Product>();

  $("[data-grid-data]").each((_, element) => {
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
    .slice(0, 15);
}
