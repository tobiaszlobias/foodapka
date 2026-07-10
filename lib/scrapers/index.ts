import {
  mergeProductsByName,
  parsePrice,
  scoreProductMatch,
  sortStoresByPrice,
  type Product,
} from "@/lib/food";
import { searchFoodoraProducts } from "@/lib/scrapers/foodora";
import { searchGlobusProducts } from "@/lib/scrapers/globus";
import { searchKauflandProducts } from "@/lib/scrapers/kaufland";
import { searchKupiProducts } from "@/lib/scrapers/kupi";
import { searchLidlProducts } from "@/lib/scrapers/lidl";
import { searchPotravinkaProducts } from "@/lib/scrapers/potravinka";

type SourceSearchDebug = {
  kupi: { ok: boolean; count: number; error?: string };
  kaufland: { ok: boolean; count: number; error?: string };
  foodora: { ok: boolean; count: number; error?: string };
  lidl: { ok: boolean; count: number; error?: string };
  globus: { ok: boolean; count: number; error?: string };
  potravinka: { ok: boolean; count: number; error?: string };
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
    searchGlobusProducts(query),
    searchPotravinkaProducts(query),
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
  );
}

export async function searchAllSourcesDebug(
  query: string,
): Promise<{ products: Product[]; debug: SourceSearchDebug }> {
  const sourceResults = await Promise.allSettled([
    searchKupiProducts(query),
    searchKauflandProducts(query),
    searchFoodoraProducts(query),
    searchLidlProducts(query),
    searchGlobusProducts(query),
    searchPotravinkaProducts(query),
  ]);

  const [kupi, kaufland, foodora, lidl, globus, potravinka] = sourceResults;

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
    ),
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
      globus:
        globus.status === "fulfilled"
          ? { ok: true, count: globus.value.length }
          : {
              ok: false,
              count: 0,
              error:
                globus.reason instanceof Error
                  ? globus.reason.message
                  : String(globus.reason),
            },
      potravinka:
        potravinka.status === "fulfilled"
          ? { ok: true, count: potravinka.value.length }
          : {
              ok: false,
              count: 0,
              error:
                potravinka.reason instanceof Error
                  ? potravinka.reason.message
                  : String(potravinka.reason),
            },
    },
  };
}
