import { LineChart, RefreshCw } from "lucide-react";
import { useState } from "react";
import { KpiSummary } from "./components/KpiSummary";
import { MarketTable, MarketTableSkeleton } from "./components/MarketTable";
import { PriceChartPanel } from "./components/PriceChartPanel";
import { ErrorState } from "./components/Feedback";
import { useMarketOverview, usePriceChart, useTopMarkets } from "./hooks/useMarketData";
import { clearCache } from "./lib/api";
import { cn } from "./lib/cn";
import { formatCount, formatTimestamp, titleFromId } from "./lib/format";
import type { ChartRange, SelectedCoin } from "./types";

const DEFAULT_COIN_ID = "bitcoin";

export default function App() {
  const [refreshToken, setRefreshToken] = useState(0);
  const [selectedId, setSelectedId] = useState(DEFAULT_COIN_ID);
  const [range, setRange] = useState<ChartRange>("7");

  const overview = useMarketOverview(refreshToken);
  const markets = useTopMarkets(refreshToken);
  const chart = usePriceChart(selectedId, range, refreshToken);
  const refreshing = overview.loading || markets.loading || chart.loading;

  const match = markets.data?.find((coin) => coin.id === selectedId) ?? null;
  const selectedCoin: SelectedCoin = match
    ? {
        id: match.id,
        name: match.name,
        symbol: match.symbol,
        image: match.image,
        price: match.currentPrice,
      }
    : {
        id: selectedId,
        name: selectedId === DEFAULT_COIN_ID ? "Bitcoin" : titleFromId(selectedId),
        symbol: selectedId === DEFAULT_COIN_ID ? "btc" : selectedId,
        image: null,
        price: null,
      };

  const refresh = () => {
    clearCache();
    setRefreshToken((value) => value + 1);
  };

  const selectCoin = (id: string) => {
    setSelectedId(id);
    if (!window.matchMedia("(max-width: 1023px)").matches) return;
    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    document.getElementById("price-chart")?.scrollIntoView({
      behavior: reduceMotion ? "auto" : "smooth",
      block: "start",
    });
  };

  return (
    <div className="min-h-screen">
      <a
        href="#main"
        className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-50 focus:rounded-full focus:bg-white focus:px-4 focus:py-2 focus:text-sm focus:font-medium focus:text-zinc-950"
      >
        Skip to content
      </a>

      <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
        <header className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3">
            <div className="grid h-12 w-12 place-items-center rounded-2xl bg-emerald-400/15 text-emerald-300 ring-1 ring-emerald-400/30">
              <LineChart className="h-5 w-5" aria-hidden="true" />
            </div>
            <div>
              <p className="text-[11px] font-medium uppercase tracking-[0.2em] text-emerald-300/80">Financial markets</p>
              <h1 className="text-2xl font-semibold tracking-tight text-white sm:text-[1.7rem]">Market Analytics</h1>
            </div>
          </div>

          <div className="flex items-center justify-between gap-4 sm:justify-end">
            <p className="text-xs text-zinc-500">
              {overview.data?.updatedAt
                ? `Updated ${formatTimestamp(overview.data.updatedAt)}`
                : overview.loading
                  ? "Fetching market data…"
                  : "Market data unavailable"}
            </p>
            <button type="button" onClick={refresh} disabled={refreshing} className="btn-ghost">
              <RefreshCw className={cn("h-4 w-4", refreshing && "animate-spin")} aria-hidden="true" />
              Refresh
            </button>
          </div>
        </header>

        <main id="main" className="mt-8 space-y-6">
          <KpiSummary query={overview} />
          <PriceChartPanel coin={selectedCoin} range={range} onRangeChange={setRange} query={chart} />

          {markets.loading && !markets.data ? <MarketTableSkeleton /> : null}
          {markets.error && !markets.data ? <ErrorState error={markets.error} onRetry={markets.retry} /> : null}
          {markets.data ? (
            <MarketTable
              coins={markets.data}
              loading={markets.loading}
              error={markets.error}
              onRetry={markets.retry}
              selectedId={selectedId}
              onSelect={selectCoin}
            />
          ) : null}
        </main>

        <footer className="mt-8 flex flex-col gap-1 text-xs text-zinc-500 sm:flex-row sm:items-center sm:justify-between">
          <p>
            Prices and statistics from{" "}
            <a
              href="https://www.coingecko.com"
              target="_blank"
              rel="noreferrer"
              className="underline decoration-white/20 underline-offset-2 hover:text-zinc-300"
            >
              CoinGecko
            </a>
            . Figures can be delayed.
          </p>
          {overview.data ? <p>{formatCount(overview.data.activeCryptocurrencies)} active assets tracked</p> : null}
        </footer>
      </div>
    </div>
  );
}
