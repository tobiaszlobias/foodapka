"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

export default function HelpModal() {
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    const handleOpen = () => setIsOpen(true);
    window.addEventListener("open-help", handleOpen);
    return () => window.removeEventListener("open-help", handleOpen);
  }, []);

  // Prevent scrolling when modal is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "unset";
    }
    return () => {
      document.body.style.overflow = "unset";
    };
  }, [isOpen]);

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 md:p-6 overflow-y-auto">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setIsOpen(false)}
            className="fixed inset-0 bg-zinc-950/40 backdrop-blur-md"
          />

          {/* Modal Container */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 40 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 40 }}
            className="relative w-full max-w-2xl overflow-hidden rounded-[2.5rem] bg-white dark:bg-zinc-900 shadow-[0_32px_80px_-20px_rgba(0,0,0,0.3)] border border-white dark:border-zinc-800"
          >
            {/* Visual Decoration */}
            <div className="absolute -top-24 -right-24 w-64 h-64 bg-foodappka-500/10 dark:bg-foodappka-500/5 rounded-full blur-3xl pointer-events-none" />
            <div className="absolute -bottom-24 -left-24 w-64 h-64 bg-lime-500/10 dark:bg-lime-500/5 rounded-full blur-3xl pointer-events-none" />

            <div className="relative p-8 md:p-12">
              {/* Header */}
              <div className="flex items-start justify-between mb-10">
                <div className="space-y-2">
                  <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-foodappka-100 dark:bg-foodappka-900/40 text-foodappka-700 dark:text-foodappka-300 text-[10px] font-black uppercase tracking-widest border border-foodappka-200 dark:border-foodappka-800">
                    <span className="w-1.5 h-1.5 rounded-full bg-foodappka-500 animate-pulse" />
                    Centrum pomoci
                  </div>
                  <h2 className="text-3xl md:text-4xl font-black text-zinc-950 dark:text-white leading-tight">
                    Jak ovládnout <br />
                    <span className="text-foodappka-600 dark:text-foodappka-400">Foodapku?</span>
                  </h2>
                </div>
                <button
                  onClick={() => setIsOpen(false)}
                  className="flex h-12 w-12 items-center justify-center rounded-full bg-zinc-100 dark:bg-zinc-800 text-zinc-500 hover:bg-zinc-200 dark:hover:bg-zinc-700 transition-all active:scale-90 border border-zinc-200 dark:border-zinc-700"
                >
                  <span className="material-symbols-outlined">close</span>
                </button>
              </div>

              {/* Grid of help items */}
              <div className="grid gap-4">
                <div className="group flex gap-5 p-6 rounded-[2rem] bg-zinc-50 dark:bg-zinc-800/40 border border-zinc-100 dark:border-zinc-800 transition-all hover:bg-white dark:hover:bg-zinc-800 hover:shadow-xl hover:shadow-black/5 dark:hover:shadow-none">
                  <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-white dark:bg-zinc-900 shadow-sm border border-zinc-100 dark:border-zinc-700 text-foodappka-600 dark:text-foodappka-400 group-hover:scale-110 transition-transform">
                    <span className="material-symbols-outlined text-2xl" style={{ fontVariationSettings: "'FILL' 1" }}>search</span>
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-zinc-950 dark:text-white mb-1 leading-none">Chytré vyhledávání</h3>
                    <p className="text-sm text-zinc-500 dark:text-zinc-400 leading-relaxed font-medium">
                      Najdeme vám nejlepší akční ceny ze všech obchodů. Kliknutím na "TOP" uvidíte tu nejvýhodnější nabídku dne.
                    </p>
                  </div>
                </div>

                <div className="group flex gap-5 p-6 rounded-[2rem] bg-zinc-50 dark:bg-zinc-800/40 border border-zinc-100 dark:border-zinc-800 transition-all hover:bg-white dark:hover:bg-zinc-800 hover:shadow-xl hover:shadow-black/5 dark:hover:shadow-none">
                  <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-white dark:bg-zinc-900 shadow-sm border border-zinc-100 dark:border-zinc-700 text-foodappka-600 dark:text-foodappka-400 group-hover:scale-110 transition-transform">
                    <span className="material-symbols-outlined text-2xl" style={{ fontVariationSettings: "'FILL' 1" }}>restaurant_menu</span>
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-zinc-950 dark:text-white mb-1 leading-none">AI Recepty</h3>
                    <p className="text-sm text-zinc-500 dark:text-zinc-400 leading-relaxed font-medium">
                      Stačí napsat název jídla nebo jen suroviny. Naše AI sestaví recept a rovnou vám k němu dohledá nejlevnější nákupní košík.
                    </p>
                  </div>
                </div>

                <div className="group flex gap-5 p-6 rounded-[2rem] bg-zinc-50 dark:bg-zinc-800/40 border border-zinc-100 dark:border-zinc-800 transition-all hover:bg-white dark:hover:bg-zinc-800 hover:shadow-xl hover:shadow-black/5 dark:hover:shadow-none">
                  <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-white dark:bg-zinc-900 shadow-sm border border-zinc-100 dark:border-zinc-700 text-foodappka-600 dark:text-foodappka-400 group-hover:scale-110 transition-transform">
                    <span className="material-symbols-outlined text-2xl" style={{ fontVariationSettings: "'FILL' 1" }}>trending_down</span>
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-zinc-950 dark:text-white mb-1 leading-none">Hlídací pes</h3>
                    <p className="text-sm text-zinc-500 dark:text-zinc-400 leading-relaxed font-medium">
                      Sledujte ceny oblíbených položek. Jakmile spadnou pod vaši limitní cenu, okamžitě vás upozorníme oznámením.
                    </p>
                  </div>
                </div>
              </div>

              {/* Footer Button */}
              <div className="mt-12">
                <button
                  onClick={() => setIsOpen(false)}
                  className="w-full py-5 rounded-[1.5rem] bg-zinc-950 dark:bg-white text-white dark:text-zinc-950 font-black text-sm uppercase tracking-[0.2em] hover:scale-[1.02] active:scale-95 transition-all shadow-2xl"
                >
                  Všechno jasné!
                </button>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
