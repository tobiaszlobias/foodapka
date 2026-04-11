"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import { getStoreIcon } from "@/lib/food";
import { getStoreLogoPath } from "@/lib/storeLogos";
import { normalizeText } from "@/lib/food";

export function StoreBrand({ shopName, small = false }: { shopName: string; small?: boolean }) {
  const logoPath = getStoreLogoPath(shopName);
  const isLidl = normalizeText(shopName).includes("lidl");
  const isAlbert = normalizeText(shopName).includes("albert");

  if (logoPath) {
    return (
      <span className="inline-flex items-center justify-center">
        <Image
          src={logoPath}
          alt={`${shopName} logo`}
          width={isLidl || isAlbert ? 140 : 80}
          height={isLidl || isAlbert ? 140 : 80}
          className={`${
            small 
              ? (isLidl || isAlbert ? "h-11 w-11" : "h-9 w-9") 
              : (isLidl || isAlbert ? "h-24 w-24 md:h-32 md:w-32" : "h-14 w-14 md:h-20 md:w-20")
          } object-contain`}
        />
      </span>
    );
  }

  return (
    <div className="flex items-center gap-2">
      <span className={small ? "text-sm" : "text-xl"}>{getStoreIcon(shopName)}</span>
      <span className={`font-bold text-zinc-800 dark:text-zinc-200 ${small ? "text-[11px]" : "text-base md:text-lg"}`}>
        {shopName}
      </span>
    </div>
  );
}

export function SearchLoadingAnimation({ progress }: { progress?: number }) {
  const [currentShop, setCurrentShop] = useState(0);
  const [fakeProgress, setFakeProgress] = useState(0);
  const shops = ["Lidl", "Albert", "Kaufland", "Tesco", "Penny", "Billa"];

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentShop((prev) => (prev + 1) % shops.length);
    }, 800);
    return () => clearInterval(timer);
  }, [shops.length]);

  // "Realistic" fake progress logic if no real progress is provided
  useEffect(() => {
    if (progress !== undefined) return;

    // Start with a jump
    setFakeProgress(15);

    const interval = setInterval(() => {
      setFakeProgress(prev => {
        if (prev < 40) return prev + Math.random() * 10;
        if (prev < 85) return prev + Math.random() * 2;
        if (prev < 98) return prev + 0.1; // Slow down at the end
        return prev;
      });
    }, 400);

    return () => clearInterval(interval);
  }, [progress]);

  const displayProgress = progress !== undefined ? progress : fakeProgress;

  return (
    <div className="flex flex-col items-center justify-center py-10 px-4 text-center overflow-hidden relative">
      <div className="space-y-4 w-full max-w-xs mx-auto">
        <div className="flex flex-col items-center gap-4">
          <div className="flex items-center gap-2 text-foodappka-600 font-black px-6 py-2 bg-foodappka-50 dark:bg-foodappka-900/30 rounded-full text-sm shadow-sm border border-foodappka-100 dark:border-foodappka-800 animate-pulse">
            <span className="material-symbols-outlined text-sm animate-spin">sync</span>
            <span>Prohledáváme {shops[currentShop]}...</span>
          </div>
          <div className="space-y-1">
            <p className="text-xs text-zinc-500 dark:text-zinc-400 font-bold leading-relaxed">
              Hlídací pes čmuchá nejlepší akční nabídky z milionu položek...
            </p>
            <p className="text-[10px] text-foodappka-600 font-black tracking-widest uppercase">
              {Math.round(displayProgress)}% HOTOVO
            </p>
          </div>
        </div>

        {/* Modern Progress Track */}
        <div className="mt-6 w-full h-2 bg-zinc-100 dark:bg-zinc-800 rounded-full overflow-hidden p-0.5 border border-zinc-200/50 dark:border-zinc-700/50">
          <div 
            className="h-full bg-gradient-to-r from-foodappka-400 to-foodappka-600 rounded-full transition-all duration-500 ease-out" 
            style={{ width: `${displayProgress}%` }}
          />
        </div>
      </div>
    </div>
  );
}

export function LoadingCards() {
  return (
    <div className="grid gap-4">
      {Array.from({ length: 3 }).map((_, index) => (
        <article
          key={index}
          className="overflow-hidden rounded-2xl border border-foodappka-100 dark:border-zinc-800 bg-white/90 dark:bg-foodappka-950 p-5 shadow-sm"
        >
          <div className="animate-pulse space-y-4">
            <div className="h-6 w-2/3 rounded-full bg-foodappka-100 dark:bg-zinc-800" />
            <div className="h-4 w-40 rounded-full bg-zinc-100 dark:bg-zinc-900" />
            <div className="grid gap-3">
              {Array.from({ length: 2 }).map((_, storeIndex) => (
                <div
                  key={storeIndex}
                  className="h-12 rounded-xl bg-zinc-50 dark:bg-zinc-900/50"
                />
              ))}
            </div>
          </div>
        </article>
      ))}
    </div>
  );
}

export function RecipeSkeleton() {
  return (
    <div className="grid gap-4">
      {Array.from({ length: 3 }).map((_, index) => (
        <div
          key={index}
          className="animate-pulse rounded-2xl border border-foodappka-100 dark:border-zinc-800 bg-white/85 dark:bg-foodappka-950 p-5 shadow-sm"
        >
          <div className="h-5 w-36 rounded-full bg-foodappka-100 dark:bg-zinc-800" />
          <div className="mt-4 h-20 rounded-xl bg-zinc-100 dark:bg-zinc-900" />
        </div>
      ))}
    </div>
  );
}

export function EmptyState({ hasSearched, title, description, icon }: { 
  hasSearched: boolean; 
  title?: string;
  description?: string;
  icon?: string;
}) {
  return (
    <div className="rounded-2xl border border-dashed border-foodappka-200 dark:border-zinc-800 bg-white/70 dark:bg-foodappka-950 px-6 py-12 text-center shadow-sm">
      <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-full bg-foodappka-100 dark:bg-zinc-800 text-3xl">
        {icon || (hasSearched ? "🧺" : "🥬")}
      </div>
      <h2 className="text-lg font-semibold text-foodappka-950 dark:text-white">
        {title || (hasSearched ? "Nic jsme nenašli" : "Začněte hledat")}
      </h2>
      <p className="mx-auto mt-3 max-w-xs text-sm leading-relaxed text-zinc-600 dark:text-zinc-400">
        {description || (hasSearched 
          ? "Zkuste jiný název nebo obecnější výraz." 
          : "Zadejte název potraviny a foodappka vám ukáže nejlepší akční ceny.")}
      </p>
    </div>
  );
}
