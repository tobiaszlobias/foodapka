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
  return value
    .replace(/\s*\d+\s+nejbližší(ch)?\s+poboče?k?[ay]?/gi, "")
    .replace(/www\.[a-z0-9.-]+\.[a-z]{2,}/gi, "")
    .replace(/\s+/g, " ")
    .trim();
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

    // Kupi.cz zobrazuje i budoucí akce (ještě neplatí, začínají později) —
    // ty mají div.discounts_validity BEZ třídy valid_discount. Bez tohohle
    // filtru appka nabízela jako "nejlevnější" cenu, která ještě neplatí.
    const validityEl = row.find(".discounts_validity");
    const isCurrentlyValid = validityEl.length === 0 || validityEl.hasClass("valid_discount");
    if (!isCurrentlyValid) return;

    const originalPrice = row.find(".standard_price").text().trim();
    const packageSize = row.find(".discount_amount").text().trim().replace(/^\/\s*/, "");
    const discountPercent = row.find(".discount_percentage").text().trim();
    const note = row.find(".discount_note").text().trim();
    const loyaltyCardLabel = row.find(".discounts_club").text().trim();

    stores.push({
      shopId: row.attr("data-shop") || "",
      shopName: cleanShopName(row.find(".discounts_shop_wrap").text()),
      price,
      originalPrice: originalPrice || undefined,
      pricePerUnit: row.find(".price_per_unit").text().trim(),
      amount: row.find(".amount_percentage").text().trim(),
      packageSize: packageSize || undefined,
      discountPercent: discountPercent || undefined,
      note: note || undefined,
      loyaltyCardLabel: loyaltyCardLabel || undefined,
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

  const productUrlsWithImages = new Map<string, string | undefined>();
  $('a[href*="/sleva/"]').each((_, element) => {
    const href = $(element).attr("href");
    if (!href) return;
    const url = absoluteUrl(KUPI_ORIGIN, href);
    const imgEl = $(element).find("img");
    const img = imgEl.attr("data-src") || imgEl.attr("src");
    const validImg = img && !img.includes("no_img") && img.startsWith("http") ? img : undefined;
    // Zachovej existující obrázek pokud ho nový nemá
    if (!productUrlsWithImages.has(url)) {
      productUrlsWithImages.set(url, validImg);
    } else if (validImg && !productUrlsWithImages.get(url)) {
      productUrlsWithImages.set(url, validImg);
    }
  });

  const detailResults = await Promise.allSettled(
    Array.from(productUrlsWithImages.entries()).slice(0, 12).map(async ([url, image]) => {
      const product = await fetchKupiProduct(url);
      if (!product) return null;
      return { ...product, image };
    }),
  );

  return detailResults.reduce<Product[]>((accumulator, result) => {
    if (result.status === "fulfilled" && result.value) {
      accumulator.push(result.value);
    }
    return accumulator;
  }, []);
}
