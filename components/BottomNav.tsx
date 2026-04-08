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
    <nav className="lg:hidden fixed bottom-0 left-0 right-0 z-50 bg-white/80 dark:bg-black/80 backdrop-blur-xl border-t border-foodapka-100 dark:border-zinc-800 pb-safe">
      <div className="flex justify-around items-center h-16">
        {NAV_ITEMS.map((item) => {
          // Logic to determine if active
          const isSettings = item.id === "settings" && pathname.includes("/settings");
          const isModeActive = !pathname.includes("/settings") && item.id === mode;
          const isActive = isSettings || isModeActive;

          return (
            <Link
              key={item.id}
              href={item.href}
              className={`flex flex-col items-center justify-center w-full h-full gap-1 transition-all ${
                isActive
                  ? "text-foodapka-600 dark:text-foodapka-400"
                  : "text-zinc-400 dark:text-zinc-600"
              }`}
            >
              <span 
                className="material-symbols-outlined text-[24px]"
                style={isActive ? { fontVariationSettings: "'FILL' 1" } : undefined}
              >
                {item.icon}
              </span>
              <span className="text-[10px] font-bold uppercase tracking-wider">
                {item.label}
              </span>
              {isActive && (
                <div className="absolute bottom-1 w-1 h-1 rounded-full bg-foodapka-600 dark:bg-foodapka-400" />
              )}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
