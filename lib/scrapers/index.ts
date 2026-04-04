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

type SourceSearchDebug = {
  kupi: { ok: boolean; count: number; error?: string };
  kaufland: { ok: boolean; count: number; error?: string };
  foodora: { ok: boolean; count: number; error?: string };
  lidl: { ok: boolean; count: number; error?: string };
};

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

export async function searchAllSourcesDebug(
  query: string,
): Promise<{ products: Product[]; debug: SourceSearchDebug }> {
  const sourceResults = await Promise.allSettled([
    searchKupiProducts(query),
    searchKauflandProducts(query),
    searchFoodoraProducts(query),
    searchLidlProducts(query),
  ]);

  const [kupi, kaufland, foodora, lidl] = sourceResults;

  const products = sourceResults.reduce<Product[]>((accumulator, result) => {
    if (result.status === "fulfilled") {
      accumulator.push(
        ...result.value.filter((product): product is Product => Boolean(product)),
      );
    }
    return accumulator;
  }, []);

  return {
    products: sortProducts(
      mergeProductsByName(
        products.map((product) => ({
          ...product,
          stores: sortStoresByPrice(product.stores),
        })),
      ),
      query,
    ).slice(0, 18),
    debug: {
      kupi:
        kupi.status === "fulfilled"
          ? { ok: true, count: kupi.value.length }
          : { ok: false, count: 0, error: kupi.reason instanceof Error ? kupi.reason.message : String(kupi.reason) },
      kaufland:
        kaufland.status === "fulfilled"
          ? { ok: true, count: kaufland.value.length }
          : {
              ok: false,
              count: 0,
              error:
                kaufland.reason instanceof Error
                  ? kaufland.reason.message
                  : String(kaufland.reason),
            },
      foodora:
        foodora.status === "fulfilled"
          ? { ok: true, count: foodora.value.length }
          : {
              ok: false,
              count: 0,
              error:
                foodora.reason instanceof Error
                  ? foodora.reason.message
                  : String(foodora.reason),
            },
      lidl:
        lidl.status === "fulfilled"
          ? { ok: true, count: lidl.value.length }
          : {
              ok: false,
              count: 0,
              error:
                lidl.reason instanceof Error
                  ? lidl.reason.message
                  : String(lidl.reason),
            },
    },
  };
}
