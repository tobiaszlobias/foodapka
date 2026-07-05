import {
  formatDiscountPercent,
  parsePrice,
  scoreProductMatch,
  type Product,
} from "@/lib/food";

const LIDL_ORIGIN = "https://www.lidl.cz";
const BINGBOT_UA = "Mozilla/5.0 (compatible; bingbot/2.0; +http://www.bing.com/bingbot.htm)";
const FOOD_CATEGORY = "Potraviny a nápoje";

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
  currencySymbol?: string;
};

type LidlGridboxData = {
  fullTitle?: string;
  canonicalUrl?: string;
  canonicalPath?: string;
  category?: string;
  image?: string;
  price?: LidlPrice;
};

type LidlItem = {
  gridbox?: {
    data?: LidlGridboxData;
  };
};

type LidlSearchResponse = {
  type?: string;
  numFound?: number;
  items?: LidlItem[];
};

function formatLidlPrice(value: number): string {
  return `${value.toFixed(2).replace(".", ",")} Kč`;
}

function parseLidlItem(item: LidlItem, query: string): Product | null {
  const data = item.gridbox?.data;
  if (!data) return null;

  const name = data.fullTitle ?? "";
  if (!name) return null;

  const currentPrice = data.price?.price;
  if (typeof currentPrice !== "number" || !Number.isFinite(currentPrice)) return null;

  if (scoreProductMatch(name, query) <= 0) return null;

  const canonicalPath = data.canonicalUrl ?? data.canonicalPath ?? "";
  const url = canonicalPath.startsWith("http")
    ? canonicalPath
    : `${LIDL_ORIGIN}${canonicalPath}`;

  const oldPrice =
    typeof data.price?.oldPrice === "number" &&
    data.price.oldPrice > 0 &&
    data.price.oldPrice > currentPrice
      ? data.price.oldPrice
      : null;

  const pricePerUnit = data.price?.basePrice?.text ?? "";
  const discountPct = data.price?.discount?.percentageDiscount;
  const amount =
    discountPct && discountPct > 0
      ? `-${discountPct}%`
      : formatDiscountPercent(currentPrice, oldPrice);

  return {
    name,
    url,
    image: data.image || undefined,
    stores: [
      {
        shopId: "lidl",
        shopName: "Lidl",
        price: formatLidlPrice(currentPrice),
        originalPrice: oldPrice ? formatLidlPrice(oldPrice) : undefined,
        pricePerUnit,
        amount,
        discountPercent: discountPct && discountPct > 0 ? `-${discountPct} %` : undefined,
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
  const url = new URL(`${LIDL_ORIGIN}/q/api/search`);
  url.searchParams.set("assortment", "CZ");
  url.searchParams.set("locale", "cs_CZ");
  url.searchParams.set("version", "v2.0.0");
  url.searchParams.set("q", query);
  url.searchParams.set("fetchsize", "100");
  url.searchParams.set("category", FOOD_CATEGORY);

  const response = await fetch(url.toString(), {
    headers: {
      "User-Agent": BINGBOT_UA,
      "Accept-Language": "cs-CZ,cs;q=0.9",
    },
    cache: "no-store",
  });

  if (!response.ok) {
    throw new Error(`Lidl API HTTP ${response.status}`);
  }

  const data = (await response.json()) as LidlSearchResponse;

  if (data.type === "redirect" || !data.items?.length) {
    return [];
  }

  const products: Product[] = [];
  for (const item of data.items) {
    const product = parseLidlItem(item, query);
    if (product) products.push(product);
  }

  return products
    .sort((a, b) => {
      const scoreDelta = scoreProductMatch(b.name, query) - scoreProductMatch(a.name, query);
      if (scoreDelta !== 0) return scoreDelta;
      return parsePrice(a.stores[0]!.price) - parsePrice(b.stores[0]!.price);
    })
    .slice(0, 15);
}
