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
  fetchHtmlWithNodeHttps,
  isBlockedHtml,
} from "@/lib/scrapers/shared";
import { normalizeText } from "@/lib/food";

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

function buildLidlQueryVariants(query: string) {
  const normalized = normalizeText(query);
  const variants = [
    query,
    `trvanlive ${query}`,
    `cerstve ${query}`,
    `${query} 1 l`,
  ];

  if (normalized.includes("mleko")) {
    variants.push(
      "trvanlive mleko",
      "mleko polotucne",
      "mleko plnotucne",
      "trvanlive mleko polotucne",
    );
  }

  return Array.from(new Set(variants.map((value) => value.trim()).filter(Boolean)));
}

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
        originalPrice: oldPrice ? formatPrice(oldPrice) : undefined,
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
  const products = new Map<string, Product>();
  let lastError: Error | null = null;

  for (const variant of buildLidlQueryVariants(query)) {
    try {
      const { html, statusCode } = await fetchHtmlWithNodeHttps(
        `${LIDL_ORIGIN}${LIDL_SEARCH_PATH}?q=${encodeURIComponent(variant)}`,
        {
          Cookie: "i18n_redirected=cs_CZ",
          Referer: `${LIDL_ORIGIN}/`,
        },
      );

      if (
        statusCode >= 300 ||
        isBlockedHtml(html) ||
        html.includes("url=https://www.lidl.cz/c/ceny-v-klidu/")
      ) {
        continue;
      }

      const $ = cheerio.load(html);

      $("[data-grid-data], [data-grid-data] [data-grid-data]").each((_, element) => {
        const rawValue = $(element).attr("data-grid-data");
        if (!rawValue) return;

        const product = parseLidlGridProduct(rawValue);
        if (!product) return;
        if (scoreProductMatch(product.name, query) <= 0) return;

        products.set(product.url || product.name, product);
      });

      if (products.size > 0) {
        break;
      }
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));
    }
  }

  if (products.size === 0 && lastError) {
    throw lastError;
  }

  return Array.from(products.values())
    .sort((a, b) => {
      const scoreDelta = scoreProductMatch(b.name, query) - scoreProductMatch(a.name, query);
      if (scoreDelta !== 0) return scoreDelta;
      return parsePrice(a.stores[0]!.price) - parsePrice(b.stores[0]!.price);
    })
    .slice(0, 12);
}
