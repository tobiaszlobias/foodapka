import { FOODORA_STORE_CONFIGS, type FoodoraStoreConfig } from "@/data/foodoraStores";
import {
  cleanProductName,
  formatDiscountPercent,
  formatPrice,
  normalizeText,
  scoreProductMatch,
  type Product,
} from "@/lib/food";
import { SCRAPER_HEADERS } from "@/lib/scrapers/shared";

const FOODORA_GRAPHQL_URL = "https://cz.fd-api.com/api/v5/graphql";
const FOODORA_GRAPHQL_VERSION = "GROCERIES-MENU-MICROFRONTEND.26.13.0000";
const FOODORA_BRAND = "fo-eu";
const FOODORA_GLOBAL_ENTITY_ID = "DJ_CZ";
const FOODORA_LANGUAGE_CODE = "cs";
const FOODORA_LOCALE = "cs_CZ";
const FOODORA_ATTRIBUTES = [
  "baseContentValue",
  "baseUnit",
  "freshnessGuaranteeInDays",
  "maximumSalesQuantity",
  "minPriceLastMonth",
  "pricePerBaseUnit",
  "sku",
  "nutri_grade",
  "sugar_level",
] as const;

const FOODORA_SEARCH_QUERY = `
    fragment ProductFields on Product {
        attributes(keys: ${"$"}attributes) {
            key
            value
        }
        activeCampaigns {
            benefitQuantity
            cartItemUsageLimit
            description
            discountType
            discountValue
            endTime
            id
            isAutoAddable
            isBenefit
            isTrigger
            name
            teaserFormat
            totalTriggerThresholdFloat
            triggerQuantity
            type
        }
        badges
        description
        favourite
        globalCatalogID
        isAvailable
        name
        nmrAdID
        originalPrice
        packagingCharge
        parentID
        price
        productBadges {
            text
            type
            variant
        }
        productID
        stockAmount
        stockPrediction
        tags
        type
        urls
        vendorID
        weightableAttributes {
            weightedOriginalPrice
            weightedPrice
            weightValue {
                unit
                value
            }
        }
    }

    query getSearchProducts(
        ${"$"}attributes: [String!]
        ${"$"}brand: String!
        ${"$"}config: String
        ${"$"}userCode: String
        ${"$"}globalEntityId: String
        ${"$"}languageCode: String!
        ${"$"}limit: Int!
        ${"$"}locale: String!
        ${"$"}offset: Int!
        ${"$"}query: String!
        ${"$"}vendors: [VendorInformation!]!
        ${"$"}verticalTypes: [String!]!
    ) {
        searchProducts(
            input: {
                brand: ${"$"}brand
                config: ${"$"}config
                customerID: ${"$"}userCode
                globalEntityID: ${"$"}globalEntityId
                languageCode: ${"$"}languageCode
                limit: ${"$"}limit
                locale: ${"$"}locale
                offset: ${"$"}offset
                query: ${"$"}query
                vendors: ${"$"}vendors
                verticalTypes: ${"$"}verticalTypes
            }
        ) {
            itemCounts {
                total
            }
            products {
                items {
                    payload {
                        ...ProductFields
                    }
                }
            }
            promoted {
                itemCounts {
                    total
                }
                products {
                    items {
                        nmrAdID
                        payload {
                            ...ProductFields
                        }
                    }
                }
            }
            requestID
        }
    }
`;

type FoodoraAttribute = {
  key?: string;
  value?: string;
};

type FoodoraPayload = {
  attributes?: FoodoraAttribute[];
  description?: string;
  globalCatalogID?: string;
  isAvailable?: boolean;
  name?: string;
  originalPrice?: number;
  price?: number;
  productID?: string;
  urls?: string[];
  vendorID?: string;
};

type FoodoraSearchItem = {
  nmrAdID?: string;
  payload?: FoodoraPayload | null;
};

type FoodoraSearchResponse = {
  data?: {
    searchProducts?: {
      products?: {
        items?: FoodoraSearchItem[];
      };
      promoted?: {
        products?: {
          items?: FoodoraSearchItem[];
        };
      };
    };
  };
  errors?: Array<{ message?: string }>;
};

type FoodoraCandidate = {
  id: string;
  name: string;
  price: number;
  originalPrice: number | null;
  pricePerUnit: string;
};

function buildSearchUrl(searchUrl: string, query: string) {
  return `${searchUrl}${encodeURIComponent(query)}`;
}

function readAttributeMap(attributes: FoodoraAttribute[] | undefined) {
  return (attributes ?? []).reduce<Record<string, string>>((accumulator, attribute) => {
    if (!attribute.key || typeof attribute.value !== "string") return accumulator;
    accumulator[attribute.key] = attribute.value;
    return accumulator;
  }, {});
}

function formatFoodoraUnitPrice(attributes: FoodoraAttribute[] | undefined) {
  const attributeMap = readAttributeMap(attributes);
  const baseUnit = attributeMap.baseUnit?.trim();
  const rawPrice = attributeMap.pricePerBaseUnit?.replace(",", ".");
  const pricePerBaseUnit = rawPrice ? Number(rawPrice) : Number.NaN;

  if (!baseUnit || !Number.isFinite(pricePerBaseUnit)) return "";
  return `${formatPrice(pricePerBaseUnit)} / ${baseUnit}`;
}

