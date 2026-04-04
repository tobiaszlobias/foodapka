import rawSearchDictionary from "@/data/search_dictionary.json";

export type SearchDictionaryEntry = {
  label: string;
  category: string;
  aliases: string[];
  search_terms: string[];
  negative_terms: string[];
};

type PreparedSearchDictionaryEntry = SearchDictionaryEntry & {
  key: string;
  normalizedLabel: string;
  normalizedAliases: string[];
  normalizedSearchTerms: string[];
  normalizedNegativeTerms: string[];
  normalizedKeywords: string[];
};

const GENERIC_QUERY_TOKENS = new Set([
  "maso",
  "potravina",
  "potraviny",
  "jidlo",
  "produkt",
  "produkty",
  "surovina",
  "suroviny",
  "napoj",
  "napoje",
  "akce",
  "sleva",
]);

const LEGACY_PHRASE_VARIANTS: Record<string, string[]> = {
  kure: ["kuřecí", "kuřecí maso", "kuřecí prsa"],
  kureci: ["kuře", "kuřecí maso", "kuřecí prsa"],
  "maso kureci": ["kuřecí", "kuřecí maso", "kuřecí prsa"],
  "kureci maso": ["kuřecí", "kuřecí prsa", "kuře"],
  chleba: ["chléb"],
  chleb: ["chleba"],
  hrozno: ["hroznové víno"],
  hrozny: ["hroznové víno"],
  rohlik: ["rohlík"],
  mliko: ["mléko"],
};

const LEGACY_TOKEN_VARIANTS: Record<string, string[]> = {
  kure: ["kuře", "kuřecí", "kuřecí maso"],
  kureci: ["kuřecí", "kuře", "kuřecí maso"],
  chleba: ["chléb"],
  chleb: ["chleba"],
  hrozno: ["hroznové víno"],
  hrozny: ["hroznové víno"],
  rohlik: ["rohlík"],
  mliko: ["mléko"],
};

const searchDictionary = rawSearchDictionary as Record<
  string,
  SearchDictionaryEntry
>;

