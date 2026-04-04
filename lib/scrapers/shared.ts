export const SCRAPER_HEADERS = {
  "User-Agent":
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
  "Accept-Language": "cs-CZ,cs;q=0.9,en;q=0.8",
};

export async function fetchHtml(url: string) {
  const response = await fetch(url, {
    headers: SCRAPER_HEADERS,
    cache: "no-store",
  });

  if (!response.ok) {
    throw new Error(`HTTP ${response.status} for ${url}`);
  }

  return {
    html: await response.text(),
    url: response.url,
  };
}

export function absoluteUrl(origin: string, value: string) {
  if (!value) return "";
  if (value.startsWith("http://") || value.startsWith("https://")) return value;
  return new URL(value, origin).toString();
}

export function extractEmbeddedPayload(html: string, pattern: RegExp) {
  const match = html.match(pattern);
  return match?.[1] ?? null;
}

export function parseEmbeddedJson<T>(html: string, pattern: RegExp) {
  const payload = extractEmbeddedPayload(html, pattern);
  if (!payload) return null;

  try {
    return JSON.parse(payload) as T;
  } catch {
    return null;
  }
}

export function parseEmbeddedJsonLoose<T>(html: string, pattern: RegExp) {
  const payload = extractEmbeddedPayload(html, pattern);
  if (!payload) return null;

  const sanitized = payload
    .replace(/:undefined([,}\]])/g, ":null$1")
    .replace(/,\s*([}\]])/g, "$1");

  try {
    return JSON.parse(sanitized) as T;
  } catch {
    return null;
  }
}

export function decodeHtmlEntities(value: string) {
  return value
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">");
}

export function isBlockedHtml(html: string) {
  return /px-captcha|Access to this page has been denied|Press & Hold to confirm you are a human|PerimeterX|captcha\.px-cloud\.net/i.test(
    html,
  );
}
