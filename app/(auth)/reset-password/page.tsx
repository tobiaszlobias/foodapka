"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";

export default function ResetPasswordPage() {
  const [password, setPassword] = useState("");
  const [passwordConfirm, setPasswordConfirm] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [sessionReady, setSessionReady] = useState(false);

  useEffect(() => {
    const supabase = createClient();
    // Recovery link přihlásí uživatele dočasnou session — počkáme, až bude k dispozici
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSessionReady(!!session);
    });
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
      if (event === "PASSWORD_RECOVERY" || event === "SIGNED_IN") {
        setSessionReady(true);
      }
    });
    return () => subscription.unsubscribe();
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (password.length < 6) {
      setError("Heslo musí mít alespoň 6 znaků.");
      return;
    }
    if (password !== passwordConfirm) {
      setError("Hesla se neshodují.");
      return;
    }

    setLoading(true);
    const supabase = createClient();
    const { error } = await supabase.auth.updateUser({ password });

    if (error) {
      setError(error.message);
      setLoading(false);
      return;
    }

    window.location.href = "/app";
  }

  return (
    <main className="min-h-screen flex items-center justify-center bg-surface dark:bg-black px-4 transition-colors duration-200">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <Link href="/" className="text-3xl font-display font-black text-mnamio-600 dark:text-mnamio-400">
            Mnamio
          </Link>
          <p className="mt-2 text-zinc-600 dark:text-zinc-400">Nastavte si nové heslo</p>
        </div>

        <div className="bg-white dark:bg-zinc-900 rounded-[2rem] p-8 shadow-xl shadow-black/5 dark:shadow-none border border-zinc-100 dark:border-zinc-800">
          {!sessionReady ? (
            <div className="text-center py-4">
              <p className="text-sm text-zinc-600 dark:text-zinc-400 mb-4">
                Ověřuji odkaz pro obnovu hesla… Pokud se nic nestane, odkaz mohl vypršet.
              </p>
              <Link
                href="/forgot-password"
                className="font-bold text-mnamio-600 hover:text-mnamio-700 dark:text-mnamio-400 text-sm"
              >
                Poslat nový odkaz
              </Link>
            </div>
          ) : (
            <form onSubmit={handleSubmit}>
              {error && (
                <div className="mb-6 rounded-xl bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800/50 px-4 py-3 text-sm text-red-700 dark:text-red-400">
                  {error}
                </div>
              )}

              <div className="space-y-5">
                <div>
                  <label
                    htmlFor="password"
                    className="block text-sm font-bold text-zinc-700 dark:text-zinc-300 mb-2"
                  >
                    Nové heslo
                  </label>
                  <input
                    id="password"
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    minLength={6}
                    className="w-full h-12 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-black px-4 text-zinc-900 dark:text-white outline-none transition focus:border-mnamio-500 focus:ring-2 focus:ring-mnamio-500/20"
                    placeholder="••••••••"
                  />
                </div>

                <div>
                  <label
                    htmlFor="password-confirm"
                    className="block text-sm font-bold text-zinc-700 dark:text-zinc-300 mb-2"
                  >
                    Nové heslo znovu
                  </label>
                  <input
                    id="password-confirm"
                    type="password"
                    value={passwordConfirm}
                    onChange={(e) => setPasswordConfirm(e.target.value)}
                    required
                    minLength={6}
                    className="w-full h-12 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-black px-4 text-zinc-900 dark:text-white outline-none transition focus:border-mnamio-500 focus:ring-2 focus:ring-mnamio-500/20"
                    placeholder="••••••••"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="mt-6 w-full h-12 rounded-xl bg-mnamio-600 text-white font-black transition hover:bg-mnamio-700 shadow-lg shadow-mnamio-600/20 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? "Ukládám..." : "Nastavit nové heslo"}
              </button>
            </form>
          )}
        </div>
      </div>
    </main>
  );
}
