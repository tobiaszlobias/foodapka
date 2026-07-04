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
    .from("watched_products")
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
    query?: string;
    targetPrice?: number;
  };

  const query = body.query?.trim();
  const targetPrice = Number(body.targetPrice);

  if (!query) {
    return Response.json({ error: "Chybí dotaz, co hlídat." }, { status: 400 });
  }
  if (!Number.isFinite(targetPrice) || targetPrice <= 0) {
    return Response.json({ error: "Zadejte platnou cílovou cenu." }, { status: 400 });
  }

  const { data, error } = await supabase
    .from("watched_products")
    .upsert(
      {
        user_id: user.id,
        query,
        target_price: targetPrice,
        last_notified_price: null,
      },
      { onConflict: "user_id,query" },
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

  const id = req.nextUrl.searchParams.get("id");
  if (!id) {
    return Response.json({ error: "Chybí id." }, { status: 400 });
  }

  const { error } = await supabase
    .from("watched_products")
    .delete()
    .eq("user_id", user.id)
    .eq("id", id);

  if (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }

  return Response.json({ ok: true });
}
