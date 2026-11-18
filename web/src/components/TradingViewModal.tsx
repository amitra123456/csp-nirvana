"use client";

import React, { useEffect, useState } from "react";
import { Setup, Levels } from "@/types/snapshot";
import { formatCurrency, formatPercent } from "@/lib/data";

interface TradingViewModalProps {
  isOpen: boolean;
  onClose: () => void;
  setup: Setup | null;
}

export function TradingViewModal({ isOpen, onClose, setup }: TradingViewModalProps) {
  const [activeTab, setActiveTab] = useState<"levels" | "factors">("levels");

  // Handle escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    if (isOpen) {
      document.body.style.overflow = "hidden";
      window.addEventListener("keydown", handleKeyDown);
    }
    return () => {
      document.body.style.overflow = "unset";
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen, onClose]);

  if (!isOpen || !setup) return null;

  const ticker = setup.ticker;
  const spot = setup.spot;
  const strike = setup.strike;
  const costBasis = setup.cost_basis;
  const oneSigmaLow = setup.one_sigma_low;
  const levels = setup.levels || ({} as Levels);

  // Compile all model levels with color coding and contextual roles
  const modelLevels = [
    {
      name: "Current Spot Price",
      price: spot,
      category: "spot",
      color: "#6CB4FF",
      tag: "Live Spot",
      desc: "Reference candle close",
      distancePct: 0.0,
      isPrimary: true
    },
    {
      name: "Put Strike Price",
      price: strike,
      category: "strike",
      color: "#34D399",
      tag: `Target (${setup.cushion_pct.toFixed(1)}% Cushion)`,
      desc: "Contract sell strike",
      distancePct: ((strike - spot) / spot) * 100,
      isPrimary: true
    },
    {
      name: "Net Cost Basis",
      price: costBasis,
      category: "basis",
      color: "#FCD34D",
      tag: "Break-Even Floor",
      desc: "Strike minus premium received",
      distancePct: ((costBasis - spot) / spot) * 100,
      isPrimary: true
    },
    {
      name: "1σ Expected Move Floor",
      price: oneSigmaLow,
      category: "sigma",
      color: "#F87171",
      tag: "1-Sigma Limit",
      desc: "84.1% 1-standard deviation floor",
      distancePct: ((oneSigmaLow - spot) / spot) * 100,
      isPrimary: true
    },
    ...(levels.macro_support ? [{
      name: "Macro 1-2Y Support Shelf",
      price: levels.macro_support,
      category: "macro",
      color: "#10B981",
      tag: "Institutional Floor",
      desc: "Multi-year historical pivot minimum",
      distancePct: ((levels.macro_support - spot) / spot) * 100,
      isPrimary: false
    }] : []),
    ...(levels.swing_low_252 ? [{
      name: "52-Week Macro Low (252d)",
      price: levels.swing_low_252,
      category: "macro",
      color: "#059669",
      tag: "52W Low",
      desc: "252-day absolute swing floor",
      distancePct: ((levels.swing_low_252 - spot) / spot) * 100,
      isPrimary: false
    }] : []),
    ...(levels.macro_vpoc ? [{
      name: "Macro 1Y AVWAP (VPOC)",
      price: levels.macro_vpoc,
      category: "vwap",
      color: "#818CF8",
      tag: "Macro VPOC",
      desc: "252-day volume-weighted anchor",
      distancePct: ((levels.macro_vpoc - spot) / spot) * 100,
      isPrimary: false
    }] : []),
    ...(levels.sma200 ? [{
      name: "200-Day SMA",
      price: levels.sma200,
      category: "ma",
      color: "#A78BFA",
      tag: levels.sma50 && levels.sma50 > levels.sma200 ? "Golden Cross Floor" : "Secular 200 MA",
      desc: "Institutional secular trend baseline",
      distancePct: ((levels.sma200 - spot) / spot) * 100,
      isPrimary: false
    }] : []),
    ...(levels.sma50 ? [{
      name: "50-Day SMA",
      price: levels.sma50,
      category: "ma",
      color: "#60A5FA",
      tag: "Intermediate Trend",
      desc: "50-day moving average",
      distancePct: ((levels.sma50 - spot) / spot) * 100,
      isPrimary: false
    }] : []),
    ...(levels.avwap ? [{
      name: "Anchored VWAP (Cycle Low)",
      price: levels.avwap,
      category: "vwap",
      color: "#38BDF8",
      tag: "Anchor VWAP",
      desc: "Institutional average volume cost",
      distancePct: ((levels.avwap - spot) / spot) * 100,
      isPrimary: false
    }] : []),
    ...(levels.vwap20 ? [{
      name: "20-Day VWAP",
      price: levels.vwap20,
      category: "vwap",
      color: "#94A3B8",
      tag: "Short-Term VWAP",
      desc: "20-day volume-weighted price",
      distancePct: ((levels.vwap20 - spot) / spot) * 100,
      isPrimary: false
    }] : []),
    ...(levels.ote_618 ? [{
      name: "ICT OTE 61.8% Retracement",
      price: levels.ote_618,
      category: "fib",
      color: "#E2E8F0",
      tag: "OTE 61.8%",
      desc: "Optimal Trade Entry sweet spot",
      distancePct: ((levels.ote_618 - spot) / spot) * 100,
      isPrimary: false
    }] : []),
    ...(levels.ote_786 ? [{
      name: "ICT OTE 78.6% Deep Discount",
      price: levels.ote_786,
      category: "fib",
      color: "#CBD5E1",
      tag: "OTE 78.6%",
      desc: "Deep discount liquidity pool",
      distancePct: ((levels.ote_786 - spot) / spot) * 100,
      isPrimary: false
    }] : []),
  ].sort((a, b) => b.price - a.price);

  const tvUrl = `https://www.tradingview.com/chart/?symbol=${encodeURIComponent(ticker)}`;
  const widgetSrc = `https://s.tradingview.com/widgetembed/?symbol=${encodeURIComponent(ticker)}&interval=D&hidesidetoolbar=0&symboledit=1&saveimage=0&toolbarbg=121821&theme=dark&style=1&timezone=exchange&studies=%5B%22MASimple%40tv-basicstudies%22%2C%22VWAP%40tv-basicstudies%22%5D&locale=en`;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
      <div 
        className="relative w-full max-w-7xl h-[92vh] flex flex-col rounded-2xl bg-[#0E131B] border border-desk-border shadow-2xl overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header Bar */}
        <div className="flex flex-wrap items-center justify-between gap-4 px-6 py-4 border-b border-desk-border bg-[#121821]">
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2">
              <span className="text-2xl font-black font-mono tracking-tight text-white">{ticker}</span>
              <span className="text-sm font-medium text-desk-secondary hidden sm:inline">{setup.name}</span>
            </div>
            
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-full text-xs font-mono font-bold bg-desk-accent/15 text-desk-accent border border-desk-accent/30">
                Score {setup.score.toFixed(1)}
              </span>
              <span className={`px-2.5 py-0.5 rounded-full text-xs font-mono font-bold ${
                setup.sizing_tier === "2x" 
                  ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30" 
                  : "bg-desk-raised text-desk-secondary border border-desk-border"
              }`}>
                {setup.sizing_tier === "2x" ? "2X Conviction" : "1X Allocation"}
              </span>
              <span className="px-2.5 py-0.5 rounded text-[11px] font-mono uppercase bg-desk-raised text-desk-tertiary border border-desk-border">
                {setup.trend}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {/* Quick Metrics */}
            <div className="hidden md:flex items-center gap-4 text-xs font-mono border-r border-desk-border pr-4">
              <div>
                <span className="text-desk-tertiary">Spot:</span>{" "}
                <strong className="text-white">${spot.toFixed(2)}</strong>
              </div>
              <div>
                <span className="text-desk-tertiary">Strike:</span>{" "}
                <strong className="text-emerald-400">${strike.toFixed(1)}P</strong>
              </div>
              <div>
                <span className="text-desk-tertiary">Cushion:</span>{" "}
                <strong className="text-desk-accent">+{setup.cushion_pct.toFixed(1)}%</strong>
              </div>
              <div>
                <span className="text-desk-tertiary">Prem:</span>{" "}
                <strong className="text-white">${setup.bid.toFixed(2)}</strong>
              </div>
            </div>

            {/* External TradingView Link */}
            <a
              href={tvUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-control bg-desk-raised hover:bg-desk-border text-xs font-semibold text-white transition-colors border border-desk-border"
            >
              <span>TradingView.com</span>
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
                <polyline points="15 3 21 3 21 9" />
                <line x1="10" y1="14" x2="21" y2="3" />
              </svg>
            </a>

            {/* Close Button */}
            <button
              onClick={onClose}
              className="p-1.5 rounded-control text-desk-secondary hover:text-white hover:bg-desk-raised transition-colors"
              aria-label="Close modal"
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <line x1="18" y1="6" x2="6" y2="18" />
                <line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            </button>
          </div>
        </div>

        {/* Content Body: Split Screen (Chart 65% + Levels Rail 35%) */}
        <div className="flex-1 flex flex-col lg:flex-row overflow-hidden">
          {/* Main Chart Section */}
          <div className="flex-1 h-full min-h-[350px] relative bg-[#0B0E14]">
            <iframe
              src={widgetSrc}
              title={`TradingView Chart for ${ticker}`}
              className="w-full h-full border-0"
              allowFullScreen
            />
          </div>

          {/* Model Levels & Parameters Side Panel */}
          <div className="w-full lg:w-[420px] flex flex-col border-t lg:border-t-0 lg:border-l border-desk-border bg-[#0E131B] overflow-hidden">
            {/* Panel Tabs */}
            <div className="flex items-center border-b border-desk-border px-4 bg-[#121821]">
              <button
                onClick={() => setActiveTab("levels")}
                className={`py-3 px-4 text-xs font-mono font-bold tracking-wider uppercase border-b-2 transition-colors ${
                  activeTab === "levels"
                    ? "border-desk-accent text-desk-accent"
                    : "border-transparent text-desk-tertiary hover:text-desk-secondary"
                }`}
              >
                Model Levels ({modelLevels.length})
              </button>
              <button
                onClick={() => setActiveTab("factors")}
                className={`py-3 px-4 text-xs font-mono font-bold tracking-wider uppercase border-b-2 transition-colors ${
                  activeTab === "factors"
                    ? "border-desk-accent text-desk-accent"
                    : "border-transparent text-desk-tertiary hover:text-desk-secondary"
                }`}
              >
                Score Attribution (7 Factors)
              </button>
            </div>

            {/* Tab 1: Built-in Model Levels Rail */}
            {activeTab === "levels" && (
              <div className="flex-1 overflow-y-auto p-4 space-y-2">
                <div className="text-[11px] font-mono text-desk-tertiary uppercase pb-1 flex justify-between">
                  <span>Structural Price Level</span>
                  <span>Distance vs Spot</span>
                </div>

                {modelLevels.map((lvl, idx) => (
                  <div
                    key={idx}
                    className={`p-2.5 rounded-lg border transition-all ${
                      lvl.isPrimary
                        ? "bg-[#141B26] border-desk-border shadow-sm"
                        : "bg-[#0E131B] border-desk-border/60 hover:bg-[#121821]"
                    }`}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <span
                          className="w-2.5 h-2.5 rounded-full shrink-0"
                          style={{ backgroundColor: lvl.color }}
                        />
                        <span className={`text-xs font-bold font-mono ${lvl.isPrimary ? "text-white" : "text-desk-text"}`}>
                          ${lvl.price.toFixed(2)}
                        </span>
                        <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-desk-raised text-desk-secondary border border-desk-border">
                          {lvl.tag}
                        </span>
                      </div>

                      <span className={`text-xs font-mono font-bold ${
                        lvl.distancePct === 0
                          ? "text-desk-accent"
                          : lvl.distancePct < 0
                          ? "text-emerald-400"
                          : "text-desk-secondary"
                      }`}>
                        {lvl.distancePct === 0 ? "SPOT" : `${lvl.distancePct.toFixed(1)}%`}
                      </span>
                    </div>

                    <div className="flex items-center justify-between text-[11px] text-desk-tertiary mt-1 pl-4.5">
                      <span>{lvl.name}</span>
                      <span className="text-[10px] italic">{lvl.desc}</span>
                    </div>
                  </div>
                ))}

                {/* Sizing & Structure Rationale Box */}
                <div className="mt-4 p-3 rounded-lg bg-[#141B26] border border-desk-border space-y-1.5 text-xs font-mono">
                  <div className="text-desk-tertiary uppercase text-[10px] font-bold">Model Conviction Rule</div>
                  <div className="text-white font-semibold">{setup.sizing_reason || "Standard 1X Allocation"}</div>
                  <div className="text-desk-secondary text-[11px] leading-relaxed">
                    Strike ${strike.toFixed(1)} sits behind {setup.cushion_pct.toFixed(1)}% downside cushion with 1-Sigma limit at ${oneSigmaLow.toFixed(2)}.
                  </div>
                </div>
              </div>
            )}

            {/* Tab 2: 7-Factor Subscores & Model Attribution */}
            {activeTab === "factors" && (
              <div className="flex-1 overflow-y-auto p-4 space-y-3">
                <div className="text-[11px] font-mono text-desk-tertiary uppercase pb-1">
                  Nirvana Composite Quantitative Breakdown
                </div>

                {setup.score_parts && Object.entries(setup.score_parts).map(([partKey, val], idx) => {
                  const score = val[0];
                  const max = val[1];
                  const pct = Math.min(100, Math.max(0, (score / max) * 100));
                  
                  const factorNames: Record<string, string> = {
                    cushion: "1. Beta-Adaptive Cushion Safety",
                    valuation: "2. Lens 1 Intrinsic Valuation (FCF)",
                    levels: "3. Macro S/R & Trend Integration",
                    news_flow: "4. Catalyst & Whale Absorption",
                    candles: "5. Candlestick & Volume Confirmation",
                    probability: "6. Statistical Market Odds N(d2)",
                    yield: "7. Return on Collateral (Cycle ROC)",
                  };

                  return (
                    <div key={idx} className="p-3 rounded-lg bg-[#141B26] border border-desk-border space-y-1.5 font-mono">
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-bold text-white">{factorNames[partKey] || partKey}</span>
                        <span className="font-bold text-desk-accent">{score.toFixed(1)} / {max.toFixed(1)} pts</span>
                      </div>
                      <div className="w-full h-1.5 rounded-full bg-desk-raised overflow-hidden">
                        <div 
                          className="h-full rounded-full bg-desk-accent transition-all duration-300"
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                    </div>
                  );
                })}

                {/* Watchouts / Risk Checks */}
                {setup.watchouts && setup.watchouts.length > 0 && (
                  <div className="pt-2 space-y-2">
                    <div className="text-[11px] font-mono text-desk-riskText uppercase font-bold">
                      Active Model Watchouts ({setup.watchouts.length})
                    </div>
                    {setup.watchouts.map((w, idx) => (
                      <div key={idx} className="p-2.5 rounded-lg bg-desk-risk/10 border border-desk-risk/30 text-xs font-mono">
                        <div className="font-bold text-desk-riskText">{w.title}</div>
                        <div className="text-[11px] text-desk-secondary mt-0.5">{w.detail}</div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
