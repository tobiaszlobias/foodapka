"use client";

import Link from "next/link";
import { useSearchParams, usePathname } from "next/navigation";

type NavItem = {
  id: string;
  label: string;
  icon: string;
  href: string;
  premium?: boolean;
};

const NAV_ITEMS: NavItem[] = [
  { id: "search", label: "Hledat", icon: "search", href: "/app" },
  { id: "recipes", label: "Recepty", icon: "restaurant", href: "/app?mode=recipes" },
  { id: "watchdog", label: "Pes", icon: "trending_down", href: "/app?mode=watchdog", premium: true },
  { id: "lists", label: "Seznamy", icon: "receipt_long", href: "/app?mode=lists" },
];

export default function BottomNav() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const mode = searchParams.get("mode") || "search";

  return (
    <nav className="lg:hidden fixed bottom-0 left-0 right-0 z-[100] bg-white/90 dark:bg-black/90 backdrop-blur-2xl border-t border-zinc-100 dark:border-zinc-800 pb-safe shadow-[0_-10px_40px_rgba(0,0,0,0.05)]">
      <div className="flex justify-around items-stretch h-16">
        {NAV_ITEMS.map((item) => {
          const isSettings = item.id === "settings" && pathname.includes("/settings");
          const isModeActive = !pathname.includes("/settings") && item.id === mode;
          const isActive = isSettings || isModeActive;

          return (
            <Link
              key={item.id}
              href={item.href}
              onClick={(e) => {
                if (isActive) {
                  // If already active, trigger a reset event instead of standard navigation
                  window.dispatchEvent(new CustomEvent("nav-reset", { detail: { mode: item.id } }));
                }
              }}
              className={`relative flex-1 flex flex-col items-center justify-center gap-1 transition-all active:scale-90 active:bg-zinc-50 dark:active:bg-zinc-900/50 ${
                isActive
                  ? "text-foodappka-600 dark:text-foodappka-400"
                  : "text-zinc-400 dark:text-zinc-600"
              }`}
            >
              <span className="relative">
                <span
                  className="material-symbols-outlined text-[26px]"
                  style={isActive ? { fontVariationSettings: "'FILL' 1" } : undefined}
                >
                  {item.icon}
                </span>
                {item.premium && (
                  <span className="absolute -top-1 -right-2 flex h-3.5 w-3.5 items-center justify-center rounded-full bg-gradient-to-br from-amber-300 to-amber-500 shadow-sm">
                    <span className="material-symbols-outlined text-[9px] text-amber-950">lock</span>
                  </span>
                )}
              </span>
              <span className="text-[9px] font-black uppercase tracking-tighter">
                {item.label}
              </span>
              {isActive && (
                <div className="absolute bottom-1.5 w-1 h-1 rounded-full bg-foodappka-600 dark:bg-foodappka-400" />
              )}
            </Link>
          );
        })}
        
        {/* Help Button (Special case, no Link) */}
        <button
          onClick={() => window.dispatchEvent(new CustomEvent("open-help"))}
          className="flex-1 flex flex-col items-center justify-center gap-1 transition-all active:scale-90 active:bg-zinc-50 dark:active:bg-zinc-900/50 text-zinc-400 dark:text-zinc-600"
        >
          <span className="material-symbols-outlined text-[26px]">help</span>
          <span className="text-[9px] font-black uppercase tracking-tighter">Nápověda</span>
        </button>
      </div>
    </nav>
  );
}
