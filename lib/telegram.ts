const TELEGRAM_API_BASE = "https://api.telegram.org";

export function getTelegramBotToken() {
  const token = process.env.TELEGRAM_BOT_TOKEN;
  if (!token) throw new Error("TELEGRAM_BOT_TOKEN není nastaven.");
  return token;
}

export function getTelegramBotUsername() {
  return process.env.TELEGRAM_BOT_USERNAME || "";
}

export async function sendTelegramMessage(chatId: string, text: string) {
  const token = getTelegramBotToken();
  const res = await fetch(`${TELEGRAM_API_BASE}/bot${token}/sendMessage`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      chat_id: chatId,
      text,
      parse_mode: "HTML",
      disable_web_page_preview: true,
    }),
  });

  if (!res.ok) {
    const body = await res.text().catch(() => "");
    throw new Error(`Telegram sendMessage selhalo (${res.status}): ${body}`);
  }

  return res.json();
}
