"use client";

import { useEffect, useState, useMemo } from "react";
import Link from "next/link";
import { Setup, Snapshot, HeldBack, Position } from "@/types/snapshot";
import { formatCurrency, formatPercent, formatNumber } from "@/lib/data";

export default function TodayPage() {
  const [snapshot, setSnapshot] = useState<Snapshot | null>(null);
  const [loading, setLoading] = useState(true);
  const [preset, setPreset] = useState<"conservative" | "core" | "aggressive" | "custom">("core");
  
  // Filter toggle states
  const [skipEarnings, setSkipEarnings] = useState(true);
  const [redDaysOnly, setRedDaysOnly] = useState(false);
  const [hideHeld, setHideHeld] = useState(false);

  useEffect(() => {
    async function loadData() {
      try {
        // Direct local snapshot fetch
        const res = await fetch("/api/snapshot", { cache: "no-store" });
        if (res.ok) {
          const data = await res.json();
          setSnapshot(data);
        }
      } catch (e) {
        console.error("Failed to load snapshot:", e);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  const itmPositions = useMemo(() => {
    return snapshot?.positions?.filter((p) => p.status === "itm") || [];
  }, [snapshot]);

  const heldTickers = useMemo(() => {
    return new Set(snapshot?.positions?.map((p) => p.ticker.toUpperCase()) || []);
  }, [snapshot]);

  // Filter setups based on preset and toggles
  const filteredSetups = useMemo(() => {
    if (!snapshot?.setups) return [];
    return snapshot.setups.filter((s) => {
      // Preset gates
      if (preset === "conservative" && (s.cushion_pct < 15.0 || s.score < 85)) return false;
      if (preset === "core" && (s.cushion_pct < 12.0 || s.score < 80)) return false;
      if (preset === "aggressive" && s.cushion_pct < 8.0) return false;

      // Toggle chips
      if (skipEarnings && s.watchouts.some((w) => w.title.includes("Earnings"))) return false;
      if (redDaysOnly && s.trend === "breakout") return false;
      if (hideHeld && heldTickers.has(s.ticker.toUpperCase())) return false;

      return true;
    });
  }, [snapshot, preset, skipEarnings, redDaysOnly, hideHeld, heldTickers]);

  // Aggregate "If you take all N"
  const totals = useMemo(() => {
    const totalCash = filteredSetups.reduce((acc, s) => acc + s.collateral, 0);
    const totalCredit = filteredSetups.reduce((acc, s) => acc + s.credit, 0);
    const avgRoc = filteredSetups.length > 0 ? filteredSetups.reduce((acc, s) => acc + s.roc_cycle_pct, 0) / filteredSetups.length : 0;
    return { totalCash, totalCredit, avgRoc };
  }, [filteredSetups]);

  if (loading) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="h-10 w-64 bg-desk-card rounded-control" />
        <div className="h-14 w-full bg-desk-card rounded-control" />
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          <div className="lg:col-span-3 h-96 bg-desk-card rounded-card" />
          <div className="h-96 bg-desk-card rounded-card" />
        </div>
      </div>
    );
  }

  if (!snapshot) {
    return (
      <div className="rounded-card border border-desk-border bg-desk-card p-12 text-center">
        <h2 className="text-xl font-bold text-desk-text">No snapshot data available yet</h2>
        <p className="mt-2 text-sm text-desk-secondary">
          The automated cron pipeline executes weekdays at 3:35 PM ET. Click "Run scan now" above to build the initial snapshot.
        </p>
      </div>
    );
  }

  const presetRules = {
    conservative: "Conservative: >= 15% cushion, >= 85 Nirvana score, strict 35 DTE quality floor.",
    core: "Core: >= 12% cushion, >= 80 Nirvana score, balanced return on collateral (~35 DTE).",
    aggressive: "Aggressive: >= 8% cushion, premium maximizing, elevated gamma capture.",
    custom: "Custom: User-defined multi-horizon rules.",
  };

  return (
    <div className="space-y-6">
      {/* 1. Header & Summary */}
      <div className="flex flex-col sm:flex-row sm:items-baseline sm:justify-between gap-2">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-desk-text">Today's setups</h1>
          <p className="text-sm text-desk-secondary">
            Deterministic cash-secured put opportunities passing institutional cushion & market odds gates.
          </p>
        </div>
      </div>

      {/* 2. ITM Position Alert Banner */}
      {itmPositions.length > 0 && (
        <Link
          href="/positions"
          className="flex items-center justify-between rounded-control border border-desk-risk/30 bg-desk-risk/10 px-4 py-3 text-sm text-desk-riskText transition-colors hover:bg-desk-risk/15"
        >
          <div className="flex items-center gap-2.5">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z" />
              <line x1="12" y1="9" x2="12" y2="13" />
              <line x1="12" y1="17" x2="12.01" y2="17" />
            </svg>
            <span className="font-semibold">
              {itmPositions.length} position{itmPositions.length > 1 ? "s" : ""} in the money ({itmPositions.map((p) => p.ticker).join(", ")}) — review exit & roll triggers
            </span>
          </div>
          <span className="text-xs font-bold underline underline-offset-4">Open Positions →</span>
        </Link>
      )}

      {/* 3. Preset Segmented Control & Filter Toggles */}
      <div className="rounded-card border border-desk-border bg-desk-card p-4 space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center rounded-control bg-desk-bg p-1 border border-desk-border">
            {(["conservative", "core", "aggressive", "custom"] as const).map((p) => (
              <button
                key={p}
                onClick={() => setPreset(p)}
                className={`min-h-[36px] rounded-control px-3.5 py-1.5 text-xs font-semibold capitalize transition-all ${
                  preset === p
                    ? "bg-desk-raised text-desk-text shadow-sm"
                    : "text-desk-secondary hover:text-desk-text"
                }`}
              >
                {p}
              </button>
            ))}
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={() => setSkipEarnings(!skipEarnings)}
              className={`min-h-[36px] rounded-control px-3 py-1.5 text-xs font-medium border transition-colors ${
                skipEarnings
                  ? "bg-desk-accent/15 border-desk-accent/40 text-desk-accent"
                  : "bg-desk-bg border-desk-border text-desk-secondary hover:text-desk-text"
              }`}
            >
              Skip earnings weeks
            </button>
            <button
              onClick={() => setRedDaysOnly(!redDaysOnly)}
              className={`min-h-[36px] rounded-control px-3 py-1.5 text-xs font-medium border transition-colors ${
                redDaysOnly
                  ? "bg-desk-accent/15 border-desk-accent/40 text-desk-accent"
                  : "bg-desk-bg border-desk-border text-desk-secondary hover:text-desk-text"
              }`}
            >
              Red days only
            </button>
            <button
              onClick={() => setHideHeld(!hideHeld)}
              className={`min-h-[36px] rounded-control px-3 py-1.5 text-xs font-medium border transition-colors ${
                hideHeld
                  ? "bg-desk-accent/15 border-desk-accent/40 text-desk-accent"
                  : "bg-desk-bg border-desk-border text-desk-secondary hover:text-desk-text"
              }`}
            >
              Hide names I hold
            </button>
          </div>
        </div>

        <div className="flex items-center justify-between text-xs text-desk-tertiary pt-1 border-t border-desk-border/50">
          <span>{presetRules[preset]}</span>
          <Link href="/rules" className="text-desk-accent hover:underline">
            Edit rules
          </Link>
        </div>
      </div>

      {/* 4. Main 2-Column Grid (Table + Right Rail) */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Setups Table */}
        <div className="lg:col-span-3 rounded-card border border-desk-border bg-desk-card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="border-b border-desk-border bg-desk-raised text-xs text-desk-secondary font-medium uppercase tracking-wider">
                <tr>
                  <th className="py-3 px-4">Stock</th>
                  <th className="py-3 px-3">Score</th>
                  <th className="py-3 px-3">Sell Put</th>
                  <th className="py-3 px-3">Cushion</th>
                  <th className="py-3 px-3">Credit</th>
                  <th className="py-3 px-3">Return/Cycle</th>
                  <th className="py-3 px-3">Market Odds</th>
                  <th className="py-3 px-3">Context</th>
                  <th className="py-3 px-4 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-desk-border font-mono text-xs">
                {filteredSetups.length === 0 ? (
                  <tr>
                    <td colSpan={9} className="py-12 text-center text-desk-secondary font-sans text-sm">
                      No setups qualify under current filters. Try relaxing the cushion or enabling earnings weeks.
                    </td>
                  </tr>
                ) : (
                  filteredSetups.map((s) => {
                    const isHeld = heldTickers.has(s.ticker);
                    return (
                      <tr key={s.ticker} className="hover:bg-desk-raised/60 transition-colors">
                        {/* Stock */}
                        <td className="py-3.5 px-4 font-sans">
                          <Link href={`/ticket/${s.ticker}`} className="font-bold text-desk-text hover:text-desk-accent flex flex-col">
                            <span className="text-sm font-mono text-desk-accent font-bold">{s.ticker}</span>
                            <span className="text-xs text-desk-secondary truncate max-w-[120px]">{s.name}</span>
                          </Link>
                        </td>

                        {/* Score */}
                        <td className="py-3.5 px-3">
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-desk-text">{s.score.toFixed(1)}</span>
                            <div className="w-12 h-1.5 rounded-full bg-desk-bg overflow-hidden">
                              <div
                                className="h-full bg-desk-accent rounded-full"
                                style={{ width: `${Math.min(100, s.score)}%` }}
                              />
                            </div>
                          </div>
                        </td>

                        {/* Sell Put */}
                        <td className="py-3.5 px-3 font-mono text-desk-text">
                          <div className="font-semibold">${s.strike.toFixed(2)}</div>
                          <div className="text-[11px] text-desk-secondary">{s.expiry} ({s.dte}d)</div>
                        </td>

                        {/* Cushion */}
                        <td className="py-3.5 px-3">
                          <span className="font-bold text-desk-text">{s.cushion_pct.toFixed(1)}%</span>
                          <span className="block text-[11px] text-desk-tertiary">OTM</span>
                        </td>

                        {/* Credit */}
                        <td className="py-3.5 px-3 font-semibold text-desk-text">
                          ${s.bid.toFixed(2)}
                          <span className="block text-[11px] text-desk-secondary">(${s.credit.toFixed(0)})</span>
                        </td>

                        {/* Return/cycle */}
                        <td className="py-3.5 px-3">
                          <span className="font-bold text-desk-accent">{s.roc_cycle_pct.toFixed(2)}%</span>
                          <span className="block text-[11px] text-desk-secondary">({s.roc_annual_pct.toFixed(1)}% Ann.)</span>
                        </td>

                        {/* Market Odds */}
                        <td className="py-3.5 px-3">
                          <span className="font-bold text-desk-text">{s.odds_otm_market_pct.toFixed(1)}%</span>
                          <span className="block text-[11px] text-desk-tertiary">OTM win</span>
                        </td>

                        {/* Context Chips */}
                        <td className="py-3.5 px-3 font-sans">
                          <div className="flex flex-col gap-1">
                            <span className="inline-block px-1.5 py-0.5 rounded text-[10px] font-semibold bg-desk-border text-desk-secondary w-max uppercase">
                              {s.trend}
                            </span>
                            {s.held_position && (
                              <span className={`inline-block px-1.5 py-0.5 rounded text-[10px] font-semibold w-max ${
                                s.held_position.itm
                                  ? "bg-desk-risk/15 text-desk-riskText border border-desk-risk/30"
                                  : "bg-desk-accent/15 text-desk-accent border border-desk-accent/30"
                              }`}>
                                Hold ${s.held_position.strike} · {s.held_position.itm ? "ITM" : "OTM"}
                              </span>
                            )}
                          </div>
                        </td>

                        {/* Review Button */}
                        <td className="py-3.5 px-4 text-right">
                          <Link
                            href={`/ticket/${s.ticker}`}
                            className="inline-flex min-h-[34px] items-center rounded-control bg-desk-raised px-3 py-1 text-xs font-semibold text-desk-accent hover:bg-desk-accent hover:text-desk-bg transition-colors"
                          >
                            Review →
                          </Link>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Right Rail: Portfolio Impact & Held Back */}
        <div className="space-y-6">
          {/* "If you take all N" card */}
          <div className="rounded-card border border-desk-border bg-desk-card p-5 space-y-4">
            <h2 className="text-sm font-bold text-desk-text uppercase tracking-wider">
              If you take all {filteredSetups.length}
            </h2>

            <div className="space-y-3 font-mono">
              <div>
                <span className="text-xs text-desk-secondary block">Cash collateral to set aside</span>
                <span className="text-xl font-bold text-desk-text">{formatCurrency(totals.totalCash)}</span>
              </div>

              <div>
                <span className="text-xs text-desk-secondary block">Immediate credit collected</span>
                <span className="text-xl font-bold text-desk-accent">{formatCurrency(totals.totalCredit)}</span>
              </div>

              <div>
                <span className="text-xs text-desk-secondary block">Average return per cycle</span>
                <span className="text-sm font-bold text-desk-text">{totals.avgRoc.toFixed(2)}%</span>
              </div>
            </div>

            {filteredSetups.length > 5 && (
              <div className="rounded-control bg-desk-caution/10 border border-desk-caution/30 p-2.5 text-xs text-desk-cautionText font-sans">
                ⚠️ Sector concentration warning: taking all {filteredSetups.length} setups exceeds recommended single-batch collateral cap.
              </div>
            )}
          </div>

          {/* "Held Back · N" card */}
          <div className="rounded-card border border-desk-border bg-desk-card p-5 space-y-3">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-bold text-desk-text uppercase tracking-wider">
                Held back · {snapshot.held_back?.length || 0}
              </h2>
              <span className="text-xs text-desk-tertiary">Validation gates</span>
            </div>

            <div className="divide-y divide-desk-border/60 max-h-80 overflow-y-auto pr-1">
              {(!snapshot.held_back || snapshot.held_back.length === 0) ? (
                <div className="text-xs text-desk-secondary py-3">No candidates held back.</div>
              ) : (
                snapshot.held_back.slice(0, 10).map((h, i) => (
                  <div key={i} className="py-2.5 text-xs">
                    <span className="font-mono font-bold text-desk-accent">{h.ticker}</span>
                    <p className="text-desk-secondary mt-0.5">{h.reason}</p>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>

      {/* 5. Legend Footer */}
      <footer className="rounded-card border border-desk-border bg-desk-raised/40 p-4 text-xs text-desk-secondary space-y-1">
        <p>
          <strong className="text-desk-text">Market odds:</strong> Implied probability of expiring out of the money derived directly from options chain delta and Parkinson historical volatility.
        </p>
        <p>
          <strong className="text-desk-text">Cushion:</strong> Percentage drop required before the underlying reaches your strike price.
        </p>
      </footer>
    </div>
  );
}
