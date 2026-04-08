"use client";

export default function ListsSection() {
  return (
    <div className="space-y-6">
      <header className="mb-6 md:mb-10 px-1 md:px-2 text-left">
        <h1 className="text-3xl md:text-4xl lg:text-5xl font-extrabold tracking-tight text-foodapka-950 dark:text-white leading-tight mb-2">
          Seznamy 📝
        </h1>
        <p className="text-sm md:text-lg text-zinc-600 dark:text-zinc-400">
          Vytvářejte a spravujte své seznamy.
        </p>
      </header>
      
      <div className="flex gap-4 px-1 md:px-2">
        <button className="inline-flex items-center gap-2 rounded-full bg-foodapka-500 px-5 py-2.5 font-semibold text-white transition hover:bg-foodapka-600 text-sm">
          <span className="material-symbols-outlined text-lg">add</span>
          Nový seznam
        </button>
      </div>
      
      <div className="rounded-2xl border border-dashed border-foodapka-300 dark:border-foodapka-800 bg-white/90 dark:bg-foodapka-950 p-8 text-center shadow-sm">
        <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-foodapka-100 dark:bg-zinc-800 text-3xl">
          📋
        </div>
        <h2 className="text-lg md:text-xl font-semibold text-foodapka-950 dark:text-white mb-2">
          Zatím žádné seznamy
        </h2>
        <p className="text-sm text-zinc-600 dark:text-zinc-400 max-w-xs mx-auto">
          Vytvořte si nový seznam a přidávejte produkty.
        </p>
      </div>
    </div>
  );
}
