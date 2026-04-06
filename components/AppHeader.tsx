"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import ThemeToggle from "@/components/ThemeToggle";
import { createClient } from "@/lib/supabase/client";
import type { User } from "@supabase/supabase-js";

export default function AppHeader() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const supabase = createClient();
    
    supabase.auth.getUser().then(({ data: { user } }) => {
      setUser(user);
      setLoading(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        setUser(session?.user ?? null);
      }
    );

    return () => subscription.unsubscribe();
  }, []);

  async function handleLogout() {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/");
    router.refresh();
  }

  return (
    <nav className="fixed top-0 w-full z-50 bg-emerald-50/80 backdrop-blur-xl shadow-sm">
      <div className="flex justify-between items-center px-8 py-4 max-w-[1800px] mx-auto">
        <div className="flex items-center gap-8">
          <Link href="/" className="text-2xl font-bold tracking-tight text-emerald-700">
            foodapka
          </Link>
          <div className="hidden md:flex items-center gap-6">
            <Link
              href="/app"
              className="text-emerald-700 font-bold border-b-2 border-emerald-600"
            >
              Aplikace
            </Link>
            <Link
              href="/"
              className="text-zinc-500 hover:text-emerald-600 transition-colors"
            >
              O projektu
            </Link>
          </div>
        </div>
        
        <div className="flex items-center gap-4">
          <button className="hover:bg-emerald-100/50 rounded-full transition-all p-2 active:scale-95 duration-200">
            <span className="material-symbols-outlined text-emerald-600">notifications</span>
          </button>
          <button className="hover:bg-emerald-100/50 rounded-full transition-all p-2 active:scale-95 duration-200">
            <span className="material-symbols-outlined text-emerald-600">favorite</span>
          </button>
          <button className="hover:bg-emerald-100/50 rounded-full transition-all p-2 active:scale-95 duration-200">
            <span className="material-symbols-outlined text-emerald-600">shopping_cart</span>
          </button>
          <ThemeToggle />
          
          {!loading && (
            user ? (
              <div className="flex items-center gap-3 ml-2">
                <div className="w-9 h-9 rounded-full bg-emerald-600 flex items-center justify-center text-white font-semibold text-sm">
                  {user.email?.charAt(0).toUpperCase()}
                </div>
                <button
                  onClick={handleLogout}
                  className="text-sm text-zinc-500 hover:text-emerald-600 transition-colors"
                >
                  Odhlásit
                </button>
              </div>
            ) : (
              <Link
                href="/login"
                className="ml-2 px-5 py-2 rounded-full bg-emerald-600 text-white font-semibold text-sm hover:bg-emerald-700 transition-colors"
              >
                Přihlásit
              </Link>
            )
          )}
        </div>
      </div>
    </nav>
  );
}
