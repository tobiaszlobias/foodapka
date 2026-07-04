import { NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { parsePrice, type Product, type Store } from "@/lib/food";

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
    product?: Product;
    store?: Store;
  };

  if (!body.product?.name || !body.store?.price) {
    return Response.json({ error: "Chybí data o produktu." }, { status: 400 });
  }

  const currentPrice = parsePrice(body.store.price);

  const { data, error } = await supabase
    .from("watched_products")
    .upsert(
      {
        user_id: user.id,
        product_url: body.product.url || body.product.name,
        product_name: body.product.name,
        shop_name: body.store.shopName,
        query: body.product.name,
        last_known_price: currentPrice,
        initial_price: currentPrice,
      },
      { onConflict: "user_id,product_url" },
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
