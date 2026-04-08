"use client";

import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";

type NavItem = {
  id: string;
  label: string;
  icon: string;
  href: string;
};

const NAV_ITEMS: NavItem[] = [
  { id: "search", label: "Vyhledávání", icon: "search", href: "/app" },
  { id: "recipes", label: "Recepty", icon: "restaurant", href: "/app?mode=recipes" },
  { id: "watchdog", label: "Hlídací pes", icon: "trending_down", href: "/app?mode=watchdog" },
  { id: "lists", label: "Nákupní seznamy", icon: "receipt_long", href: "/app?mode=lists" },
  { id: "settings", label: "Nastavení", icon: "settings", href: "/app/settings" },
];

export default function Sidebar() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const mode = searchParams.get("mode") || "search";

  return (
    <aside className="hidden lg:flex h-[calc(100vh-5rem)] w-72 flex-col gap-2 rounded-r-[2rem] bg-foodapka-50/80 dark:bg-foodapka-950/90 p-6 shadow-[0px_20px_40px_rgba(0,33,20,0.08)] dark:shadow-none fixed top-20 left-0 z-40">
      <nav className="flex flex-col gap-2 mt-4">
        {NAV_ITEMS.map((item) => {
          const isSettings = item.id === "settings" && pathname.includes("/settings");
          const isModeActive = !pathname.includes("/settings") && item.id === mode;
          const isActive = isSettings || isModeActive;

          return (
            <Link
              key={item.id}
              href={item.href}
              className={`flex items-center gap-4 px-6 py-3 rounded-full transition-all ${
                isActive
                  ? "bg-foodapka-500 text-white shadow-lg shadow-foodapka-500/30"
                  : "text-zinc-500 dark:text-zinc-400 hover:text-foodapka-600 dark:hover:text-foodapka-400 hover:bg-foodapka-100 dark:hover:bg-foodapka-900/50 hover:translate-x-1"
              }`}
            >
              <span
                className="material-symbols-outlined"
                style={isActive ? { fontVariationSettings: "'FILL' 1" } : undefined}
              >
                {item.icon}
              </span>
              <span className="font-medium">{item.label}</span>
            </Link>
          );
        })}
      </nav>

      <div className="mt-auto flex flex-col gap-4 border-t border-foodapka-100/50 dark:border-zinc-700 pt-6">
        <Link
          href="/"
          className="bg-foodapka-500 hover:bg-foodapka-600 text-white rounded-full px-6 py-3 font-bold transition-all shadow-md text-center"
        >
          Zpět na úvod
        </Link>
        <div className="flex flex-col gap-1">
          <Link
            href="/app/settings#napoveda"
            className="flex items-center gap-4 text-zinc-500 dark:text-zinc-400 px-6 py-2 text-sm hover:text-foodapka-600 dark:hover:text-foodapka-400 transition-colors"
          >
            <span className="material-symbols-outlined text-lg">help</span>
            <span>Nápověda</span>
          </Link>
        </div>
      </div>
    </aside>
  );
}
