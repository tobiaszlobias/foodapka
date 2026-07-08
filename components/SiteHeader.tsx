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
        className="text-lg font-semibold tracking-tight text-mnamio-950"
      >
        Mnamio
      </Link>
      <div className="flex items-center gap-3">
        <span className="rounded-full bg-mnamio-100 px-3 py-1.5 text-xs font-medium text-mnamio-700">
          {current === "home" ? "Vyhledávání" : "Recepty"}
        </span>
        <ThemeToggle />
      </div>
    </header>
  );
}
