import { createClient } from "@/lib/supabase/server";
import { sendTelegramMessage } from "@/lib/telegram";
import { searchAllSources } from "@/lib/scrapers";
import { parsePrice, sortStoresByPrice } from "@/lib/food";
import { filterProductsByStores } from "@/lib/storeFilters";

// Ruční testovací spuštění hlídače cen pro přihlášeného uživatele — na rozdíl
// od /api/cron/check-prices (chráněno CRON_SECRET, běží pro všechny uživatele,
// respektuje throttle) tohle vždy pošle Telegram zprávu, aby si uživatel mohl
// ověřit, že mu notifikace vůbec dojde.
export async function POST() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return Response.json({ error: "Nejste přihlášeni." }, { status: 401 });
  }

  const { data: link } = await supabase
    .from("telegram_links")
    .select("chat_id")
    .eq("user_id", user.id)
    .maybeSingle();

  if (!link?.chat_id) {
    return Response.json({ error: "Nejdřív propojte Telegram." }, { status: 400 });
  }

  const { data: watched, error } = await supabase
    .from("watched_products")
    .select("*")
    .eq("user_id", user.id);

  if (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
  if (!watched || watched.length === 0) {
    return Response.json({ error: "Nemáte žádné hlídané položky." }, { status: 400 });
  }

  let sent = 0;

  for (const item of watched) {
    try {
      const products = await searchAllSources(item.query);
      const scopedProducts = filterProductsByStores(products, item.store_filter);

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

      if (!best) {
        await sendTelegramMessage(
          link.chat_id,
          `🐶 <b>Test hlídání</b>\n\n„${item.query}“\nNic jsme aktuálně nenašli.`,
        );
      } else {
        const targetPrice = Number(item.target_price);
        const underTarget = best.price <= targetPrice;
        await sendTelegramMessage(
          link.chat_id,
          `🐶 <b>Test hlídání</b>${underTarget ? " — pod cílovkou! 🎉" : ""}\n\n„${item.query}“\n${best.productName}\n${best.shopName}: <b>${best.price.toFixed(2).replace(".", ",")} Kč</b>\n(cílovka: ${targetPrice.toFixed(2).replace(".", ",")} Kč)`,
        );
      }
      sent += 1;
    } catch (err) {
      console.error(`❌ Watchdog test-run failed for item ${item.id}:`, err);
    }
  }

  return Response.json({ sent });
}
