"use client";

import { showToast } from "@/components/Toast";

// Ukázková data pro zašedlý náhled — watchdog je zatím premium teaser bez backendu
const PREVIEW_ITEMS = [
  { name: "Máslo 250 g", target: "39,90 Kč", current: "54,90 Kč", store: "Lidl" },
  { name: "Kuřecí prsa 1 kg", target: "129,00 Kč", current: "169,00 Kč", store: "Kaufland" },
  { name: "Olivový olej 500 ml", target: "149,00 Kč", current: "199,00 Kč", store: "Albert" },
];

export default function WatchdogSection() {
  return (
    <div className="space-y-6">
      <header className="mb-6 md:mb-10 px-1 md:px-2">
        <div className="flex items-center gap-3 mb-2">
          <h1 className="text-xl md:text-3xl lg:text-4xl font-display font-extrabold tracking-tight text-foodappka-950 dark:text-white leading-tight">
            Hlídací pes
          </h1>
          <span className="inline-flex items-center gap-1 rounded-full bg-gradient-to-r from-amber-400 to-amber-500 px-3 py-1 text-[10px] font-black uppercase tracking-widest text-amber-950 shadow-sm">
            <span className="material-symbols-outlined text-[13px]">workspace_premium</span>
            Premium
          </span>
        </div>
        <p className="text-sm md:text-lg text-zinc-600 dark:text-zinc-400">
          Upozorníme vás, když cena vašich produktů klesne.
        </p>
      </header>

      {/* Zašedlý náhled — ukazuje, jak bude watchdog vypadat. Grid stacking: overlay i náhled sdílí buňku, výška = větší z nich */}
      <div className="grid">
        <div className="col-start-1 row-start-1 space-y-3 grayscale opacity-50 pointer-events-none select-none" aria-hidden="true">
          {PREVIEW_ITEMS.map((item) => (
            <div
              key={item.name}
              className="flex items-center justify-between gap-4 rounded-2xl border border-zinc-100 dark:border-zinc-800 bg-white dark:bg-foodappka-950 px-5 py-4 shadow-sm"
            >
              <div className="flex items-center gap-3 min-w-0">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-foodappka-100 dark:bg-zinc-800">
                  <span className="material-symbols-outlined text-foodappka-600 text-xl">trending_down</span>
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-bold text-zinc-900 dark:text-white truncate">{item.name}</p>
                  <p className="text-[11px] text-zinc-500">{item.store} · nyní {item.current}</p>
                </div>
              </div>
              <div className="text-right shrink-0">
                <p className="text-[10px] font-black uppercase tracking-widest text-zinc-400">Cílová cena</p>
                <p className="text-sm font-black text-foodappka-700 dark:text-foodappka-400">{item.target}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Premium overlay */}
        <div className="col-start-1 row-start-1 z-10 flex items-center justify-center py-4">
          <div className="mx-4 w-full max-w-md rounded-[2rem] border border-amber-200/60 dark:border-amber-500/30 bg-white/95 dark:bg-zinc-900/95 backdrop-blur-md p-6 md:p-8 text-center shadow-2xl">
            <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-gradient-to-br from-amber-300 to-amber-500 shadow-lg shadow-amber-500/30">
              <span className="material-symbols-outlined text-amber-950 text-2xl">lock</span>
            </div>
            <h2 className="text-lg md:text-xl font-black text-zinc-900 dark:text-white mb-2">
              Hlídací pes je součástí Premium
            </h2>
            <p className="text-sm text-zinc-600 dark:text-zinc-400 mb-5">
              Nastavte si cílovou cenu a my pohlídáme letáky za vás. Jakmile cena klesne, dáme vám vědět.
            </p>
            <ul className="text-left text-sm text-zinc-700 dark:text-zinc-300 space-y-2 mb-6">
              <li className="flex items-start gap-2">
                <span className="material-symbols-outlined text-foodappka-600 text-lg">check_circle</span>
                Neomezený počet hlídaných produktů
              </li>
              <li className="flex items-start gap-2">
                <span className="material-symbols-outlined text-foodappka-600 text-lg">check_circle</span>
                Upozornění e-mailem hned po vydání letáků
              </li>
              <li className="flex items-start gap-2">
                <span className="material-symbols-outlined text-foodappka-600 text-lg">check_circle</span>
                Historie cen a nejlepší okamžik k nákupu
              </li>
            </ul>
            <button
              onClick={() => showToast("Premium právě připravujeme — dáme vám vědět! 🐶", "info")}
              className="w-full rounded-full bg-gradient-to-r from-amber-400 to-amber-500 px-6 py-3 font-black text-amber-950 shadow-lg shadow-amber-500/30 transition hover:brightness-105 active:scale-95"
            >
              Chci Premium
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
