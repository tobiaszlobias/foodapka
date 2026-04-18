import { NextRequest, NextResponse } from "next/server";
import OpenAI from "openai";

// If the key is missing, it will throw an error or we can handle it gracefully.
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY || "", 
});

export async function POST(req: NextRequest) {
  try {
    if (!process.env.OPENAI_API_KEY) {
      return NextResponse.json(
        { error: "API klíč pro OpenAI není nastaven v .env.local" },
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

    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content: `Jsi expertní kuchař a nákupčí. Tvojí úlohou je vzít požadavek uživatele a vymyslet pro něj ideální recept. 
          Musíš vrátit POUZE validní JSON objekt. Žádný jiný text.
          
          Formát JSONu:
          {
            "name": "Název jídla",
            "description": "Krátký lákavý popis jídla a proč se hodí k požadavku.",
            "ingredients": [
              "surovina 1 v základním tvaru",
              "surovina 2 v základním tvaru"
            ]
          }
          
          Pravidla pro 'ingredients':
          1. Piš POUZE základní názvy surovin, ne množství ani jednotky (např. piš "kuřecí prsa", NIKOLIV "500g kuřecích prsou").
          2. Piš je v 1. pádě jednotného čísla nebo běžném množném čísle (např. "rýže basmati", "rajčata", "cibule").
          3. Vybírej běžně dostupné suroviny v českých supermarketech.
          4. Vyhni se úplným základům jako sůl, pepř a voda, ty lidé většinou mají doma. Ostatní koření můžeš přidat.`,
        },
        {
          role: "user",
          content: prompt,
        },
      ],
      response_format: { type: "json_object" },
      temperature: 0.7,
    });

    const resultText = completion.choices[0]?.message?.content;
    
    if (!resultText) {
      throw new Error("Odpověď od AI byla prázdná.");
    }

    const recipeData = JSON.parse(resultText);

    // Validate the parsed data
    if (!recipeData.name || !Array.isArray(recipeData.ingredients)) {
      throw new Error("AI nevrátila správný formát receptu.");
    }

    return NextResponse.json(recipeData);
  } catch (error: any) {
    console.error("AI Recipe Generation Error:", error);
    return NextResponse.json(
      { error: error.message || "Nepodařilo se vygenerovat recept." },
      { status: 500 }
    );
  }
}
