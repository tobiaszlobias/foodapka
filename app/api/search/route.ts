import * as cheerio from "cheerio";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { NextRequest } from "next/server";
import {
  estimateStoreSavings,
  parsePrice,
  sortStoresByPrice,
  type Product,
  type ProductAvailability,
  type Store,
} from "@/lib/food";
import {
  buildSearchQueryVariants,
  getDictionaryNegativeTerms,
  normalizeSearchText,
} from "@/lib/searchQueries";

const apiKey = process.env.GEMINI_API_KEY;
const genAI = apiKey ? new GoogleGenerativeAI(apiKey) : null;
const preferredGeminiModels = process.env.GEMINI_MODEL
  ? [process.env.GEMINI_MODEL]
  : ["gemini-2.5-flash-lite", "gemini-2.5-flash"];
const relevanceCache = new Map<string, { expiresAt: number; urls: string[] }>();
const fallbackQueryCache = new Map<
  string,
  { expiresAt: number; queries: string[] }
>();
const searchCandidatesCache = new Map<
  string,
  { expiresAt: number; candidates: SearchCandidate[] }
>();
const productDetailCache = new Map<
  string,
  { expiresAt: number; product: Product | null }
>();
const queryResultsCache = new Map<
  string,
  { expiresAt: number; products: Product[] }
>();
const RELEVANCE_CACHE_TTL_MS = 1000 * 60 * 60 * 6;
const FALLBACK_QUERY_CACHE_TTL_MS = 1000 * 60 * 60 * 12;
const SEARCH_CANDIDATES_CACHE_TTL_MS = 1000 * 60 * 15;
const PRODUCT_DETAIL_CACHE_TTL_MS = 1000 * 60 * 30;
const QUERY_RESULTS_CACHE_TTL_MS = 1000 * 60 * 15;
const GEMINI_CANDIDATE_LIMIT = 12;
const MAX_PRIMARY_QUERY_VARIANTS = 4;
const MAX_FALLBACK_QUERY_VARIANTS = 2;
const PRIMARY_QUERY_CONCURRENCY = 3;
const FALLBACK_QUERY_CONCURRENCY = 2;

type SearchContext = {
  recipeName?: string;
  recipeIngredients?: string[];
};

type SearchCandidate = {
  url: string;
  name: string;
  availability?: ProductAvailability;
};

function tokenize(value: string) {
  return normalizeSearchText(value).split(/\s+/).filter(Boolean);
}

function buildCandidateNameFromUrl(url: string) {
  return url.replace("/sleva/", "").replace(/-/g, " ").trim();
}

function hasExactShortTokenMatch(query: string, productName: string) {
  const queryTokens = tokenize(query).filter((token) => token.length <= 3);
  if (queryTokens.length === 0) return true;

  const productTokens = new Set(tokenize(productName));
  return queryTokens.every((token) => productTokens.has(token));
}

function containsNegativeTerm(productName: string, negativeTerms: string[]) {
  if (negativeTerms.length === 0) return false;

  const normalizedProductName = normalizeSearchText(productName);
  return negativeTerms.some((negativeTerm) => {
    const normalizedNegativeTerm = normalizeSearchText(negativeTerm);
    return (
      normalizedNegativeTerm.length > 0 &&
      normalizedProductName.includes(normalizedNegativeTerm)
    );
  });
}

function mapUrlsToCandidates(urls: string[], candidates: SearchCandidate[]) {
  const byUrl = new Map(candidates.map((candidate) => [candidate.url, candidate]));
  return urls
    .map((url) => byUrl.get(url))
    .filter((candidate): candidate is SearchCandidate => !!candidate);
}

function hasSaleResults(products: Product[]) {
  return products.some((product) => product.stores.length > 0);
}

function getResultsScore(products: Product[]) {
  return products.reduce((score, product) => {
    if (product.stores.length > 0) {
      return score + 100 + product.stores.length;
    }

    if (product.availability === "not_on_sale") {
      return score + 1;
    }

    return score;
  }, 0);
}

function getCachedRelevantUrls(cacheKey: string) {
  const cached = relevanceCache.get(cacheKey);
  if (!cached) return null;

  if (cached.expiresAt < Date.now()) {
    relevanceCache.delete(cacheKey);
    return null;
  }

  return cached.urls;
}

function getCachedFallbackQueries(cacheKey: string) {
  const cached = fallbackQueryCache.get(cacheKey);
  if (!cached) return null;

  if (cached.expiresAt < Date.now()) {
    fallbackQueryCache.delete(cacheKey);
    return null;
  }

  return cached.queries;
}

