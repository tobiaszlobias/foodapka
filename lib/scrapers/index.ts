import {
  mergeProductsByName,
  parsePrice,
  scoreProductMatch,
  sortStoresByPrice,
  type Product,
} from "@/lib/food";
import { searchFoodoraProducts } from "@/lib/scrapers/foodora";
import { searchKauflandProducts } from "@/lib/scrapers/kaufland";
import { searchKupiProducts } from "@/lib/scrapers/kupi";
import { searchLidlProducts } from "@/lib/scrapers/lidl";

function sortProducts(products: Product[], query: string) {
  return [...products].sort((a, b) => {
    const scoreDelta = scoreProductMatch(b.name, query) - scoreProductMatch(a.name, query);
    if (scoreDelta !== 0) return scoreDelta;

    const priceDelta = parsePrice(a.stores[0]?.price || "") - parsePrice(b.stores[0]?.price || "");
    if (priceDelta !== 0) return priceDelta;

    return b.stores.length - a.stores.length;
  });
}

export async function searchAllSources(query: string) {
  const sourceResults = await Promise.allSettled([
    searchKupiProducts(query),
    searchKauflandProducts(query),
    searchFoodoraProducts(query),
    searchLidlProducts(query),
  ]);

  const products = sourceResults.reduce<Product[]>((accumulator, result) => {
    if (result.status === "fulfilled") {
      accumulator.push(
        ...result.value.filter((product): product is Product => Boolean(product)),
      );
    }
    return accumulator;
  }, []);

  return sortProducts(
    mergeProductsByName(
      products.map((product) => ({
        ...product,
        stores: sortStoresByPrice(product.stores),
      })),
    ),
    query,
  ).slice(0, 18);
}
