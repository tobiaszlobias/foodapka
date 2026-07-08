"use client";

import Link from "next/link";
import { useState } from "react";
import { createClient } from "@/lib/supabase/client";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [sent, setSent] = useState(false);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const supabase = createClient();
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`,
    });

    setLoading(false);
    if (error) {
      setError(error.message);
      return;
    }
    setSent(true);
  }

  return (
    <main className="min-h-screen flex items-center justify-center bg-surface dark:bg-black px-4 transition-colors duration-200">
      <div className="w-full max-w-md relative">
        <Link
          href="/login"
          className="absolute -top-12 left-0 flex items-center gap-2 text-zinc-500 hover:text-foodappka-600 transition-colors font-bold text-sm"
        >
          <span className="material-symbols-outlined text-lg">arrow_back</span>
          Zpět na přihlášení
        </Link>

        <div className="text-center mb-8">
          <Link href="/" className="text-3xl font-display font-black text-foodappka-600 dark:text-foodappka-400">
            Mnamio
          </Link>
          <p className="mt-2 text-zinc-600 dark:text-zinc-400">Obnova zapomenutého hesla</p>
        </div>

        <div className="bg-white dark:bg-zinc-900 rounded-[2rem] p-8 shadow-xl shadow-black/5 dark:shadow-none border border-zinc-100 dark:border-zinc-800">
          {sent ? (
            <div className="text-center py-4">
              <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-foodappka-100 dark:bg-foodappka-900/50">
                <span className="material-symbols-outlined text-foodappka-600 text-2xl">mark_email_read</span>
              </div>
              <h2 className="text-lg font-black text-zinc-900 dark:text-white mb-2">E-mail odeslán</h2>
              <p className="text-sm text-zinc-600 dark:text-zinc-400">
                Pokud u nás máte účet, poslali jsme vám na <strong>{email}</strong> odkaz pro nastavení nového hesla.
              </p>
            </div>
          ) : (
            <form onSubmit={handleSubmit}>
              {error && (
                <div className="mb-6 rounded-xl bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800/50 px-4 py-3 text-sm text-red-700 dark:text-red-400">
                  {error}
                </div>
              )}

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
                  className="w-full h-12 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-black px-4 text-zinc-900 dark:text-white outline-none transition focus:border-foodappka-500 focus:ring-2 focus:ring-foodappka-500/20"
                  placeholder="vas@email.cz"
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="mt-6 w-full h-12 rounded-xl bg-foodappka-600 text-white font-black transition hover:bg-foodappka-700 shadow-lg shadow-foodappka-600/20 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? "Odesílám..." : "Poslat odkaz pro obnovu"}
              </button>
            </form>
          )}
        </div>
      </div>
    </main>
  );
}
