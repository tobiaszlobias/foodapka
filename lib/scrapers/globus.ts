import { formatPrice, scoreProductMatch, type Product } from "@/lib/food";
import { SCRAPER_HEADERS } from "@/lib/scrapers/shared";

const GLOBUS_ORIGIN = "https://www.globus.cz";
// Hypermarket Praha-Čakovice — appka bere jednu reprezentativní pobočku, stejně
// jako u ostatních zdrojů (Kaufland/Lidl taky necílí na konkrétní adresu uživatele).
const GLOBUS_HOUSE_ID = "4005";
// clientId appka posílá jako náhodné UUID, stejně jako to dělá jejich vlastní web
const GLOBUS_CLIENT_ID = "5afaa548-0bdf-4155-b606-f26545fbe487";

type GlobusPriceInfo = {
  actualPrice?: number;
  originalPrice?: number | null;
  discountPercentage?: number | null;
};

type GlobusRibbon = {
  vSale?: { display?: boolean; label?: string };
};

type GlobusProduct = {
  name?: string;
  ean?: string[];
  vanr?: string;
  unitId?: string;
  imgThumbnail?: string | null;
  imgIcon?: string | null;
  productInHouse?: GlobusPriceInfo;
  ribbon?: GlobusRibbon | unknown[];
};

type GlobusSearchResponse = {
  products?: GlobusProduct[];
};

function cleanGlobusName(name: string) {
  // Globus názvy mají zarovnaný padding mezerami (fixed-width sloupce z ERP)
  return name.replace(/\s+/g, " ").trim();
}

function buildProductUrl(vanr: string | undefined, name: string) {
  if (!vanr) return `${GLOBUS_ORIGIN}/globus/online-objednavka`;
  return `${GLOBUS_ORIGIN}/globus/online-objednavka?produkt=${encodeURIComponent(vanr)}`;
}

export async function searchGlobusProducts(query: string): Promise<Product[]> {
  const url = new URL(`${GLOBUS_ORIGIN}/api/v1/gsoa/recommender/houses/${GLOBUS_HOUSE_ID}/searchProductsCatalog`);
  url.searchParams.set("filter", query);
  url.searchParams.set("clientId", GLOBUS_CLIENT_ID);
  url.searchParams.set("consentGranted", "false");
  url.searchParams.set("listedProductOnly", "true");
  url.searchParams.set("page", "0");
  url.searchParams.set("pageSize", "30");
  url.searchParams.set("autocomplete", "false");

  const response = await fetch(url.toString(), {
    headers: SCRAPER_HEADERS,
    cache: "no-store",
  });

  if (!response.ok) {
    throw new Error(`Globus API HTTP ${response.status}`);
  }

  const data = (await response.json()) as GlobusSearchResponse;
  const products: Product[] = [];

  for (const item of data.products ?? []) {
    const name = item.name ? cleanGlobusName(item.name) : "";
    if (!name) continue;

    const priceInfo = item.productInHouse;
    const actualPrice = priceInfo?.actualPrice;
    if (typeof actualPrice !== "number" || !Number.isFinite(actualPrice) || actualPrice <= 0) continue;

    // Appka ukazuje jen skutečné akční slevy — Globus katalog obsahuje i běžné
    // (neslevněné) ceny celého sortimentu, ty appce k porovnávání akcí neslouží.
    const originalPriceNum = priceInfo?.originalPrice;
    const hasDiscount =
      typeof originalPriceNum === "number" &&
      Number.isFinite(originalPriceNum) &&
      originalPriceNum > actualPrice;
    if (!hasDiscount) continue;

    if (scoreProductMatch(name, query) <= 0) continue;

    const discountPercentage = priceInfo?.discountPercentage;
    const image = item.imgThumbnail || item.imgIcon || undefined;

    products.push({
      name,
      url: buildProductUrl(item.vanr, name),
      image,
      stores: [
        {
          shopId: "globus",
          shopName: "Globus",
          price: formatPrice(actualPrice),
          originalPrice: formatPrice(originalPriceNum!),
          pricePerUnit: item.unitId ? `${formatPrice(actualPrice)} / ${item.unitId}` : "",
          amount: discountPercentage ? `-${discountPercentage} %` : "",
          discountPercent: discountPercentage ? `-${discountPercentage} %` : undefined,
          validity: "",
          leafletUrl: "",
          source: "globus" as const,
          sourceLabel: "Globus",
          isSale: true,
        },
      ],
    });
  }

  return products
    .sort((a, b) => scoreProductMatch(b.name, query) - scoreProductMatch(a.name, query))
    .slice(0, 15);
}
