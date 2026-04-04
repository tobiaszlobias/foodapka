"use client";

import Link from "next/link";
import { useSyncExternalStore } from "react";

type SiteHeaderProps = {
  current?: "home" | "recipes";
};

type ThemeMode = "light" | "dark";

const STORAGE_KEY = "foodapka-theme";
const THEME_CHANGE_EVENT = "foodapka-theme-change";

function linkClasses(active: boolean) {
  return active
    ? "inline-flex items-center rounded-full bg-emerald-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition dark:bg-emerald-500 dark:text-slate-950"
    : "inline-flex items-center rounded-full border border-white/30 bg-white/70 px-4 py-2 text-sm font-medium text-emerald-950 transition hover:border-emerald-300 hover:bg-white dark:border-slate-700 dark:bg-slate-900/70 dark:text-slate-100 dark:hover:border-emerald-500 dark:hover:bg-slate-900";
}

function SunIcon() {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 24 24"
      className="h-4 w-4"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <circle cx="12" cy="12" r="4" />
      <path d="M12 2v2.5" />
      <path d="M12 19.5V22" />
      <path d="M4.93 4.93 6.7 6.7" />
      <path d="m17.3 17.3 1.77 1.77" />
      <path d="M2 12h2.5" />
      <path d="M19.5 12H22" />
      <path d="m4.93 19.07 1.77-1.77" />
      <path d="M17.3 6.7 19.07 4.93" />
    </svg>
  );
}

function MoonIcon() {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 24 24"
      className="h-4 w-4"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8Z" />
    </svg>
  );
}

function applyTheme(theme: ThemeMode) {
  document.documentElement.setAttribute("data-theme", theme);
  window.dispatchEvent(new Event(THEME_CHANGE_EVENT));
}

function getThemeSnapshot(): ThemeMode {
  if (typeof document === "undefined") {
    return "light";
  }

  return document.documentElement.getAttribute("data-theme") === "dark"
    ? "dark"
    : "light";
}

function getServerThemeSnapshot(): ThemeMode {
  return "light";
}

function subscribeToThemeStore(onStoreChange: () => void) {
  if (typeof window === "undefined") {
    return () => undefined;
  }

  const handleThemeChange = () => onStoreChange();
  window.addEventListener(THEME_CHANGE_EVENT, handleThemeChange);

  return () => {
    window.removeEventListener(THEME_CHANGE_EVENT, handleThemeChange);
  };
}

export default function SiteHeader({ current = "home" }: SiteHeaderProps) {
  const theme = useSyncExternalStore(
    subscribeToThemeStore,
    getThemeSnapshot,
    getServerThemeSnapshot,
  );
  const isDark = theme === "dark";

  function toggleTheme() {
    const nextTheme: ThemeMode = isDark ? "light" : "dark";
    applyTheme(nextTheme);
    try {
      localStorage.setItem(STORAGE_KEY, nextTheme);
    } catch {
      // Ignore storage failures and keep runtime theme only.
    }
  }

  return (
    <header className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
      <Link
        href="/"
        className="text-lg font-semibold tracking-tight text-emerald-950 dark:text-slate-100"
      >
        foodapka
      </Link>
      <div className="flex flex-wrap items-center gap-2">
        <nav className="flex flex-wrap gap-2">
          <Link href="/" className={linkClasses(current === "home")}>
            Vyhledávání
          </Link>
          <Link href="/recepty" className={linkClasses(current === "recipes")}>
            Recepty
          </Link>
        </nav>
        <button
          type="button"
          onClick={toggleTheme}
          aria-pressed={isDark}
          aria-label={isDark ? "Přepnout na světlý režim" : "Přepnout na tmavý režim"}
          className="inline-flex items-center gap-3 rounded-full border border-white/40 bg-white/75 px-3 py-2 text-sm font-semibold text-emerald-950 transition hover:border-emerald-300 hover:bg-white dark:border-slate-700 dark:bg-slate-900/75 dark:text-slate-100 dark:hover:border-emerald-500 dark:hover:bg-slate-900"
        >
          <span className="relative flex h-6 w-11 items-center rounded-full bg-emerald-200/90 p-1 transition dark:bg-slate-700">
            <span
              className={`h-4 w-4 rounded-full bg-white shadow-sm transition ${
                isDark ? "translate-x-5 bg-emerald-400" : "translate-x-0"
              }`}
            />
          </span>
          <span className="flex items-center gap-1.5">
            {isDark ? <MoonIcon /> : <SunIcon />}
            Dark Mode
          </span>
        </button>
      </div>
    </header>
  );
}
