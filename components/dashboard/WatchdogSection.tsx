"use client";

import { useCallback, useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { showToast } from "@/components/Toast";
import { INGREDIENT_PRESETS } from "@/lib/ingredientPresets";
import { useBodyScrollLock } from "@/lib/useBodyScrollLock";
import { AVAILABLE_STORES } from "@/lib/favoriteStores";
import { StoreFilterChips } from "./DashboardShared";

type WatchedProduct = {
  id: string;
  query: string;
  target_price: number;
  last_notified_price: number | null;
  store_filter: string[] | null;
  created_at: string;
};

type WatchFormProps = {
  onDone: (item: WatchedProduct) => void;
  onCancel?: () => void;
};

/** Samotný formulář hlídání — sdílený mezi mobilním bottom-sheet modalem
 * (AddWatchDialog) a inline verzí přímo na stránce na desktopu. */
function WatchForm({ onDone, onCancel }: WatchFormProps) {
  const [selectedPresetId, setSelectedPresetId] = useState<string | null>(null);
  const [customQuery, setCustomQuery] = useState("");
  const [targetPrice, setTargetPrice] = useState("");
  const [selectedStores, setSelectedStores] = useState<string[]>([]);
  const [saving, setSaving] = useState(false);

  const selectedPreset = INGREDIENT_PRESETS.find((p) => p.id === selectedPresetId);
  const activeQuery = selectedPreset ? selectedPreset.label : customQuery;

  const normalizedSearch = customQuery.trim().toLowerCase();
  const filteredPresets = normalizedSearch
    ? INGREDIENT_PRESETS.filter((p) => p.label.toLowerCase().includes(normalizedSearch))
    : INGREDIENT_PRESETS;

  const handleSave = async () => {
    const query = selectedPreset ? selectedPreset.query : customQuery.trim();
    const priceNum = Number(targetPrice.replace(",", "."));

    if (!query) {
      showToast("Vyberte surovinu nebo napište vlastní dotaz.", "error");
      return;
    }
    if (!Number.isFinite(priceNum) || priceNum <= 0) {
      showToast("Zadejte platnou cílovou cenu.", "error");
      return;
    }

    setSaving(true);
    try {
      const res = await fetch("/api/watchdog", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query, targetPrice: priceNum, storeFilter: selectedStores }),
      });
      if (res.status === 401) {
        showToast("Pro hlídání cen se musíte přihlásit.", "info");
        return;
      }
      if (!res.ok) throw new Error();
      const data = await res.json();
      showToast("🐶 Hlídáme! Dáme vám vědět na Telegramu, až cena klesne.", "success");
      setSelectedPresetId(null);
      setCustomQuery("");
      setTargetPrice("");
      setSelectedStores([]);
      onDone(data.item);
    } catch {
      showToast("Nepodařilo se nastavit hlídání ceny.", "error");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="grid md:grid-cols-2 gap-4 md:gap-6">
        <div>
          <label className="block text-sm font-bold text-zinc-700 dark:text-zinc-300 mb-2">
            Vyberte nebo vyhledejte produkt, který chcete hlídat
          </label>
          <div className="relative mb-3">
            <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-zinc-400 text-lg">
              search
            </span>
            <input
              value={customQuery}
              onChange={(e) => {
                setCustomQuery(e.target.value);
                setSelectedPresetId(null);
              }}
              placeholder="Např. kuřecí prsa, máslo…"
              className="w-full h-12 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-black pl-11 pr-4 text-zinc-900 dark:text-white outline-none transition focus:border-mnamio-500 focus:ring-2 focus:ring-mnamio-500/20"
            />
          </div>
          <div className="grid grid-cols-3 gap-2 max-h-56 overflow-y-auto">
            {filteredPresets.map((preset) => (
              <button
                key={preset.id}
                onClick={() => {
                  setSelectedPresetId(preset.id);
                  setCustomQuery("");
                }}
                className={`flex flex-col items-center gap-1 rounded-xl border-2 py-3 px-1 transition-all ${
                  selectedPresetId === preset.id
                    ? "border-mnamio-500 bg-mnamio-50 dark:bg-mnamio-900/30 text-mnamio-700 dark:text-mnamio-300"
                    : "border-zinc-100 dark:border-zinc-800 text-zinc-500 dark:text-zinc-400 hover:border-mnamio-200"
                }`}
              >
                <span className="material-symbols-outlined text-xl">{preset.icon}</span>
                <span className="text-[11px] font-bold text-center leading-tight">{preset.label}</span>
              </button>
            ))}
            {filteredPresets.length === 0 && (
              <p className="col-span-3 py-3 text-center text-xs text-zinc-400">
                Žádný preset — použijeme přesně to, co jste napsali.
              </p>
            )}
          </div>
        </div>

        <div className="flex flex-col">
          <label className="block text-sm font-bold text-zinc-700 dark:text-zinc-300 mb-2">
            Upozornit, když cena klesne pod
            {activeQuery && <span className="font-normal text-zinc-500"> ({activeQuery})</span>}
          </label>
          <div className="relative">
            <input
              value={targetPrice}
              onChange={(e) => setTargetPrice(e.target.value)}
              inputMode="decimal"
              placeholder="20"
              className="w-full h-12 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-black px-4 pr-12 text-zinc-900 dark:text-white outline-none transition focus:border-mnamio-500 focus:ring-2 focus:ring-mnamio-500/20"
            />
            <span className="absolute right-4 top-1/2 -translate-y-1/2 text-sm font-bold text-zinc-400">Kč</span>
          </div>

          <div className="mt-4">
            <label className="block text-sm font-bold text-zinc-700 dark:text-zinc-300 mb-2">
              Ve kterých obchodech hlídat
            </label>
            <StoreFilterChips stores={AVAILABLE_STORES} selected={selectedStores} onChange={setSelectedStores} />
            <p className="mt-1.5 text-xs text-zinc-500 dark:text-zinc-400">
              {selectedStores.length === 0 ? "Nevybráno = hlídáme napříč všemi obchody." : "Hlídáme jen ve vybraných obchodech."}
            </p>
          </div>

          <div className="mt-auto pt-4 flex gap-2">
            {onCancel && (
              <button
                onClick={onCancel}
                className="h-12 px-5 rounded-full border border-zinc-200 dark:border-zinc-700 text-sm font-bold text-zinc-500 hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-colors"
              >
                Zrušit
              </button>
            )}
            <button
              onClick={handleSave}
              disabled={saving}
              className="flex-1 h-12 rounded-full bg-mnamio-600 text-white font-black transition hover:bg-mnamio-700 shadow-lg shadow-mnamio-600/20 active:scale-95 disabled:opacity-50"
            >
              {saving ? "Ukládám…" : "Zapnout hlídání"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

type AddWatchDialogProps = {
  onClose: () => void;
  onCreated: (item: WatchedProduct) => void;
};

/** Mobilní bottom-sheet modal — na desktopu se místo toho renderuje WatchForm inline. */
function AddWatchDialog({ onClose, onCreated }: AddWatchDialogProps) {
  // Na desktopu (lg+) je tenhle modal skrytý přes CSS a nahrazený inline
  // formulářem na stránce — nesmí zamykat scroll, i když je v DOM.
  const [isMobileViewport, setIsMobileViewport] = useState(
    typeof window !== "undefined" ? window.innerWidth < 1024 : true,
  );
  useEffect(() => {
    const handleResize = () => setIsMobileViewport(window.innerWidth < 1024);
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);
  useBodyScrollLock(isMobileViewport);

  return createPortal(
    <div
      className="lg:hidden fixed inset-0 z-[200] flex items-end justify-center bg-black/50 backdrop-blur-sm p-0"
      onClick={onClose}
    >
      <div
        className="w-full max-h-[90vh] overflow-hidden rounded-t-[2rem] bg-white dark:bg-zinc-900 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="max-h-[90vh] overflow-y-auto overscroll-contain p-6 pb-safe">
          <div className="flex items-center justify-between mb-5">
            <h3 className="text-lg font-black text-zinc-900 dark:text-white flex items-center gap-2">
              <span className="material-symbols-outlined text-mnamio-600">trending_down</span>
              Přidat hlídání
            </h3>
            <button
              onClick={onClose}
              className="flex h-9 w-9 items-center justify-center rounded-full bg-zinc-100 dark:bg-zinc-800 text-zinc-500 hover:text-zinc-900 dark:hover:text-white transition-colors"
            >
              <span className="material-symbols-outlined text-lg">close</span>
            </button>
          </div>

          <WatchForm
            onDone={(item) => {
              onCreated(item);
              onClose();
            }}
          />
        </div>
      </div>
    </div>,
    document.body,
  );
}

export default function WatchdogSection() {
  const [items, setItems] = useState<WatchedProduct[] | null>(null);
  const [telegramLinked, setTelegramLinked] = useState(false);
  const [linking, setLinking] = useState(false);
  const [deepLink, setDeepLink] = useState<string | null>(null);
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [testing, setTesting] = useState(false);

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

  const handleTestRun = async () => {
    setTesting(true);
    try {
      const res = await fetch("/api/watchdog/test-run", { method: "POST" });
      const data = await res.json();
      if (!res.ok) {
        showToast(data.error ?? "Test se nepodařilo spustit.", "error");
        return;
      }
      showToast(`✅ Odesláno ${data.sent} zpráv na Telegram, zkontrolujte si to.`, "success");
    } catch {
      showToast("Test se nepodařilo spustit.", "error");
    } finally {
      setTesting(false);
    }
  };

  const removeItem = async (id: string) => {
    setItems((prev) => (prev ? prev.filter((i) => i.id !== id) : prev));
    await fetch(`/api/watchdog?id=${id}`, { method: "DELETE" });
  };

  const loading = items === null;
  const isEmpty = items !== null && items.length === 0;

  return (
    <div className="space-y-6">
      <header className="mb-6 md:mb-10 px-1 md:px-2 flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-xl md:text-3xl lg:text-4xl font-display font-extrabold tracking-tight text-mnamio-950 dark:text-white leading-tight mb-2">
            Hlídací pes
          </h1>
          <p className="text-sm md:text-lg text-zinc-600 dark:text-zinc-400">
            Upozorníme vás na Telegramu, když cena klesne.
          </p>
        </div>
        <button
          onClick={() => setShowAddDialog((v) => !v)}
          className="inline-flex items-center gap-2 rounded-full bg-mnamio-600 px-5 py-2.5 text-sm font-bold text-white shadow-lg shadow-mnamio-600/20 hover:bg-mnamio-700 transition-all active:scale-95"
        >
          <span className="material-symbols-outlined text-lg">{showAddDialog ? "close" : "add"}</span>
          {showAddDialog ? "Zavřít" : "Přidat hlídání"}
        </button>
      </header>

      {/* Formulář hlídání — na desktopu inline na stránce, na mobilu bottom-sheet modal (viz níže) */}
      {showAddDialog && (
        <div className="hidden lg:block rounded-2xl border border-mnamio-100 dark:border-zinc-800 bg-white/95 dark:bg-mnamio-950 p-6 shadow-sm">
          <WatchForm
            onDone={(item) => {
              setItems((prev) => [item, ...(prev ?? [])]);
              setShowAddDialog(false);
            }}
            onCancel={() => setShowAddDialog(false)}
          />
        </div>
      )}

      {/* Propojení Telegramu */}
      <div className="rounded-2xl border border-mnamio-100 dark:border-zinc-800 bg-white/95 dark:bg-mnamio-950 p-5 md:p-6 shadow-sm">
        <div className="flex items-center justify-between gap-4 flex-wrap">
          <div className="flex items-center gap-3">
            <div className={`flex h-12 w-12 items-center justify-center rounded-full ${telegramLinked ? "bg-mnamio-100 dark:bg-mnamio-900/50" : "bg-zinc-100 dark:bg-zinc-800"}`}>
              <span className={`material-symbols-outlined text-2xl ${telegramLinked ? "text-mnamio-600" : "text-zinc-400"}`}>
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
              className="shrink-0 inline-flex items-center gap-2 rounded-full bg-mnamio-500 px-5 py-2.5 text-sm font-bold text-white hover:bg-mnamio-600 transition-all disabled:opacity-50"
            >
              <span className="material-symbols-outlined text-lg">send</span>
              {linking ? "Otevírám…" : "Propojit"}
            </button>
          )}
        </div>
        {deepLink && !telegramLinked && (
          <p className="mt-3 text-xs text-zinc-500 dark:text-zinc-400">
            Otevřel se Telegram s botem — stačí kliknout na <strong>Start</strong>. Pokud se okno neotevřelo,{" "}
            <a href={deepLink} target="_blank" rel="noreferrer" className="text-mnamio-600 font-bold underline">
              klikněte sem
            </a>
            .
          </p>
        )}
        {telegramLinked && !isEmpty && (
          <button
            onClick={handleTestRun}
            disabled={testing}
            className="mt-4 inline-flex items-center gap-2 rounded-full border border-mnamio-200 dark:border-mnamio-800 px-4 py-2 text-xs font-bold text-mnamio-700 dark:text-mnamio-400 hover:bg-mnamio-50 dark:hover:bg-mnamio-900/30 transition-colors disabled:opacity-50"
          >
            <span className={`material-symbols-outlined text-base ${testing ? "animate-spin" : ""}`}>
              {testing ? "progress_activity" : "bolt"}
            </span>
            {testing ? "Spouštím test…" : "Otestovat teď"}
          </button>
        )}
      </div>

      {/* Seznam hlídaných produktů */}
      {loading ? (
        <div className="py-10 text-center text-sm text-zinc-400">Načítám…</div>
      ) : isEmpty ? (
        <div className="rounded-2xl border border-dashed border-mnamio-300 dark:border-mnamio-800 bg-white/90 dark:bg-mnamio-950 p-8 text-center shadow-sm">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-mnamio-100 dark:bg-zinc-800">
            <span className="material-symbols-outlined text-mnamio-500 text-3xl">notification_important</span>
          </div>
          <h2 className="text-lg md:text-xl font-semibold text-mnamio-950 dark:text-white mb-2">
            Zatím nic nehlídáte
          </h2>
          <p className="text-sm text-zinc-600 dark:text-zinc-400 mb-6 max-w-xs mx-auto">
            Vyberte surovinu a nastavte cílovou cenu, na kterou vás upozorníme.
          </p>
          <button
            onClick={() => setShowAddDialog(true)}
            className="inline-flex items-center gap-2 rounded-full bg-mnamio-500 px-6 py-2.5 font-semibold text-white transition hover:bg-mnamio-600 text-sm"
          >
            <span className="material-symbols-outlined text-lg">add</span>
            Přidat hlídání
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          {items!.map((item) => {
            const triggered = item.last_notified_price !== null;
            const matchedPreset = INGREDIENT_PRESETS.find((p) => p.query === item.query);
            return (
              <div
                key={item.id}
                className="flex items-center justify-between gap-4 rounded-2xl border border-zinc-100 dark:border-zinc-800 bg-white dark:bg-mnamio-950 px-5 py-4 shadow-sm"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-mnamio-100 dark:bg-zinc-800">
                    <span className="material-symbols-outlined text-mnamio-600 text-xl">
                      {matchedPreset?.icon ?? "trending_down"}
                    </span>
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-bold text-zinc-900 dark:text-white truncate">
                      {matchedPreset?.label ?? item.query}
                    </p>
                    <p className="text-[11px] text-zinc-500">
                      {triggered ? `Naposledy nalezeno za ${item.last_notified_price!.toFixed(2).replace(".", ",")} Kč` : "Zatím pod cílovkou nic"}
                    </p>
                    {item.store_filter && item.store_filter.length > 0 && (
                      <p className="mt-0.5 text-[10px] font-bold text-mnamio-600 dark:text-mnamio-400 truncate">
                        jen {item.store_filter.join(", ")}
                      </p>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-3 shrink-0">
                  <div className="text-right">
                    <p className="text-[9px] font-black uppercase tracking-widest text-zinc-400">Pod</p>
                    <p className={`text-sm font-black ${triggered ? "text-green-600" : "text-mnamio-700 dark:text-mnamio-400"}`}>
                      {Number(item.target_price).toFixed(2).replace(".", ",")} Kč
                    </p>
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

      {showAddDialog && (
        <AddWatchDialog
          onClose={() => setShowAddDialog(false)}
          onCreated={(item) => setItems((prev) => [item, ...(prev ?? [])])}
        />
      )}
    </div>
  );
}
