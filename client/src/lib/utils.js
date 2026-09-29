import { clsx } from "clsx";
import { twMerge } from "tailwind-merge"

export function cn(...inputs) {
  return twMerge(clsx(inputs));
}

export const CHART_PALETTE = [
  "var(--chart-1)",
  "var(--chart-2)",
  "var(--chart-3)",
  "var(--chart-4)",
  "var(--chart-5)",
];

export function getVariantColor(index) {
  if (index === undefined || index === null) return CHART_PALETTE[0];
  const idx = typeof index === "number" ? index : parseInt(index, 10) || 0;
  return CHART_PALETTE[Math.abs(idx) % CHART_PALETTE.length];
}

