"use client";

import Link from "next/link";
import { motion } from "framer-motion";
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
];

export default function BottomNav() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const mode = searchParams.get("mode") || "search";

  return (
    <nav className="lg:hidden fixed bottom-0 left-0 right-0 z-[100] flex justify-center px-4 pb-[calc(env(safe-area-inset-bottom)+0.75rem)] pointer-events-none">
      <div className="pointer-events-auto flex items-stretch h-14 gap-0.5 rounded-full bg-white/70 dark:bg-zinc-900/60 backdrop-blur-2xl backdrop-saturate-150 border border-white/60 dark:border-white/10 shadow-[0_8px_32px_rgba(0,0,0,0.12),inset_0_1px_0_rgba(255,255,255,0.5)] dark:shadow-[0_8px_32px_rgba(0,0,0,0.4),inset_0_1px_0_rgba(255,255,255,0.08)] px-1.5">
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
              className="relative flex items-center justify-center px-1 py-1"
            >
              {isActive && (
                <motion.div
                  layoutId="bottom-nav-active-pill"
                  className="absolute inset-y-1 inset-x-0.5 rounded-full bg-mnamio-500 shadow-lg shadow-mnamio-500/30"
                  transition={{ type: "spring", stiffness: 500, damping: 35 }}
                />
              )}
              <span
                className={`relative flex flex-col items-center justify-center gap-0.5 w-16 transition-colors duration-200 ${
                  isActive ? "text-white" : "text-zinc-500 dark:text-zinc-400"
                }`}
              >
                <span
                  className="material-symbols-outlined text-[22px]"
                  style={isActive ? { fontVariationSettings: "'FILL' 1" } : undefined}
                >
                  {item.icon}
                </span>
                <span className="text-[9px] font-black uppercase tracking-tighter">
                  {item.label}
                </span>
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