function getCachedSearchCandidates(cacheKey: string) {
  const cached = searchCandidatesCache.get(cacheKey);
  if (!cached) return null;

  if (cached.expiresAt < Date.now()) {
    searchCandidatesCache.delete(cacheKey);
    return null;
  }

  return cached.candidates;
}

function getCachedProductDetail(cacheKey: string) {
  const cached = productDetailCache.get(cacheKey);
  if (!cached) return null;

  if (cached.expiresAt < Date.now()) {
    productDetailCache.delete(cacheKey);
    return null;
  }

  return cached.product;
}

function getCachedQueryResults(cacheKey: string) {
  const cached = queryResultsCache.get(cacheKey);
  if (!cached) return null;

  if (cached.expiresAt < Date.now()) {
    queryResultsCache.delete(cacheKey);
    return null;
  }

  return cached.products;
}

async function callGeminiText(prompt: string, maxOutputTokens: number) {
  if (!genAI) return "";

  for (const modelName of preferredGeminiModels) {
    try {
      const model = genAI.getGenerativeModel({
        model: modelName,
        generationConfig: {
          candidateCount: 1,
          maxOutputTokens,
          temperature: 0,
          topP: 0.1,
        },
      });
      const result = await model.generateContent(prompt);
      const text = result.response.text().trim();
      if (text) return text;
    } catch (e) {
      console.log(`Gemini error for model ${modelName}:`, e);
    }
  }

  return "";
}

function buildRelevancePrompt(
  query: string,
  productNames: string[],
  context?: SearchContext,
) {
  const recipeContext =
    context?.recipeName && context.recipeIngredients?.length
      ? `
Kontext receptu:
- Název receptu: ${context.recipeName}
- Všechny ingredience receptu: ${context.recipeIngredients.join(", ")}
- Hledaná položka "${query}" je jedna ingredience z tohoto receptu
- Pokud nějaký produkt dává v kontextu receptu zjevně nesmysl, NEVRACEJ ho
- Například v receptu na overnight oats není "Medium" pivo správný výsledek pro "med"`
      : "";

  return `Uživatel hledá základní ingredienci do receptu: "${query}"${recipeContext}

Zde jsou nalezené produkty (index: název):
${productNames.join("\n")}

Pravidla:
- Vrať pouze produkty které jsou PŘÍMO tato ingredience
- Nevracej produkty které ji jen obsahují jako příchuť nebo součást názvu
- Nevracej produkty které jsou významově mimo kontext receptu
- Například pro "tortilla": vrať tortilla placky, NIKOLI chips, doritos, nachos
- Například pro "kuřecí prsa": vrať kuřecí prsa, NIKOLI nugety, řízky, hotová jídla
- Například pro "mléko": vrať mléko, NIKOLI čokoládové mléko, kefír, jogurt

Vrať POUZE čísla indexů oddělená čárkou, například: 0,2,4
Pokud žádný produkt není relevantní, vrať: -1`;
}

function buildFallbackQueryPrompt(query: string, context?: SearchContext) {
  const recipeContext =
    context?.recipeName && context.recipeIngredients?.length
      ? `
Kontext receptu:
- Název receptu: ${context.recipeName}
- Ingredience receptu: ${context.recipeIngredients.join(", ")}`
      : "";

  return `Uživatel hledá ingredienci "${query}", ale v akčních produktech jsme nenašli vhodný přesný výsledek.${recipeContext}

Navrhni 1 až 3 velmi krátké alternativní vyhledávací dotazy do českého supermarketu tak, aby:
- zůstaly ve stejné kategorii ingredience
- byly co nejbližší původnímu významu
- nepřidávaly nesouvisející produkty
- pomohly najít nejbližší akční variantu, když přesný termín není ve slevě

Příklady:
- "včelí med" -> "med", "med květový"
- "řecký jogurt" -> "jogurt řecký", "bílý jogurt"

Vrať POUZE dotazy, každý na nový řádek. Bez číslování, bez vysvětlení.`;
}

