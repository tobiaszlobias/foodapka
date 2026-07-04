import { randomBytes } from "crypto";
import { createClient } from "@/lib/supabase/server";
import { getTelegramBotUsername } from "@/lib/telegram";

// Vytvoří jednorázový propojovací token — uživatel ho odešle botovi přes /start <token>,
// webhook pak najde tento token a uloží chat_id k user_id.
export async function POST() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return Response.json({ error: "Nejste přihlášeni." }, { status: 401 });
  }

  const token = randomBytes(16).toString("hex");

  const { error } = await supabase.from("telegram_links").upsert(
    {
      user_id: user.id,
      link_token: token,
      chat_id: null,
      linked_at: null,
    },
    { onConflict: "user_id" },
  );

  if (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }

  const botUsername = getTelegramBotUsername();
  const deepLink = botUsername ? `https://t.me/${botUsername}?start=${token}` : null;

  return Response.json({ token, deepLink });
}

export async function GET() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return Response.json({ error: "Nejste přihlášeni." }, { status: 401 });
  }

  const { data } = await supabase
    .from("telegram_links")
    .select("chat_id, linked_at")
    .eq("user_id", user.id)
    .maybeSingle();

  return Response.json({ linked: Boolean(data?.chat_id), linkedAt: data?.linked_at ?? null });
}

export async function DELETE() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return Response.json({ error: "Nejste přihlášeni." }, { status: 401 });
  }

  await supabase.from("telegram_links").delete().eq("user_id", user.id);
  return Response.json({ ok: true });
}
