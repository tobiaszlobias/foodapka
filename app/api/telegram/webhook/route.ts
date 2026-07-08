import { NextRequest } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { sendTelegramMessage } from "@/lib/telegram";

type TelegramUpdate = {
  message?: {
    chat: { id: number };
    text?: string;
  };
};

// Telegram webhook — voláno Telegramem při každé zprávě botovi.
// Ověřuje se sdíleným tajemstvím v query stringu (?secret=...), protože
// Telegram nepodporuje vlastní auth hlavičky pro webhooky.
export async function POST(req: NextRequest) {
  const secret = req.nextUrl.searchParams.get("secret");
  if (secret !== process.env.TELEGRAM_WEBHOOK_SECRET) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const update = (await req.json()) as TelegramUpdate;
  const message = update.message;
  const chatId = message?.chat?.id;
  const text = message?.text?.trim();

  if (!chatId || !text) {
    return Response.json({ ok: true });
  }

  const startMatch = text.match(/^\/start(?:\s+(\S+))?/);
  if (startMatch) {
    const token = startMatch[1];
    if (!token) {
      await sendTelegramMessage(
        String(chatId),
        "Ahoj! Pro propojení účtu otevřete v aplikaci Mnamio sekci Hlídací pes a klikněte na „Propojit Telegram“.",
      );
      return Response.json({ ok: true });
    }

    const supabase = createAdminClient();
    const { data: link, error } = await supabase
      .from("telegram_links")
      .select("user_id")
      .eq("link_token", token)
      .is("chat_id", null)
      .maybeSingle();

    if (error || !link) {
      await sendTelegramMessage(
        String(chatId),
        "Tento propojovací odkaz už není platný. Zkuste to znovu z aplikace.",
      );
      return Response.json({ ok: true });
    }

    await supabase
      .from("telegram_links")
      .update({ chat_id: String(chatId), linked_at: new Date().toISOString() })
      .eq("user_id", link.user_id);

    await sendTelegramMessage(
      String(chatId),
      "✅ Účet je propojený! Teď vám sem budeme posílat upozornění, když klesne cena hlídaného produktu.",
    );
    return Response.json({ ok: true });
  }

  return Response.json({ ok: true });
}
