export const CHART_RANGES = [
  { id: "1", label: "24H" },
  { id: "7", label: "7D" },
  { id: "30", label: "30D" },
  { id: "365", label: "1Y" },
] as const;

export type ChartRange = (typeof CHART_RANGES)[number]["id"];

export interface MarketOverview {
  totalMarketCapUsd: number;
  marketCapChangePercentage24h: number | null;
  totalVolumeUsd: number;
  bitcoinDominance: number;
  activeCryptocurrencies: number;
  trendingCount: number;
  trendingSymbols: string[];
  updatedAt: number | null;
}

export interface MarketCoin {
  id: string;
  symbol: string;
  name: string;
  image: string;
  currentPrice: number | null;
  marketCap: number | null;
  marketCapRank: number | null;
  totalVolume: number | null;
  priceChangePercentage24h: number | null;
  sparkline: number[];
}

export interface PricePoint {
  timestamp: number;
  price: number;
}

export interface SelectedCoin {
  id: string;
  name: string;
  symbol: string;
  image: string | null;
  price: number | null;
}