function mapFoodoraItemToCandidate(item: FoodoraSearchItem) {
  const payload = item.payload;
  if (!payload || payload.isAvailable === false) return null;
  if (!payload.name || typeof payload.price !== "number") return null;

  const id =
    payload.productID ||
    payload.globalCatalogID ||
    `${normalizeText(payload.name)}|${payload.vendorID ?? "foodora"}`;

  return {
    id,
    name: payload.name,
    price: payload.price,
    originalPrice:
      typeof payload.originalPrice === "number" &&
      payload.originalPrice > payload.price
        ? payload.originalPrice
        : null,
    pricePerUnit: formatFoodoraUnitPrice(payload.attributes),
  } satisfies FoodoraCandidate;
}

function dedupeFoodoraCandidates(candidates: FoodoraCandidate[], query: string) {
  const deduped = new Map<string, FoodoraCandidate>();

  candidates.forEach((candidate) => {
    if (scoreProductMatch(candidate.name, query) <= 0) return;

    const key = `${candidate.id}|${normalizeText(cleanProductName(candidate.name))}`;
    const existing = deduped.get(key);

    if (!existing || candidate.price < existing.price) {
      deduped.set(key, candidate);
    }
  });

  return Array.from(deduped.values())
    .sort((left, right) => {
      const scoreDelta = scoreProductMatch(right.name, query) - scoreProductMatch(left.name, query);
      if (scoreDelta !== 0) return scoreDelta;
      return left.price - right.price;
    })
    .slice(0, 10);
}

function mapCandidatesToProducts(
  candidates: FoodoraCandidate[],
  storeConfig: FoodoraStoreConfig,
  resultUrl: string,
) {
  return candidates.map((candidate) => {
    // Create unique URL for each product using product ID
    const productUrl = candidate.id.includes('|') 
      ? resultUrl // Fallback URL if ID is composite
      : `${resultUrl}&product=${encodeURIComponent(candidate.id)}`;
    
    return {
      name: candidate.name,
      url: productUrl,
      stores: [
        {
          shopId: `foodora-${storeConfig.vendorCode}`,
          shopName: storeConfig.chainName,
          price: formatPrice(candidate.price),
          pricePerUnit: candidate.pricePerUnit,
          amount: formatDiscountPercent(candidate.price, candidate.originalPrice),
          validity: "",
          leafletUrl: resultUrl,
          source: "foodora" as const,
          sourceLabel: "Foodora",
          isSale:
            candidate.originalPrice !== null &&
            Number.isFinite(candidate.originalPrice) &&
            candidate.originalPrice > candidate.price,
        },
      ],
    } satisfies Product;
  });
}

async function fetchFoodoraProducts(query: string, storeConfig: FoodoraStoreConfig) {
  // Generate Perseus tracking IDs
  const timestamp = Date.now();
  const randomId = () => Math.random().toString(36).substring(2, 20);
  const perseusClientId = `${timestamp}.${randomId()}`;
  const perseusSessionId = `${timestamp}.${randomId()}`;

  const response = await fetch(FOODORA_GRAPHQL_URL, {
    method: "POST",
    headers: {
      ...SCRAPER_HEADERS,
      Accept: "application/json",
      "Content-Type": "application/json;charset=UTF-8",
      Origin: "https://www.foodora.cz",
      Referer: "https://www.foodora.cz/",
      "X-Requested-With": "XMLHttpRequest",
      "X-Global-Entity-Id": FOODORA_GLOBAL_ENTITY_ID,
      "apollographql-client-name": "web",
      "apollographql-client-version": FOODORA_GRAPHQL_VERSION,
      "x-apollo-operation-name": "getSearchProducts",
      "x-pd-language-id": "3",
      "perseus-client-id": perseusClientId,
      "perseus-session-id": perseusSessionId,
      platform: "web",
    },
    cache: "no-store",
    body: JSON.stringify({
      query: FOODORA_SEARCH_QUERY,
      variables: {
        attributes: FOODORA_ATTRIBUTES,
        brand: FOODORA_BRAND,
        config: null,
        globalEntityId: FOODORA_GLOBAL_ENTITY_ID,
        languageCode: FOODORA_LANGUAGE_CODE,
        limit: 24,
        locale: FOODORA_LOCALE,
        offset: 0,
        query,
        vendors: [{ id: storeConfig.vendorCode }],
        verticalTypes: [storeConfig.verticalType],
      },
    }),
  });

  if (!response.ok) {
    throw new Error(`Foodora HTTP ${response.status} for ${storeConfig.chainName}`);
  }

  return (await response.json()) as FoodoraSearchResponse;
}

async function searchFoodoraStore(query: string, storeConfig: FoodoraStoreConfig) {
  const resultUrl = buildSearchUrl(storeConfig.searchUrl, query);
  const payload = await fetchFoodoraProducts(query, storeConfig);
  const searchProducts = payload.data?.searchProducts;

  if (!searchProducts) {
    if (payload.errors?.length) {
      throw new Error(
        `Foodora GraphQL failed for ${storeConfig.chainName}: ${payload.errors
          .map((error) => error.message)
          .filter(Boolean)
          .join(", ")}`,
      );
    }

    return [];
  }

  const candidates = dedupeFoodoraCandidates(
    [
      ...(searchProducts.promoted?.products?.items ?? []),
      ...(searchProducts.products?.items ?? []),
    ]
      .map(mapFoodoraItemToCandidate)
      .filter((candidate): candidate is FoodoraCandidate => Boolean(candidate)),
    query,
  );

  return mapCandidatesToProducts(candidates, storeConfig, resultUrl);
}

export async function searchFoodoraProducts(query: string) {
  const storeResults = await Promise.allSettled(
    FOODORA_STORE_CONFIGS.map((store) => searchFoodoraStore(query, store)),
  );

  return storeResults.reduce<Product[]>((accumulator, result) => {
    if (result.status === "fulfilled") {
      accumulator.push(...result.value);
    }
    return accumulator;
  }, []);
}
