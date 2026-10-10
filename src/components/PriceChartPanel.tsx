import { useMemo } from "react";
import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import type { QueryResult } from "../hooks/useQuery";
import { cn } from "../lib/cn";
import {
  formatAxisDate,
  formatAxisPrice,
  formatExactPrice,
  formatTooltipDate,
  rangeDescription,
} from "../lib/format";
import { CHART_RANGES, type ChartRange, type PricePoint, type SelectedCoin } from "../types";
import { ChangeBadge } from "./ChangeBadge";
import { CoinAvatar } from "./CoinAvatar";
import { ErrorState, InlineAlert } from "./Feedback";

interface PriceChartPanelProps {
  coin: SelectedCoin;
  range: ChartRange;
  onRangeChange: (range: ChartRange) => void;
  query: QueryResult<PricePoint[]>;
}

function paddedDomain(values: number[]): [number, number] {
  const min = Math.min(...values);
  const max = Math.max(...values);
  const padding = (max - min) * 0.12 || Math.abs(max) * 0.02 || 1;
  return [min - padding, max + padding];
}

function ChartTooltip({
  active,
  payload,
  range,
}: {
  active?: boolean;
  payload?: ReadonlyArray<{ payload?: PricePoint }>;
  range: ChartRange;
}) {
  const point = payload?.[0]?.payload;
  if (!active || !point) return null;

  return (
    <div className="rounded-xl border border-white/10 bg-zinc-950/95 px-3 py-2 shadow-xl">
      <p className="text-xs text-zinc-400">{formatTooltipDate(point.timestamp, range)}</p>
      <p className="mt-1 font-mono text-sm text-white">{formatExactPrice(point.price)}</p>
    </div>
  );
}

export function PriceChartPanel({ coin, range, onRangeChange, query }: PriceChartPanelProps) {
  const series = useMemo(() => {
    if (!query.data || query.data.length === 0) return null;
    const prices = query.data.map((point) => point.price);
    const open = prices[0];
    const close = prices[prices.length - 1];
    const high = Math.max(...prices);
    const low = Math.min(...prices);
    const change = open === 0 ? null : ((close - open) / open) * 100;
    return { open, close, high, low, change, domain: paddedDomain(prices) };
  }, [query.data]);

  const tone = series == null || series.change == null || series.change >= 0 ? "#34d399" : "#fb7185";
  const displayPrice = coin.price ?? series?.close ?? null;

  return (
    <section id="price-chart" className="panel scroll-mt-4 p-5 sm:p-6" aria-busy={query.loading}>
      <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
        <div className="flex items-center gap-3">
          <CoinAvatar image={coin.image} symbol={coin.symbol} />
          <div>
            <h2 className="text-lg font-semibold tracking-tight text-white">{coin.name}</h2>
            <p className="text-xs uppercase tracking-[0.16em] text-zinc-500">{coin.symbol}</p>
          </div>
        </div>

        <div className="flex flex-col gap-3 sm:items-end">
          <div className="flex flex-wrap items-center gap-3 sm:justify-end">
            <p className="font-mono text-3xl font-medium tracking-tight text-white">
              {displayPrice === null ? "—" : formatExactPrice(displayPrice)}
            </p>
            {series ? <ChangeBadge value={series.change} /> : null}
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <p className="mr-1 text-xs text-zinc-500">{rangeDescription(range)}</p>
            <div className="flex rounded-xl bg-zinc-950/80 p-1 ring-1 ring-white/10" role="tablist" aria-label="Chart timeframe">
              {CHART_RANGES.map((item) => {
                const selected = item.id === range;
                return (
                  <button
                    key={item.id}
                    type="button"
                    role="tab"
                    aria-selected={selected}
                    onClick={() => onRangeChange(item.id)}
                    className={cn(
                      "rounded-lg px-3 py-1.5 text-xs font-semibold tracking-wide transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-400",
                      selected ? "bg-emerald-400 text-zinc-950" : "text-zinc-400 hover:bg-white/5 hover:text-zinc-100",
                    )}
                  >
                    {item.label}
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      <div className="mt-6">
        {query.loading && query.data ? <p className="mb-2 text-xs text-zinc-500">Updating chart…</p> : null}
        {query.error && query.data ? (
          <div className="mb-4">
            <InlineAlert error={query.error} onRetry={query.retry} />
          </div>
        ) : null}

        {query.loading && !query.data ? (
          <div className="h-[320px] animate-pulse rounded-xl bg-zinc-800/60 sm:h-[360px]" aria-hidden="true" />
        ) : null}

        {query.error && !query.data ? <ErrorState error={query.error} onRetry={query.retry} /> : null}

        {query.data && query.data.length === 0 ? (
          <div className="grid h-[320px] place-items-center rounded-xl border border-dashed border-white/10 text-sm text-zinc-400">
            No price history returned for this range.
          </div>
        ) : null}

        {query.data && query.data.length > 0 && series ? (
          <div className="h-[320px] w-full sm:h-[360px]">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={query.data} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="priceFill" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor={tone} stopOpacity={0.32} />
                    <stop offset="100%" stopColor={tone} stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid stroke="#27272a" vertical={false} />
                <XAxis
                  dataKey="timestamp"
                  tickFormatter={(value: number) => formatAxisDate(value, range)}
                  minTickGap={28}
                  tick={{ fill: "#a1a1aa", fontSize: 11 }}
                  tickLine={false}
                  axisLine={false}
                  dy={8}
                />
                <YAxis
                  domain={series.domain}
                  allowDataOverflow
                  tickFormatter={(value: number) => formatAxisPrice(value)}
                  width={72}
                  tick={{ fill: "#a1a1aa", fontSize: 11 }}
                  tickLine={false}
                  axisLine={false}
                  tickCount={5}
                />
                <Tooltip
                  content={(props) => (
                    <ChartTooltip
                      active={props.active}
                      payload={props.payload as ReadonlyArray<{ payload?: PricePoint }> | undefined}
                      range={range}
                    />
                  )}
                  cursor={{ stroke: "#52525b", strokeDasharray: "4 4" }}
                  wrapperStyle={{ outline: "none" }}
                />
                <Area
                  type="monotone"
                  dataKey="price"
                  stroke={tone}
                  strokeWidth={2}
                  fill="url(#priceFill)"
                  dot={false}
                  activeDot={{ r: 4, strokeWidth: 0, fill: tone }}
                  animationDuration={450}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        ) : null}
      </div>

      {series ? (
        <dl className="mt-4 grid grid-cols-2 gap-3 border-t border-white/5 pt-4 sm:grid-cols-4">
          <Stat label="Open" value={formatExactPrice(series.open)} />
          <Stat label="High" value={formatExactPrice(series.high)} />
          <Stat label="Low" value={formatExactPrice(series.low)} />
          <Stat label="Close" value={formatExactPrice(series.close)} />
        </dl>
      ) : null}
    </section>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-xs uppercase tracking-wide text-zinc-500">{label}</dt>
      <dd className="mt-1 font-mono text-sm text-zinc-100">{value}</dd>
    </div>
  );
}
