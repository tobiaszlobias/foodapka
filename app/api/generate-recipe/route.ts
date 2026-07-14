import { NextRequest, NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import { INGREDIENT_CLASSES } from "@/lib/ingredientClasses";

export async function POST(req: NextRequest) {
  console.log("🚀 API: Volání Anthropic API");
  try {
    const apiKey = process.env.ANTHROPIC_API_KEY;

    if (!apiKey) {
      return NextResponse.json(
        { error: "API klíč (ANTHROPIC_API_KEY) není nastaven v .env.local" },
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

    const anthropic = new Anthropic({ apiKey });

    let message;
    try {
      message = await anthropic.messages.create({
        model: "claude-haiku-4-5-20251001",
        max_tokens: 2048,
        messages: [
          {
            role: "user",
            content: `Jsi expertní kuchař. Vymysli recept na základě požadavku: "${prompt}".
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
      });
    } catch (fetchError: unknown) {
      console.error("❌ Anthropic call failed:", fetchError);
      const message = fetchError instanceof Error ? fetchError.message : String(fetchError);
      throw new Error(`Anthropic API Error: ${message}`);
    }

    const resultText = message.content[0]?.type === "text" ? message.content[0].text : undefined;

    if (!resultText) {
      throw new Error("Claude nevrátil žádný text.");
    }

    // Pro jistotu vyčistíme text od případných markdown značek
    const cleanedJson = resultText.replace(/```json/g, "").replace(/```/g, "").trim();
    const recipeData = JSON.parse(cleanedJson);

    console.log(`✅ Recept vygenerován: ${recipeData.name}`);
    return NextResponse.json(recipeData);

  } catch (error: unknown) {
    console.error("💥 Anthropic API Error:", error);
    const details = error instanceof Error ? error.message : String(error);
    return NextResponse.json(
      {
        error: "Nepodařilo se vygenerovat recept.",
        details
      },
      { status: 500 }
    );
  }
}
