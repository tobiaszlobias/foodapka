export type SavingsSource = "exact" | "estimated";
export type ProductAvailability = "sale" | "not_on_sale";

export type Store = {
  shopId: string;
  shopName: string;
  price: string;
  discountPct: string;
  originalPrice: string;
  savingsSource?: SavingsSource;
  pricePerUnit: string;
  amount: string;
  validity: string;
  leafletUrl: string;
};

export type Product = {
  name: string;
  url: string;
  stores: Store[];
  availability?: ProductAvailability;
};

export const STORE_META: Record<string, string> = {
  Lidl: "🟡",
  Penny: "🔴",
  Kaufland: "🔵",
  Albert: "🟢",
  Billa: "🔴",
  Tesco: "🔵",
  Globus: "🟣",
};

export function parsePrice(price: string) {
  const normalized = price.replace(/\s/g, "").replace(",", ".").match(/[\d.]+/);
  return normalized ? Number(normalized[0]) : Number.POSITIVE_INFINITY;
}

function formatPriceValue(price: number) {
  return price.toFixed(2).replace(".", ",");
}

function parseDiscountPct(discountPct: string) {
  const pct = parseInt(discountPct.replace(/[^0-9]/g, ""), 10);
  return Number.isFinite(pct) ? pct : 0;
}

function median(values: number[]) {
  const sorted = [...values].sort((a, b) => a - b);
  const middle = Math.floor(sorted.length / 2);

  if (sorted.length % 2 === 0) {
    return (sorted[middle - 1] + sorted[middle]) / 2;
  }

  return sorted[middle];
}

export function sortStoresByPrice(stores: Store[]) {
  return [...stores].sort((a, b) => parsePrice(a.price) - parsePrice(b.price));
}

export function cleanProductName(name: string) {
  return name.replace("Aktuální akční slevy ", "").trim();
}

export function getStoreIcon(shopName: string) {
  return (
    Object.entries(STORE_META).find(([name]) => shopName.includes(name))?.[1] ??
    "🏪"
  );
}

export function calculateStoreSavings(store: Store) {
  const currentPrice = parsePrice(store.price);
  if (!Number.isFinite(currentPrice)) return null;

  const explicitOriginalPrice = parsePrice(store.originalPrice);
  const explicitDiscountPct = parseDiscountPct(store.discountPct);

  let originalPrice = explicitOriginalPrice;
  let source: SavingsSource = store.savingsSource ?? "exact";

  if (!Number.isFinite(originalPrice) || originalPrice <= currentPrice) {
    if (!explicitDiscountPct) return null;
    originalPrice = currentPrice / (1 - explicitDiscountPct / 100);
    source = "exact";
  }

  const saving = originalPrice - currentPrice;
  if (saving <= 0) return null;

  const pct =
    explicitDiscountPct || Math.round((saving / originalPrice) * 100);

  return {
    originalPrice: formatPriceValue(originalPrice),
    saving: formatPriceValue(saving),
    pct,
    source,
  };
}

export function estimateStoreSavings(stores: Store[]) {
  const parsedStores = stores
    .map((store) => ({ store, price: parsePrice(store.price) }))
    .filter((entry) => Number.isFinite(entry.price));

  return stores.map((store) => {
    if (store.originalPrice || parseDiscountPct(store.discountPct) > 0) {
      return {
        ...store,
        savingsSource: "exact" as const,
      };
    }

    const currentPrice = parsePrice(store.price);
    if (!Number.isFinite(currentPrice)) return store;

    const higherPeerPrices = parsedStores
      .map((entry) => entry.price)
      .filter((price) => price > currentPrice);

    if (higherPeerPrices.length === 0) return store;

    const referencePrice = median(higherPeerPrices);
    const saving = referencePrice - currentPrice;
    const relativeSaving = saving / referencePrice;

    if (saving < 2 || relativeSaving < 0.05) {
      return store;
    }

    return {
      ...store,
      originalPrice: `${formatPriceValue(referencePrice)} Kč`,
      savingsSource: "estimated" as const,
    };
  });
}
