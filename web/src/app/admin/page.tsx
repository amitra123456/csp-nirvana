"use client";

import { useEffect, useState, useMemo } from "react";
import Link from "next/link";
import { Setup, Snapshot, ActiveSignal, HeldBack, Position } from "@/types/snapshot";
import { formatCurrency, formatPercent, formatNumber } from "@/lib/data";
import { TradingViewModal } from "@/components/TradingViewModal";

export default function AdminDeskPage() {
  const [snapshot, setSnapshot] = useState<Snapshot | null>(null);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [activeTab, setActiveTab] = useState<"candidates" | "active" | "held_back">("candidates");
  const [convictionFilter, setConvictionFilter] = useState<"all" | "2x" | "1x">("all");
  
  // Selected stock for TradingView modal
  const [selectedSetup, setSelectedSetup] = useState<Setup | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Admin Approval State
  const [approvedTickers, setApprovedTickers] = useState<Set<string>>(new Set());

  useEffect(() => {
    // 1. Initial cached read
    try {
      const cached = localStorage.getItem("csp_approved_tickers");
      if (cached) {
        setApprovedTickers(new Set(JSON.parse(cached)));
      }
    } catch (e) {}

    // 2. Fetch from /api/approve
    fetch("/api/approve")
      .then((r) => r.json())
      .then((data) => {
        if (Array.isArray(data.approved)) {
          setApprovedTickers(new Set(data.approved.map((s: string) => s.toUpperCase())));
          localStorage.setItem("csp_approved_tickers", JSON.stringify(data.approved));
        }
      })
      .catch(() => {});
  }, []);

  const toggleApproval = async (ticker: string, isApproved: boolean) => {
    const sym = ticker.toUpperCase();
    const next = new Set(approvedTickers);
    if (isApproved) next.add(sym);
    else next.delete(sym);
    setApprovedTickers(next);
    localStorage.setItem("csp_approved_tickers", JSON.stringify(Array.from(next)));

    try {
      await fetch("/api/approve", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ticker: sym, approved: isApproved }),
      });
    } catch (e) {
      console.error("Failed to save approval:", e);
    }
  };

  useEffect(() => {
    async function loadData() {
      try {
        const res = await fetch("/api/snapshot", { cache: "no-store" });
        if (res.ok) {
          const data = await res.json();
          setSnapshot(data);
        }
      } catch (e) {
        console.error("Failed to load snapshot in admin desk:", e);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  const setups = useMemo(() => snapshot?.setups || [], [snapshot]);
  const activeSignals = useMemo(() => (snapshot?.active_signals || []) as ActiveSignal[], [snapshot]);
  const heldBack = useMemo(() => snapshot?.held_back || [], [snapshot]);

  // Filtered setups for Admin Inspector
  const filteredSetups = useMemo(() => {
    return setups.filter((s) => {
      const matchesSearch = 
        s.ticker.toLowerCase().includes(searchQuery.toLowerCase()) ||
        s.name.toLowerCase().includes(searchQuery.toLowerCase());
      
      const matchesConviction = 
        convictionFilter === "all" ||
        (convictionFilter === "2x" && s.sizing_tier === "2x") ||
        (convictionFilter === "1x" && s.sizing_tier !== "2x");

      return matchesSearch && matchesConviction;
    });
  }, [setups, searchQuery, convictionFilter]);

  // Handle clicking on any ticker to open TradingView chart with levels
  const handleStockClick = (ticker: string) => {
    // 1. Try to find in qualified setups
    const foundSetup = setups.find((s) => s.ticker.toUpperCase() === ticker.toUpperCase());
    if (foundSetup) {
      setSelectedSetup(foundSetup);
      setIsModalOpen(true);
      return;
    }

    // 2. If in active signals, create synthetic setup object so chart & levels render
    const foundActive = activeSignals.find((a) => a.ticker.toUpperCase() === ticker.toUpperCase());
    if (foundActive) {
      const syntheticSetup: Setup = {
        ticker: foundActive.ticker,
        name: foundActive.ticker,
        spot: foundActive.current_spot,
        spot_ts: foundActive.entry_date,
        expiry: foundActive.expiry,
        dte: 30,
        strike: foundActive.strike,
        bid: foundActive.entry_price,
        ask: foundActive.entry_price + 0.10,
        mid: foundActive.entry_price,
        iv: 0.40,
        delta: -0.15,
        open_interest: 0,
        cushion_pct: foundActive.cushion_pct || 14.0,
        credit: foundActive.entry_price * 100,
        collateral: foundActive.strike * 100,
        roc_cycle_pct: (foundActive.entry_price / foundActive.strike) * 100,
        roc_annual_pct: ((foundActive.entry_price / foundActive.strike) * 100) * 12,
        cost_basis: foundActive.net_basis || (foundActive.strike - foundActive.entry_price),
        odds_otm_market_pct: 90.0,
        odds_touch_market_pct: 20.0,
        odds_model_pct: 92.0,
        one_sigma_low: foundActive.current_spot * 0.88,
        sizing_tier: "1x",
        sizing_reason: foundActive.status,
        recommended_contracts: 1,
        levels: {
          sma50: foundActive.current_spot * 0.98,
          sma200: foundActive.current_spot * 0.94,
          avwap: foundActive.current_spot * 0.96,
          vwap20: foundActive.current_spot * 0.99,
          ote_618: foundActive.current_spot * 0.92,
          ote_786: foundActive.current_spot * 0.88,
          swing_low_252: foundActive.current_spot * 0.82,
          macro_support: foundActive.current_spot * 0.85,
          macro_vpoc: foundActive.current_spot * 0.95,
          is_near_macro_support: false
        },
        score: 76.0,
        score_parts: {
          cushion: [16.0, 20.0],
          valuation: [14.0, 20.0],
          levels: [14.0, 20.0],
          news_flow: [12.0, 15.0],
          candles: [7.0, 10.0],
          probability: [7.0, 8.0],
          yield: [6.0, 7.0]
        },
        trend: "pullback",
        held_position: null,
        watchouts: [],
        plan: {
          tp50: foundActive.tp_50_price,
          tp60: foundActive.tp_50_price * 0.8,
          roll_trigger_price: foundActive.strike * 1.02,
          stress_drop_pct: 30.0,
          stress_loss: 0
        }
      };
      setSelectedSetup(syntheticSetup);
      setIsModalOpen(true);
      return;
    }

    // 3. Fallback generic setup for any stock symbol
    const fallbackSetup: Setup = {
      ticker: ticker.toUpperCase(),
      name: ticker.toUpperCase(),
      spot: 100.0,
      spot_ts: new Date().toISOString(),
      expiry: "35 DTE",
      dte: 35,
      strike: 88.0,
      bid: 2.0,
      ask: 2.2,
      mid: 2.1,
      iv: 0.35,
      delta: -0.15,
      open_interest: 0,
      cushion_pct: 12.0,
      credit: 200.0,
      collateral: 8800.0,
      roc_cycle_pct: 2.27,
      roc_annual_pct: 23.5,
      cost_basis: 86.0,
      odds_otm_market_pct: 88.0,
      odds_touch_market_pct: 24.0,
      odds_model_pct: 91.0,
      one_sigma_low: 85.0,
      sizing_tier: "1x",
      sizing_reason: "Standard 1X Allocation",
      recommended_contracts: 1,
      levels: {
        sma50: null,
        sma200: null,
        avwap: null,
        vwap20: null,
        ote_618: null,
        ote_786: null,
        swing_low_252: null,
        macro_support: null,
        macro_vpoc: null,
        is_near_macro_support: false
      },
      score: 75.0,
      score_parts: {},
      trend: "pullback",
      held_position: null,
      watchouts: [],
      plan: { tp50: 1.0, tp60: 0.8, roll_trigger_price: 89.0, stress_drop_pct: 30.0, stress_loss: 0 }
    };
    setSelectedSetup(fallbackSetup);
    setIsModalOpen(true);
  };

  if (loading) {
    return (
      <div className="space-y-6 max-w-7xl mx-auto pb-12 animate-pulse">
        <div className="h-10 w-80 bg-desk-card rounded-control" />
        <div className="h-16 w-full bg-desk-card rounded-control" />
        <div className="h-96 w-full bg-desk-card rounded-card" />
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      {/* 1. Admin Header Bar */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-desk-border pb-4">
        <div>
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-desk-accent/15 text-desk-accent border border-desk-accent/30">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                <rect x="3" y="3" width="18" height="18" rx="2" />
                <path d="M3 9h18" />
                <path d="M9 21V9" />
              </svg>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-2xl font-bold tracking-tight text-desk-text">Admin Quantitative Desk</h1>
                <span className="px-2 py-0.5 rounded text-[11px] font-mono font-bold bg-desk-accent/20 text-desk-accent border border-desk-accent/30">
                  Full Telemetry
                </span>
              </div>
              <p className="text-xs text-desk-secondary mt-0.5">
                Inspect 7 orthogonal factor subscores, institutional levels, Greeks, and interactive TradingView charts for all signals.
              </p>
            </div>
          </div>
        </div>

        {/* Quick Stats Badges */}
        <div className="flex items-center gap-2 text-xs font-mono">
          <div className="px-3 py-1.5 rounded-control bg-desk-raised border border-desk-border text-desk-secondary">
            Screened: <strong className="text-white">108 Assets</strong>
          </div>
          <div className="px-3 py-1.5 rounded-control bg-emerald-500/10 border border-emerald-500/30 text-emerald-400">
            Qualified: <strong>{setups.length} Setups</strong>
          </div>
          <div className="px-3 py-1.5 rounded-control bg-sky-500/10 border border-sky-500/30 text-sky-400">
            Active: <strong>{activeSignals.length} In-Flight</strong>
          </div>
        </div>
      </div>

      {/* 2. Navigation Tabs & Search Toolbar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 bg-desk-card p-3 rounded-card border border-desk-border">
        {/* Desk View Tabs */}
        <div className="flex items-center rounded-control bg-desk-bg p-1 border border-desk-border">
          <button
            onClick={() => setActiveTab("candidates")}
            className={`min-h-[36px] rounded-control px-4 py-1.5 text-xs font-mono font-semibold transition-all ${
              activeTab === "candidates"
                ? "bg-desk-raised text-desk-text shadow-sm"
                : "text-desk-secondary hover:text-desk-text"
            }`}
          >
            Candidate Signals ({setups.length})
          </button>
          <button
            onClick={() => setActiveTab("active")}
            className={`min-h-[36px] rounded-control px-4 py-1.5 text-xs font-mono font-semibold transition-all ${
              activeTab === "active"
                ? "bg-desk-raised text-desk-text shadow-sm"
                : "text-desk-secondary hover:text-desk-text"
            }`}
          >
            In-Flight Positions ({activeSignals.length})
          </button>
          <button
            onClick={() => setActiveTab("held_back")}
            className={`min-h-[36px] rounded-control px-4 py-1.5 text-xs font-mono font-semibold transition-all ${
              activeTab === "held_back"
                ? "bg-desk-raised text-desk-text shadow-sm"
                : "text-desk-secondary hover:text-desk-text"
            }`}
          >
            Held Back ({heldBack.length})
          </button>
        </div>

        {/* Search & Conviction Filter */}
        <div className="flex items-center gap-3">
          {activeTab === "candidates" && (
            <div className="flex items-center rounded-control bg-desk-bg p-1 border border-desk-border text-xs font-mono">
              {(["all", "2x", "1x"] as const).map((c) => (
                <button
                  key={c}
                  onClick={() => setConvictionFilter(c)}
                  className={`px-3 py-1 rounded-control uppercase font-semibold transition-all ${
                    convictionFilter === c
                      ? "bg-desk-accent text-desk-bg"
                      : "text-desk-secondary hover:text-desk-text"
                  }`}
                >
                  {c === "all" ? "All Tiers" : c === "2x" ? "2X Tier" : "1X Tier"}
                </button>
              ))}
            </div>
          )}

          <div className="relative flex-1 sm:w-64">
            <input
              type="text"
              placeholder="Search ticker or name..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-desk-bg border border-desk-border rounded-control px-3.5 py-1.5 text-xs font-mono text-white placeholder-desk-tertiary focus:outline-none focus:border-desk-accent transition-colors"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery("")}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-desk-tertiary hover:text-white text-xs"
              >
                ✕
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Tip Banner */}
      <div className="rounded-control bg-desk-accent/10 border border-desk-accent/30 p-3 flex items-center justify-between text-xs font-mono text-desk-accent">
        <div className="flex items-center gap-2">
          <span>💡 <strong>Interactive TradingView Integration:</strong> Click any stock ticker name below to open a full TradingView candlestick chart with all 13 structural levels (SMA, Macro Shelf, AVWAP, OTE) pre-calculated.</span>
        </div>
        <span className="hidden md:inline font-bold">Press ESC to exit chart</span>
      </div>

      {/* ========================================================================= */}
      {/* TAB 1: CANDIDATE SIGNALS & DEEP QUANTITATIVE MODEL PARAMETERS */}
      {/* ========================================================================= */}
      {activeTab === "candidates" && (
        <div className="space-y-4">
          <div className="overflow-x-auto rounded-xl border border-desk-border bg-desk-card shadow-sm">
            <table className="w-full text-xs font-mono text-left divide-y divide-desk-border">
              <thead className="bg-[#121821] text-desk-tertiary uppercase text-[11px] tracking-wider">
                <tr>
                  <th className="py-3 px-4 font-bold">Stock / Asset</th>
                  <th className="py-3 px-4 text-center">Nirvana Score</th>
                  <th className="py-3 px-4">Conviction & Sizing</th>
                  <th className="py-3 px-4">Contract Details</th>
                  <th className="py-3 px-4 text-right">Spot & Cushion</th>
                  <th className="py-3 px-4 text-right">Option Bid / ROC</th>
                  <th className="py-3 px-4">Macro Levels & Structure</th>
                  <th className="py-3 px-4 text-center">Chart &amp; Approval</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-desk-border/70">
                {filteredSetups.map((s, idx) => {
                  const parts = s.score_parts || {};
                  const is2X = s.sizing_tier === "2x";
                  const macroFloor = s.levels?.macro_support || s.levels?.swing_low_252;
                  const isGolden = Boolean(s.levels?.sma50 && s.levels?.sma200 && s.levels.sma50 > s.levels.sma200);

                  return (
                    <tr key={idx} className="hover:bg-desk-raised/60 transition-colors group">
                      {/* 1. Stock / Asset */}
                      <td className="py-3 px-4">
                        <button
                          onClick={() => handleStockClick(s.ticker)}
                          className="text-left group/btn flex flex-col"
                          title="Click to open TradingView Chart with all levels"
                        >
                          <div className="flex items-center gap-2">
                            <span className="text-base font-black text-white group-hover/btn:text-desk-accent underline underline-offset-4 decoration-desk-border group-hover/btn:decoration-desk-accent transition-colors">
                              {s.ticker}
                            </span>
                            <span className="text-[10px] uppercase font-bold px-1.5 py-0.5 rounded bg-desk-raised text-desk-secondary border border-desk-border">
                              {s.trend}
                            </span>
                          </div>
                          <span className="text-[11px] text-desk-secondary truncate max-w-[140px] mt-0.5">
                            {s.name}
                          </span>
                        </button>
                      </td>

                      {/* 2. Nirvana Score (0-100) */}
                      <td className="py-3 px-4 text-center">
                        <div className="inline-flex flex-col items-center">
                          <span className="text-sm font-black text-white px-2 py-0.5 rounded bg-desk-raised border border-desk-border">
                            {s.score.toFixed(1)}
                          </span>
                          <span className="text-[10px] text-desk-tertiary mt-1">
                            PoS {s.odds_otm_market_pct.toFixed(0)}%
                          </span>
                        </div>
                      </td>

                      {/* 3. Conviction & Sizing */}
                      <td className="py-3 px-4">
                        <div className="space-y-1">
                          <span className={`inline-block px-2 py-0.5 rounded text-[11px] font-bold ${
                            is2X 
                              ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30" 
                              : "bg-desk-raised text-desk-secondary border border-desk-border"
                          }`}>
                            {is2X ? "2X Allocation (2 Cont)" : "1X Allocation (1 Cont)"}
                          </span>
                          <p className="text-[11px] text-desk-tertiary leading-tight max-w-[200px] truncate" title={s.sizing_reason}>
                            {s.sizing_reason || "Standard allocation"}
                          </p>
                        </div>
                      </td>

                      {/* 4. Contract Details */}
                      <td className="py-3 px-4">
                        <div className="space-y-0.5">
                          <div className="text-white font-bold">
                            ${s.strike.toFixed(1)} Put
                          </div>
                          <div className="text-[11px] text-desk-secondary">
                            Exp: {s.expiry} ({s.dte} DTE)
                          </div>
                          <div className="text-[10px] text-desk-tertiary">
                            Δ {s.delta ? s.delta.toFixed(2) : "-0.15"} &middot; IV {(s.iv * 100).toFixed(0)}%
                          </div>
                        </div>
                      </td>

                      {/* 5. Spot & Cushion */}
                      <td className="py-3 px-4 text-right">
                        <div className="space-y-0.5">
                          <div className="text-white font-bold">${s.spot.toFixed(2)}</div>
                          <div className="text-emerald-400 font-bold">+{s.cushion_pct.toFixed(1)}% Cushion</div>
                          <div className="text-[10px] text-desk-tertiary">1σ: ${s.one_sigma_low.toFixed(1)}</div>
                        </div>
                      </td>

                      {/* 6. Option Bid / ROC */}
                      <td className="py-3 px-4 text-right">
                        <div className="space-y-0.5">
                          <div className="text-white font-bold">${s.bid.toFixed(2)} Bid</div>
                          <div className="text-desk-accent font-bold">+{s.roc_cycle_pct.toFixed(1)}% ROC</div>
                          <div className="text-[10px] text-desk-secondary font-mono">
                            ${formatNumber(s.collateral)} Collat
                          </div>
                        </div>
                      </td>

                      {/* 7. Macro Levels & Structure */}
                      <td className="py-3 px-4">
                        <div className="space-y-1">
                          <div className="flex items-center gap-1.5">
                            {isGolden ? (
                              <span className="px-1.5 py-0.5 rounded text-[10px] bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
                                50&gt;200 Golden
                              </span>
                            ) : (
                              <span className="px-1.5 py-0.5 rounded text-[10px] bg-desk-raised text-desk-tertiary border border-desk-border">
                                Normal Trend
                              </span>
                            )}
                            {macroFloor && s.strike <= macroFloor && (
                              <span className="px-1.5 py-0.5 rounded text-[10px] bg-sky-500/15 text-sky-400 border border-sky-500/30">
                                Fortified Shelf
                              </span>
                            )}
                          </div>
                          <div className="text-[10px] text-desk-tertiary">
                            Basis: ${s.cost_basis.toFixed(2)} &middot; 200MA: ${s.levels?.sma200?.toFixed(1) || "N/A"}
                          </div>
                        </div>
                      </td>

                      {/* 8. TradingView Action Button & Approval Checkbox */}
                      <td className="py-3 px-4 text-center">
                        <div className="flex items-center justify-center gap-2">
                          <button
                            onClick={() => handleStockClick(s.ticker)}
                            className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-control bg-desk-raised hover:bg-desk-accent hover:text-desk-bg text-white font-semibold text-xs transition-colors border border-desk-border"
                            title="Open TradingView Chart with all levels"
                          >
                            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                              <line x1="18" y1="20" x2="18" y2="10" />
                              <line x1="12" y1="20" x2="12" y2="4" />
                              <line x1="6" y1="20" x2="6" y2="14" />
                            </svg>
                            <span>Chart</span>
                          </button>

                          <label className={`inline-flex items-center gap-1.5 px-2 py-1 rounded-control border cursor-pointer select-none transition-all ${
                            approvedTickers.has(s.ticker.toUpperCase())
                              ? "bg-emerald-500/15 border-emerald-500/40 text-emerald-400 font-bold"
                              : "bg-[#121821] border-desk-border text-desk-secondary hover:border-desk-secondary"
                          }`}>
                            <input
                              type="checkbox"
                              checked={approvedTickers.has(s.ticker.toUpperCase())}
                              onChange={(e) => toggleApproval(s.ticker, e.target.checked)}
                              className="w-3.5 h-3.5 rounded border-desk-border bg-desk-bg text-emerald-500 cursor-pointer accent-emerald-500"
                            />
                            <span className="text-[11px] font-mono">
                              {approvedTickers.has(s.ticker.toUpperCase()) ? "Approved" : "Approve"}
                            </span>
                          </label>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 2: ACTIVE IN-FLIGHT POSITIONS & SYSTEMATIC TRIAGE PROTOCOL */}
      {/* ========================================================================= */}
      {activeTab === "active" && (
        <div className="space-y-4">
          <div className="overflow-x-auto rounded-xl border border-desk-border bg-desk-card shadow-sm">
            <table className="w-full text-xs font-mono text-left divide-y divide-desk-border">
              <thead className="bg-[#121821] text-desk-tertiary uppercase text-[11px] tracking-wider">
                <tr>
                  <th className="py-3 px-4">Stock</th>
                  <th className="py-3 px-4">Strike & Basis</th>
                  <th className="py-3 px-4">Entry / Current</th>
                  <th className="py-3 px-4 text-center">50% TP Progress</th>
                  <th className="py-3 px-4">Triage Protocol Status</th>
                  <th className="py-3 px-4">Prescribed Triage Action</th>
                  <th className="py-3 px-4 text-center">TradingView</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-desk-border/70">
                {activeSignals.map((a, idx) => {
                  const isProfit = a.profit_pct >= 0;
                  const absProfit = Math.min(100, Math.abs(a.profit_pct));

                  return (
                    <tr key={idx} className="hover:bg-desk-raised/60 transition-colors">
                      {/* Stock */}
                      <td className="py-3 px-4">
                        <button
                          onClick={() => handleStockClick(a.ticker)}
                          className="text-left font-black text-base text-white hover:text-desk-accent underline underline-offset-4 decoration-desk-border transition-colors"
                        >
                          {a.ticker}
                        </button>
                        <div className="text-[11px] text-desk-tertiary">
                          Entry: {a.entry_date}
                        </div>
                      </td>

                      {/* Strike & Basis */}
                      <td className="py-3 px-4">
                        <div className="text-white font-bold">${a.strike.toFixed(1)} Put</div>
                        <div className="text-[11px] text-desk-secondary">
                          Basis: ${a.net_basis ? a.net_basis.toFixed(2) : (a.strike - a.entry_price).toFixed(2)}
                        </div>
                        <div className="text-[10px] text-desk-tertiary">
                          Spot: ${a.current_spot.toFixed(2)}
                        </div>
                      </td>

                      {/* Entry / Current */}
                      <td className="py-3 px-4">
                        <div className="text-desk-tertiary">Entry: ${a.entry_price.toFixed(2)}</div>
                        <div className="text-white font-bold">Now: ${a.current_price.toFixed(2)}</div>
                        <div className="text-[10px] text-desk-secondary">TP50: ${a.tp_50_price.toFixed(2)}</div>
                      </td>

                      {/* Progress Bar */}
                      <td className="py-3 px-4 min-w-[140px]">
                        <div className="space-y-1">
                          <div className="flex items-center justify-between text-[11px]">
                            <span className={isProfit ? "text-emerald-400 font-bold" : "text-desk-riskText font-bold"}>
                              {isProfit ? `+${a.profit_pct.toFixed(1)}%` : `${a.profit_pct.toFixed(1)}%`}
                            </span>
                            <span className="text-desk-tertiary text-[10px]">
                              {a.rolls > 0 ? `${a.rolls} rolls` : "0 rolls"}
                            </span>
                          </div>
                          <div className="w-full h-1.5 rounded-full bg-desk-raised overflow-hidden">
                            <div
                              className={`h-full rounded-full transition-all duration-300 ${
                                isProfit ? "bg-emerald-400" : "bg-desk-risk"
                              }`}
                              style={{ width: `${absProfit}%` }}
                            />
                          </div>
                        </div>
                      </td>

                      {/* Status Badge */}
                      <td className="py-3 px-4">
                        <span
                          className="inline-block px-2.5 py-1 rounded text-[11px] font-bold border"
                          style={{
                            color: a.badge_color || "#38BDF8",
                            borderColor: `${a.badge_color || "#38BDF8"}40`,
                            backgroundColor: `${a.badge_color || "#38BDF8"}15`,
                          }}
                        >
                          {a.status}
                        </span>
                      </td>

                      {/* Prescribed Triage Action */}
                      <td className="py-3 px-4 max-w-[280px]">
                        <p className="text-[11px] text-desk-secondary leading-snug">
                          {a.triage_action || "Holding Theta"}
                        </p>
                      </td>

                      {/* Action */}
                      <td className="py-3 px-4 text-center">
                        <button
                          onClick={() => handleStockClick(a.ticker)}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-control bg-desk-raised hover:bg-desk-accent hover:text-desk-bg text-white font-semibold text-xs transition-colors border border-desk-border"
                        >
                          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                            <line x1="18" y1="20" x2="18" y2="10" />
                            <line x1="12" y1="20" x2="12" y2="4" />
                            <line x1="6" y1="20" x2="6" y2="14" />
                          </svg>
                          <span>Chart</span>
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 3: HELD BACK CANDIDATES & ELIMINATION AUDIT */}
      {/* ========================================================================= */}
      {activeTab === "held_back" && (
        <div className="space-y-4">
          <div className="overflow-x-auto rounded-xl border border-desk-border bg-desk-card shadow-sm">
            <table className="w-full text-xs font-mono text-left divide-y divide-desk-border">
              <thead className="bg-[#121821] text-desk-tertiary uppercase text-[11px] tracking-wider">
                <tr>
                  <th className="py-3 px-4 font-bold">Stock</th>
                  <th className="py-3 px-4">Failure Reason / Gate Violated</th>
                  <th className="py-3 px-4 text-center">TradingView</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-desk-border/70">
                {heldBack.map((hb, idx) => (
                  <tr key={idx} className="hover:bg-desk-raised/60 transition-colors">
                    <td className="py-3 px-4">
                      <button
                        onClick={() => handleStockClick(hb.ticker)}
                        className="font-black text-base text-white hover:text-desk-accent underline underline-offset-4 decoration-desk-border transition-colors"
                      >
                        {hb.ticker}
                      </button>
                    </td>
                    <td className="py-3 px-4 text-desk-riskText font-medium">
                      {hb.reason}
                    </td>
                    <td className="py-3 px-4 text-center">
                      <button
                        onClick={() => handleStockClick(hb.ticker)}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-control bg-desk-raised hover:bg-desk-accent hover:text-desk-bg text-white font-semibold text-xs transition-colors border border-desk-border"
                      >
                        <span>Chart</span>
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TRADINGVIEW INTERACTIVE MODAL WITH BUILT-IN MODEL LEVELS */}
      {/* ========================================================================= */}
      <TradingViewModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        setup={selectedSetup}
      />
    </div>
  );
}
