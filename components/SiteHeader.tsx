import Link from "next/link";
import ThemeToggle from "@/components/ThemeToggle";

type SiteHeaderProps = {
  current?: "home" | "recipes";
};

export default function SiteHeader({ current = "home" }: SiteHeaderProps) {
  return (
    <header className="flex items-center justify-between">
      <Link
        href="/"
        className="text-lg font-semibold tracking-tight text-foodappka-950"
      >
        foodappka
      </Link>
      <div className="flex items-center gap-3">
        <span className="rounded-full bg-foodappka-100 px-3 py-1.5 text-xs font-medium text-foodappka-700">
          {current === "home" ? "Vyhledávání" : "Recepty"}
        </span>
        <ThemeToggle />
      </div>
    </header>
  );
}
