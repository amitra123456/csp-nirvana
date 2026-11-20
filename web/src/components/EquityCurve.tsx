"use client";

import React, { useEffect, useMemo, useState } from "react";
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip, CartesianGrid, ReferenceLine } from "recharts";

interface SimTrade {
  ticker: string;
  entry_date: string;
  close_date: string;
  strike: number;
  rolls: number;
  realized_gain: number; // per share
  result: string;
  exit_type?: string;
}

const money = (v: number) => `${v < 0 ? "-" : ""}$${Math.abs(Math.round(v)).toLocaleString("en-US")}`;

/**
 * Cumulative P&L of every simulated closed trade, one contract each (100 shares),
 * booked on the close date, with a two-handle date range slider.
 */
export function EquityCurve() {
  const [trades, setTrades] = useState<SimTrade[] | null>(null);
  const [asOf, setAsOf] = useState<string>("");
  const [error, setError] = useState<string | null>(null);
  const [range, setRange] = useState<[number, number] | null>(null);

  useEffect(() => {
    fetch("/api/sim-trades")
      .then((r) => (r.ok ? r.json() : Promise.reject(new Error("not found"))))
      .then((d) => {
        setTrades((d.trades || []) as SimTrade[]);
        setAsOf(d.as_of || "");
      })
      .catch(() => setError("Simulated trade history is not available yet. It is written by the daily scan."));
  }, []);

  // One point per close date: P&L of trades closed that day (1 contract = 100 shares)
  const days = useMemo(() => {
    if (!trades) return [];
    const m = new Map<string, { pnl: number; n: number; wins: number; worst: number }>();
    for (const t of trades) {
      const v = (t.realized_gain || 0) * 100;
      const e = m.get(t.close_date) || { pnl: 0, n: 0, wins: 0, worst: 0 };
      e.pnl += v; e.n += 1; e.wins += t.result === "WIN" ? 1 : 0; e.worst = Math.min(e.worst, v);
      m.set(t.close_date, e);
    }
    return Array.from(m.entries()).sort(([a], [b]) => a.localeCompare(b)).map(([date, e]) => ({ date, ...e }));
  }, [trades]);

  useEffect(() => {
    if (days.length && !range) setRange([0, days.length - 1]);
  }, [days, range]);

  const view = useMemo(() => {
    if (!range || !days.length) return null;
    const [a, b] = range;
    let cum = 0, peak = 0, maxDD = 0, n = 0, wins = 0, worst = 0;
    const points = [{ date: days[a].date, equity: 0 }];
    for (let i = a; i <= b; i++) {
      const d = days[i];
      cum += d.pnl; n += d.n; wins += d.wins; worst = Math.min(worst, d.worst);
      peak = Math.max(peak, cum);
      maxDD = Math.min(maxDD, cum - peak);
      points.push({ date: d.date, equity: Math.round(cum) });
    }
    return { points, net: cum, maxDD, n, winRate: n ? (wins / n) * 100 : 0, worst };
  }, [days, range]);

  const setPreset = (months: number | null) => {
    if (!days.length) return;
    const last = days.length - 1;
    if (months === null) return setRange([0, last]);
    const end = new Date(days[last].date + "T00:00:00Z");
    end.setUTCMonth(end.getUTCMonth() - months);
    const cutoff = end.toISOString().slice(0, 10);
    const start = Math.max(0, days.findIndex((d) => d.date >= cutoff));
    setRange([start, last]);
  };

  return (
    <section className="rounded-card border border-desk-border bg-desk-card p-4 space-y-4" aria-label="Equity curve">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="text-sm font-bold text-desk-text uppercase tracking-wider">Equity Curve · 1 Contract per Trade</h2>
          <p className="mt-0.5 text-xs text-desk-secondary">
            Cumulative P&amp;L of every trade the simulator closed, one contract each, booked on the close date.
            Simulated with model (Black-Scholes) prices; no bid/ask spreads or commissions, so real results would be lower.
            {asOf ? ` Data through ${asOf.slice(0, 10)}.` : ""}
          </p>
        </div>
        <span className="rounded border border-amber-500/30 bg-amber-500/10 px-2 py-0.5 text-xs font-semibold text-amber-400">Simulated</span>
      </div>

      {error && <p className="text-sm text-desk-secondary">{error}</p>}

      {view && range && (
        <>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
            {[
              ["Net P&L", money(view.net), view.net < 0 ? "text-desk-riskText" : "text-emerald-400"],
              ["Max drawdown", money(view.maxDD), "text-desk-riskText"],
              ["Trades closed", view.n.toLocaleString(), "text-desk-text"],
              ["Win rate", `${view.winRate.toFixed(1)}%`, "text-desk-text"],
              ["Worst trade", money(view.worst), "text-desk-riskText"],
            ].map(([label, value, cls]) => (
              <div key={label} className="rounded-control border border-desk-border bg-desk-raised/60 p-3">
                <span className="block text-xs text-desk-tertiary">{label}</span>
                <span className={`font-mono text-lg font-bold ${cls}`}>{value}</span>
              </div>
            ))}
          </div>

          <div className="h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={view.points} margin={{ top: 8, right: 12, left: 8, bottom: 4 }}>
                <defs>
                  <linearGradient id="eqFill" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#6CB4FF" stopOpacity={0.35} />
                    <stop offset="100%" stopColor="#6CB4FF" stopOpacity={0.02} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#253041" opacity={0.5} />
                <XAxis dataKey="date" stroke="#8E9AA8" fontSize={11} tickLine={false} minTickGap={40} />
                <YAxis stroke="#8E9AA8" fontSize={11} tickLine={false} width={64}
                       tickFormatter={(v) => `${v < 0 ? "-" : ""}$${Math.abs(v) >= 1000 ? `${(Math.abs(v) / 1000).toFixed(0)}k` : Math.abs(v)}`} />
                <Tooltip
                  contentStyle={{ backgroundColor: "#121821", borderColor: "#253041", borderRadius: 8, color: "#E8ECF1" }}
                  labelStyle={{ color: "#8E9AA8" }}
                  formatter={(v: number) => [money(v), "Cumulative P&L"]}
                />
                <ReferenceLine y={0} stroke="#3A4656" />
                <Area type="monotone" dataKey="equity" stroke="#6CB4FF" strokeWidth={2} fill="url(#eqFill)" isAnimationActive={false} />
              </AreaChart>
            </ResponsiveContainer>
          </div>

          {/* Date range slider: two handles on one track */}
          <div className="space-y-2">
            <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
              <span className="font-mono text-desk-text">
                {days[range[0]].date} → {days[range[1]].date}
              </span>
              <div className="flex gap-1.5">
                {([["3M", 3], ["6M", 6], ["1Y", 12], ["All", null]] as [string, number | null][]).map(([label, m]) => (
                  <button
                    key={label}
                    onClick={() => setPreset(m)}
                    className="rounded-control border border-desk-border bg-desk-bg px-2.5 py-1 font-semibold text-desk-secondary hover:text-desk-text"
                  >
                    {label}
                  </button>
                ))}
              </div>
            </div>
            <div className="dual-range relative h-8">
              <div className="absolute left-0 right-0 top-1/2 h-1.5 -translate-y-1/2 rounded-full bg-desk-bg border border-desk-border" />
              <div
                className="absolute top-1/2 h-1.5 -translate-y-1/2 rounded-full bg-desk-accent/60"
                style={{
                  left: `${(range[0] / Math.max(1, days.length - 1)) * 100}%`,
                  right: `${100 - (range[1] / Math.max(1, days.length - 1)) * 100}%`,
                }}
              />
              <input
                type="range" min={0} max={days.length - 1} value={range[0]}
                aria-label="Start date"
                onChange={(e) => {
                  const v = Number(e.target.value);
                  setRange((r) => (r ? [Math.max(0, Math.min(v, r[1] - 1)), r[1]] : r));
                }}
                className="absolute inset-0 w-full"
              />
              <input
                type="range" min={0} max={days.length - 1} value={range[1]}
                aria-label="End date"
                onChange={(e) => {
                  const v = Number(e.target.value);
                  setRange((r) => (r ? [r[0], Math.min(days.length - 1, Math.max(v, r[0] + 1))] : r));
                }}
                className="absolute inset-0 w-full"
              />
            </div>
          </div>
        </>
      )}
    </section>
  );
}

export default EquityCurve;
