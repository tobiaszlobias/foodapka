type SearchBarProps = {
  placeholder?: string;
};

export default function SearchBar({
  placeholder = "Hledejte produkty jako mleko, pecivo nebo limonada",
}: SearchBarProps) {
  return (
    <form className="flex w-full flex-col gap-3 rounded-2xl border border-zinc-200 bg-white p-3 shadow-sm sm:flex-row sm:items-center">
      <label htmlFor="product-search" className="sr-only">
        Hledat produkty
      </label>
      <input
        id="product-search"
        type="text"
        placeholder={placeholder}
        className="h-12 w-full rounded-xl border border-zinc-200 bg-zinc-50 px-4 text-sm text-zinc-900 outline-none transition focus:border-zinc-400 focus:bg-white"
      />
      <button
        type="submit"
        className="h-12 rounded-xl bg-emerald-600 px-6 text-sm font-semibold text-white transition hover:bg-emerald-700 focus:outline-none focus:ring-2 focus:ring-emerald-300"
      >
        Hledat
      </button>
    </form>
  );
}
