import { NextRequest } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { sendTelegramMessage } from "@/lib/telegram";
import { searchAllSources } from "@/lib/scrapers";
import { parsePrice, sortStoresByPrice } from "@/lib/food";
import { filterProductsByStores } from "@/lib/storeFilters";

// Denní cron (viz vercel.json) — pro každé hlídání (dotaz + cílová cena) prohledá
// všechny obchody a pokud nejlevnější nalezená cena klesla pod cílovku, pošle
// Telegram notifikaci s konkrétním produktem a obchodem. Nenotifikuje opakovaně
// za stejnou cenu (last_notified_price).
export async function GET(req: NextRequest) {
  const authHeader = req.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const supabase = createAdminClient();
  const { data: watched, error } = await supabase.from("watched_products").select("*");

  if (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
  if (!watched || watched.length === 0) {
    return Response.json({ checked: 0, notified: 0 });
  }

  // Cache výsledků hledání podle dotazu — víc uživatelů může hlídat stejný dotaz
  const searchCache = new Map<string, Awaited<ReturnType<typeof searchAllSources>>>();
  let notified = 0;

  for (const item of watched) {
    try {
      const query: string = item.query;
      let products = searchCache.get(query);
      if (!products) {
        products = await searchAllSources(query);
        searchCache.set(query, products);
      }

      // Store filter je per-hlídání (dva uživatelé mohou hlídat stejný dotaz
      // v jiných obchodech) — cache je jen na surové výsledky ze scraperů,
      // filtrace se aplikuje až tady.
      const scopedProducts = filterProductsByStores(products, item.store_filter);

      // Najdi nejlevnější nabídku napříč produkty a obchody odpovídajícími výběru
      let best: { price: number; productName: string; shopName: string } | null = null;
      for (const product of scopedProducts) {
        const cheapestStore = sortStoresByPrice(product.stores)[0];
        if (!cheapestStore) continue;
        const price = parsePrice(cheapestStore.price);
        if (!Number.isFinite(price)) continue;
        if (!best || price < best.price) {
          best = { price, productName: product.name, shopName: cheapestStore.shopName };
        }
      }

      if (!best) continue;

      const targetPrice = Number(item.target_price);
      const alreadyNotifiedAtOrBelow =
        item.last_notified_price !== null && best.price >= Number(item.last_notified_price);

      if (best.price <= targetPrice && !alreadyNotifiedAtOrBelow) {
        const { data: link } = await supabase
          .from("telegram_links")
          .select("chat_id")
          .eq("user_id", item.user_id)
          .maybeSingle();

        if (link?.chat_id) {
          await sendTelegramMessage(
            link.chat_id,
            `🐶 <b>Cena klesla pod vaši hranici!</b>\n\n„${item.query}“\n${best.productName}\n${best.shopName}: <b>${best.price.toFixed(2).replace(".", ",")} Kč</b>\n(hlídáno pod ${targetPrice.toFixed(2).replace(".", ",")} Kč)`,
          );
          notified += 1;

          await supabase
            .from("watched_products")
            .update({ last_notified_price: best.price })
            .eq("id", item.id);
        }
      } else if (best.price > targetPrice && item.last_notified_price !== null) {
        // Cena zase vzrostla nad cílovku — reset, aby příští pokles pod cílovku znovu notifikoval
        await supabase
          .from("watched_products")
          .update({ last_notified_price: null })
          .eq("id", item.id);
      }
    } catch (err) {
      console.error(`❌ Watchdog check failed for item ${item.id}:`, err);
    }
  }

  return Response.json({ checked: watched.length, notified });
}
