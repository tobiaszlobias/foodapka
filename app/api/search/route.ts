import { NextRequest } from "next/server";
import { mergeProductsByName } from "@/lib/food";
import { getIngredientQueryAlternatives } from "@/lib/ingredientClasses";
import { searchAllSources, searchAllSourcesDebug } from "@/lib/scrapers";
import { filterProductsForQuery } from "@/lib/searchProfiles";

export async function GET(req: NextRequest) {
  const query = req.nextUrl.searchParams.get("q")?.trim() || "";
  if (!query) {
    return Response.json({ products: [], count: 0 });
  }

  const recipe = req.nextUrl.searchParams.get("recipe")?.trim() || undefined;

  try {
    const wantsDebug = req.nextUrl.searchParams.get("debug") === "1";
    if (wantsDebug) {
      const { products, debug } = await searchAllSourcesDebug(query);
      const filteredProducts = filterProductsForQuery(products, query, { recipe });
      return Response.json({ products: filteredProducts, count: filteredProducts.length, debug });
    }

    const queryAlternatives = getIngredientQueryAlternatives(query, recipe);
    const searchResults = await Promise.all(
      queryAlternatives.map((candidateQuery) => searchAllSources(candidateQuery)),
    );
    const products = mergeProductsByName(searchResults.flat());
    const filteredProducts = filterProductsForQuery(products, query, { recipe });
    return Response.json({ products: filteredProducts, count: filteredProducts.length });
  } catch (error) {
    return Response.json(
      {
        error:
          error instanceof Error ? error.message : "Nepodařilo se načíst výsledky.",
        products: [],
        count: 0,
      },
      { status: 500 },
    );
  }
}
