import Anthropic from "@anthropic-ai/sdk";
import { normalizeText, type Product } from "@/lib/food";

export type AiRelevanceOptions = {
  recipe?: string;
  banned?: string[];
};

export type AiRelevanceResult = {
  products: Product[];
  aiApplied: boolean;
  flagged: string[];
};

const MODEL = "claude-haiku-4-5-20251001";
const TIMEOUT_MS = 8_000;
const MAX_CANDIDATES = 120;
const CACHE_TTL_MS = 24 * 60 * 60 * 1000;
const CACHE_MAX_SIZE = 5_000;

const FLAG_SCHEMA = {
  type: "object",
  properties: {
    flag: { type: "array", items: { type: "integer" } },
  },
  required: ["flag"],
  additionalProperties: false,
} as const;

const SYSTEM_PROMPT = `Jsi filtr relevance pro český vyhledávač cen potravin. Uživatel hledá konkrétní potravinu/surovinu; dostaneš očíslovaný seznam názvů produktů ze supermarketů.

Vrať POUZE indexy produktů, které vůbec NEPATŘÍ do stejné kategorie potravin jako hledaný dotaz — tedy:
- krmivo a potřeby pro zvířata (i když název obsahuje stejné slovo, např. "kuřecí kousky" pro psy),
- drogerie, kosmetika, domácí potřeby,
- úplně jiný druh potraviny (např. bonbóny pro dotaz "máslo"),
- hotový výrobek s jinou příchutí místo suroviny samotné (např. "jogurt s příchutí parmazánu" pro dotaz "parmazán").

NEVYŘAZUJ produkt jen proto, že je to jiný druh/řez/varianta/balení STEJNÉ suroviny — např. u dotazu "kuřecí prsa" ponech i kuřecí stehna, křídla, mleté kuřecí maso nebo ochucené kuřecí prsa; u dotazu "mléko" ponech i kondenzované nebo kefírové mléko. Přesnost shody s dotazem řeší jiná část systému, ty rozhoduješ jen o kategorii "je to vůbec tahle potravina/surovina, nebo něco jiného".

Buď konzervativní: když si nejsi jistý, produkt ponech (nevracej jeho index).`;

type CacheEntry = { flagged: boolean; expiresAt: number };
const verdictCache = new Map<string, CacheEntry>();

function cacheKey(query: string, productName: string): string {
  return `${normalizeText(query)}||${normalizeText(productName)}`;
}

function pruneCache() {
  const now = Date.now();
  for (const [key, entry] of verdictCache) {
    if (entry.expiresAt <= now) verdictCache.delete(key);
  }
  while (verdictCache.size >= CACHE_MAX_SIZE) {
    const oldestKey = verdictCache.keys().next().value;
    if (oldestKey === undefined) break;
    verdictCache.delete(oldestKey);
  }
}

function setCacheEntry(key: string, flagged: boolean) {
  if (verdictCache.size >= CACHE_MAX_SIZE) pruneCache();
  verdictCache.set(key, { flagged, expiresAt: Date.now() + CACHE_TTL_MS });
}

let client: Anthropic | null = null;
function getClient(): Anthropic | null {
  if (!process.env.ANTHROPIC_API_KEY) return null;
  client ??= new Anthropic({ maxRetries: 0, timeout: TIMEOUT_MS });
  return client;
}

function isFlagVerdict(value: unknown): value is { flag: number[] } {
  return (
    typeof value === "object" &&
    value !== null &&
    Array.isArray((value as { flag?: unknown }).flag) &&
    (value as { flag: unknown[] }).flag.every((n) => Number.isInteger(n))
  );
}

function buildUserMessage(
  query: string,
  candidates: Product[],
  options?: AiRelevanceOptions,
): string {
  const lines = [`Hledaná potravina: "${query}"`];
  if (options?.recipe) {
    lines.push(`Kontext receptu: "${options.recipe}"`);
  }
  if (options?.banned && options.banned.length > 0) {
    lines.push(`Uživatel nechce: ${options.banned.join(", ")}`);
  }
  lines.push("", "Produkty:");
  candidates.forEach((p, i) => lines.push(`${i}. ${p.name}`));
  lines.push("", 'Vrať JSON {"flag": [indexy k odsunutí]}.');
  return lines.join("\n");
}

