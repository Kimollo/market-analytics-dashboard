import { ArrowDownRight, ArrowUpRight, Minus } from "lucide-react";
import { cn } from "../lib/cn";
import { formatSignedPercent } from "../lib/format";

export function ChangeBadge({ value }: { value: number | null }) {
  if (value === null || !Number.isFinite(value)) {
    return <span className="text-sm text-zinc-500">—</span>;
  }

  const positive = value > 0;
  const negative = value < 0;
  const Icon = positive ? ArrowUpRight : negative ? ArrowDownRight : Minus;

  return (
    <span
      className={cn(
        "inline-flex items-center gap-0.5 whitespace-nowrap rounded-full px-2 py-0.5 font-mono text-xs font-medium",
        positive && "bg-emerald-400/15 text-emerald-300",
        negative && "bg-rose-400/15 text-rose-300",
        !positive && !negative && "bg-zinc-400/10 text-zinc-300",
      )}
    >
      <Icon className="h-3.5 w-3.5" aria-hidden="true" />
      {formatSignedPercent(value)}
    </span>
  );
}
