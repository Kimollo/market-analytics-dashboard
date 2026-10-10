import type { LucideIcon } from "lucide-react";
import { BarChart3, Bitcoin, Flame, Globe } from "lucide-react";
import type { ReactNode } from "react";
import type { QueryResult } from "../hooks/useQuery";
import { formatCompactUsd, formatCount, formatDominance } from "../lib/format";
import type { MarketOverview } from "../types";
import { ChangeBadge } from "./ChangeBadge";
import { ErrorState, InlineAlert } from "./Feedback";

interface KpiSummaryProps {
  query: QueryResult<MarketOverview>;
}

export function KpiSummary({ query }: KpiSummaryProps) {
  if (query.loading && !query.data) {
    return (
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4" aria-hidden="true">
        {Array.from({ length: 4 }, (_, index) => (
          <div key={index} className="panel h-[138px] animate-pulse" />
        ))}
      </div>
    );
  }

  if (query.error && !query.data) {
    return <ErrorState error={query.error} onRetry={query.retry} />;
  }

  if (!query.data) return null;

  const overview = query.data;
  const cards: Array<{ label: string; value: string; icon: LucideIcon; hint: ReactNode; tone: string }> = [
    {
      label: "Global Market Cap",
      value: formatCompactUsd(overview.totalMarketCapUsd),
      icon: Globe,
      tone: "bg-emerald-400/10 text-emerald-300",
      hint: (
        <span className="inline-flex items-center gap-2">
          <ChangeBadge value={overview.marketCapChangePercentage24h} />
          <span className="text-xs text-zinc-500">24h</span>
        </span>
      ),
    },
    {
      label: "24h Volume",
      value: formatCompactUsd(overview.totalVolumeUsd),
      icon: BarChart3,
      tone: "bg-sky-400/10 text-sky-300",
      hint: <span className="text-xs text-zinc-500">Traded across tracked markets</span>,
    },
    {
      label: "Bitcoin Dominance",
      value: formatDominance(overview.bitcoinDominance),
      icon: Bitcoin,
      tone: "bg-amber-400/10 text-amber-300",
      hint: <span className="text-xs text-zinc-500">Share of total market cap</span>,
    },
    {
      label: "Trending Coins",
      value: formatCount(overview.trendingCount),
      icon: Flame,
      tone: "bg-rose-400/10 text-rose-300",
      hint: (
        <span className="text-xs text-zinc-500">
          {overview.trendingSymbols.length > 0 ? overview.trendingSymbols.join(" · ") : "Most watched right now"}
        </span>
      ),
    },
  ];

  return (
    <div className="space-y-3">
      {query.error ? <InlineAlert error={query.error} onRetry={query.retry} /> : null}
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {cards.map((card) => (
          <article key={card.label} className="panel p-5">
            <div className="flex items-center justify-between gap-3">
              <p className="text-sm text-zinc-400">{card.label}</p>
              <span className={`grid h-9 w-9 place-items-center rounded-xl ${card.tone}`}>
                <card.icon className="h-4 w-4" aria-hidden="true" />
              </span>
            </div>
            <p className="mt-4 font-mono text-2xl font-medium tracking-tight text-white sm:text-[1.7rem]">
              {card.value}
            </p>
            <div className="mt-3">{card.hint}</div>
          </article>
        ))}
      </div>
    </div>
  );
}
