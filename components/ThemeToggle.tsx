"use client";

import { useSyncExternalStore } from "react";

type ThemeMode = "light" | "dark";

const STORAGE_KEY = "foodappka-theme";
const THEME_EVENT = "foodappka-theme-change";

function applyTheme(theme: ThemeMode) {
  document.documentElement.dataset.theme = theme;
  document.documentElement.style.colorScheme = theme;
  window.localStorage.setItem(STORAGE_KEY, theme);
  window.dispatchEvent(new Event(THEME_EVENT));
}

export default function ThemeToggle() {
  const theme = useSyncExternalStore(
    (onStoreChange) => {
      window.addEventListener(THEME_EVENT, onStoreChange);
      window.addEventListener("storage", onStoreChange);

      return () => {
        window.removeEventListener(THEME_EVENT, onStoreChange);
        window.removeEventListener("storage", onStoreChange);
      };
    },
    () =>
      document.documentElement.dataset.theme === "dark" ? "dark" : "light",
    () => "light",
  );

  function toggleTheme() {
    const nextTheme = theme === "dark" ? "light" : "dark";
    applyTheme(nextTheme);
  }

  return (
    <button
      type="button"
      onClick={toggleTheme}
      aria-label={
        theme === "dark"
          ? "Přepnout na světlý režim"
          : "Přepnout na tmavý režim"
      }
      className="relative flex h-10 w-[72px] items-center rounded-full bg-foodappka-100/50 dark:bg-foodappka-800/50 p-1 transition-all hover:bg-foodappka-100 dark:hover:bg-foodappka-800 active:scale-95 group"
    >
      {/* Sliding Pill - Exactly centered over icons area */}
      <div 
        className={`absolute h-8 w-8 rounded-full bg-white dark:bg-zinc-900 shadow-sm transition-all duration-300 ease-out ${
          theme === "dark" ? "translate-x-8" : "translate-x-0"
        }`}
      />
      
      {/* Icons Layer - Symmetrical distribution */}
      <div className="relative flex w-full items-center z-10 pointer-events-none">
        <div className="flex-1 flex items-center justify-center">
          <span className={`material-symbols-outlined text-[18px] transition-colors duration-300 ${theme === 'light' ? 'text-foodappka-700' : 'text-foodappka-400/50'}`}>
            light_mode
          </span>
        </div>
        <div className="flex-1 flex items-center justify-center">
          <span className={`material-symbols-outlined text-[18px] transition-colors duration-300 ${theme === 'dark' ? 'text-foodappka-400' : 'text-foodappka-700/50'}`}>
            dark_mode
          </span>
        </div>
      </div>
    </button>
  );
}