async function filterRelevantProducts(
  query: string,
  candidates: SearchCandidate[],
  context?: SearchContext,
): Promise<SearchCandidate[]> {
  if (candidates.length === 0) return [];

  const negativeTerms = getDictionaryNegativeTerms(query);
  const candidatesWithoutNegativeTerms = candidates.filter(
    (candidate) => !containsNegativeTerm(candidate.name, negativeTerms),
  );
  const lexicallyFilteredCandidates = candidatesWithoutNegativeTerms.filter(
    (candidate) => hasExactShortTokenMatch(query, candidate.name),
  );
  const effectiveCandidates =
    lexicallyFilteredCandidates.length > 0
      ? lexicallyFilteredCandidates
      : candidatesWithoutNegativeTerms.length > 0
        ? candidatesWithoutNegativeTerms
        : candidates;

  const rankedCandidates = [...effectiveCandidates].sort((a, b) => {
    const aName = normalizeSearchText(a.name);
    const bName = normalizeSearchText(b.name);
    const normalizedQuery = normalizeSearchText(query);
    const queryTokens = tokenize(query);

    const scoreCandidate = (candidateName: string, availability?: ProductAvailability) => {
      const candidateTokens = candidateName.split(/\s+/).filter(Boolean);
      let score = availability === "not_on_sale" ? 10 : 40;

      if (candidateName === normalizedQuery) {
        score += 1000;
      }

      if (candidateName.startsWith(normalizedQuery)) {
        score += 300;
      }

      if (candidateName.includes(normalizedQuery)) {
        score += 120;
      }

      const matchedTokens = queryTokens.filter((queryToken) =>
        candidateTokens.some(
          (candidateToken) =>
            candidateToken === queryToken ||
            candidateToken.startsWith(queryToken) ||
            queryToken.startsWith(candidateToken),
        ),
      ).length;

      score += matchedTokens * 90;

      if (matchedTokens === queryTokens.length) {
        score += 220;
      }

      score -= Math.max(candidateTokens.length - queryTokens.length, 0) * 8;
      return score;
    };

    return (
      scoreCandidate(bName, b.availability) -
      scoreCandidate(aName, a.availability)
    );
  });

  if (!genAI || !context?.recipeName) {
    return rankedCandidates.slice(0, 5);
  }

  if (rankedCandidates.length <= 5) {
    return rankedCandidates.slice(0, 5);
  }

  const candidatePool = rankedCandidates.slice(0, GEMINI_CANDIDATE_LIMIT);
  const cacheKey = [
    query.toLowerCase(),
    context?.recipeName?.toLowerCase() ?? "",
    context?.recipeIngredients?.join("|").toLowerCase() ?? "",
    candidatePool.map((candidate) => candidate.url).join("|"),
  ].join("::");
  const cachedUrls = getCachedRelevantUrls(cacheKey);
  if (cachedUrls) return mapUrlsToCandidates(cachedUrls, candidatePool);

  const productNames = candidatePool.map(
    (candidate, i) => `${i}: ${candidate.name}`,
  );

  const prompt = buildRelevancePrompt(query, productNames, context);

  try {
    const text = await callGeminiText(prompt, 24);

    if (!text) {
      const fallbackUrls = rankedCandidates
        .slice(0, 5)
        .map((candidate) => candidate.url);
      relevanceCache.set(cacheKey, {
        expiresAt: Date.now() + RELEVANCE_CACHE_TTL_MS,
        urls: fallbackUrls,
      });
      return mapUrlsToCandidates(fallbackUrls, rankedCandidates);
    }

    if (text.trim() === "-1") {
      relevanceCache.set(cacheKey, {
        expiresAt: Date.now() + RELEVANCE_CACHE_TTL_MS,
        urls: [],
      });
      return [];
    }

    const indices = text
      .split(",")
      .map((value) => Number.parseInt(value.trim(), 10))
      .filter(
        (value) =>
          !Number.isNaN(value) && value >= 0 && value < candidatePool.length,
      );

    if (indices.length === 0) {
      const fallbackUrls = rankedCandidates
        .slice(0, 5)
        .map((candidate) => candidate.url);
      relevanceCache.set(cacheKey, {
        expiresAt: Date.now() + RELEVANCE_CACHE_TTL_MS,
        urls: fallbackUrls,
      });
      return mapUrlsToCandidates(fallbackUrls, rankedCandidates);
    }

    const relevantUrls = indices
      .slice(0, 5)
      .map((index) => candidatePool[index].url);

    relevanceCache.set(cacheKey, {
      expiresAt: Date.now() + RELEVANCE_CACHE_TTL_MS,
      urls: relevantUrls,
    });

    return mapUrlsToCandidates(relevantUrls, candidatePool);
  } catch (e) {
    console.log("Gemini filtering error:", e);
    return rankedCandidates.slice(0, 5);
  }
}

