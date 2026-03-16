"use client";
import { useState } from "react";

type Store = {
  shopId: string;
  shopName: string;
  price: string;
  pricePerUnit: string;
  amount: string;
  validity: string;
  leafletUrl: string;
};

type Product = {
  name: string;
  url: string;
  stores: Store[];
};

type SearchBarProps = {
  onResults: (products: Product[]) => void;
  onLoading: (loading: boolean) => void;
};

export default function SearchBar({ onResults, onLoading }: SearchBarProps) {
  const [query, setQuery] = useState("");

  async function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    if (!query.trim()) return;
    onLoading(true);
    const res = await fetch(`/api/search?q=${encodeURIComponent(query)}`);
    const data = await res.json();
    onResults(data.products);
    onLoading(false);
  }

  return (
    <form
      onSubmit={handleSearch}
      className="flex w-full flex-col gap-3 rounded-2xl border border-zinc-200 bg-white p-3 shadow-sm sm:flex-row sm:items-center"
    >
      <label htmlFor="product-search" className="sr-only">
        Hledat produkty
      </label>
      <input
        id="product-search"
        type="text"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="Hledejte produkty jako mleko, pecivo nebo limonada"
        className="h-12 w-full rounded-xl border border-zinc-200 bg-zinc-50 px-4 text-sm text-zinc-900 outline-none transition focus:border-zinc-400 focus:bg-white"
      />
      <button
        type="submit"
        className="h-12 rounded-xl bg-emerald-600 px-6 text-sm font-semibold text-white transition hover:bg-emerald-700"
      >
        Hledat
      </button>
    </form>
  );
}
