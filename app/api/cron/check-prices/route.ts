import { NextRequest } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { sendTelegramMessage } from "@/lib/telegram";
import { searchAllSources } from "@/lib/scrapers";
import { parsePrice } from "@/lib/food";

// Denní cron (viz vercel.json) — projde všechny hlídané produkty, ověří aktuální
// cenu ve stejném obchodě a při poklesu pošle Telegram notifikaci.
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

  // Cache výsledků hledání podle dotazu — víc uživatelů může hlídat stejný produkt
  const searchCache = new Map<string, Awaited<ReturnType<typeof searchAllSources>>>();

  let notified = 0;

  for (const item of watched) {
    try {
      const query: string = item.query || item.product_name;
      let products = searchCache.get(query);
      if (!products) {
        products = await searchAllSources(query);
        searchCache.set(query, products);
      }

      const match = products.find(
        (p) => p.url === item.product_url || p.name === item.product_name,
      );
      const store = match?.stores.find((s) => s.shopName === item.shop_name) ?? match?.stores[0];
      if (!store) continue;

      const newPrice = parsePrice(store.price);
      if (!Number.isFinite(newPrice)) continue;

      const previousPrice = Number(item.last_known_price);

      if (newPrice < previousPrice) {
        const { data: link } = await supabase
          .from("telegram_links")
          .select("chat_id")
          .eq("user_id", item.user_id)
          .maybeSingle();

        if (link?.chat_id) {
          const savings = (previousPrice - newPrice).toFixed(2).replace(".", ",");
          await sendTelegramMessage(
            link.chat_id,
            `🐶 <b>Cena klesla!</b>\n\n${item.product_name}\n${item.shop_name}: <b>${store.price}</b> (dřív ${previousPrice.toFixed(2).replace(".", ",")} Kč)\nUšetříte ${savings} Kč.`,
          );
          notified += 1;
        }
      }

      if (newPrice !== previousPrice) {
        await supabase
          .from("watched_products")
          .update({ last_known_price: newPrice })
          .eq("id", item.id);
      }
    } catch (err) {
      console.error(`❌ Watchdog check failed for item ${item.id}:`, err);
    }
  }

  return Response.json({ checked: watched.length, notified });
}
