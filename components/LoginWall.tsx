"use client";

import Link from "next/link";

type LoginWallProps = {
  title?: string;
  description: string;
  icon?: string;
};

export default function LoginWall({
  title = "Tato funkce je jen pro přihlášené",
  description,
  icon = "lock",
}: LoginWallProps) {
  return (
    <div className="py-16 md:py-24 flex items-center justify-center px-4">
      <div className="w-full max-w-sm text-center rounded-[2rem] border border-mnamio-100 dark:border-zinc-800 bg-white/95 dark:bg-mnamio-950 p-8 shadow-xl shadow-black/5 dark:shadow-none">
        <div className="w-16 h-16 mx-auto mb-5 rounded-full bg-mnamio-100 dark:bg-mnamio-900/50 flex items-center justify-center">
          <span className="material-symbols-outlined text-mnamio-600 dark:text-mnamio-400 text-3xl">
            {icon}
          </span>
        </div>

        <h2 className="text-xl font-display font-black text-zinc-900 dark:text-white mb-2">
          {title}
        </h2>
        <p className="text-sm text-zinc-600 dark:text-zinc-400 mb-7 leading-relaxed">
          {description}
        </p>

        <Link
          href="/login"
          className="inline-flex w-full items-center justify-center h-12 rounded-full bg-mnamio-600 text-white font-black hover:bg-mnamio-700 transition shadow-lg shadow-mnamio-600/20 active:scale-95"
        >
          Přihlásit se
        </Link>
        <p className="mt-4 text-sm text-zinc-500 dark:text-zinc-400">
          Nemáte účet?{" "}
          <Link
            href="/signup"
            className="font-bold text-mnamio-600 hover:text-mnamio-700 dark:text-mnamio-400"
          >
            Zaregistrujte se
          </Link>
        </p>
      </div>
    </div>
  );
}
