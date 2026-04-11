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
  const [showUserMenu, setShowUserMenu] = useState(false);

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
    setShowUserMenu(false);
    router.push("/");
    router.refresh();
  }

  return (
    <nav className="fixed top-0 w-full z-50 h-16 bg-foodapka-50/80 dark:bg-foodapka-950/90 backdrop-blur-xl border-b border-foodapka-100 dark:border-foodapka-900/50">
      <div className="flex justify-between items-center px-4 md:px-8 py-2 max-w-[1800px] mx-auto h-full">
        <div className="flex items-center gap-4 md:gap-8">
          <Link href="/" className="text-xl md:text-2xl font-asset tracking-tight text-foodapka-700 dark:text-foodapka-400">
            foodapka
          </Link>
        </div>
        
        <div className="flex items-center gap-2 md:gap-4">
          <div className="hidden sm:flex items-center gap-2 md:gap-4">
            <Link 
              href="/app?mode=notifications"
              className="flex h-10 w-10 items-center justify-center hover:bg-foodapka-100/50 dark:hover:bg-foodapka-800/50 rounded-full transition-all active:scale-95 duration-200"
              title="Oznámení"
            >
              <span className="material-symbols-outlined text-foodapka-600 dark:text-foodapka-400">notifications</span>
            </Link>
            <Link 
              href="/app?mode=favorites"
              className="flex h-10 w-10 items-center justify-center hover:bg-foodapka-100/50 dark:hover:bg-foodapka-800/50 rounded-full transition-all active:scale-95 duration-200"
              title="Oblíbené"
            >
              <span className="material-symbols-outlined text-foodapka-600 dark:text-foodapka-400">favorite</span>
            </Link>
          </div>
          
          <ThemeToggle />
          
          {!loading && (
            user ? (
              <div className="relative ml-1 md:ml-2">
                <button 
                  onClick={() => setShowUserMenu(!showUserMenu)}
                  className="w-10 h-10 rounded-full bg-foodapka-500 flex items-center justify-center text-white font-black text-sm hover:ring-2 hover:ring-foodapka-300 transition-all active:scale-95 shadow-sm"
                >
                  {user.email?.charAt(0).toUpperCase()}
                </button>
                
                {showUserMenu && (
                  <>
                    <div 
                      className="fixed inset-0 z-10" 
                      onClick={() => setShowUserMenu(false)}
                    />
                    <div className="absolute right-0 mt-2 w-48 rounded-2xl bg-white dark:bg-zinc-900 shadow-xl border border-zinc-100 dark:border-zinc-800 py-2 z-20 animate-in fade-in zoom-in-95 duration-100">
                      <div className="px-4 py-2 border-b border-zinc-100 dark:border-zinc-800 mb-1">
                        <p className="text-xs font-bold text-zinc-400 uppercase tracking-widest">Můj účet</p>
                        <p className="text-sm font-bold text-zinc-900 dark:text-white truncate">{user.email}</p>
                      </div>
                      <Link 
                        href="/app/settings" 
                        onClick={() => setShowUserMenu(false)}
                        className="flex items-center gap-3 px-4 py-2 text-sm text-zinc-600 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-colors"
                      >
                        <span className="material-symbols-outlined text-lg">settings</span>
                        <span>Nastavení</span>
                      </Link>
                      <Link 
                        href="/app?mode=lists" 
                        onClick={() => setShowUserMenu(false)}
                        className="flex items-center gap-3 px-4 py-2 text-sm text-zinc-600 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-colors"
                      >
                        <span className="material-symbols-outlined text-lg">receipt_long</span>
                        <span>Moje seznamy</span>
                      </Link>
                      <button
                        onClick={handleLogout}
                        className="w-full flex items-center gap-3 px-4 py-2 text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors text-left"
                      >
                        <span className="material-symbols-outlined text-lg">logout</span>
                        <span>Odhlásit</span>
                      </button>
                    </div>
                  </>
                )}
              </div>
            ) : (
              <Link
                href="/login"
                className="ml-1 md:ml-2 px-4 md:px-5 py-1.5 md:py-2 rounded-full bg-foodapka-500 text-white font-semibold text-xs md:text-sm hover:bg-foodapka-600 transition-colors"
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
