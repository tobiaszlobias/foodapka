import Link from "next/link";
import ThemeToggle from "@/components/ThemeToggle";

type SiteHeaderProps = {
  current?: "home" | "recipes";
};

function linkClasses(active: boolean) {
  return active
    ? "inline-flex items-center rounded-full bg-emerald-600 px-4 py-2 text-sm font-semibold text-white shadow-sm"
    : "inline-flex items-center rounded-full border border-white/30 bg-white/70 px-4 py-2 text-sm font-medium text-emerald-950 transition hover:border-emerald-300 hover:bg-white";
}

export default function SiteHeader({ current = "home" }: SiteHeaderProps) {
  return (
    <header className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
      <Link
        href="/"
        className="text-lg font-semibold tracking-tight text-emerald-950"
      >
        foodapka
      </Link>
      <nav className="flex flex-wrap gap-2">
        <Link href="/" className={linkClasses(current === "home")}>
          Vyhledávání
        </Link>
        <Link href="/recepty" className={linkClasses(current === "recipes")}>
          Recepty
        </Link>
        <ThemeToggle />
      </nav>
    </header>
  );
}
