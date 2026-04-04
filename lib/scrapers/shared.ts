import { request as httpsRequest } from "node:https";

export const SCRAPER_HEADERS = {
  "User-Agent":
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
  "Accept-Language": "cs-CZ,cs;q=0.9,en;q=0.8",
};

export async function fetchHtml(url: string) {
  let response: Response;

  try {
    response = await fetch(url, {
      headers: SCRAPER_HEADERS,
      cache: "no-store",
    });
  } catch (error) {
    const message =
      error instanceof Error
        ? error.cause instanceof Error
          ? `${error.message}: ${error.cause.message}`
          : error.message
        : "Unknown fetch error";
    throw new Error(`Fetch failed for ${url}: ${message}`);
  }

  if (!response.ok) {
    throw new Error(`HTTP ${response.status} for ${url}`);
  }

  return {
    html: await response.text(),
    url: response.url,
  };
}

export async function fetchHtmlWithNodeHttps(
  url: string,
  extraHeaders: Record<string, string> = {},
  redirectCount = 0,
): Promise<{ html: string; url: string; statusCode: number }> {
  const target = new URL(url);

  return new Promise((resolve, reject) => {
    const request = httpsRequest(
      target,
      {
        method: "GET",
        maxHeaderSize: 256 * 1024,
        headers: {
          ...SCRAPER_HEADERS,
          Accept: "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
          "Accept-Encoding": "identity",
          ...extraHeaders,
        },
      },
      (response) => {
        const statusCode = response.statusCode ?? 0;
        const location = response.headers.location;

        if (
          location &&
          statusCode >= 300 &&
          statusCode < 400 &&
          redirectCount < 3
        ) {
          response.resume();
          const redirectUrl = new URL(location, target).toString();
          fetchHtmlWithNodeHttps(redirectUrl, extraHeaders, redirectCount + 1)
            .then(resolve)
            .catch(reject);
          return;
        }

        const chunks: Buffer[] = [];
        response.on("data", (chunk) => {
          chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
        });
        response.on("end", () => {
          resolve({
            html: Buffer.concat(chunks).toString("utf8"),
            url: target.toString(),
            statusCode,
          });
        });
      },
    );

    request.on("error", (error) => {
      reject(
        new Error(
          `Node HTTPS request failed for ${url}: ${
            error instanceof Error ? error.message : String(error)
          }`,
        ),
      );
    });

    request.end();
  });
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
