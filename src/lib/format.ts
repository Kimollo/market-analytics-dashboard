import type { ChartRange } from "../types";

export function formatCompactUsd(value: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    notation: "compact",
    maximumFractionDigits: 2,
  }).format(value);
}

export function formatExactPrice(value: number): string {
  const absolute = Math.abs(value);
  const maximumFractionDigits =
    absolute >= 1000 ? 2 : absolute >= 1 ? 4 : absolute >= 0.01 ? 6 : 8;

  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 2,
    maximumFractionDigits,
  }).format(value);
}

export function formatAxisPrice(value: number): string {
  if (!Number.isFinite(value)) return "";
  if (Math.abs(value) >= 1000) return formatCompactUsd(value);
  if (Math.abs(value) >= 1) {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      maximumFractionDigits: 2,
    }).format(value);
  }
  return formatExactPrice(value);
}

export function formatSignedPercent(value: number): string {
  const formatted = `${Math.abs(value).toFixed(2)}%`;
  if (value > 0) return `+${formatted}`;
  if (value < 0) return `-${formatted}`;
  return formatted;
}

export function formatDominance(value: number): string {
  return `${value.toFixed(1)}%`;
}

export function formatCount(value: number): string {
  return new Intl.NumberFormat("en-US").format(value);
}

export function formatTimestamp(unixSeconds: number): string {
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(new Date(unixSeconds * 1000));
}

export function formatAxisDate(timestamp: number, range: ChartRange): string {
  const date = new Date(timestamp);
  if (range === "1") {
    return new Intl.DateTimeFormat("en-US", { hour: "numeric" }).format(date);
  }
  if (range === "365") {
    return new Intl.DateTimeFormat("en-US", { month: "short", year: "2-digit" }).format(date);
  }
  return new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric" }).format(date);
}

export function formatTooltipDate(timestamp: number, range: ChartRange): string {
  const includeTime = range !== "365";
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    ...(includeTime ? { hour: "numeric" as const, minute: "2-digit" as const } : {}),
  }).format(new Date(timestamp));
}

export function rangeDescription(range: ChartRange): string {
  switch (range) {
    case "1":
      return "Past 24 hours";
    case "7":
      return "Past 7 days";
    case "30":
      return "Past 30 days";
    case "365":
      return "Past year";
  }
}

export function titleFromId(id: string): string {
  return id
    .split("-")
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}
