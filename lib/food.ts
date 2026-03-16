export type Store = {
  shopId: string;
  shopName: string;
  price: string;
  pricePerUnit: string;
  amount: string;
  validity: string;
  leafletUrl: string;
};

export type Product = {
  name: string;
  url: string;
  stores: Store[];
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
