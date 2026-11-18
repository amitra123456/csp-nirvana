"use client";

import { useEffect, useState, useMemo } from "react";
import Link from "next/link";
import { Setup, Snapshot, HeldBack, Position, ActiveSignal, ClosedTrade } from "@/types/snapshot";
import { formatCurrency, formatPercent, formatNumber } from "@/lib/data";

export default function SignalsPage() {
  const [snapshot, setSnapshot] = useState<Snapshot | null>(null);
  const [loading, setLoading] = useState(true);
  const [preset, setPreset] = useState<"conservative" | "core" | "aggressive" | "custom">("core");
  
  // Filter toggle states (all start inactive so full qualified universe is visible, then filter dynamically)
  const [skipEarnings, setSkipEarnings] = useState(false);
  const [redDaysOnly, setRedDaysOnly] = useState(false);
  const [hideHeld, setHideHeld] = useState(false);

  // Admin Review & Approval State (status: approved | disapproved | none, and comments)
  const [reviewRecords, setReviewRecords] = useState<Record<string, { status: "approved" | "disapproved" | "none"; comment: string }>>({});

  useEffect(() => {
    // 1. Initial cached read
    try {
      const cached = localStorage.getItem("csp_review_records");
      if (cached) {
        setReviewRecords(JSON.parse(cached));
      }
    } catch (e) {}

    // 2. Fetch from /api/approve
    fetch("/api/approve")
      .then((r) => r.json())
      .then((data) => {
        if (data.records && typeof data.records === "object") {
          setReviewRecords(data.records);
          localStorage.setItem("csp_review_records", JSON.stringify(data.records));
        }
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    async function loadData() {
      try {
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

  const heldTickers = useMemo(() => {
    return new Set(snapshot?.positions?.map((p) => p.ticker.toUpperCase()) || []);
  }, [snapshot]);

  // Counts for toggle chips
  const earningsHoldCount = useMemo(() => {
    if (!snapshot?.setups) return 0;
    return snapshot.setups.filter((s) => s.watchouts?.some((w) => w.title.toLowerCase().includes("earning"))).length;
  }, [snapshot]);

  const heldInUniverseCount = useMemo(() => {
    if (!snapshot?.setups) return 0;
    return snapshot.setups.filter((s) => heldTickers.has(s.ticker.toUpperCase())).length;
  }, [snapshot, heldTickers]);

  // Filter setups based on preset and toggles
  const filteredSetups = useMemo(() => {
    if (!snapshot?.setups) return [];
    return snapshot.setups.filter((s) => {
      // Preset gates
      if (preset === "conservative" && (s.cushion_pct < 15.0 || s.score < 70)) return false;
      if (preset === "core" && (s.cushion_pct < 12.0 || s.score < 65)) return false;
      if (preset === "aggressive" && s.cushion_pct < 8.0) return false;

      // Toggle chips
      if (skipEarnings && s.watchouts?.some((w) => w.title.toLowerCase().includes("earning") || w.detail.toLowerCase().includes("earning"))) return false;
      if (redDaysOnly && (s.is_red_day === false || (typeof s.day_change_pct === "number" && s.day_change_pct >= 0))) return false;
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

  // Card 2: Active in-flight open positions
  const activeSignals = useMemo(() => {
    return (snapshot?.active_signals || []) as ActiveSignal[];
  }, [snapshot]);

  const activeStats = useMemo(() => {
    if (!activeSignals.length) return { count: 0, tpHit: 0, harvesting: 0, tested: 0 };
    const tpHit = activeSignals.filter((a) => a.profit_pct >= 50.0).length;
    const harvesting = activeSignals.filter((a) => a.profit_pct >= 0.0 && a.profit_pct < 50.0).length;
    const tested = activeSignals.filter((a) => a.profit_pct < 0.0).length;
    return { count: activeSignals.length, tpHit, harvesting, tested };
  }, [activeSignals]);

  // Card 3: Closed trades
  const closedTrades = useMemo(() => {
    return (snapshot?.closed_trades || []) as ClosedTrade[];
  }, [snapshot]);

  const closedStats = useMemo(() => {
    if (!closedTrades.length) return { count: 0, wr: 0, totalPnl: 0, avgDays: 0 };
    const wins = closedTrades.filter((t) => t.result === "WIN").length;
    const wr = (wins / closedTrades.length) * 100;
    const totalPnl = closedTrades.reduce((sum, t) => sum + (t.realized_gain * 100), 0);
    const avgDays = closedTrades.reduce((sum, t) => sum + t.days_held, 0) / closedTrades.length;
    return { count: closedTrades.length, wr, totalPnl, avgDays };
  }, [closedTrades]);

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
      <div className="rounded-card border border-desk-risk/30 bg-desk-risk/10 p-8 text-center">
        <h2 className="text-lg font-bold text-desk-riskText">Snapshot Data Unavailable</h2>
        <p className="text-sm text-desk-secondary mt-2">
          Unable to connect to verified snapshot cache. Ensure <code>data/snapshots/latest.json</code> exists.
        </p>
      </div>
    );
  }

  const presetRules = {
    conservative: "≥ 15% Cushion · Score ≥ 70 · Low Beta Pullbacks",
    core: "≥ 12% Cushion · Score ≥ 65 · 30-45 DTE · Strict Institutional",
    aggressive: "≥ 8% Cushion · Score ≥ 60 · Momentum / Shorter DTE",
    custom: "Custom user-configured rule parameters",
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      {/* 1. Header with Metadata */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-desk-border pb-4">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold tracking-tight text-desk-text">Signals &amp; Candidates</h1>
            <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-500/10 px-2.5 py-0.5 text-xs font-medium text-emerald-400 border border-emerald-500/20">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
              Verified 3:35 PM ET
            </span>
          </div>
          <p className="text-xs text-desk-secondary mt-1">
            As of: {snapshot.run?.as_of_et || "Latest Close"} &middot; Engine: {snapshot.run?.run_id || "v2.5-prod"} &middot; Strict 7-Gate Validation
          </p>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs text-desk-tertiary">Data Feeds:</span>
          <span className="rounded bg-desk-raised px-2 py-0.5 text-[11px] font-mono text-desk-secondary border border-desk-border">
            SIP Live
          </span>
          <span className="rounded bg-desk-raised px-2 py-0.5 text-[11px] font-mono text-desk-secondary border border-desk-border">
            Alpaca Options
          </span>
        </div>
      </div>

      {/* 2. Preset Segmented Control & Filter Toggles */}
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
              className={`min-h-[36px] inline-flex items-center gap-1.5 rounded-control px-3 py-1.5 text-xs font-semibold border transition-all ${
                skipEarnings
                  ? "bg-amber-500/15 border-amber-500/50 text-amber-400 shadow-sm"
                  : "bg-desk-bg border-desk-border text-desk-secondary hover:text-desk-text hover:border-desk-borderHover"
              }`}
              title="Filter out stocks with upcoming earnings announcements"
            >
              <span className={`w-2 h-2 rounded-full ${skipEarnings ? "bg-amber-400" : "bg-desk-border"}`} />
              Skip earnings weeks
              {earningsHoldCount > 0 && (
                <span className={`px-1.5 py-0.5 rounded text-[10px] font-mono ${skipEarnings ? "bg-amber-500/20 text-amber-300 font-bold" : "bg-desk-raised text-desk-tertiary"}`}>
                  {skipEarnings ? `-${earningsHoldCount}` : `${earningsHoldCount}`}
                </span>
              )}
            </button>
            <button
              onClick={() => setRedDaysOnly(!redDaysOnly)}
              className={`min-h-[36px] inline-flex items-center gap-1.5 rounded-control px-3 py-1.5 text-xs font-semibold border transition-all ${
                redDaysOnly
                  ? "bg-rose-500/15 border-rose-500/50 text-rose-400 shadow-sm"
                  : "bg-desk-bg border-desk-border text-desk-secondary hover:text-desk-text hover:border-desk-borderHover"
              }`}
              title="Only show stocks having a red day / pullback"
            >
              <span className={`w-2 h-2 rounded-full ${redDaysOnly ? "bg-rose-400" : "bg-desk-border"}`} />
              Red days only
            </button>
            <button
              onClick={() => setHideHeld(!hideHeld)}
              className={`min-h-[36px] inline-flex items-center gap-1.5 rounded-control px-3 py-1.5 text-xs font-semibold border transition-all ${
                hideHeld
                  ? "bg-desk-accent/15 border-desk-accent/50 text-desk-accent shadow-sm"
                  : "bg-desk-bg border-desk-border text-desk-secondary hover:text-desk-text hover:border-desk-borderHover"
              }`}
              title="Hide stocks where you already hold open positions"
            >
              <span className={`w-2 h-2 rounded-full ${hideHeld ? "bg-desk-accent" : "bg-desk-border"}`} />
              Hide names I hold
              {heldInUniverseCount > 0 && (
                <span className={`px-1.5 py-0.5 rounded text-[10px] font-mono ${hideHeld ? "bg-desk-accent/20 text-desk-accent font-bold" : "bg-desk-raised text-desk-tertiary"}`}>
                  {hideHeld ? `-${heldInUniverseCount}` : `${heldInUniverseCount} held`}
                </span>
              )}
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

      {/* 4. Main 2-Column Grid (Card 1: Table + Right Rail) */}
      <div className="flex flex-col lg:flex-row gap-5 items-start">
        {/* Setups Table: Card 1 */}
        <div className="flex-1 min-w-0 rounded-card border border-desk-border bg-desk-card overflow-hidden">
          <div className="p-4 border-b border-desk-border bg-desk-raised/60 flex flex-wrap items-center justify-between gap-2">
            <div>
              <h2 className="text-sm font-bold text-desk-text uppercase tracking-wider flex items-center gap-2">
                <span>⚡ Today&apos;s Qualified Setups</span>
                <span className="text-xs font-mono font-normal text-desk-accent">({filteredSetups.length} ready to enter)</span>
              </h2>
              <p className="text-xs text-desk-secondary mt-0.5">
                Evaluated strictly at market close (3:35 PM ET) &middot; Min {snapshot.rules?.cushion_min_pct || 12}% Cushion &middot; 1X Standard &amp; 🔥 2X Whale Conviction
              </p>
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-center text-sm">
              <thead className="border-b border-desk-border bg-desk-raised text-xs text-desk-secondary font-medium uppercase tracking-wider">
                <tr>
                  <th className="py-3 px-3 text-center">Stock</th>
                  <th className="py-3 px-3 text-center">Date of Signal</th>
                  <th className="py-3 px-3 text-center">Current Price</th>
                  <th className="py-3 px-3 text-center">Put Strike</th>
                  <th className="py-3 px-3 text-center">Put Expiration</th>
                  <th className="py-3 px-3 text-center">Credit</th>
                  <th className="py-3 px-3 text-center">Position Size</th>
                  <th className="py-3 px-3 text-center">Return/Cycle</th>
                  <th className="py-3 px-3 text-center">Model Score</th>
                  <th className="py-3 px-4 text-center">Expert Analysis</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-desk-border font-mono text-xs">
                {filteredSetups.length === 0 ? (
                  <tr>
                    <td colSpan={10} className="py-12 text-center text-desk-secondary font-sans text-sm">
                      No setups qualify under current filters. Try relaxing the cushion or enabling earnings weeks.
                    </td>
                  </tr>
                ) : (
                  filteredSetups.map((s) => {
                    const sym = s.ticker.toUpperCase();
                    const rec = reviewRecords[sym] || { status: "none", comment: "" };
                    const status = rec.status;
                    const comment = rec.comment;
                    const signalDate = s.spot_ts ? s.spot_ts.slice(0, 10) : (snapshot.run?.as_of_et?.slice(0, 10) || "2026-11-18");

                    return (
                      <tr key={s.ticker} className={`hover:bg-desk-raised/60 transition-colors ${status === "approved" ? "bg-emerald-500/[0.02]" : status === "disapproved" ? "bg-rose-500/[0.02]" : ""}`}>
                        {/* 1. Stock */}
                        <td className="py-3.5 px-3 font-sans text-center">
                          <Link href={`/ticket/${s.ticker}`} className="inline-flex flex-col items-center hover:text-desk-accent">
                            <div className="inline-flex items-center gap-1.5">
                              <span className="text-sm font-mono text-desk-accent font-bold">{s.ticker}</span>
                              {heldTickers.has(sym) && (
                                <span className="rounded bg-sky-500/15 px-1 py-0.2 text-[9px] font-mono text-sky-400 font-semibold border border-sky-500/30" title="Held in your open portfolio">
                                  HELD
                                </span>
                              )}
                            </div>
                            <span className="text-[11px] text-desk-secondary truncate max-w-[110px]">{s.name}</span>
                          </Link>
                        </td>

                        {/* 2. Date of Signal */}
                        <td className="py-3.5 px-3 font-mono text-center">
                          <div className="font-medium text-white">{signalDate}</div>
                          <div className="text-[10px] text-desk-tertiary">3:35 PM ET</div>
                        </td>

                        {/* 3. Current Price */}
                        <td className="py-3.5 px-3 font-mono font-bold text-center">
                          <div className="text-white">${s.spot.toFixed(2)}</div>
                          {typeof (s as any).day_change_pct === "number" && (
                            <div className={`text-[10px] font-medium ${(s as any).day_change_pct < 0 ? "text-rose-400" : "text-emerald-400"}`}>
                              {(s as any).day_change_pct > 0 ? "+" : ""}{(s as any).day_change_pct.toFixed(2)}%
                            </div>
                          )}
                        </td>

                        {/* 4. Put Strike */}
                        <td className="py-3.5 px-3 font-mono text-center">
                          <div className="font-bold text-emerald-400">${s.strike.toFixed(1)}P</div>
                          <div className="text-[10px] text-desk-secondary">+{s.cushion_pct.toFixed(1)}% Cushion</div>
                        </td>

                        {/* 5. Put Expiration */}
                        <td className="py-3.5 px-3 font-mono text-center">
                          <div className="font-semibold text-white">{s.expiry}</div>
                          <div className="text-[10px] text-desk-tertiary">{s.dte} DTE</div>
                          {s.watchouts?.some((w) => w.title.toLowerCase().includes("earning")) && (
                            <span className="inline-flex items-center gap-1 rounded bg-amber-500/15 px-1 py-0.2 text-[9px] font-mono text-amber-400 border border-amber-500/30 mt-0.5" title="Trade spans earnings announcement window">
                              ⚠️ Earnings
                            </span>
                          )}
                        </td>

                        {/* 6. Credit */}
                        <td className="py-3.5 px-3 font-mono text-center">
                          <div className="font-semibold text-desk-text">${s.bid.toFixed(2)}</div>
                          <div className="text-[10px] text-desk-secondary">(${s.credit.toFixed(0)})</div>
                        </td>

                        {/* 7. Position Size (1X or 2x..) */}
                        <td className="py-3.5 px-3 font-mono text-center">
                          <div className="flex justify-center">
                            {s.sizing_tier === "2x" ? (
                              <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 whitespace-nowrap">
                                🔥 2X (2 Cont)
                              </span>
                            ) : (
                              <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-semibold bg-desk-raised text-desk-secondary border border-desk-border whitespace-nowrap">
                                1X (1 Cont)
                              </span>
                            )}
                          </div>
                        </td>

                        {/* 8. Return/Cycle */}
                        <td className="py-3.5 px-3 font-mono text-center">
                          <div className="font-bold text-desk-accent">+{s.roc_cycle_pct.toFixed(2)}%</div>
                          <div className="text-[10px] text-desk-secondary">({s.roc_annual_pct.toFixed(1)}% Ann.)</div>
                        </td>

                        {/* 9. Model Score */}
                        <td className="py-3.5 px-3 font-mono text-center">
                          <div className="inline-flex flex-col items-center">
                            <span className="font-bold text-white px-2 py-0.5 rounded bg-desk-raised border border-desk-border">
                              {s.score.toFixed(1)}
                            </span>
                            <span className="text-[10px] text-desk-tertiary mt-0.5">
                              PoS {s.odds_otm_market_pct.toFixed(0)}%
                            </span>
                          </div>
                        </td>

                        {/* 10. Approved Column (Green Tick or Red Cross with Comment Note) */}
                        <td className="py-3.5 px-4 text-center">
                          <div className="inline-flex flex-col items-center justify-center">
                            {status === "approved" ? (
                              <div
                                className="inline-flex items-center gap-1 px-2.5 py-1 rounded-control bg-emerald-500/15 border border-emerald-500/40 text-emerald-400 font-bold shadow-sm select-none"
                                title={comment ? `Approved: ${comment}` : "Approved by Admin"}
                              >
                                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                                  <polyline points="20 6 9 17 4 12" />
                                </svg>
                                <span className="text-[11px] font-mono">Approved</span>
                              </div>
                            ) : status === "disapproved" ? (
                              <div
                                className="inline-flex items-center gap-1 px-2.5 py-1 rounded-control bg-rose-500/15 border border-rose-500/40 text-rose-400 font-bold shadow-sm select-none"
                                title={comment ? `Disapproved: ${comment}` : "Disapproved by Admin"}
                              >
                                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                                  <line x1="18" y1="6" x2="6" y2="18" />
                                  <line x1="6" y1="6" x2="18" y2="18" />
                                </svg>
                                <span className="text-[11px] font-mono">Disapproved</span>
                              </div>
                            ) : (
                              <div
                                className="inline-flex items-center gap-1 px-2.5 py-1 rounded-control bg-desk-raised border border-desk-border text-desk-tertiary select-none"
                                title="Pending Admin Review"
                              >
                                <span className="text-[10px]">⏳</span>
                                <span className="text-[11px] font-mono">Pending</span>
                              </div>
                            )}

                            {comment && (
                              <div
                                className="text-[10px] text-desk-secondary font-mono italic mt-1 max-w-[130px] truncate"
                                title={comment}
                              >
                                💬 {comment}
                              </div>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Right Rail: Portfolio Impact & Held Back (Narrower & Smaller Fonts) */}
        <div className="w-full lg:w-60 xl:w-64 shrink-0 space-y-3.5">
          {/* "If you take all N" card */}
          <div className="rounded-card border border-desk-border bg-desk-card p-3.5 space-y-3">
            <h2 className="text-xs font-bold text-desk-text uppercase tracking-wider">
              If you take all {filteredSetups.length}
            </h2>

            <div className="space-y-2.5 font-mono text-xs">
              <div>
                <span className="text-[10px] text-desk-tertiary block uppercase">Cash collateral</span>
                <span className="text-sm font-bold text-desk-text">{formatCurrency(totals.totalCash)}</span>
              </div>

              <div>
                <span className="text-[10px] text-desk-tertiary block uppercase">Credit collected</span>
                <span className="text-sm font-bold text-desk-accent">{formatCurrency(totals.totalCredit)}</span>
              </div>

              <div>
                <span className="text-[10px] text-desk-tertiary block uppercase">Avg return / cycle</span>
                <span className="text-xs font-bold text-desk-text">{totals.avgRoc.toFixed(2)}%</span>
              </div>
            </div>

            {filteredSetups.length > 5 && (
              <div className="rounded-control bg-desk-caution/10 border border-desk-caution/30 p-2 text-[10px] text-desk-cautionText font-sans leading-tight">
                ⚠️ Sector concentration warning: taking all {filteredSetups.length} setups exceeds recommended collateral cap.
              </div>
            )}
          </div>

          {/* "Held Back · N" card */}
          <div className="rounded-card border border-desk-border bg-desk-card p-3.5 space-y-2.5">
            <div className="flex items-center justify-between">
              <h2 className="text-xs font-bold text-desk-text uppercase tracking-wider">
                Held back &middot; {snapshot.held_back?.length || 0}
              </h2>
              <span className="text-[10px] text-desk-tertiary">Gates</span>
            </div>

            <div className="divide-y divide-desk-border/60 max-h-72 overflow-y-auto pr-1">
              {(!snapshot.held_back || snapshot.held_back.length === 0) ? (
                <div className="text-[11px] text-desk-secondary py-2">No candidates held back.</div>
              ) : (
                snapshot.held_back.slice(0, 10).map((h, i) => (
                  <div key={i} className="py-2 text-[11px]">
                    <span className="font-mono font-bold text-desk-accent text-xs">{h.ticker}</span>
                    <p className="text-desk-secondary text-[10px] leading-tight mt-0.5">{h.reason}</p>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>

      {/* ========================================================= */}
      {/* 5. Card 2: Active Open Positions (In-Flight Until 50% TP) */}
      {/* ========================================================= */}
      <div className="rounded-card border border-desk-border bg-desk-card overflow-hidden space-y-4">
        <div className="p-4 border-b border-desk-border bg-desk-raised/60 flex flex-wrap items-center justify-between gap-4">
          <div>
            <h2 className="text-sm font-bold text-desk-text uppercase tracking-wider flex items-center gap-2">
              <span>⏳ Active Open Positions</span>
              <span className="text-xs font-mono font-normal text-desk-accent">({activeSignals.length} in-flight)</span>
            </h2>
            <p className="text-xs text-desk-secondary mt-0.5">
              Continuous candle-by-candle position tracking across all institutional names. Positions remain active until Kirsten&apos;s 50% Take-Profit target is captured or expiration. Sorted newest-first.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2 font-mono text-xs">
            <span className="px-2.5 py-1 rounded bg-desk-bg border border-desk-border text-desk-secondary">
              Total Active: <strong className="text-desk-text">{activeStats.count}</strong>
            </span>
            <span className="px-2.5 py-1 rounded bg-emerald-500/10 border border-emerald-500/30 text-emerald-400">
              🎯 50% TP Hit: <strong>{activeStats.tpHit}</strong>
            </span>
            <span className="px-2.5 py-1 rounded bg-desk-accent/10 border border-desk-accent/30 text-desk-accent">
              ⏳ Harvesting: <strong>{activeStats.harvesting}</strong>
            </span>
            <span className="px-2.5 py-1 rounded bg-desk-risk/10 border border-desk-risk/30 text-desk-riskText">
              🛡️ Tested: <strong>{activeStats.tested}</strong>
            </span>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-desk-border bg-desk-raised text-xs text-desk-secondary font-medium uppercase tracking-wider">
              <tr>
                <th className="py-3 px-4">Entry Date</th>
                <th className="py-3 px-4">Stock</th>
                <th className="py-3 px-3">Put Strike</th>
                <th className="py-3 px-3">Spot Price</th>
                <th className="py-3 px-3">Cushion</th>
                <th className="py-3 px-3">Entry Credit</th>
                <th className="py-3 px-3">Put Mark</th>
                <th className="py-3 px-3">P&amp;L %</th>
                <th className="py-3 px-3">Progress</th>
                <th className="py-3 px-3">Expiry</th>
                <th className="py-3 px-4 text-right">Action Protocol</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-desk-border font-mono text-xs">
              {activeSignals.length === 0 ? (
                <tr>
                  <td colSpan={11} className="py-8 text-center text-desk-secondary font-sans text-sm">
                    No active positions currently recorded in flight.
                  </td>
                </tr>
              ) : (
                activeSignals.map((a, idx) => {
                  const cushion = a.current_spot > 0 ? ((a.current_spot - a.strike) / a.current_spot) * 100 : 0;
                  const pnlColor =
                    a.profit_pct >= 50.0
                      ? "text-emerald-400"
                      : a.profit_pct >= 0
                      ? "text-desk-accent"
                      : "text-desk-riskText";
                  const prog = Math.min(100, Math.max(0, a.progress_to_target || 0));

                  return (
                    <tr key={`${a.ticker}-${a.entry_date}-${idx}`} className="hover:bg-desk-raised/60 transition-colors">
                      <td className="py-3.5 px-4 text-desk-secondary">{a.entry_date}</td>
                      <td className="py-3.5 px-4 font-sans font-bold">
                        <Link href={`/ticket/${a.ticker}`} className="text-desk-accent hover:underline">
                          {a.ticker}
                        </Link>
                      </td>
                      <td className="py-3.5 px-3 font-semibold text-desk-text">${a.strike.toFixed(1)}P</td>
                      <td className="py-3.5 px-3 text-desk-text">${a.current_spot.toFixed(2)}</td>
                      <td className="py-3.5 px-3">
                        <span className={cushion > 0 ? "text-desk-accent font-semibold" : "text-desk-riskText font-semibold"}>
                          {cushion > 0 ? "+" : ""}{cushion.toFixed(1)}%
                        </span>
                      </td>
                      <td className="py-3.5 px-3 text-desk-text">${a.entry_price.toFixed(2)}</td>
                      <td className="py-3.5 px-3 font-bold text-desk-text">${a.current_price.toFixed(2)}</td>
                      <td className={`py-3.5 px-3 font-bold ${pnlColor}`}>
                        {a.profit_pct > 0 ? "+" : ""}{a.profit_pct.toFixed(1)}%
                      </td>
                      {/* Bidirectional Progress Bar */}
                      <td className="py-3.5 px-3 min-w-[130px]">
                        {(() => {
                          const isPos = a.profit_pct >= 0;
                          const rightW = isPos ? Math.min(50, (a.profit_pct / 50.0) * 50) : 0;
                          const leftW = !isPos ? Math.min(50, (Math.abs(a.profit_pct) / 100.0) * 50) : 0;
                          const posColor = a.profit_pct >= 50 ? "bg-emerald-500" : "bg-desk-accent";
                          const labelColor = a.profit_pct >= 50 ? "text-emerald-400" : isPos ? "text-desk-accent" : "text-desk-riskText";
                          const subLabel = a.profit_pct >= 50 ? "🎯 50% TP" : isPos ? `${((a.profit_pct / 50) * 100).toFixed(0)}% of TP` : "Drawdown";

                          return (
                            <div>
                              <div className="flex items-center justify-between text-[11px] mb-1">
                                <span className={`font-mono font-semibold ${labelColor}`}>
                                  {a.profit_pct > 0 ? "+" : ""}{a.profit_pct.toFixed(1)}%
                                </span>
                                <span className="text-[10px] text-desk-secondary">
                                  {subLabel}
                                </span>
                              </div>
                              <div className="relative h-1.5 w-full bg-desk-bg rounded-full overflow-hidden border border-desk-border/60">
                                <div className="absolute left-1/2 top-0 bottom-0 w-[1px] bg-desk-border z-10" />
                                {isPos ? (
                                  <div
                                    className={`absolute left-1/2 top-0 bottom-0 ${posColor} rounded-r-full transition-all`}
                                    style={{ width: `${rightW}%` }}
                                  />
                                ) : (
                                  <div
                                    className="absolute right-1/2 top-0 bottom-0 bg-desk-riskText rounded-l-full transition-all"
                                    style={{ width: `${leftW}%` }}
                                  />
                                )}
                              </div>
                            </div>
                          );
                        })()}
                      </td>
                      <td className="py-3.5 px-3 text-desk-secondary">{a.expiry}</td>
                      <td className="py-3.5 px-4 text-right min-w-[210px]">
                        <span
                          className="inline-block px-2 py-0.5 rounded text-[10px] font-semibold whitespace-nowrap"
                          style={{
                            backgroundColor: `${a.badge_color || "#38BDF8"}18`,
                            color: a.badge_color || "#38BDF8",
                            border: `1px solid ${a.badge_color || "#38BDF8"}40`,
                          }}
                        >
                          {a.status}
                        </span>
                        {a.triage_action && (
                          <div className="text-[10px] text-desk-secondary mt-1 max-w-[240px] ml-auto leading-tight">
                            {a.triage_action}
                          </div>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ========================================================= */}
      {/* 6. Card 3: Closed Trades & Realized Results               */}
      {/* ========================================================= */}
      <div className="rounded-card border border-desk-border bg-desk-card overflow-hidden space-y-4">
        <div className="p-4 border-b border-desk-border bg-desk-raised/60 flex flex-wrap items-center justify-between gap-4">
          <div>
            <h2 className="text-sm font-bold text-desk-text uppercase tracking-wider flex items-center gap-2">
              <span>🏁 Closed Trades &amp; Realized Results</span>
              <span className="text-xs font-mono font-normal text-desk-secondary">(Audited Performance)</span>
            </h2>
            <p className="text-xs text-desk-secondary mt-0.5">
              Audited historical closed trades verified candle-by-candle with Kirsten&apos;s 50% Take-Profit rule, assignment tracking, and net-credit rolls.
            </p>
          </div>
        </div>

        {/* 4 Mini KPI Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 px-4">
          <div className="rounded-control bg-desk-raised/60 border border-desk-border p-3">
            <span className="text-[11px] text-desk-secondary uppercase font-medium block">Total Closed</span>
            <span className="text-lg font-bold font-mono text-desk-text">{closedStats.count} Trades</span>
          </div>
          <div className="rounded-control bg-desk-raised/60 border border-desk-border p-3">
            <span className="text-[11px] text-desk-secondary uppercase font-medium block">Win Rate</span>
            <span className={`text-lg font-bold font-mono ${closedStats.wr >= 75 ? "text-emerald-400" : "text-desk-accent"}`}>
              {closedStats.wr.toFixed(1)}%
            </span>
          </div>
          <div className="rounded-control bg-desk-raised/60 border border-desk-border p-3">
            <span className="text-[11px] text-desk-secondary uppercase font-medium block">Realized Gain</span>
            <span className={`text-lg font-bold font-mono ${closedStats.totalPnl >= 0 ? "text-emerald-400" : "text-desk-riskText"}`}>
              {closedStats.totalPnl >= 0 ? "+" : ""}{formatCurrency(closedStats.totalPnl)}
            </span>
          </div>
          <div className="rounded-control bg-desk-raised/60 border border-desk-border p-3">
            <span className="text-[11px] text-desk-secondary uppercase font-medium block">Avg Hold Time</span>
            <span className="text-lg font-bold font-mono text-desk-text">{closedStats.avgDays.toFixed(1)} Days</span>
          </div>
        </div>

        {/* Closed Trades Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-desk-border bg-desk-raised text-xs text-desk-secondary font-medium uppercase tracking-wider">
              <tr>
                <th className="py-3 px-4">Open Date</th>
                <th className="py-3 px-4">Close Date</th>
                <th className="py-3 px-3">Stock</th>
                <th className="py-3 px-3">Put Strike</th>
                <th className="py-3 px-3">Entry &rarr; Exit</th>
                <th className="py-3 px-3">Realized ($)</th>
                <th className="py-3 px-3">Return %</th>
                <th className="py-3 px-3">Days</th>
                <th className="py-3 px-3">Result</th>
                <th className="py-3 px-4 text-right">Exit Reason</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-desk-border font-mono text-xs">
              {closedTrades.length === 0 ? (
                <tr>
                  <td colSpan={10} className="py-8 text-center text-desk-secondary font-sans text-sm">
                    No closed trades found in history.
                  </td>
                </tr>
              ) : (
                closedTrades.slice(0, 30).map((c, idx) => {
                  const gain = c.realized_gain * 100;
                  const isWin = c.result === "WIN";

                  return (
                    <tr key={`${c.ticker}-${c.close_date}-${idx}`} className="hover:bg-desk-raised/60 transition-colors">
                      <td className="py-3 px-4 text-desk-secondary">{c.open_date}</td>
                      <td className="py-3 px-4 text-desk-secondary font-semibold">{c.close_date}</td>
                      <td className="py-3 px-3 font-sans font-bold">
                        <Link href={`/ticket/${c.ticker}`} className="text-desk-accent hover:underline">
                          {c.ticker}
                        </Link>
                      </td>
                      <td className="py-3 px-3 font-semibold text-desk-text">${c.strike.toFixed(1)}P</td>
                      <td className="py-3 px-3 text-desk-secondary">
                        ${c.entry_credit.toFixed(2)} &rarr; ${c.exit_debit.toFixed(2)}
                      </td>
                      <td className={`py-3 px-3 font-bold ${gain >= 0 ? "text-emerald-400" : "text-desk-riskText"}`}>
                        {gain >= 0 ? "+" : ""}${gain.toFixed(1)}
                      </td>
                      <td className={`py-3 px-3 font-bold ${c.profit_pct >= 0 ? "text-emerald-400" : "text-desk-riskText"}`}>
                        {c.profit_pct > 0 ? "+" : ""}{c.profit_pct.toFixed(1)}%
                      </td>
                      <td className="py-3 px-3 text-desk-secondary">{c.days_held}d</td>
                      <td className="py-3 px-3">
                        <span
                          className={`inline-block px-1.5 py-0.5 rounded text-[10px] font-bold ${
                            isWin
                              ? "bg-emerald-500/15 text-emerald-400 border border-emerald-500/30"
                              : "bg-desk-risk/15 text-desk-riskText border border-desk-risk/30"
                          }`}
                        >
                          {c.result}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-right text-desk-secondary text-[11px] truncate max-w-[200px]">
                        {c.exit_type}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* 7. Legend Footer */}
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
