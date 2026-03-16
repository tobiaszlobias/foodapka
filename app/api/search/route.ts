import * as cheerio from "cheerio";
import { NextRequest } from "next/server";

export async function GET(req: NextRequest) {
  const q = req.nextUrl.searchParams.get("q") || "";
  if (!q) return Response.json({ products: [] });

  const searchUrl = `https://www.kupi.cz/hledej?f=${encodeURIComponent(q)}`;
  const headers = {
    "User-Agent":
      "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
    "Accept-Language": "cs-CZ,cs;q=0.9",
  };

  const searchRes = await fetch(searchUrl, { headers });
  const searchHtml = await searchRes.text();
  const $s = cheerio.load(searchHtml);

  const productUrls: string[] = [];
  $s('a[href*="/sleva/"]').each((_, el) => {
    const href = $s(el).attr("href");
    if (href && !productUrls.includes(href)) {
      productUrls.push(href);
    }
  });

  const results: any[] = [];

  for (const url of productUrls.slice(0, 5)) {
    const detailRes = await fetch(`https://www.kupi.cz${url}`, { headers });
    const detailHtml = await detailRes.text();
    const $d = cheerio.load(detailHtml);

    const name = $d("h2.blind").first().text().trim();
    const stores: any[] = [];
    const seen = new Set<string>();

    $d("div.discount_row").each((_, el) => {
      const shopId = $d(el).attr("data-shop");
      const price = $d(el).find("strong.discount_price_value").text().trim();
      const shopName = $d(el)
        .find(".discounts_shop_wrap")
        .text()
        .replace(/\s*\d+\s+nejbližší(ch)?\s+poboče?k?[ay]?/gi, "")
        .trim();
      const pricePerUnit = $d(el).find(".price_per_unit").text().trim();
      const amount = $d(el).find(".amount_percentage").text().trim();
      const validity = $d(el)
        .find(".discounts_validity.valid_discount")
        .text()
        .trim();
      const leafletUrl = $d(el).find("a.btn_link_leaflet").attr("href") || "";
      const key = `${shopId}-${price}`;

      if (price && !seen.has(key)) {
        seen.add(key);
        stores.push({
          shopId,
          shopName,
          price,
          pricePerUnit,
          amount,
          validity,
          leafletUrl,
        });
      }
    });

    if (name && stores.length > 0) {
      results.push({ name, url, stores });
    }
  }

  return Response.json({ products: results, count: results.length });
}
