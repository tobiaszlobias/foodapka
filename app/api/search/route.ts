import { NextRequest } from "next/server";
import { searchAllSources } from "@/lib/scrapers";

export async function GET(req: NextRequest) {
  const query = req.nextUrl.searchParams.get("q")?.trim() || "";
  if (!query) {
    return Response.json({ products: [], count: 0 });
  }

  try {
    const products = await searchAllSources(query);
    return Response.json({ products, count: products.length });
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
