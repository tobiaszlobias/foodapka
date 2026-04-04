import { GoogleGenerativeAI } from "@google/generative-ai";
import { NextRequest } from "next/server";

type EstimateRequestItem = {
  ingredient?: string;
  productName?: string | null;
  status?: "not_found" | "not_on_sale";
};

type EstimateResponseItem = {
  ingredient: string;
  minPrice: number;
  maxPrice: number;
  note?: string;
};

const apiKey = process.env.GEMINI_API_KEY;
const genAI = apiKey ? new GoogleGenerativeAI(apiKey) : null;
const preferredGeminiModels = process.env.GEMINI_MODEL
  ? [process.env.GEMINI_MODEL]
  : ["gemini-2.5-flash-lite", "gemini-2.5-flash"];

async function callGeminiText(prompt: string, maxOutputTokens: number) {
  if (!genAI) return "";

  for (const modelName of preferredGeminiModels) {
    try {
      const model = genAI.getGenerativeModel({
        model: modelName,
        generationConfig: {
          candidateCount: 1,
          maxOutputTokens,
          temperature: 0.2,
          topP: 0.2,
        },
      });
      const result = await model.generateContent(prompt);
      const text = result.response.text().trim();
      if (text) return text;
    } catch (error) {
      console.log(`Gemini estimate error for model ${modelName}:`, error);
    }
  }

  return "";
}

function extractJsonObject(text: string) {
  const fencedMatch = text.match(/```(?:json)?\s*([\s\S]*?)```/i);
  const candidate = fencedMatch?.[1]?.trim() || text.trim();

  const firstBrace = candidate.indexOf("{");
  const lastBrace = candidate.lastIndexOf("}");
  if (firstBrace === -1 || lastBrace === -1 || lastBrace <= firstBrace) {
    return null;
  }

  try {
    return JSON.parse(candidate.slice(firstBrace, lastBrace + 1)) as {
      items?: EstimateResponseItem[];
    };
  } catch {
    return null;
  }
}

function buildEstimatePrompt(recipe: string | undefined, items: EstimateRequestItem[]) {
  const recipeContext = recipe?.trim()
    ? `Recept: ${recipe.trim()}`
    : "Recept není upřesněný.";

  const itemLines = items
    .map((item, index) => {
      const statusLabel =
        item.status === "not_on_sale"
          ? "produkt byl dohledán, ale není teď v akci"
          : "produkt se nepodařilo najít";
      const productLabel = item.productName?.trim()
        ? `; nejbližší nalezený produkt: ${item.productName.trim()}`
        : "";

      return `${index + 1}. ingredience: ${item.ingredient?.trim()} ; stav: ${statusLabel}${productLabel}`;
    })
    .join("\n");

  return `Jsi asistent pro české supermarkety.
Potřebuji odhadnout běžnou NEAKČNÍ cenu nákupního balení nebo typického minimálního množství pro ingredience do receptu.
${recipeContext}

Položky:
${itemLines}

Pravidla:
- Odhaduj běžné české supermarketové ceny v Kč.
- Nevracej akční ceny.
- U položek jako tortilla odhadni cenu běžného balení, ne jedné tortilly.
- U zeleniny a ovoce odhadni běžné spotřebitelské množství, které člověk typicky koupí pro domácí recept.
- minPrice a maxPrice musí být celá čísla.
- maxPrice musí být větší nebo rovno minPrice.
- Rozsah drž realistický a spíš užší.
- note napiš stručně česky, třeba "balení 4-6 ks" nebo "cca 500 g".

Vrať POUZE validní JSON v tomto tvaru:
{
  "items": [
    {
      "ingredient": "tortilla",
      "minPrice": 30,
      "maxPrice": 45,
      "note": "balení 4-6 ks"
    }
  ]
}`;
}

export async function POST(req: NextRequest) {
  try {
    const body = (await req.json()) as {
      recipe?: string;
      items?: EstimateRequestItem[];
    };
    const items = Array.isArray(body.items)
      ? body.items.filter(
          (item): item is EstimateRequestItem =>
            !!item && typeof item.ingredient === "string" && !!item.ingredient.trim(),
        )
      : [];

    if (items.length === 0) {
      return Response.json({ items: [] });
    }

    if (!genAI) {
      return Response.json({ items: [] });
    }

    const prompt = buildEstimatePrompt(body.recipe, items);
    const text = await callGeminiText(prompt, 400);
    const parsed = text ? extractJsonObject(text) : null;
    const estimateItems = Array.isArray(parsed?.items) ? parsed.items : [];
    const estimateMap = new Map(
      estimateItems.map((item) => [item.ingredient.trim().toLowerCase(), item]),
    );

    const sanitizedItems = items
      .map((item) => {
        const estimate = estimateMap.get(item.ingredient!.trim().toLowerCase());
        if (!estimate) return null;

        const minPrice = Math.max(1, Math.round(Number(estimate.minPrice)));
        const maxPrice = Math.max(minPrice, Math.round(Number(estimate.maxPrice)));

        if (!Number.isFinite(minPrice) || !Number.isFinite(maxPrice)) {
          return null;
        }

        return {
          ingredient: item.ingredient!.trim(),
          minPrice,
          maxPrice,
          note:
            typeof estimate.note === "string" && estimate.note.trim()
              ? estimate.note.trim()
              : undefined,
        };
      })
      .filter((item): item is NonNullable<typeof item> => !!item);

    return Response.json({ items: sanitizedItems });
  } catch {
    return Response.json(
      { error: "Nepodařilo se odhadnout běžné ceny." },
      { status: 400 },
    );
  }
}
