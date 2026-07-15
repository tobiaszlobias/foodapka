/**
 * Sweep všech preset dotazů (recepty + watchdog) proti běžícímu /api/search.
 * Použití: npx tsx scripts/verify-search.ts [--base http://localhost:3000] [--out report.md]
 */
import { RECIPE_PRESETS } from "../lib/recipes";
import { INGREDIENT_PRESETS } from "../lib/ingredientPresets";

type Store = { shopName: string; price: string };
type Product = { name: string; stores: Store[]; aiFlagged?: boolean };
type SearchResponse = {
  products: Product[];
  count: number;
  debug?: { aiRelevance?: { applied: boolean; flagged: string[] } };
  error?: string;
};

type QueryResult = {
  query: string;
  status: "OK" | "WEAK" | "EMPTY" | "ERROR";
  count: number;
  top5: string[];
  aiFlagged: string[];
  httpStatus?: number;
  errorMessage?: string;
};

function parseArgs() {
  const args = process.argv.slice(2);
  const baseIdx = args.indexOf("--base");
  const outIdx = args.indexOf("--out");
  return {
    base: baseIdx >= 0 ? args[baseIdx + 1] : "http://localhost:3000",
    out: outIdx >= 0 ? args[outIdx + 1] : undefined,
    debug: args.includes("--debug"),
  };
}

function collectQueries(): string[] {
  const queries = new Set<string>();
  for (const recipe of RECIPE_PRESETS) {
    for (const ingredient of recipe.ingredients) {
      if (typeof ingredient === "string") {
        queries.add(ingredient);
      } else {
        queries.add(ingredient.searchQuery || ingredient.name);
      }
    }
  }
  for (const preset of INGREDIENT_PRESETS) {
    queries.add(preset.query);
  }
  return [...queries].filter(Boolean).sort((a, b) => a.localeCompare(b, "cs"));
}

function cheapestLabel(product: Product): string {
  const prices = product.stores
    .map((s) => ({ shopName: s.shopName, value: parseFloat(s.price.replace(/[^\d,.-]/g, "").replace(",", ".")) }))
    .filter((s) => Number.isFinite(s.value) && s.value > 0)
    .sort((a, b) => a.value - b.value);
  if (prices.length === 0) return product.name;
  return `${product.name} (${prices[0].shopName}, ${prices[0].value} Kč)`;
}

async function runQuery(base: string, query: string, debug: boolean): Promise<QueryResult> {
  const url = `${base}/api/search?q=${encodeURIComponent(query)}${debug ? "&debug=1" : ""}`;
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 30_000);
    const res = await fetch(url, { signal: controller.signal });
    clearTimeout(timeout);

    if (!res.ok) {
      return { query, status: "ERROR", count: 0, top5: [], aiFlagged: [], httpStatus: res.status };
    }
    const data: SearchResponse = await res.json();
    if (data.error) {
      return { query, status: "ERROR", count: 0, top5: [], aiFlagged: [], errorMessage: data.error };
    }
    const count = data.count ?? data.products.length;
    const status = count === 0 ? "EMPTY" : count < 5 ? "WEAK" : "OK";
    return {
      query,
      status,
      count,
      top5: data.products.slice(0, 5).map(cheapestLabel),
      aiFlagged: data.debug?.aiRelevance?.flagged ?? [],
    };
  } catch (error) {
    return {
      query,
      status: "ERROR",
      count: 0,
      top5: [],
      aiFlagged: [],
      errorMessage: error instanceof Error ? error.message : String(error),
    };
  }
}

async function runWithConcurrency<T, R>(items: T[], limit: number, fn: (item: T) => Promise<R>): Promise<R[]> {
  const results: R[] = new Array(items.length);
  let next = 0;
  async function worker() {
    while (next < items.length) {
      const index = next++;
      results[index] = await fn(items[index]);
    }
  }
  await Promise.all(Array.from({ length: Math.min(limit, items.length) }, worker));
  return results;
}

function toMarkdown(results: QueryResult[]): string {
  const lines: string[] = [];
  const counts = { OK: 0, WEAK: 0, EMPTY: 0, ERROR: 0 };
  for (const r of results) counts[r.status]++;

  lines.push(`# Search sweep report`, "");
  lines.push(`OK: ${counts.OK} · WEAK: ${counts.WEAK} · EMPTY: ${counts.EMPTY} · ERROR: ${counts.ERROR}`, "");

  for (const r of results) {
    lines.push(`## ${r.status} — "${r.query}" (${r.count})`);
    if (r.errorMessage) lines.push(`Chyba: ${r.errorMessage}`);
    if (r.httpStatus) lines.push(`HTTP: ${r.httpStatus}`);
    for (const name of r.top5) lines.push(`- ${name}`);
    if (r.aiFlagged.length > 0) {
      lines.push(`AI flagged: ${r.aiFlagged.join(", ")}`);
    }
    lines.push("");
  }
  return lines.join("\n");
}

async function main() {
  const { base, out, debug } = parseArgs();
  const queries = collectQueries();
  console.log(`🚀 Sweep ${queries.length} dotazů proti ${base}${debug ? " (s AI debugem)" : ""}`);

  const results = await runWithConcurrency(queries, 4, (q) => runQuery(base, q, debug));

  const report = toMarkdown(results);
  console.log(report);

  if (out) {
    const fs = await import("node:fs/promises");
    await fs.writeFile(out, report, "utf-8");
    console.log(`✅ Report uložen do ${out}`);
  }

  const emptyCount = results.filter((r) => r.status === "EMPTY").length;
  const errorCount = results.filter((r) => r.status === "ERROR").length;
  if (emptyCount > 0 || errorCount > 0) {
    console.log(`❌ ${emptyCount} EMPTY, ${errorCount} ERROR`);
  }
}

main();
