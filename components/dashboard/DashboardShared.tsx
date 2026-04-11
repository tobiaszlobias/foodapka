"use client";

import Image from "next/image";
import { getStoreIcon } from "@/lib/food";
import { getStoreLogoPath } from "@/lib/storeLogos";
import { normalizeText } from "@/lib/food";

export function StoreBrand({ shopName, small = false }: { shopName: string; small?: boolean }) {
  const logoPath = getStoreLogoPath(shopName);
  const isLidl = normalizeText(shopName).includes("lidl");

  if (logoPath) {
    return (
      <span className="inline-flex items-center justify-center">
        <Image
          src={logoPath}
          alt={`${shopName} logo`}
          width={isLidl ? 100 : 80}
          height={isLidl ? 100 : 80}
          className={`${
            small 
              ? (isLidl ? "h-10 w-10" : "h-9 w-9") 
              : (isLidl ? "h-16 w-16 md:h-24 md:w-24" : "h-14 w-14 md:h-20 md:w-20")
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

export function SearchLoadingAnimation() {
  return (
    <div className="flex flex-col items-center justify-center py-12 px-4 text-center overflow-hidden">
      <div className="relative mb-8">
        {/* Pulsing Outer Ring */}
        <div className="absolute inset-0 rounded-full bg-foodapka-500/20 animate-ping" />
        
        {/* Watchdog Icon */}
        <div className="relative w-24 h-24 rounded-full bg-white dark:bg-foodapka-950 border-4 border-foodapka-500 flex items-center justify-center shadow-xl z-10">
          <span className="material-symbols-outlined text-5xl text-foodapka-600 animate-bounce">pets</span>
        </div>

        {/* Flying store bubbles */}
        <div className="absolute -top-4 -left-4 w-10 h-10 rounded-full bg-white dark:bg-zinc-800 shadow-lg border border-zinc-100 dark:border-zinc-700 flex items-center justify-center animate-bounce [animation-delay:0.2s]">
          <span className="text-xs">🛒</span>
        </div>
        <div className="absolute top-0 -right-6 w-12 h-12 rounded-full bg-white dark:bg-zinc-800 shadow-lg border border-zinc-100 dark:border-zinc-700 flex items-center justify-center animate-bounce [animation-delay:0.5s]">
          <span className="text-xs">🏷️</span>
        </div>
        <div className="absolute -bottom-2 -right-2 w-8 h-8 rounded-full bg-white dark:bg-zinc-800 shadow-lg border border-zinc-100 dark:border-zinc-700 flex items-center justify-center animate-bounce [animation-delay:0.8s]">
          <span className="text-xs">🥓</span>
        </div>
      </div>

      <h3 className="text-xl font-black text-zinc-900 dark:text-white mb-2">Hlídací pes právě čmuchá slevy...</h3>
      <div className="flex items-center gap-2 text-zinc-500 dark:text-zinc-400 font-medium">
        <span className="material-symbols-outlined animate-spin text-sm">progress_activity</span>
        <p className="text-sm">Prohledáváme miliony položek z aktuálních letáků</p>
      </div>

      {/* Animated Flyer Scanning Line */}
      <div className="mt-8 w-full max-w-[280px] h-1.5 bg-zinc-100 dark:bg-zinc-800 rounded-full overflow-hidden">
        <div className="h-full bg-foodapka-500 w-1/3 rounded-full animate-[shimmer_1.5s_infinite_linear]" />
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
          className="overflow-hidden rounded-2xl border border-foodapka-100 dark:border-zinc-800 bg-white/90 dark:bg-foodapka-950 p-5 shadow-sm"
        >
          <div className="animate-pulse space-y-4">
            <div className="h-6 w-2/3 rounded-full bg-foodapka-100 dark:bg-zinc-800" />
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
          className="animate-pulse rounded-2xl border border-foodapka-100 dark:border-zinc-800 bg-white/85 dark:bg-foodapka-950 p-5 shadow-sm"
        >
          <div className="h-5 w-36 rounded-full bg-foodapka-100 dark:bg-zinc-800" />
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
    <div className="rounded-2xl border border-dashed border-foodapka-200 dark:border-zinc-800 bg-white/70 dark:bg-foodapka-950 px-6 py-12 text-center shadow-sm">
      <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-full bg-foodapka-100 dark:bg-zinc-800 text-3xl">
        {icon || (hasSearched ? "🧺" : "🥬")}
      </div>
      <h2 className="text-lg font-semibold text-foodapka-950 dark:text-white">
        {title || (hasSearched ? "Nic jsme nenašli" : "Začněte hledat")}
      </h2>
      <p className="mx-auto mt-3 max-w-xs text-sm leading-relaxed text-zinc-600 dark:text-zinc-400">
        {description || (hasSearched 
          ? "Zkuste jiný název nebo obecnější výraz." 
          : "Zadejte název potraviny a foodapka vám ukáže nejlepší akční ceny.")}
      </p>
    </div>
  );
}
