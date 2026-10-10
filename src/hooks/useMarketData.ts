import { useCallback } from "react";
import { fetchOverview, fetchPriceHistory, fetchTopMarkets } from "../lib/api";
import type { ChartRange } from "../types";
import { useQuery } from "./useQuery";

export function useMarketOverview(refreshToken: number) {
  const queryFn = useCallback((fresh: boolean) => fetchOverview(fresh), []);
  return useQuery("overview", queryFn, refreshToken);
}

export function useTopMarkets(refreshToken: number) {
  const queryFn = useCallback((fresh: boolean) => fetchTopMarkets(fresh), []);
  return useQuery("markets", queryFn, refreshToken);
}

export function usePriceChart(coinId: string, range: ChartRange, refreshToken: number) {
  const queryFn = useCallback(
    (fresh: boolean) => fetchPriceHistory(coinId, range, fresh),
    [coinId, range],
  );
  return useQuery(`chart:${coinId}:${range}`, queryFn, refreshToken);
}
