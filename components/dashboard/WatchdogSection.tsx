"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { showToast } from "@/components/Toast";

type WatchedProduct = {
  id: string;
  product_name: string;
  shop_name: string;
  last_known_price: number;
  initial_price: number;
  created_at: string;
};

export default function WatchdogSection() {
  const router = useRouter();
  const [items, setItems] = useState<WatchedProduct[] | null>(null);
  const [telegramLinked, setTelegramLinked] = useState(false);
  const [linking, setLinking] = useState(false);
  const [deepLink, setDeepLink] = useState<string | null>(null);

  const loadItems = useCallback(async () => {
    try {
      const res = await fetch("/api/watchdog");
      if (res.status === 401) {
        setItems([]);
        return;
      }
      const data = await res.json();
      setItems(data.items ?? []);
    } catch {
      setItems([]);
    }
  }, []);

  const loadTelegramStatus = useCallback(async () => {
    try {
      const res = await fetch("/api/telegram/link");
      if (!res.ok) return;
      const data = await res.json();
      setTelegramLinked(Boolean(data.linked));
    } catch {
      // ticho — stav zůstane neznámý, uživatel může znovu kliknout na propojit
    }
  }, []);

  useEffect(() => {
    void loadItems();
    void loadTelegramStatus();
  }, [loadItems, loadTelegramStatus]);

  const handleLinkTelegram = async () => {
    setLinking(true);
    try {
      const res = await fetch("/api/telegram/link", { method: "POST" });
      if (res.status === 401) {
        showToast("Pro propojení Telegramu se musíte přihlásit.", "info");
        return;
      }
      const data = await res.json();
      if (data.deepLink) {
        setDeepLink(data.deepLink);
        window.open(data.deepLink, "_blank");
      } else {
        showToast("Telegram bot zatím není nastavený.", "error");
      }
    } finally {
      setLinking(false);
    }
  };

  const handleUnlinkTelegram = async () => {
    await fetch("/api/telegram/link", { method: "DELETE" });
    setTelegramLinked(false);
    showToast("Telegram odpojen.", "info");
  };

  const removeItem = async (id: string) => {
    setItems((prev) => (prev ? prev.filter((i) => i.id !== id) : prev));
    await fetch(`/api/watchdog?id=${id}`, { method: "DELETE" });
  };

  const loading = items === null;
  const isEmpty = items !== null && items.length === 0;

  return (
    <div className="space-y-6">
      <header className="mb-6 md:mb-10 px-1 md:px-2">
        <h1 className="text-xl md:text-3xl lg:text-4xl font-display font-extrabold tracking-tight text-foodappka-950 dark:text-white leading-tight mb-2">
          Hlídací pes
        </h1>
        <p className="text-sm md:text-lg text-zinc-600 dark:text-zinc-400">
          Upozorníme vás na Telegramu, když cena klesne.
        </p>
      </header>

      {/* Propojení Telegramu */}
      <div className="rounded-2xl border border-foodappka-100 dark:border-zinc-800 bg-white/95 dark:bg-foodappka-950 p-5 md:p-6 shadow-sm">
        <div className="flex items-center justify-between gap-4 flex-wrap">
          <div className="flex items-center gap-3">
            <div className={`flex h-12 w-12 items-center justify-center rounded-full ${telegramLinked ? "bg-foodappka-100 dark:bg-foodappka-900/50" : "bg-zinc-100 dark:bg-zinc-800"}`}>
              <span className={`material-symbols-outlined text-2xl ${telegramLinked ? "text-foodappka-600" : "text-zinc-400"}`}>
                {telegramLinked ? "check_circle" : "send"}
              </span>
            </div>
            <div>
              <h3 className="font-bold text-zinc-900 dark:text-white">
                {telegramLinked ? "Telegram propojen" : "Propojit Telegram"}
              </h3>
              <p className="text-xs text-zinc-500 dark:text-zinc-400">
                {telegramLinked
                  ? "Upozornění na pokles ceny vám budou chodit sem."
                  : "Nastavte si notifikace o poklesu cen přímo do Telegramu."}
              </p>
            </div>
          </div>
          {telegramLinked ? (
            <button
              onClick={handleUnlinkTelegram}
              className="shrink-0 rounded-full border border-zinc-200 dark:border-zinc-700 px-4 py-2 text-xs font-bold text-zinc-500 hover:text-red-500 hover:border-red-200 transition-colors"
            >
              Odpojit
            </button>
          ) : (
            <button
              onClick={handleLinkTelegram}
              disabled={linking}
              className="shrink-0 inline-flex items-center gap-2 rounded-full bg-foodappka-500 px-5 py-2.5 text-sm font-bold text-white hover:bg-foodappka-600 transition-all disabled:opacity-50"
            >
              <span className="material-symbols-outlined text-lg">send</span>
              {linking ? "Otevírám…" : "Propojit"}
            </button>
          )}
        </div>
        {deepLink && !telegramLinked && (
          <p className="mt-3 text-xs text-zinc-500 dark:text-zinc-400">
            Otevřel se Telegram s botem — stačí kliknout na <strong>Start</strong>. Pokud se okno neotevřelo,{" "}
            <a href={deepLink} target="_blank" rel="noreferrer" className="text-foodappka-600 font-bold underline">
              klikněte sem
            </a>
            .
          </p>
        )}
      </div>

      {/* Seznam hlídaných produktů */}
      {loading ? (
        <div className="py-10 text-center text-sm text-zinc-400">Načítám…</div>
      ) : isEmpty ? (
        <div className="rounded-2xl border border-dashed border-foodappka-300 dark:border-foodappka-800 bg-white/90 dark:bg-foodappka-950 p-8 text-center shadow-sm">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-foodappka-100 dark:bg-zinc-800">
            <span className="material-symbols-outlined text-foodappka-500 text-3xl">notification_important</span>
          </div>
          <h2 className="text-lg md:text-xl font-semibold text-foodappka-950 dark:text-white mb-2">
            Zatím nemáte žádné produkty
          </h2>
          <p className="text-sm text-zinc-600 dark:text-zinc-400 mb-6 max-w-xs mx-auto">
            Vyhledejte produkt a klikněte na ikonu hlídacího psa u ceny.
          </p>
          <button
            onClick={() => router.push("/app")}
            className="inline-flex items-center gap-2 rounded-full bg-foodappka-500 px-6 py-2.5 font-semibold text-white transition hover:bg-foodappka-600 text-sm"
          >
            <span className="material-symbols-outlined text-lg">search</span>
            Vyhledat produkty
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          {items!.map((item) => {
            const dropped = item.last_known_price < item.initial_price;
            return (
              <div
                key={item.id}
                className="flex items-center justify-between gap-4 rounded-2xl border border-zinc-100 dark:border-zinc-800 bg-white dark:bg-foodappka-950 px-5 py-4 shadow-sm"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-foodappka-100 dark:bg-zinc-800">
                    <span className="material-symbols-outlined text-foodappka-600 text-xl">trending_down</span>
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-bold text-zinc-900 dark:text-white truncate">{item.product_name}</p>
                    <p className="text-[11px] text-zinc-500">{item.shop_name}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3 shrink-0">
                  <div className="text-right">
                    <p className={`text-sm font-black ${dropped ? "text-green-600" : "text-foodappka-700 dark:text-foodappka-400"}`}>
                      {item.last_known_price.toFixed(2).replace(".", ",")} Kč
                    </p>
                    {dropped && (
                      <p className="text-[10px] text-zinc-400 line-through">
                        {item.initial_price.toFixed(2).replace(".", ",")} Kč
                      </p>
                    )}
                  </div>
                  <button
                    onClick={() => removeItem(item.id)}
                    className="flex h-8 w-8 items-center justify-center rounded-full text-zinc-300 hover:text-red-500 transition-colors"
                  >
                    <span className="material-symbols-outlined text-lg">close</span>
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
