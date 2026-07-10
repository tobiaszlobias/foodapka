import { NextRequest, NextResponse } from "next/server";
import { INGREDIENT_CLASSES } from "@/lib/ingredientClasses";

export async function POST(req: NextRequest) {
  console.log("🚀 API: Volání nativního Gemini API");
  try {
    const apiKey = process.env.GEMINI_API_KEY || process.env.GOOGLE_GENERATIVE_AI_API_KEY;
    
    if (!apiKey) {
      return NextResponse.json(
        { error: "API klíč (GEMINI_API_KEY) není nastaven v .env.local" },
        { status: 500 }
      );
    }

    const body = await req.json();
    const prompt = body.prompt;

    if (!prompt) {
      return NextResponse.json(
        { error: "Nezadali jste žádný požadavek na recept." },
        { status: 400 }
      );
    }

    const KNOWN_INGREDIENTS = INGREDIENT_CLASSES.map(c => c.aliases[0]);

    // Použijeme gemini-flash-lite-latest, který je v tomto prostředí dostupný a funkční
    const baseUrl = "https://generativelanguage.googleapis.com/v1beta/models/gemini-flash-lite-latest:generateContent";
    const url = `${baseUrl}?key=${apiKey}`;

    let response;
    try {
      response = await fetch(url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          contents: [
            {
              parts: [
                {
                  text: `Jsi expertní kuchař. Vymysli recept na základě požadavku: "${prompt}".
                  ODPOVĚZ POUZE JAKO ČISTÝ JSON v tomto formátu:
                  {
                    "name": "Název jídla",
                    "description": "Zhodnocení vybraných surovin, jak se k sobě hodí a proč tento recept splňuje přání uživatele.",
                    "ingredients": [
                      {
                        "name": "přesný název suroviny (např. máslo)",
                        "searchQuery": "obecný název suroviny pro vyhledávač, 1-2 slova (např. máslo)",
                        "banned": ["seznam", "slov", "která", "nechceme", "ve", "výsledcích", "např", "croissant", "pomazánka"]
                      }
                    ],
                    "instructions": ["Stručný krok 1", "Stručný krok 2"]
                  }
                  
                  DŮLEŽITÉ:
                  1. U 'banned' slov buď kreativní a vypiš vše, co by mohl vyhledávač v supermarketu splést (např. pro 'máslo' zakaž 'croissant', 'pomazánka', 'sušenky', 'listové těsto').
                  2. Do 'searchQuery' NIKDY nedávej značky, gramáže ani přídavná jména ("máslo 250g", "kuřecí prsa čerstvá" je špatně; "máslo", "kuřecí prsa" je správně) — upřesnění patří do 'banned'.
                  3. Používej tyto názvy surovin, pokud se hodí: ${KNOWN_INGREDIENTS.slice(0, 50).join(", ")}.`
                }
              ]
            }
          ]
        })
      });
    } catch (fetchError: any) {
      console.error("❌ Fetch failed directly:", fetchError);
      throw new Error(`Fetch failed: ${fetchError.message} (cause: ${fetchError.cause})`);
    }

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error?.message || `Gemini API Error: ${response.status}`);
    }

    const data = await response.json();
    const resultText = data.candidates?.[0]?.content?.parts?.[0]?.text;

    if (!resultText) {
      throw new Error("Gemini nevrátil žádný text.");
    }

    // Pro jistotu vyčistíme text od případných markdown značek
    const cleanedJson = resultText.replace(/```json/g, "").replace(/```/g, "").trim();
    const recipeData = JSON.parse(cleanedJson);

    console.log(`✅ Recept vygenerován: ${recipeData.name}`);
    return NextResponse.json(recipeData);

  } catch (error: any) {
    console.error("💥 Gemini API Error:", error);
    return NextResponse.json(
      { 
        error: "Nepodařilo se vygenerovat recept.",
        details: error.message
      },
      { status: 500 }
    );
  }
}
