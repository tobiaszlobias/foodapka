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
      <main className="min-h-screen flex items-center justify-center bg-[radial-gradient(circle_at_top,_rgba(110,231,183,0.18),_transparent_40%),linear-gradient(180deg,_#f5fbf5_0%,_#f8fafc_100%)] px-4">
        <div className="w-full max-w-md text-center">
          <div className="bg-white rounded-[2rem] p-8 shadow-[0_20px_60px_-20px_rgba(16,185,129,0.25)] border border-foodapka-100">
            <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-foodapka-100 flex items-center justify-center">
              <span className="material-symbols-outlined text-foodapka-600 text-3xl">
                mark_email_read
              </span>
            </div>
            <h2 className="text-xl font-bold text-zinc-900 mb-2">
              Ověřte svůj email
            </h2>
            <p className="text-zinc-600 mb-6">
              Poslali jsme vám ověřovací odkaz na <strong>{email}</strong>.
              Klikněte na něj pro dokončení registrace.
            </p>
            <Link
              href="/login"
              className="inline-block px-6 py-3 rounded-xl bg-foodapka-600 text-white font-semibold hover:bg-foodapka-700 transition"
            >
              Zpět na přihlášení
            </Link>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen flex items-center justify-center bg-[radial-gradient(circle_at_top,_rgba(110,231,183,0.18),_transparent_40%),linear-gradient(180deg,_#f5fbf5_0%,_#f8fafc_100%)] px-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <Link href="/" className="text-3xl font-bold text-foodapka-700">
            foodapka
          </Link>
          <p className="mt-2 text-zinc-600">Vytvořte si účet zdarma</p>
        </div>

        <form
          onSubmit={handleSubmit}
          className="bg-white rounded-[2rem] p-8 shadow-[0_20px_60px_-20px_rgba(16,185,129,0.25)] border border-foodapka-100"
        >
          {error && (
            <div className="mb-6 rounded-xl bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">
              {error}
            </div>
          )}

          <div className="space-y-5">
            <div>
              <label
                htmlFor="email"
                className="block text-sm font-medium text-zinc-700 mb-2"
              >
                Email
              </label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="w-full h-12 rounded-xl border border-zinc-200 bg-zinc-50 px-4 text-zinc-900 outline-none transition focus:border-foodapka-500 focus:bg-white focus:ring-2 focus:ring-foodapka-500/20"
                placeholder="vas@email.cz"
              />
            </div>

            <div>
              <label
                htmlFor="password"
                className="block text-sm font-medium text-zinc-700 mb-2"
              >
                Heslo
              </label>
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="w-full h-12 rounded-xl border border-zinc-200 bg-zinc-50 px-4 text-zinc-900 outline-none transition focus:border-foodapka-500 focus:bg-white focus:ring-2 focus:ring-foodapka-500/20"
                placeholder="Minimálně 6 znaků"
              />
            </div>

            <div>
              <label
                htmlFor="confirmPassword"
                className="block text-sm font-medium text-zinc-700 mb-2"
              >
                Potvrďte heslo
              </label>
              <input
                id="confirmPassword"
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
                className="w-full h-12 rounded-xl border border-zinc-200 bg-zinc-50 px-4 text-zinc-900 outline-none transition focus:border-foodapka-500 focus:bg-white focus:ring-2 focus:ring-foodapka-500/20"
                placeholder="Zopakujte heslo"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="mt-6 w-full h-12 rounded-xl bg-foodapka-600 text-white font-semibold transition hover:bg-foodapka-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? "Vytváření účtu..." : "Vytvořit účet"}
          </button>

          <p className="mt-6 text-center text-sm text-zinc-600">
            Už máte účet?{" "}
            <Link
              href="/login"
              className="font-semibold text-foodapka-600 hover:text-foodapka-700"
            >
              Přihlaste se
            </Link>
          </p>
        </form>
      </div>
    </main>
  );
}