async function suggestFallbackQueries(
  query: string,
  context?: SearchContext,
): Promise<string[]> {
  if (!genAI) return [];

  const cacheKey = [
    query.toLowerCase(),
    context?.recipeName?.toLowerCase() ?? "",
    context?.recipeIngredients?.join("|").toLowerCase() ?? "",
  ].join("::");
  const cachedQueries = getCachedFallbackQueries(cacheKey);
  if (cachedQueries) return cachedQueries;

  const prompt = buildFallbackQueryPrompt(query, context);
  const text = await callGeminiText(prompt, 48);

  const queries = text
    .split("\n")
    .map((value) => value.trim().replace(/^[-*\d.\s]+/, ""))
    .filter(Boolean)
    .filter((value, index, all) => all.indexOf(value) === index)
    .filter((value) => value.toLowerCase() !== query.toLowerCase())
    .slice(0, 3);

  fallbackQueryCache.set(cacheKey, {
    expiresAt: Date.now() + FALLBACK_QUERY_CACHE_TTL_MS,
    queries,
  });

  return queries;
}

async function scrapeSearchCandidates(query: string, headers: HeadersInit) {
  const cacheKey = normalizeSearchText(query);
  const cachedCandidates = getCachedSearchCandidates(cacheKey);
  if (cachedCandidates) return cachedCandidates;

  const searchUrl = `https://www.kupi.cz/hledej?f=${encodeURIComponent(query)}`;
  const searchRes = await fetch(searchUrl, { headers });
  const searchHtml = await searchRes.text();
  const $s = cheerio.load(searchHtml);

  const candidates: SearchCandidate[] = [];
  const seen = new Set<string>();

  $s('a[href*="/sleva/"]').each((_, el) => {
    const href = $s(el).attr("href");
    if (!href || seen.has(href)) return;

    const name = $s(el).text().replace(/\s+/g, " ").trim();
    if (!name) return;

    const cardText = $s(el)
      .closest("section, article, li, div")
      .text()
      .replace(/\s+/g, " ")
      .trim();
    const normalizedCardText = normalizeSearchText(cardText);
    const availability =
      normalizedCardText.includes("neni v akci") ||
      normalizedCardText.includes("aktualne neni ve sleve")
        ? ("not_on_sale" as const)
        : undefined;

    seen.add(href);
    candidates.push({
      url: href,
      name,
      availability,
    });
  });

  searchCandidatesCache.set(cacheKey, {
    expiresAt: Date.now() + SEARCH_CANDIDATES_CACHE_TTL_MS,
    candidates,
  });

  return candidates;
}

async function fetchProductDetail(
  candidate: SearchCandidate,
  headers: HeadersInit,
): Promise<Product | null> {
  if (productDetailCache.has(candidate.url)) {
    return getCachedProductDetail(candidate.url);
  }

  const detailRes = await fetch(`https://www.kupi.cz${candidate.url}`, {
    headers,
  });
  const detailHtml = await detailRes.text();
  const $d = cheerio.load(detailHtml);

  const name =
    $d("h2.blind").first().text().trim() ||
    candidate.name ||
    buildCandidateNameFromUrl(candidate.url);

  const stores: Store[] = [];
  const seen = new Set<string>();

  $d("div.discount_row").each((_, el) => {
    const shopId = $d(el).attr("data-shop") || "";

    const price = $d(el).find("strong.discount_price_value").text().trim();
    const discountPct = $d(el).find("div.discount_percentage").text().trim();
    const originalPrice = (() => {
      const p = parsePrice(price);
      const pct = parseInt(discountPct.replace(/[^0-9]/g, ""));
      if (!pct || !p) return "";
      return (p / (1 - pct / 100)).toFixed(2) + " Kč";
    })();

    const shopName = $d(el)
      .find(".discounts_shop_wrap")
      .text()
      .replace(/\s*\d+\s+nejbližší(ch)?\s+poboče?k?[ay]?/gi, "")
      .trim();

    const pricePerUnit = $d(el).find(".price_per_unit").text().trim();
    const amount = $d(el).find(".amount_percentage").text().trim();
    const validity = $d(el)
      .find(".discounts_validity.valid_discount")
      .text()
      .trim();
    const leafletUrl = $d(el).find("a.btn_link_leaflet").attr("href") || "";
    const key = `${shopId}-${price}`;

    if (price && !seen.has(key)) {
      seen.add(key);
      stores.push({
        shopId,
        shopName,
        price,
        discountPct,
        originalPrice,
        pricePerUnit,
        amount,
        validity,
        leafletUrl,
      });
    }
  });

  let product: Product | null = null;

  if (name && stores.length > 0) {
    const storesWithSavings = estimateStoreSavings(stores);
    product = {
      name,
      url: candidate.url,
      stores: sortStoresByPrice(storesWithSavings),
      availability: "sale",
    };
  } else {
    const detailText = normalizeSearchText($d("body").text());
    const isExplicitlyNotOnSale =
      candidate.availability === "not_on_sale" ||
      detailText.includes("aktualne neni ve sleve") ||
      detailText.includes("neni v akci");

    if (name && isExplicitlyNotOnSale) {
      product = {
        name,
        url: candidate.url,
        stores: [],
        availability: "not_on_sale",
      };
    }
  }

  productDetailCache.set(candidate.url, {
    expiresAt: Date.now() + PRODUCT_DETAIL_CACHE_TTL_MS,
    product,
  });

  return product;
}

