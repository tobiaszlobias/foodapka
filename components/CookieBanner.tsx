"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";

export default function CookieBanner() {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const consent = localStorage.getItem("cookie_consent");
    if (!consent) {
      setIsVisible(true);
    }
  }, []);

  const handleAccept = () => {
    localStorage.setItem("cookie_consent", "accepted");
    setIsVisible(false);
  };

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ opacity: 0, y: 50, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 20, scale: 0.95 }}
          className="fixed bottom-4 left-4 right-4 md:left-auto md:right-8 md:max-w-md z-[200]"
        >
          <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-3xl p-6 shadow-2xl shadow-black/10 backdrop-blur-xl">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 rounded-2xl bg-mnamio-100 dark:bg-mnamio-900/50 flex items-center justify-center shrink-0">
                <span className="material-symbols-outlined text-mnamio-600 dark:text-mnamio-400">cookie</span>
              </div>
              <div className="flex-1">
                <h3 className="font-bold text-zinc-900 dark:text-white mb-1">Ochrana soukromí</h3>
                <p className="text-xs md:text-sm text-zinc-600 dark:text-zinc-400 leading-relaxed">
                  Foodappka využívá technické cookies a lokální úložiště k ukládání vašich nákupních preferencí a pro zajištění správného fungování aplikace. Pokračováním v používání s tímto souhlasíte.
                </p>
              </div>
            </div>
            <div className="mt-6 flex justify-end">
              <button
                onClick={handleAccept}
                className="bg-mnamio-600 hover:bg-mnamio-700 text-white px-6 py-2.5 rounded-full font-bold text-sm transition-all shadow-md shadow-mnamio-600/20 active:scale-95"
              >
                Rozumím
              </button>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
