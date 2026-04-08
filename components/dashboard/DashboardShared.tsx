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
          width={isLidl ? 68 : 56}
          height={isLidl ? 68 : 56}
          className={`${
            small 
              ? (isLidl ? "h-6 w-6" : "h-5 w-5") 
              : (isLidl ? "h-10 w-10 md:h-14 md:w-14" : "h-8 w-8 md:h-12 md:w-12")
          } object-contain`}
        />
      </span>
    );
  }

  return (
    <div className="flex items-center gap-1.5">
      <span className={small ? "text-xs" : "text-lg"}>{getStoreIcon(shopName)}</span>
      <span className={`font-bold text-zinc-800 dark:text-zinc-200 ${small ? "text-[10px]" : "text-sm md:text-base"}`}>
        {shopName}
      </span>
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
