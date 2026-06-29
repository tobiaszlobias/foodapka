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
      <div className="w-full max-w-sm text-center rounded-[2rem] border border-foodappka-100 dark:border-zinc-800 bg-white/95 dark:bg-foodappka-950 p-8 shadow-xl shadow-black/5 dark:shadow-none">
        <div className="w-16 h-16 mx-auto mb-5 rounded-full bg-foodappka-100 dark:bg-foodappka-900/50 flex items-center justify-center">
          <span className="material-symbols-outlined text-foodappka-600 dark:text-foodappka-400 text-3xl">
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
          className="inline-flex w-full items-center justify-center h-12 rounded-full bg-foodappka-600 text-white font-black hover:bg-foodappka-700 transition shadow-lg shadow-foodappka-600/20 active:scale-95"
        >
          Přihlásit se
        </Link>
        <p className="mt-4 text-sm text-zinc-500 dark:text-zinc-400">
          Nemáte účet?{" "}
          <Link
            href="/signup"
            className="font-bold text-foodappka-600 hover:text-foodappka-700 dark:text-foodappka-400"
          >
            Zaregistrujte se
          </Link>
        </p>
      </div>
    </div>
  );
}
