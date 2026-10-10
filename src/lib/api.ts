import axios from "axios";
import type { ChartRange, MarketCoin, MarketOverview, PricePoint } from "../types";

const CACHE_TTL_MS = 60_000;

const client = axios.create({
  baseURL: "https://api.coingecko.com/api/v3",
  timeout: 15_000,
  headers: { Accept: "application/json" },
});

export class ApiError extends Error {
  readonly status: number | null;

  constructor(message: string, status: number | null = null) {
    super(message);
    this.name = "ApiError";
    this.status = status;
  }
}

interface CacheEntry {
  epoch: number;
  expiry: number;
  data: unknown;
}

interface InflightEntry {
  epoch: number;
  promise: Promise<unknown>;
}

let epoch = 0;
const cache = new Map<string, CacheEntry>();
const inflight = new Map<string, InflightEntry>();

export function clearCache(): void {
  epoch += 1;
  cache.clear();
  inflight.clear();
}

function toApiError(error: unknown): ApiError {
  if (error instanceof ApiError) return error;
  if (!axios.isAxiosError(error)) {
    return new ApiError("Something went wrong while loading market data.");
  }
  if (error.code === "ECONNABORTED") {
    return new ApiError("The request timed out. Check your connection and retry.");
  }
  if (!error.response) {
    return new ApiError("Network error. Check your connection and retry.");
  }
  if (error.response.status === 429) {
    return new ApiError("CoinGecko is rate-limiting requests. Wait a moment, then retry.", 429);
  }
  if (error.response.status === 404) {
    return new ApiError("No market data was found for this asset.", 404);
  }
  if (error.response.status >= 500) {
    return new ApiError("CoinGecko is unavailable right now. Retry in a moment.", error.response.status);
  }
  return new ApiError(`The market data request failed (${error.response.status}).`, error.response.status);
}

function wait(ms: number): Promise<void> {
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
}

function rateLimitDelay(error: unknown): number | null {
  if (!axios.isAxiosError(error) || error.response?.status !== 429) return null;
  const header = error.response.headers?.["retry-after"];
  const seconds = Number(header);
  if (Number.isFinite(seconds) && seconds >= 0 && seconds <= 8) {
    return Math.max(seconds * 1000, 500);
  }
  return 1_500;
}

async function fetchWithRateLimitRetry<T>(path: string): Promise<T> {
  try {
    const response = await client.get<T>(path);
    return response.data;
  } catch (error) {
    const delayMs = rateLimitDelay(error);
    if (delayMs === null) throw error;
    await wait(delayMs);
    const response = await client.get<T>(path);
    return response.data;
  }
}

async function getJson<T>(path: string, fresh = false): Promise<T> {
  if (!fresh) {
    const cached = cache.get(path);
    if (cached && cached.epoch === epoch && cached.expiry > Date.now()) {
      return cached.data as T;
    }
    const pending = inflight.get(path);
    if (pending && pending.epoch === epoch) {
      return pending.promise as Promise<T>;
    }
  }

  const startedEpoch = epoch;
  const promise = fetchWithRateLimitRetry<T>(path)
    .then((data) => {
      if (startedEpoch === epoch) {
        cache.set(path, {
          epoch: startedEpoch,
          expiry: Date.now() + CACHE_TTL_MS,
          data,
        });
      }
      return data;
    })
    .catch((error: unknown) => {
      throw toApiError(error);
    })
    .finally(() => {
      const current = inflight.get(path);
      if (current?.promise === promise) inflight.delete(path);
    });

  inflight.set(path, { epoch: startedEpoch, promise });
  return promise as Promise<T>;
}

function unexpected(): ApiError {
  return new ApiError("Unexpected response from the market data service.");
}

function requiredNumber(value: unknown): number {
  if (typeof value !== "number" || !Number.isFinite(value)) throw unexpected();
  return value;
}

function optionalNumber(value: unknown): number | null {
  return typeof value === "number" && Number.isFinite(value) ? value : null;
}

interface GlobalResponse {
  data?: {
    active_cryptocurrencies?: unknown;
    total_market_cap?: Record<string, unknown>;
    total_volume?: Record<string, unknown>;
    market_cap_percentage?: Record<string, unknown>;
    market_cap_change_percentage_24h_usd?: unknown;
    updated_at?: unknown;
  };
}

