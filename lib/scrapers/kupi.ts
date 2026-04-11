import * as cheerio from "cheerio";
import type { AnyNode } from "domhandler";
import {
  dedupeStores,
  sortStoresByPrice,
  type Product,
  type Store,
} from "@/lib/food";
import { absoluteUrl, fetchHtml } from "@/lib/scrapers/shared";

const KUPI_ORIGIN = "https://www.kupi.cz";

function cleanShopName(value: string) {
  return value.replace(/\s*\d+\s+nejbližší(ch)?\s+poboče?k?[ay]?/gi, "").trim();
}

function extractStoresFromDetail(
  $: cheerio.CheerioAPI,
  rows: cheerio.Cheerio<AnyNode>,
) {
  const stores: Store[] = [];

  rows.each((_, element) => {
    const row = $(element);
    const price = row.find("strong.discount_price_value").text().trim();
    if (!price) return;

    const originalPrice = row.find(".standard_price").text().trim();

    stores.push({
      shopId: row.attr("data-shop") || "",
      shopName: cleanShopName(row.find(".discounts_shop_wrap").text()),
      price,
      originalPrice: originalPrice || undefined,
      pricePerUnit: row.find(".price_per_unit").text().trim(),
      amount: row.find(".amount_percentage").text().trim(),
      validity: row.find(".discounts_validity.valid_discount").text().trim(),
      leafletUrl: absoluteUrl(
        KUPI_ORIGIN,
        row.find("a.btn_link_leaflet").attr("href") || "",
      ),
      source: "kupi",
      sourceLabel: "Kupi",
      isSale: true,
    });
  });

  return dedupeStores(stores);
}

async function fetchKupiProduct(url: string) {
  const { html } = await fetchHtml(url);
  const $ = cheerio.load(html);
  const name = $("h2.blind").first().text().trim();
  const stores = extractStoresFromDetail($, $("div.discount_row"));

  if (!name || stores.length === 0) {
    return null;
  }

  return {
    name,
    url,
    stores: sortStoresByPrice(stores),
  } satisfies Product;
}

export async function searchKupiProducts(query: string) {
  const { html } = await fetchHtml(
    `${KUPI_ORIGIN}/hledej?f=${encodeURIComponent(query)}`,
  );
  const $ = cheerio.load(html);

  const productUrls = new Set<string>();
  $('a[href*="/sleva/"]').each((_, element) => {
    const href = $(element).attr("href");
    if (!href) return;
    productUrls.add(absoluteUrl(KUPI_ORIGIN, href));
  });

  const detailResults = await Promise.allSettled(
    Array.from(productUrls).slice(0, 6).map((url) => fetchKupiProduct(url)),
  );

  return detailResults.reduce<Product[]>((accumulator, result) => {
    if (result.status === "fulfilled" && result.value) {
      accumulator.push(result.value);
    }
    return accumulator;
  }, []);
}
