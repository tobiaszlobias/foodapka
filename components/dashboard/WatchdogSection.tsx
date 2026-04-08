"use client";

import { useRouter } from "next/navigation";
import { EmptyState } from "./DashboardShared";

export default function WatchdogSection() {
  const router = useRouter();

  return (
    <div className="space-y-6">
      <header className="mb-6 md:mb-10 px-1 md:px-2">
        <h1 className="text-3xl md:text-4xl lg:text-5xl font-extrabold tracking-tight text-foodapka-950 dark:text-white leading-tight mb-2">
          Hlídací pes 🐕
        </h1>
        <p className="text-sm md:text-lg text-zinc-600 dark:text-zinc-400">
          Upozorníme vás, když cena klesne.
        </p>
      </header>
      
      <div className="rounded-2xl border border-dashed border-foodapka-300 dark:border-foodapka-800 bg-white/90 dark:bg-foodapka-950 p-8 text-center shadow-sm">
        <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-foodapka-100 dark:bg-zinc-800 text-3xl">
          🔔
        </div>
        <h2 className="text-lg md:text-xl font-semibold text-foodapka-950 dark:text-white mb-2">
          Zatím nemáte žádné produkty
        </h2>
        <p className="text-sm text-zinc-600 dark:text-zinc-400 mb-6 max-w-xs mx-auto">
          Vyhledejte produkt a klikněte na &quot;Hlídat cenu&quot;.
        </p>
        <button
          onClick={() => router.push("/app")}
          className="inline-flex items-center gap-2 rounded-full bg-foodapka-500 px-6 py-2.5 font-semibold text-white transition hover:bg-foodapka-600 text-sm"
        >
          <span className="material-symbols-outlined text-lg">search</span>
          Vyhledat produkty
        </button>
      </div>
      
      <div className="rounded-2xl border border-foodapka-100 dark:border-zinc-800 bg-white/90 dark:bg-foodapka-950 p-5 md:p-6 shadow-sm">
        <h3 className="font-semibold text-zinc-900 dark:text-white mb-4 flex items-center gap-2 text-sm md:text-base">
          <span className="material-symbols-outlined text-foodapka-500 text-lg">info</span>
          Jak to funguje?
        </h3>
        <ul className="space-y-3 text-sm text-zinc-600 dark:text-zinc-400">
          <li className="flex items-start gap-3">
            <span className="text-foodapka-500 font-bold">1.</span>
            Vyhledejte produkt
          </li>
          <li className="flex items-start gap-3">
            <span className="text-foodapka-500 font-bold">2.</span>
            Nastavte cílovou cenu
          </li>
          <li className="flex items-start gap-3">
            <span className="text-foodapka-500 font-bold">3.</span>
            Dostanete notifikaci
          </li>
        </ul>
      </div>
    </div>
  );
}
