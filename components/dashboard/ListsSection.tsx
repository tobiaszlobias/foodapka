"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { EmptyState } from "./DashboardShared";

export default function ListsSection({ user, onAddClick }: { user: any; onAddClick?: () => void }) {
  const supabase = createClient();
  const [lists, setLists] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      loadLists();
    } else {
      setLoading(false);
    }
  }, [user]);

  async function loadLists() {
    setLoading(true);
    const { data, error } = await supabase
      .from("shopping_lists")
      .select("*")
      .order("created_at", { ascending: false });

    if (data && !error) {
      setLists(data);
    }
    setLoading(false);
  }

  async function deleteList(id: string) {
    const { error } = await supabase.from("shopping_lists").delete().eq("id", id);
    if (!error) {
      setLists(lists.filter(l => l.id !== id));
    }
  }

  if (!user) {
    return (
      <div className="space-y-6">
        <header className="mb-6 px-1 text-left">
          <h1 className="text-3xl md:text-5xl font-extrabold tracking-tight text-foodapka-950 dark:text-white mb-2">
            Seznamy 📝
          </h1>
          <p className="text-sm md:text-lg text-zinc-600 dark:text-zinc-400">
            Přihlaste se pro ukládání seznamů.
          </p>
        </header>
        <EmptyState 
          hasSearched={false} 
          title="Nejste přihlášeni" 
          description="Uložené seznamy uvidíte po přihlášení ke svému účtu."
          icon="🔐"
        />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <header className="mb-6 px-1 text-left">
        <h1 className="text-3xl md:text-5xl font-extrabold tracking-tight text-foodapka-950 dark:text-white mb-2">
          Moje seznamy 📝
        </h1>
        <p className="text-sm md:text-lg text-zinc-600 dark:text-zinc-400">
          Tady najdete všechny své uložené nákupy.
        </p>
      </header>

      <div className="flex gap-4 px-1 md:px-2">
        <button 
          onClick={onAddClick}
          className="inline-flex items-center gap-2 rounded-full bg-foodapka-500 px-5 py-2.5 font-semibold text-white transition hover:bg-foodapka-600 text-sm shadow-md active:scale-95"
        >
          <span className="material-symbols-outlined text-lg">add</span>
          Nový seznam
        </button>
      </div>

      {loading ? (
        <div className="grid gap-4">
          {[1, 2].map(i => (
            <div key={i} className="h-32 rounded-2xl bg-zinc-100 dark:bg-zinc-900 animate-pulse" />
          ))}
        </div>
      ) : lists.length > 0 ? (
        <div className="grid gap-4">
          {lists.map((list) => (
            <div key={list.id} className="rounded-2xl border border-foodapka-100 dark:border-zinc-800 bg-white dark:bg-foodapka-950 p-5 shadow-sm">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h3 className="font-bold text-lg text-zinc-900 dark:text-white">{list.recipe_name}</h3>
                  <p className="text-xs text-zinc-500 dark:text-zinc-400">
                    {new Date(list.created_at).toLocaleDateString('cs-CZ')} • {list.items.length} položek
                  </p>
                </div>
                <button 
                  onClick={() => deleteList(list.id)}
                  className="text-zinc-400 hover:text-red-500 transition-colors"
                >
                  <span className="material-symbols-outlined text-xl">delete</span>
                </button>
              </div>
              
              <div className="flex flex-wrap gap-2 mb-4">
                {list.items.slice(0, 4).map((item: any, idx: number) => (
                  <span key={idx} className="px-2 py-1 rounded-lg bg-zinc-50 dark:bg-zinc-900 text-[10px] font-bold text-zinc-600 dark:text-zinc-400 border border-zinc-100 dark:border-zinc-800">
                    {item.ingredient}
                  </span>
                ))}
                {list.items.length > 4 && (
                  <span className="px-2 py-1 rounded-lg bg-zinc-50 dark:bg-zinc-900 text-[10px] font-bold text-zinc-400">
                    +{list.items.length - 4}
                  </span>
                )}
              </div>

              <div className="flex items-center justify-between pt-4 border-t border-zinc-50 dark:border-zinc-800">
                <span className="text-xl font-black text-foodapka-700 dark:text-foodapka-400">
                  {list.total_price?.toFixed(2).replace('.', ',')} Kč
                </span>
                <button className="px-4 py-2 rounded-full bg-foodapka-50 dark:bg-zinc-900 text-xs font-bold text-foodapka-800 dark:text-foodapka-300">
                  Zobrazit detail
                </button>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <EmptyState 
          hasSearched={true} 
          title="Zatím žádné seznamy" 
          description="Najděte si recept, klikněte na 'Najít ceny' a pak si seznam uložte."
          icon="📋"
        />
      )}
    </div>
  );
}
