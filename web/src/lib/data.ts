import { Snapshot } from "@/types/snapshot";

export function formatCurrency(val: number | null | undefined): string {
  if (val === null || val === undefined || isNaN(val)) return "—";
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: val % 1 === 0 ? 0 : 2,
    maximumFractionDigits: 2,
  }).format(val);
}

export function formatPercent(val: number | null | undefined): string {
  if (val === null || val === undefined || isNaN(val)) return "—";
  return `${val >= 0 ? "+" : ""}${val.toFixed(1)}%`;
}

export function formatNumber(val: number | null | undefined): string {
  if (val === null || val === undefined || isNaN(val)) return "—";
  return new Intl.NumberFormat("en-US").format(val);
}

export function getFreshness(asOfEt: string): { label: string; dotColor: string; textColor: string; isStale: boolean } {
  if (!asOfEt) {
    return {
      label: "NO DATA",
      dotColor: "bg-desk-tertiary",
      textColor: "text-desk-tertiary",
      isStale: true,
    };
  }

  try {
    const asOfTime = new Date(asOfEt).getTime();
    const nowTime = Date.now();
    const diffHours = (nowTime - asOfTime) / (1000 * 60 * 60);

    if (diffHours <= 24) {
      return {
        label: "LIVE / FRESH",
        dotColor: "bg-desk-accent",
        textColor: "text-desk-accent",
        isStale: false,
      };
    } else if (diffHours <= 48) {
      return {
        label: "STALE > 1 DAY",
        dotColor: "bg-desk-caution",
        textColor: "text-desk-cautionText",
        isStale: true,
      };
    } else {
      return {
        label: "STALE > 2 DAYS",
        dotColor: "bg-desk-risk",
        textColor: "text-desk-riskText",
        isStale: true,
      };
    }
  } catch (e) {
    return {
      label: "INVALID TIMESTAMP",
      dotColor: "bg-desk-risk",
      textColor: "text-desk-riskText",
      isStale: true,
    };
  }
}
