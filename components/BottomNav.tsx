"use client";

import Link from "next/link";
import { useSearchParams, usePathname } from "next/navigation";

type NavItem = {
  id: string;
  label: string;
  icon: string;
  href: string;
};

const NAV_ITEMS: NavItem[] = [
  { id: "search", label: "Hledat", icon: "search", href: "/app" },
  { id: "recipes", label: "Recepty", icon: "restaurant", href: "/app?mode=recipes" },
  { id: "watchdog", label: "Pes", icon: "trending_down", href: "/app?mode=watchdog" },
  { id: "lists", label: "Seznamy", icon: "receipt_long", href: "/app?mode=lists" },
  { id: "settings", label: "Nastavení", icon: "settings", href: "/app/settings" },
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
              className={`flex-1 flex flex-col items-center justify-center gap-1 transition-all active:scale-90 active:bg-zinc-50 dark:active:bg-zinc-900/50 ${
                isActive
                  ? "text-foodappka-600 dark:text-foodappka-400"
                  : "text-zinc-400 dark:text-zinc-600"
              }`}
            >
              <span 
                className="material-symbols-outlined text-[26px]"
                style={isActive ? { fontVariationSettings: "'FILL' 1" } : undefined}
              >
                {item.icon}
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
      </div>
    </nav>
  );
}