async function scrapeProductsForQuery(
  query: string,
  headers: HeadersInit,
  context?: SearchContext,
) {
  const cacheKey = [
    normalizeSearchText(query),
    context?.recipeName?.toLowerCase() ?? "",
    context?.recipeIngredients?.join("|").toLowerCase() ?? "",
  ].join("::");
  const cachedResults = getCachedQueryResults(cacheKey);
  if (cachedResults) return cachedResults;

  const candidates = await scrapeSearchCandidates(query, headers);
  const filteredCandidates = await filterRelevantProducts(
    query,
    candidates,
    context,
  );
  const results = (
    await Promise.all(
      filteredCandidates.map((candidate) => fetchProductDetail(candidate, headers)),
    )
  ).filter((product): product is Product => !!product);

  queryResultsCache.set(cacheKey, {
    expiresAt: Date.now() + QUERY_RESULTS_CACHE_TTL_MS,
    products: results,
  });

  return results;
}

export async function GET(req: NextRequest) {
  const q = req.nextUrl.searchParams.get("q") || "";
  if (!q) return Response.json({ products: [] });
  const recipeName = req.nextUrl.searchParams.get("recipe")?.trim() || "";
  const recipeIngredients = (req.nextUrl.searchParams.get("ingredients") || "")
    .split("|")
    .map((value) => value.trim())
    .filter(Boolean);

  const headers = {
    "User-Agent":
      "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
    "Accept-Language": "cs-CZ,cs;q=0.9",
  };
  const context = {
    recipeName: recipeName || undefined,
    recipeIngredients:
      recipeIngredients.length > 0 ? recipeIngredients : undefined,
  } satisfies SearchContext;

  let resolvedQuery = q;
  let usedFallbackQuery = false;
  let results: Product[] = [];
  let bestScore = -1;
  const triedQueries = new Set<string>();

  async function tryQueries(queries: string[], fallbackPhase: boolean) {
    let foundSaleResults = false;
    const queue = queries.filter((candidateQuery) => {
      const normalizedCandidate = normalizeSearchText(candidateQuery);
      if (!normalizedCandidate || triedQueries.has(normalizedCandidate)) {
        return false;
      }

      triedQueries.add(normalizedCandidate);
      return true;
    });
    const concurrency = fallbackPhase
      ? FALLBACK_QUERY_CONCURRENCY
      : PRIMARY_QUERY_CONCURRENCY;

    for (let index = 0; index < queue.length; index += concurrency) {
      const batch = queue.slice(index, index + concurrency);
      const batchResults = await Promise.all(
        batch.map(async (candidateQuery) => {
          const normalizedCandidate = normalizeSearchText(candidateQuery);
          const candidateResults = await scrapeProductsForQuery(
            candidateQuery,
            headers,
            context,
          );

          return {
            candidateQuery,
            normalizedCandidate,
            candidateResults,
            candidateScore: getResultsScore(candidateResults),
          };
        }),
      );

      for (const batchResult of batchResults) {
        if (batchResult.candidateScore > bestScore) {
          bestScore = batchResult.candidateScore;
          results = batchResult.candidateResults;
          resolvedQuery = batchResult.candidateQuery;
          usedFallbackQuery =
            fallbackPhase ||
            batchResult.normalizedCandidate !== normalizeSearchText(q);
        }

        if (hasSaleResults(batchResult.candidateResults)) {
          foundSaleResults = true;
        }
      }
    }

    return foundSaleResults;
  }

  const foundSaleResults = await tryQueries(
    buildSearchQueryVariants(q).slice(0, MAX_PRIMARY_QUERY_VARIANTS),
    false,
  );

  if (!foundSaleResults) {
    await tryQueries(
      (await suggestFallbackQueries(q, context)).slice(
        0,
        MAX_FALLBACK_QUERY_VARIANTS,
      ),
      true,
    );
  }

  return Response.json({
    products: results,
    count: results.length,
    resolvedQuery,
    usedFallbackQuery,
  });
}
