import { Search, X } from "lucide-react";
import { useMemo, useState } from "react";
import type { ApiError } from "../lib/api";
import { cn } from "../lib/cn";
import { formatCompactUsd, formatExactPrice } from "../lib/format";
import type { MarketCoin } from "../types";
import { ChangeBadge } from "./ChangeBadge";
import { CoinAvatar } from "./CoinAvatar";
import { InlineAlert } from "./Feedback";
import { Sparkline } from "./Sparkline";

interface MarketTableProps {
  coins: MarketCoin[];
  loading: boolean;
  error: ApiError | null;
  onRetry: () => void;
  selectedId: string;
  onSelect: (id: string) => void;
}

function displayMoney(value: number | null, compact = false): string {
  if (value === null) return "—";
  return compact ? formatCompactUsd(value) : formatExactPrice(value);
}

export function MarketTable({ coins, loading, error, onRetry, selectedId, onSelect }: MarketTableProps) {
  const [query, setQuery] = useState("");
  const needle = query.trim().toLowerCase();

  const visible = useMemo(() => {
    if (!needle) return coins;
    return coins.filter(
      (coin) => coin.name.toLowerCase().includes(needle) || coin.symbol.toLowerCase().includes(needle),
    );
  }, [coins, needle]);

  return (
    <section className="panel" aria-busy={loading}>
      <div className="flex flex-col gap-4 p-5 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h2 className="text-lg font-semibold tracking-tight text-white">Top assets</h2>
          <p className="mt-1 text-sm text-zinc-500">
            {needle ? `${visible.length} of ${coins.length} assets` : "Top 20 by market cap. Select a row to chart it."}
          </p>
        </div>
        <label className="relative block w-full sm:w-80">
          <span className="sr-only">Search by coin name or symbol</span>
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-500" aria-hidden="true" />
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search name or symbol"
            autoComplete="off"
            spellCheck={false}
            className="w-full rounded-xl border border-white/10 bg-zinc-950 py-2.5 pl-10 pr-10 text-sm text-zinc-100 outline-none ring-emerald-400/40 placeholder:text-zinc-600 focus:ring-2"
          />
          {query ? (
            <button
              type="button"
              onClick={() => setQuery("")}
              aria-label="Clear search"
              className="absolute right-2 top-1/2 grid h-7 w-7 -translate-y-1/2 place-items-center rounded-full text-zinc-400 hover:bg-white/5 hover:text-zinc-100"
            >
              <X className="h-4 w-4" />
            </button>
          ) : null}
        </label>
      </div>

      {loading && coins.length > 0 ? <p className="px-5 pb-3 text-xs text-zinc-500">Updating markets…</p> : null}
      {error ? (
        <div className="px-5 pb-4">
          <InlineAlert error={error} onRetry={onRetry} />
        </div>
      ) : null}

      <div className="scrollbar-thin overflow-x-auto">
        <table className="w-full min-w-[880px] border-collapse text-left">
          <caption className="sr-only">
            Top 20 cryptocurrencies by market capitalization. Activate a row to update the price chart.
          </caption>
          <thead>
            <tr className="border-y border-white/10 text-xs uppercase tracking-wide text-zinc-500">
              <th scope="col" className="px-5 py-3 font-medium">
                Rank
              </th>
              <th scope="col" className="px-3 py-3 font-medium">
                Asset
              </th>
              <th scope="col" className="px-3 py-3 text-right font-medium">
                Price
              </th>
              <th scope="col" className="px-3 py-3 text-right font-medium">
                24h Change
              </th>
              <th scope="col" className="px-3 py-3 text-right font-medium">
                24h Volume
              </th>
              <th scope="col" className="px-3 py-3 text-right font-medium">
                Market Cap
              </th>
              <th scope="col" className="px-5 py-3 text-right font-medium">
                7D
              </th>
            </tr>
          </thead>
          <tbody>
            {visible.length === 0 ? (
              <tr>
                <td colSpan={7} className="px-5 py-16 text-center text-sm text-zinc-400">
                  No assets match “{query.trim()}”.
                </td>
              </tr>
            ) : (
              visible.map((coin) => {
                const selected = coin.id === selectedId;
                return (
                  <tr
                    key={coin.id}
                    tabIndex={0}
                    aria-selected={selected}
                    onClick={() => onSelect(coin.id)}
                    onKeyDown={(event) => {
                      if (event.key === "Enter" || event.key === " ") {
                        event.preventDefault();
                        onSelect(coin.id);
                      }
                    }}
                    className={cn(
                      "cursor-pointer border-b border-white/5 outline-none transition-colors last:border-0 focus-visible:bg-white/5",
                      selected ? "bg-emerald-400/10" : "hover:bg-white/[0.035]",
                    )}
                  >
                    <td className="relative px-5 py-3 font-mono text-sm text-zinc-500">
                      {selected ? (
                        <span className="absolute bottom-2 left-0 top-2 w-0.5 rounded-full bg-emerald-400" aria-hidden="true" />
                      ) : null}
                      {coin.marketCapRank ?? "—"}
                    </td>
                    <td className="px-3 py-3">
                      <div className="flex items-center gap-3">
                        <CoinAvatar image={coin.image} symbol={coin.symbol} size="sm" />
                        <div className="min-w-0">
                          <p className="truncate font-medium text-zinc-100">{coin.name}</p>
                          <p className="text-xs uppercase tracking-wide text-zinc-500">{coin.symbol}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-3 py-3 text-right font-mono text-sm text-zinc-100">
                      {displayMoney(coin.currentPrice)}
                    </td>
                    <td className="px-3 py-3 text-right">
                      <ChangeBadge value={coin.priceChangePercentage24h} />
                    </td>
                    <td className="px-3 py-3 text-right font-mono text-sm text-zinc-300">
                      {displayMoney(coin.totalVolume, true)}
                    </td>
                    <td className="px-3 py-3 text-right font-mono text-sm text-zinc-300">
                      {displayMoney(coin.marketCap, true)}
                    </td>
                    <td className="px-5 py-3">
                      <div className="flex justify-end">
                        <Sparkline values={coin.sparkline} />
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </section>
  );
}

export function MarketTableSkeleton() {
  return (
    <div className="panel p-5" aria-hidden="true">
      <div className="h-6 w-36 animate-pulse rounded bg-zinc-800" />
      <div className="mt-5 space-y-3">
        {Array.from({ length: 8 }, (_, index) => (
          <div key={index} className="h-12 animate-pulse rounded-lg bg-zinc-800/80" />
        ))}
      </div>
    </div>
  );
}
