"use client";

import { useSyncExternalStore } from "react";

type ThemeMode = "light" | "dark";

const STORAGE_KEY = "foodapka-theme";
const THEME_EVENT = "foodapka-theme-change";

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
      aria-pressed={theme === "dark"}
      aria-label={
        theme === "dark"
          ? "Přepnout na světlý režim"
          : "Přepnout na tmavý režim"
      }
      className="inline-flex items-center gap-3 rounded-full border border-white/30 bg-white/70 px-4 py-2 text-sm font-medium text-foodapka-950 transition hover:border-foodapka-300 hover:bg-white"
    >
      <span className="text-sm">{theme === "dark" ? "Dark" : "Light"}</span>
      <span className="relative flex h-6 w-11 items-center rounded-full bg-foodapka-900/15 p-1">
        <span
          className={`h-4 w-4 rounded-full bg-white shadow-sm transition ${
            theme === "dark" ? "translate-x-5 bg-foodapka-600" : "translate-x-0"
          }`}
        />
      </span>
    </button>
  );
}
