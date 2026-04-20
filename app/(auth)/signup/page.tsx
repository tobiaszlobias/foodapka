"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { createClient } from "@/lib/supabase/client";

export default function SignupPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (password !== confirmPassword) {
      setError("Hesla se neshodují");
      return;
    }

    if (password.length < 6) {
      setError("Heslo musí mít alespoň 6 znaků");
      return;
    }

    setLoading(true);

    const supabase = createClient();

    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: `${window.location.origin}/app`,
      },
    });

    if (error) {
      setError(error.message);
      setLoading(false);
      return;
    }

    setSuccess(true);
    setLoading(false);
  }

  if (success) {
    return (
      <main className="min-h-screen flex items-center justify-center bg-surface dark:bg-black px-4 transition-colors duration-200">
        <div className="w-full max-w-md text-center">
          <div className="bg-white dark:bg-zinc-900 rounded-[2rem] p-8 shadow-xl shadow-black/5 dark:shadow-none border border-zinc-100 dark:border-zinc-800">
            <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-foodappka-100 dark:bg-foodappka-900/50 flex items-center justify-center">
              <span className="material-symbols-outlined text-foodappka-600 dark:text-foodappka-400 text-3xl">
                mark_email_read
              </span>
            </div>
            <h2 className="text-xl font-display font-black text-zinc-900 dark:text-white mb-2">
              Ověřte svůj email
            </h2>
            <p className="text-zinc-600 dark:text-zinc-400 mb-6 text-sm">
              Poslali jsme vám ověřovací odkaz na <strong>{email}</strong>.
              Klikněte na něj pro dokončení registrace.
            </p>
            <Link
              href="/login"
              className="inline-block px-8 py-3 rounded-xl bg-foodappka-600 text-white font-black hover:bg-foodappka-700 transition shadow-lg shadow-foodappka-600/20 active:scale-95"
            >
              Zpět na přihlášení
            </Link>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen flex items-center justify-center bg-surface dark:bg-black px-4 transition-colors duration-200">
      <div className="w-full max-w-md relative">
        {/* Back to Home Button */}
        <Link 
          href="/" 
          className="absolute -top-12 left-0 flex items-center gap-2 text-zinc-500 hover:text-foodappka-600 transition-colors font-bold text-sm"
        >
          <span className="material-symbols-outlined text-lg">arrow_back</span>
          Domů
        </Link>

        <div className="text-center mb-8">
          <Link href="/" className="text-3xl font-display font-black text-foodappka-600 dark:text-foodappka-400">
            foodappka
          </Link>
          <p className="mt-2 text-zinc-600 dark:text-zinc-400">Vytvořte si účet zdarma</p>
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
                className="w-full h-12 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-black px-4 text-zinc-900 dark:text-white outline-none transition focus:border-foodappka-500 focus:ring-2 focus:ring-foodappka-500/20"
                placeholder="vas@email.cz"
              />
            </div>

            <div>
              <label
                htmlFor="password"
                className="block text-sm font-bold text-zinc-700 dark:text-zinc-300 mb-2"
              >
                Heslo
              </label>
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="w-full h-12 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-black px-4 text-base text-zinc-900 dark:text-white outline-none transition focus:border-foodappka-500 focus:ring-2 focus:ring-foodappka-500/20"
                placeholder="Minimálně 6 znaků"
              />
            </div>

            <div>
              <label
                htmlFor="confirmPassword"
                className="block text-sm font-bold text-zinc-700 dark:text-zinc-300 mb-2"
              >
                Potvrďte heslo
              </label>
              <input
                id="confirmPassword"
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
                className="w-full h-12 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-black px-4 text-zinc-900 dark:text-white outline-none transition focus:border-foodappka-500 focus:ring-2 focus:ring-foodappka-500/20"
                placeholder="Zopakujte heslo"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="mt-6 w-full h-12 rounded-xl bg-foodappka-600 text-white font-black transition hover:bg-foodappka-700 shadow-lg shadow-foodappka-600/20 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? "Vytváření účtu..." : "Vytvořit účet"}
          </button>

          <p className="mt-6 text-center text-sm text-zinc-600 dark:text-zinc-400">
            Už máte účet?{" "}
            <Link
              href="/login"
              className="font-bold text-foodappka-600 hover:text-foodappka-700 dark:text-foodappka-400"
            >
              Přihlaste se
            </Link>
          </p>
        </form>
      </div>
    </main>
  );
}
