"use client";

import React from "react";

export interface SectorData {
  as_of: string;
  source?: string;
  skipped_dotted_tickers?: string[];
  sectors: Record<string, { ticker: string; name: string; market_cap: number }[]>;
}

const SHORT: Record<string, string> = {
  "Communication Services": "Comm. Services",
  "Consumer Discretionary": "Cons. Discretionary",
  "Consumer Staples": "Cons. Staples",
  "Information Technology": "Technology",
};

interface Props {
  data: SectorData | null;
  selected: string | null;
  onSelect: (sector: string | null) => void;
  /** tickers with a setup today (before the sector filter) */
  setupTickers: Set<string>;
  /** ticker -> reason it was held back today */
  heldBack: Record<string, string>;
}

/** S&P 500 sector chips; each sector covers its 10 largest companies by market cap. */
export function SectorFilter({ data, selected, onSelect, setupTickers, heldBack }: Props) {
  if (!data) return null;
  const sectors = Object.keys(data.sectors).sort();
  const rows = selected ? data.sectors[selected] || [] : [];
  const fmtCap = (v: number) => (v >= 1e12 ? `$${(v / 1e12).toFixed(2)}T` : `$${(v / 1e9).toFixed(0)}B`);

  return (
    <div className="space-y-2 pt-2 border-t border-desk-border/50">
      <div className="flex flex-wrap items-center gap-1.5">
        <span className="text-xs text-desk-tertiary mr-1">S&amp;P sector (top 10 by market cap):</span>
        <button
          onClick={() => onSelect(null)}
          className={`min-h-[32px] rounded-control px-3 py-1 text-xs font-semibold border transition-colors ${
            selected === null
              ? "bg-desk-raised border-desk-accent/60 text-desk-text"
              : "bg-desk-bg border-desk-border text-desk-secondary hover:text-desk-text"
          }`}
        >
          All
        </button>
        {sectors.map((s) => (
          <button
            key={s}
            onClick={() => onSelect(selected === s ? null : s)}
            title={s}
            className={`min-h-[32px] rounded-control px-3 py-1 text-xs font-semibold border transition-colors ${
              selected === s
                ? "bg-desk-raised border-desk-accent/60 text-desk-text"
                : "bg-desk-bg border-desk-border text-desk-secondary hover:text-desk-text"
            }`}
          >
            {SHORT[s] || s}
          </button>
        ))}
      </div>

      {selected && (
        <div className="rounded-control border border-desk-border bg-desk-bg/60 p-2.5">
          <div className="mb-1.5 flex flex-wrap items-baseline justify-between gap-2 text-xs">
            <span className="font-semibold text-desk-text">
              {selected}: {rows.filter((r) => setupTickers.has(r.ticker)).length} of {rows.length} have a setup today
            </span>
            <span className="text-desk-tertiary">Market caps as of {data.as_of}</span>
          </div>
          <div className="flex flex-wrap gap-1.5">
            {rows.map((r) => {
              const has = setupTickers.has(r.ticker);
              const reason = heldBack[r.ticker];
              return (
                <span
                  key={r.ticker}
                  title={`${r.name} · ${fmtCap(r.market_cap)}${has ? " · setup today" : reason ? ` · held back: ${reason}` : " · no qualifying put today"}`}
                  className={`rounded px-2 py-1 font-mono text-xs border ${
                    has
                      ? "border-desk-accent/50 bg-desk-accent/10 text-desk-accent"
                      : reason
                      ? "border-amber-500/30 bg-amber-500/5 text-amber-300"
                      : "border-desk-border text-desk-tertiary"
                  }`}
                >
                  {r.ticker}
                  <span className="ml-1 text-[11px] opacity-75">{has ? "setup" : reason ? "held back" : "none"}</span>
                </span>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

export default SectorFilter;
