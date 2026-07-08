"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

export type ToastMessage = {
  id: string;
  text: string;
  type: "info" | "success" | "error";
};

export default function Toast() {
  const [messages, setMessages] = useState<ToastMessage[]>([]);

  useEffect(() => {
    const handleToast = (e: any) => {
      const { text, type = "info" } = e.detail;
      const id = Math.random().toString(36).substring(2, 9);
      
      setMessages(prev => [...prev, { id, text, type }]);
      
      setTimeout(() => {
        setMessages(prev => prev.filter(m => m.id !== id));
      }, 4000);
    };

    window.addEventListener("show-toast", handleToast);
    return () => window.removeEventListener("show-toast", handleToast);
  }, []);

  return (
    <div className="fixed top-20 right-4 left-4 md:left-auto md:right-8 z-[300] flex flex-col gap-3 items-center md:items-end pointer-events-none">
      <AnimatePresence>
        {messages.map((m) => (
          <motion.div
            key={m.id}
            initial={{ opacity: 0, y: -20, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9, transition: { duration: 0.2 } }}
            className={`
              pointer-events-auto px-6 py-4 rounded-2xl shadow-2xl border backdrop-blur-md flex items-center gap-3 min-w-[280px] max-w-md
              ${m.type === 'error' ? 'bg-red-500/90 border-red-400 text-white' : 
                m.type === 'success' ? 'bg-mnamio-600/90 border-mnamio-500 text-white' : 
                'bg-zinc-900/90 border-zinc-700 text-white dark:bg-white/90 dark:border-zinc-200 dark:text-zinc-950'}
            `}
          >
            <span className="material-symbols-outlined text-xl">
              {m.type === 'error' ? 'error' : m.type === 'success' ? 'check_circle' : 'info'}
            </span>
            <span className="font-bold text-sm tracking-tight">{m.text}</span>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
}

export function showToast(text: string, type: ToastMessage["type"] = "info") {
  window.dispatchEvent(new CustomEvent("show-toast", { detail: { text, type } }));
}