export async function applyAiRelevance(
  products: Product[],
  query: string,
  options?: AiRelevanceOptions,
): Promise<AiRelevanceResult> {
  if (products.length === 0) {
    return { products, aiApplied: false, flagged: [] };
  }

  const anthropic = getClient();
  if (!anthropic) {
    return { products, aiApplied: false, flagged: [] };
  }

  pruneCache();

  const cached = new Map<number, boolean>();
  const uncached: { index: number; product: Product }[] = [];
  products.forEach((product, index) => {
    const entry = verdictCache.get(cacheKey(query, product.name));
    if (entry) {
      cached.set(index, entry.flagged);
    } else {
      uncached.push({ index, product });
    }
  });

  const candidates = uncached.slice(0, MAX_CANDIDATES);
  const skipped = uncached.slice(MAX_CANDIDATES);

  console.log(
    `🚀 AI relevance: "${query}" — ${products.length} kandidátů (${cached.size} cache, ${candidates.length} → Haiku)`,
  );

  const flaggedIndexes = new Set<number>();
  for (const [index, flagged] of cached) {
    if (flagged) flaggedIndexes.add(index);
  }

  if (candidates.length > 0) {
    const start = Date.now();
    try {
      const message = await anthropic.messages.create(
        {
          model: MODEL,
          max_tokens: 600,
          system: SYSTEM_PROMPT,
          output_config: { format: { type: "json_schema", schema: FLAG_SCHEMA } },
          messages: [
            {
              role: "user",
              content: buildUserMessage(
                query,
                candidates.map((c) => c.product),
                options,
              ),
            },
          ],
        },
        { timeout: TIMEOUT_MS },
      );

      if (message.stop_reason === "max_tokens") {
        throw new Error("Odpověď byla useknutá (max_tokens)");
      }

      const textBlock = message.content.find((block) => block.type === "text");
      if (!textBlock || textBlock.type !== "text") {
        throw new Error("Haiku nevrátil žádný text");
      }

      const parsed: unknown = JSON.parse(textBlock.text);
      if (!isFlagVerdict(parsed)) {
        throw new Error("Neplatný formát odpovědi");
      }

      const flaggedLocalIndexes = new Set(parsed.flag);
      const flaggedNames: string[] = [];

      candidates.forEach(({ index, product }, localIndex) => {
        const flagged = flaggedLocalIndexes.has(localIndex);
        setCacheEntry(cacheKey(query, product.name), flagged);
        if (flagged) {
          flaggedIndexes.add(index);
          flaggedNames.push(product.name);
        }
      });

      console.log(
        `✅ AI relevance: odsunuto ${flaggedNames.length}/${candidates.length} za ${Date.now() - start} ms: ${flaggedNames.join(", ") || "—"}`,
      );
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      console.log(`❌ AI relevance selhala (${message}) — vracím deterministické výsledky`);
      return { products, aiApplied: false, flagged: [] };
    }
  }

  if (skipped.length > 0) {
    console.log(`⚠️ AI relevance: ${skipped.length} kandidátů přeskočeno (limit ${MAX_CANDIDATES})`);
  }

  if (flaggedIndexes.size === 0) {
    return { products, aiApplied: true, flagged: [] };
  }

  if (flaggedIndexes.size >= products.length) {
    console.log(`❌ AI relevance: označila všechny produkty pro "${query}" — ignoruji verdikt`);
    return { products, aiApplied: false, flagged: [] };
  }

  const kept: Product[] = [];
  const flagged: Product[] = [];
  products.forEach((product, index) => {
    if (flaggedIndexes.has(index)) {
      flagged.push({ ...product, aiFlagged: true });
    } else {
      kept.push(product);
    }
  });

  return {
    products: [...kept, ...flagged],
    aiApplied: true,
    flagged: flagged.map((p) => p.name),
  };
}
