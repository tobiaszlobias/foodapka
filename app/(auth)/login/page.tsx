"use client";

import Link from "next/link";
import { useState } from "react";
import { createClient } from "@/lib/supabase/client";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const supabase = createClient();

    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      setError(error.message);
      setLoading(false);
      return;
    }

    window.location.href = "/app";
  }

  return (
    <main className="min-h-screen flex items-center justify-center bg-surface dark:bg-black px-4 transition-colors duration-200">
      <div className="w-full max-w-md relative">
        {/* Back to Home Button */}
        <Link 
          href="/" 
          className="absolute -top-12 left-0 flex items-center gap-2 text-zinc-500 hover:text-mnamio-600 transition-colors font-bold text-sm"
        >
          <span className="material-symbols-outlined text-lg">arrow_back</span>
          Domů
        </Link>

        <div className="text-center mb-8">
          <Link href="/" className="text-3xl font-display font-black text-mnamio-600 dark:text-mnamio-400">
            Mnamio
          </Link>
          <p className="mt-2 text-zinc-600 dark:text-zinc-400">Přihlaste se do svého účtu</p>
        </div>

        <form
          onSubmit={handleSubmit}
          className="bg-white dark:bg-zinc-900 rounded-[2rem] p-8 shadow-xl shadow-black/5 dark:shadow-none border border-zinc-100 dark:border-zinc-800"
        >
          {error && (
            <div className="mb-6 rounded-xl bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800/50 px-4 py-3 text-sm text-red-700 dark:text-red-400">
              {error}
            </div>
          )}

          <div className="space-y-5">
            <div>
              <label
                htmlFor="email"
                className="block text-sm font-bold text-zinc-700 dark:text-zinc-300 mb-2"
              >
                Email
              </label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="w-full h-12 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-black px-4 text-zinc-900 dark:text-white outline-none transition focus:border-mnamio-500 focus:ring-2 focus:ring-mnamio-500/20"
                placeholder="vas@email.cz"
              />
            </div>

            <div>
              <div className="flex items-center justify-between mb-2">
                <label
                  htmlFor="password"
                  className="block text-sm font-bold text-zinc-700 dark:text-zinc-300"
                >
                  Heslo
                </label>
                <Link
                  href="/forgot-password"
                  className="text-xs font-bold text-mnamio-600 hover:text-mnamio-700 dark:text-mnamio-400"
                >
                  Zapomenuté heslo?
                </Link>
              </div>
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="w-full h-12 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-black px-4 text-base text-zinc-900 dark:text-white outline-none transition focus:border-mnamio-500 focus:ring-2 focus:ring-mnamio-500/20"
                placeholder="••••••••"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="mt-6 w-full h-12 rounded-xl bg-mnamio-600 text-white font-black transition hover:bg-mnamio-700 shadow-lg shadow-mnamio-600/20 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? "Přihlašování..." : "Přihlásit se"}
          </button>

          <p className="mt-6 text-center text-sm text-zinc-600 dark:text-zinc-400">
            Nemáte účet?{" "}
            <Link
              href="/signup"
              className="font-bold text-mnamio-600 hover:text-mnamio-700 dark:text-mnamio-400"
            >
              Zaregistrujte se
            </Link>
          </p>
        </form>
      </div>
    </main>
  );
}
