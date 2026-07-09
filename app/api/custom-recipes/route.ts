import { NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return Response.json({ error: "Nejste přihlášeni." }, { status: 401 });
  }

  const { data, error } = await supabase
    .from("custom_recipes")
    .select("*")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });

  if (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }

  return Response.json({ items: data ?? [] });
}

export async function POST(req: NextRequest) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return Response.json({ error: "Nejste přihlášeni." }, { status: 401 });
  }

  const body = (await req.json()) as {
    name?: string;
    tags?: string[];
    description?: string;
    ingredients?: string[];
    instructions?: string[];
  };

  const name = body.name?.trim();
  const ingredients = (body.ingredients ?? []).map((i) => i.trim()).filter(Boolean);

  if (!name) {
    return Response.json({ error: "Chybí název receptu." }, { status: 400 });
  }
  if (ingredients.length === 0) {
    return Response.json({ error: "Přidejte alespoň jednu ingredienci." }, { status: 400 });
  }

  const { data, error } = await supabase
    .from("custom_recipes")
    .upsert(
      {
        user_id: user.id,
        name,
        tags: body.tags?.length ? body.tags.map((t) => t.trim()).filter(Boolean) : ["Vlastní"],
        description: body.description?.trim() || null,
        ingredients,
        instructions: body.instructions?.length ? body.instructions : null,
      },
      { onConflict: "user_id,name" },
    )
    .select()
    .single();

  if (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }

  return Response.json({ item: data });
}

export async function DELETE(req: NextRequest) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return Response.json({ error: "Nejste přihlášeni." }, { status: 401 });
  }

  const name = req.nextUrl.searchParams.get("name");
  if (!name) {
    return Response.json({ error: "Chybí název receptu." }, { status: 400 });
  }

  const { error } = await supabase
    .from("custom_recipes")
    .delete()
    .eq("user_id", user.id)
    .eq("name", name);

  if (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }

  return Response.json({ ok: true });
}
