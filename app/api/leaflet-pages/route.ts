import { NextRequest } from "next/server";
import { findLeafletPages } from "@/lib/scrapers/mojeletaky";

// Vrátí seznam URL všech stránek aktuálního letáku daného obchodu (mojeletaky.cz).
// Appka tyto URL dál posílá přes /api/leaflet-page proxy, takže se v prohlížeči
// uživatele neobjeví žádná externí doména.
export async function GET(req: NextRequest) {
  const shopName = req.nextUrl.searchParams.get("shop");
  if (!shopName) {
    return Response.json({ error: "Chybí parametr shop." }, { status: 400 });
  }

  try {
    const pages = await findLeafletPages(shopName);
    return Response.json({ pages });
  } catch (error) {
    return Response.json(
      { error: error instanceof Error ? error.message : "Chyba při načítání letáku." },
      { status: 500 },
    );
  }
}
