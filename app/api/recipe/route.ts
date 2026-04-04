import { NextRequest } from "next/server";
import { findRecipeByName, resolveRecipeIngredient } from "@/lib/recipes";

export async function POST(req: NextRequest) {
  try {
    const { recipe } = (await req.json()) as { recipe?: string };

    if (!recipe?.trim()) {
      return Response.json({ error: "Chybí název receptu." }, { status: 400 });
    }

    const recipeMatch = findRecipeByName(recipe);

    if (!recipeMatch) {
      return Response.json(
        {
          error:
            "Tento recept zatím nemáme připravený. Zkuste některý z předpřipravených receptů nebo podobný název.",
        },
        { status: 404 },
      );
    }

    return Response.json({
      recipe: recipeMatch.name,
      ingredients: recipeMatch.ingredients.map(resolveRecipeIngredient),
    });
  } catch {
    return Response.json(
      { error: "Nepodařilo se zpracovat požadavek na recept." },
      { status: 400 },
    );
  }
}
