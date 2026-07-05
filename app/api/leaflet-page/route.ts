import { NextRequest } from "next/server";
import { fetchHtml, SCRAPER_HEADERS } from "@/lib/scrapers/shared";

// Zprostředkovává obrázek konkrétní stránky letáku bez přesměrování/odkazu na
// zdrojový web — appka stránku letáku stáhne server-side, najde odpovídající
// obrázek stránky a přepošle ho jako vlastní response. V prohlížeči uživatele
// se neobjeví žádná externí doména.
export async function GET(req: NextRequest) {
  const pageUrl = req.nextUrl.searchParams.get("url");
  if (!pageUrl) {
    return Response.json({ error: "Chybí parametr url." }, { status: 400 });
  }

  let parsedUrl: URL;
  try {
    parsedUrl = new URL(pageUrl);
  } catch {
    return Response.json({ error: "Neplatná URL." }, { status: 400 });
  }

  // Jen povolené zdrojové domény — appka nesmí sloužit jako obecný proxy
  const ALLOWED_HOSTS = ["www.kupi.cz", "kupi.cz"];
  if (!ALLOWED_HOSTS.includes(parsedUrl.hostname)) {
    return Response.json({ error: "Nepovolená doména." }, { status: 400 });
  }

  try {
    const { html } = await fetchHtml(pageUrl);
    const pageParam = parsedUrl.searchParams.get("page");

    // Hledá obrázek stránky letáku ve vysokém rozlišení odpovídající číslu stránky
    const imageMatches = Array.from(
      html.matchAll(/https:\/\/img\.kupi\.cz\/letaky\/\d+\/thumbs\/[^"'\s]+_1500\.jpg/g),
    ).map((m) => m[0]);

    let imageUrl: string | undefined;
    if (pageParam) {
      imageUrl = imageMatches.find((url) => url.includes(`-${pageParam}_1500.jpg`));
    }
    if (!imageUrl) {
      imageUrl = imageMatches[0];
    }

    if (!imageUrl) {
      return Response.json({ error: "Obrázek letáku nenalezen." }, { status: 404 });
    }

    const imageRes = await fetch(imageUrl, { headers: SCRAPER_HEADERS, cache: "no-store" });
    if (!imageRes.ok) {
      return Response.json({ error: "Nepodařilo se načíst obrázek letáku." }, { status: 502 });
    }

    const imageBuffer = await imageRes.arrayBuffer();
    return new Response(imageBuffer, {
      headers: {
        "Content-Type": imageRes.headers.get("content-type") || "image/jpeg",
        "Cache-Control": "public, max-age=3600",
      },
    });
  } catch (error) {
    return Response.json(
      { error: error instanceof Error ? error.message : "Chyba při načítání letáku." },
      { status: 500 },
    );
  }
}
