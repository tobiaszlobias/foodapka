"use client";

import Link from "next/link";

type SidebarProps = {
  currentPage: "search" | "watchdog" | "lists" | "recipes" | "settings";
};

type NavItem = {
  id: SidebarProps["currentPage"];
  label: string;
  icon: string;
  href: string;
};

const NAV_ITEMS: NavItem[] = [
  { id: "search", label: "Vyhledávání", icon: "search", href: "/app" },
  { id: "watchdog", label: "Hlídací pes", icon: "trending_down", href: "/app?tab=watchdog" },
  { id: "lists", label: "Nákupní seznamy", icon: "receipt_long", href: "/app?tab=lists" },
  { id: "recipes", label: "Recepty", icon: "restaurant", href: "/app?tab=recipes" },
  { id: "settings", label: "Nastavení", icon: "settings", href: "/app?tab=settings" },
];

export default function Sidebar({ currentPage }: SidebarProps) {
  return (
    <aside className="hidden lg:flex h-[calc(100vh-5rem)] w-72 flex-col gap-2 rounded-r-[2rem] bg-emerald-50/80 p-6 shadow-[0px_20px_40px_rgba(0,33,20,0.08)] sticky top-20">
      <div className="mb-8 px-4">
        <h2 className="text-xl font-bold text-emerald-700">foodapka</h2>
        <p className="text-xs text-zinc-500 font-medium">Chytré nakupování</p>
      </div>

      <nav className="flex flex-col gap-2">
        {NAV_ITEMS.map((item) => {
          const isActive = currentPage === item.id;

          return (
            <Link
              key={item.id}
              href={item.href}
              className={`flex items-center gap-4 px-6 py-3 rounded-full transition-all ${
                isActive
                  ? "bg-emerald-600 text-white shadow-lg shadow-emerald-200"
                  : "text-zinc-500 hover:text-emerald-600 hover:bg-emerald-100 hover:translate-x-1"
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

      <div className="mt-auto flex flex-col gap-4 border-t border-emerald-100/50 pt-6">
        <Link
          href="/"
          className="bg-emerald-600 hover:bg-emerald-700 text-white rounded-full px-6 py-3 font-bold transition-all shadow-md text-center"
        >
          Zpět na úvod
        </Link>
        <div className="flex flex-col gap-1">
          <a
            href="#"
            className="flex items-center gap-4 text-zinc-500 px-6 py-2 text-sm hover:text-emerald-600 transition-colors"
          >
            <span className="material-symbols-outlined text-lg">help</span>
            <span>Nápověda</span>
          </a>
        </div>
      </div>
    </aside>
  );
}