interface TrendingResponse {
  coins?: Array<{ item?: { symbol?: unknown } }>;
}

interface MarketResponseItem {
  id?: unknown;
  symbol?: unknown;
  name?: unknown;
  image?: unknown;
  current_price?: unknown;
  market_cap?: unknown;
  market_cap_rank?: unknown;
  total_volume?: unknown;
  price_change_percentage_24h?: unknown;
  sparkline_in_7d?: { price?: unknown };
}

interface ChartResponse {
  prices?: unknown;
}

function mapGlobal(payload: GlobalResponse): Omit<MarketOverview, "trendingCount" | "trendingSymbols"> {
  const data = payload.data;
  if (!data) throw unexpected();

  return {
    totalMarketCapUsd: requiredNumber(data.total_market_cap?.usd),
    totalVolumeUsd: requiredNumber(data.total_volume?.usd),
    bitcoinDominance: requiredNumber(data.market_cap_percentage?.btc),
    marketCapChangePercentage24h: optionalNumber(data.market_cap_change_percentage_24h_usd),
    activeCryptocurrencies: requiredNumber(data.active_cryptocurrencies),
    updatedAt: optionalNumber(data.updated_at),
  };
}

function mapTrending(payload: TrendingResponse): { trendingCount: number; trendingSymbols: string[] } {
  if (!Array.isArray(payload.coins)) throw unexpected();
  const symbols = payload.coins
    .map((entry) => entry.item?.symbol)
    .filter((symbol): symbol is string => typeof symbol === "string" && symbol.trim().length > 0)
    .slice(0, 3)
    .map((symbol) => symbol.toUpperCase());

  return { trendingCount: payload.coins.length, trendingSymbols: symbols };
}

function mapMarkets(payload: MarketResponseItem[]): MarketCoin[] {
  if (!Array.isArray(payload)) throw unexpected();

  return payload.flatMap((item) => {
    if (typeof item.id !== "string" || typeof item.name !== "string" || typeof item.symbol !== "string") {
      return [];
    }

    const sparkline = Array.isArray(item.sparkline_in_7d?.price)
      ? item.sparkline_in_7d.price.filter((price): price is number => typeof price === "number" && Number.isFinite(price))
      : [];

    return [
      {
        id: item.id,
        name: item.name,
        symbol: item.symbol,
        image: typeof item.image === "string" ? item.image : "",
        currentPrice: optionalNumber(item.current_price),
        marketCap: optionalNumber(item.market_cap),
        marketCapRank: optionalNumber(item.market_cap_rank),
        totalVolume: optionalNumber(item.total_volume),
        priceChangePercentage24h: optionalNumber(item.price_change_percentage_24h),
        sparkline,
      },
    ];
  });
}

function mapChart(payload: ChartResponse): PricePoint[] {
  if (!Array.isArray(payload.prices)) throw unexpected();

  return payload.prices.flatMap((pair) => {
    if (!Array.isArray(pair) || pair.length < 2) return [];
    const timestamp = pair[0];
    const price = pair[1];
    if (typeof timestamp !== "number" || typeof price !== "number" || !Number.isFinite(price)) return [];
    return [{ timestamp, price }];
  });
}

export async function fetchOverview(fresh = false): Promise<MarketOverview> {
  const global = mapGlobal(await getJson<GlobalResponse>("/global", fresh));
  const trending = mapTrending(await getJson<TrendingResponse>("/search/trending", fresh));
  return { ...global, ...trending };
}

export function fetchTopMarkets(fresh = false): Promise<MarketCoin[]> {
  return getJson<MarketResponseItem[]>(
    "/coins/markets?vs_currency=usd&order=market_cap_desc&per_page=20&page=1&sparkline=true",
    fresh,
  ).then(mapMarkets);
}

export function fetchPriceHistory(coinId: string, range: ChartRange, fresh = false): Promise<PricePoint[]> {
  const path = `/coins/${encodeURIComponent(coinId)}/market_chart?vs_currency=usd&days=${range}`;
  return getJson<ChartResponse>(path, fresh).then(mapChart);
}