export function normalizeSearchText(value: string) {
  return value
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

function uniq<T>(values: T[]) {
  return [...new Set(values)];
}

function dedupeQueries(queries: string[]) {
  const seen = new Set<string>();

  return queries
    .map((query) => query.trim().replace(/\s+/g, " "))
    .filter(Boolean)
    .filter((query) => {
      const normalized = normalizeSearchText(query);
      if (!normalized || seen.has(normalized)) {
        return false;
      }

      seen.add(normalized);
      return true;
    });
}

function flatMapArray<T, R>(values: T[], mapper: (value: T) => R[]) {
  return values.reduce<R[]>((accumulator, value) => {
    accumulator.push(...mapper(value));
    return accumulator;
  }, []);
}

function tokenizeOriginalQuery(query: string) {
  return query.trim().split(/\s+/).filter(Boolean);
}

function tokenizeNormalized(value: string) {
  return normalizeSearchText(value).split(/\s+/).filter(Boolean);
}

function buildCompactQuery(tokens: string[]) {
  return tokens
    .filter((token) => !GENERIC_QUERY_TOKENS.has(normalizeSearchText(token)))
    .join(" ");
}

function hasTokenPrefixCoverage(queryTokens: string[], candidateTokens: string[]) {
  if (queryTokens.length === 0 || candidateTokens.length === 0) {
    return false;
  }

  return queryTokens.every((queryToken) =>
    candidateTokens.some(
      (candidateToken) =>
        candidateToken === queryToken ||
        candidateToken.startsWith(queryToken) ||
        queryToken.startsWith(candidateToken),
    ),
  );
}

const preparedSearchDictionaryEntries: PreparedSearchDictionaryEntry[] =
  Object.entries(searchDictionary).map(([key, value]) => {
    const normalizedLabel = normalizeSearchText(value.label);
    const normalizedAliases = uniq(
      value.aliases.map((alias) => normalizeSearchText(alias)).filter(Boolean),
    );
    const normalizedSearchTerms = uniq(
      value.search_terms
        .map((searchTerm) => normalizeSearchText(searchTerm))
        .filter(Boolean),
    );
    const normalizedNegativeTerms = uniq(
      value.negative_terms
        .map((negativeTerm) => normalizeSearchText(negativeTerm))
        .filter(Boolean),
    );

    return {
      ...value,
      key,
      normalizedLabel,
      normalizedAliases,
      normalizedSearchTerms,
      normalizedNegativeTerms,
      normalizedKeywords: uniq([
        normalizedLabel,
        ...normalizedAliases,
        ...normalizedSearchTerms,
      ]),
    };
  });

const POPULAR_SEARCH_HINTS = dedupeQueries([
  "kuře",
  "kuřecí",
  "kuřecí prsa",
  "mléko",
  "mléko polotučné",
  "mléko trvanlivé",
  "chléb",
  "chleba",
  "rohlík",
  "banán",
  "jablka",
  "hroznové víno",
  "vejce",
  "řecký jogurt",
  "eidam",
  "šunka",
  "rýže",
  "těstoviny",
  "brambory",
  "rajčata",
  "okurka",
  "paprika",
  ...flatMapArray(Object.values(searchDictionary), (entry) => [
    entry.label,
    ...entry.search_terms.slice(0, 2),
  ]),
]);

function scoreDictionaryEntry(
  entry: PreparedSearchDictionaryEntry,
  query: string,
) {
  const normalizedQuery = normalizeSearchText(query);
  if (!normalizedQuery) return 0;

  const queryTokens = tokenizeNormalized(query);
  let score = 0;

  if (entry.normalizedAliases.includes(normalizedQuery)) {
    score = Math.max(score, 1200);
  }

  if (entry.normalizedSearchTerms.includes(normalizedQuery)) {
    score = Math.max(score, 1180);
  }

  if (entry.normalizedLabel === normalizedQuery) {
    score = Math.max(score, 1160);
  }

  if (
    entry.normalizedAliases.some((alias) => alias.startsWith(normalizedQuery))
  ) {
    score = Math.max(score, 1040);
  }

  if (
    entry.normalizedSearchTerms.some((term) => term.startsWith(normalizedQuery))
  ) {
    score = Math.max(score, 1020);
  }

  if (
    entry.normalizedKeywords.some((keyword) => keyword.includes(normalizedQuery))
  ) {
    score = Math.max(score, 940);
  }

  if (
    queryTokens.length > 0 &&
    entry.normalizedKeywords.some((keyword) =>
      hasTokenPrefixCoverage(queryTokens, tokenizeNormalized(keyword)),
    )
  ) {
    score = Math.max(score, 900 + queryTokens.length * 10);
  }

  return score;
}

function dedupeDictionaryEntries(entries: PreparedSearchDictionaryEntry[]) {
  const seen = new Set<string>();

  return entries.filter((entry) => {
    if (seen.has(entry.key)) {
      return false;
    }

    seen.add(entry.key);
    return true;
  });
}

function findDictionaryEntries(query: string, limit = 6) {
  const normalizedQuery = normalizeSearchText(query);
  if (!normalizedQuery) return [];

  return preparedSearchDictionaryEntries
    .map((entry) => ({
      entry,
      score: scoreDictionaryEntry(entry, query),
    }))
    .filter((item) => item.score > 0)
    .sort((a, b) => {
      if (b.score !== a.score) {
        return b.score - a.score;
      }

      return a.entry.label.localeCompare(b.entry.label, "cs");
    })
    .slice(0, limit)
    .map((item) => item.entry);
}

function hasExactDictionaryMatch(
  entry: PreparedSearchDictionaryEntry,
  queries: string[],
) {
  return queries.some((query) => {
    const normalizedQuery = normalizeSearchText(query);
    if (!normalizedQuery) return false;

    return (
      entry.normalizedLabel === normalizedQuery ||
      entry.normalizedAliases.includes(normalizedQuery) ||
      entry.normalizedSearchTerms.includes(normalizedQuery)
    );
  });
}

function collectDictionaryEntries(queries: string[], limit = 6) {
  return dedupeDictionaryEntries(
    flatMapArray(queries, (query) => findDictionaryEntries(query, limit)),
  );
}

function hasStandaloneDictionaryMatch(query: string) {
  const normalizedQuery = normalizeSearchText(query);
  if (!normalizedQuery) return false;

  return preparedSearchDictionaryEntries.some(
    (entry) =>
      entry.normalizedLabel === normalizedQuery ||
      entry.normalizedAliases.includes(normalizedQuery) ||
      entry.normalizedSearchTerms.includes(normalizedQuery),
  );
}

function buildStandaloneTokenVariants(tokens: string[]) {
  if (tokens.length < 2) return [];

  const variants: string[] = [];

  tokens.forEach((token) => {
    const normalizedToken = normalizeSearchText(token);
    if (!normalizedToken || GENERIC_QUERY_TOKENS.has(normalizedToken)) {
      return;
    }

    if (hasStandaloneDictionaryMatch(token)) {
      variants.push(token);
    }

    const legacyTokenVariants = LEGACY_TOKEN_VARIANTS[normalizedToken] ?? [];
    legacyTokenVariants.forEach((variant) => {
      variants.push(variant);
    });
  });

  return dedupeQueries(variants);
}

function buildDictionaryVariants(
  entries: PreparedSearchDictionaryEntry[],
  exactMatch: boolean,
) {
  return flatMapArray(entries, (entry) => {
    if (exactMatch) {
      return [entry.label, ...entry.aliases, ...entry.search_terms];
    }

    return [entry.label, ...entry.search_terms.slice(0, 3), ...entry.aliases.slice(0, 2)];
  });
}

export function buildSearchQueryVariants(query: string) {
  const trimmedQuery = query.trim();
  if (!trimmedQuery) return [];

  const tokens = tokenizeOriginalQuery(trimmedQuery);
  const normalizedTokens = tokens.map(normalizeSearchText);
  const normalizedQuery = normalizeSearchText(trimmedQuery);
  const compactQuery = buildCompactQuery(tokens);
  const compactTokens = compactQuery ? tokenizeOriginalQuery(compactQuery) : [];
  const variants = [trimmedQuery];

  if (tokens.length === 2) {
    variants.push([tokens[1], tokens[0]].join(" "));
  }

  if (compactQuery && compactQuery !== trimmedQuery) {
    variants.push(compactQuery);
  }

  if (normalizedTokens.includes("maso") && compactTokens.length === 1) {
    variants.push(`${compactTokens[0]} maso`);
  }

  variants.push(...(LEGACY_PHRASE_VARIANTS[normalizedQuery] ?? []));
  variants.push(...buildStandaloneTokenVariants(tokens));

  normalizedTokens.forEach((normalizedToken, index) => {
    const tokenVariants = LEGACY_TOKEN_VARIANTS[normalizedToken] ?? [];

    tokenVariants.forEach((tokenVariant) => {
      const nextTokens = [...tokens];
      nextTokens[index] = tokenVariant;
      variants.push(nextTokens.join(" "));

      if (compactTokens.length > 0 && compactTokens.length < tokens.length) {
        const nextCompactTokens = [...compactTokens];
        const compactIndex = compactTokens.findIndex(
          (token) => normalizeSearchText(token) === normalizedToken,
        );

        if (compactIndex >= 0) {
          nextCompactTokens[compactIndex] = tokenVariant;
          variants.push(nextCompactTokens.join(" "));
        }
      }
    });
  });

  const dictionaryLookupQueries = dedupeQueries([trimmedQuery, compactQuery]);
  const matchedEntries = collectDictionaryEntries(dictionaryLookupQueries, 6);
  const exactEntries = matchedEntries.filter((entry) =>
    hasExactDictionaryMatch(entry, dictionaryLookupQueries),
  );
  const dictionaryVariantSource =
    exactEntries.length > 0 ? exactEntries : matchedEntries.slice(0, 4);

  variants.push(
    ...buildDictionaryVariants(
      dictionaryVariantSource,
      exactEntries.length > 0,
    ),
  );

  return dedupeQueries(variants);
}

export function buildAutocompleteSuggestions(query: string, limit = 6) {
  const trimmedQuery = query.trim();
  if (trimmedQuery.length < 2) return [];

  const normalizedQuery = normalizeSearchText(trimmedQuery);
  const directVariants = buildSearchQueryVariants(trimmedQuery);
  const dictionarySuggestions = flatMapArray(
    collectDictionaryEntries([trimmedQuery], limit),
    (entry) => [entry.label, ...entry.search_terms.slice(0, 2)],
  );

  const matchedPopularHints = POPULAR_SEARCH_HINTS.filter((hint) => {
    const normalizedHint = normalizeSearchText(hint);
    return (
      normalizedHint.includes(normalizedQuery) ||
      normalizedQuery.includes(normalizedHint)
    );
  });

  return dedupeQueries([
    ...dictionarySuggestions,
    ...directVariants,
    ...matchedPopularHints,
  ])
    .filter((suggestion) => normalizeSearchText(suggestion) !== normalizedQuery)
    .slice(0, limit);
}

export function getDictionaryNegativeTerms(query: string, limit = 12) {
  const trimmedQuery = query.trim();
  if (!trimmedQuery) return [];

  const tokens = tokenizeOriginalQuery(trimmedQuery);
  const compactQuery = buildCompactQuery(tokens);
  const dictionaryLookupQueries = dedupeQueries([trimmedQuery, compactQuery]);
  const matchedEntries = collectDictionaryEntries(dictionaryLookupQueries, 6);
  const exactEntries = matchedEntries.filter((entry) =>
    hasExactDictionaryMatch(entry, dictionaryLookupQueries),
  );
  const sourceEntries =
    exactEntries.length > 0 ? exactEntries : matchedEntries.slice(0, 4);

  return dedupeQueries(
    flatMapArray(sourceEntries, (entry) => entry.negative_terms),
  ).slice(0, limit);
}
