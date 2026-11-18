"use client";

import React, { useState, useMemo } from "react";
import { Setup } from "@/types/snapshot";

interface ModelLevelsChartProps {
  setup: Setup;
  className?: string;
}

export function ModelLevelsChart({ setup, className = "" }: ModelLevelsChartProps) {
  const [viewMode, setViewMode] = useState<"scale" | "bars">("scale");

  const spot = setup.spot;
  const strike = setup.strike;
  const costBasis = setup.cost_basis;
  const oneSigmaLow = setup.one_sigma_low;
  const levels = setup.levels || {};
  const macroFloor = levels.macro_support || levels.swing_low_252;

  // Compile all 13 structural levels relative to the Signal Price
  const levelItems = useMemo(() => {
    const list = [
      {
        id: "signal",
        name: "Signal / Entry Price",
        price: spot,
        tag: "Signal Entry",
        category: "signal",
        color: "#38BDF8",
        isPrimary: true,
      },
      {
        id: "strike",
        name: "Put Strike Price",
        price: strike,
        tag: `Target (${setup.cushion_pct.toFixed(1)}% Cushion)`,
        category: "strike",
        color: "#10B981",
        isPrimary: true,
      },
      ...(costBasis ? [{
        id: "basis",
        name: "Net Cost Basis",
        price: costBasis,
        tag: "Breakeven",
        category: "basis",
        color: "#F59E0B",
        isPrimary: true,
      }] : []),
      ...(oneSigmaLow ? [{
        id: "sigma",
        name: "1σ Expected Move Floor",
        price: oneSigmaLow,
        tag: "1-Sigma Limit",
        category: "risk",
        color: "#F43F5E",
        isPrimary: true,
      }] : []),
      ...(levels.vwap20 ? [{
        id: "vwap20",
        name: "20-Day VWAP",
        price: levels.vwap20,
        tag: "Short-Term VWAP",
        category: "vwap",
        color: "#94A3B8",
        isPrimary: false,
      }] : []),
      ...(levels.sma50 ? [{
        id: "sma50",
        name: "50-Day SMA",
        price: levels.sma50,
        tag: "50-Day Trend",
        category: "trend",
        color: "#60A5FA",
        isPrimary: false,
      }] : []),
      ...(levels.sma200 ? [{
        id: "sma200",
        name: "200-Day SMA",
        price: levels.sma200,
        tag: levels.sma50 && levels.sma50 > levels.sma200 ? "Golden Cross Floor" : "Secular 200 MA",
        category: "trend",
        color: "#A855F7",
        isPrimary: false,
      }] : []),
      ...(levels.macro_vpoc ? [{
        id: "macro_vpoc",
        name: "Macro 1Y AVWAP (VPOC)",
        price: levels.macro_vpoc,
        tag: "Macro VPOC",
        category: "vwap",
        color: "#818CF8",
        isPrimary: false,
      }] : []),
      ...(levels.avwap ? [{
        id: "avwap",
        name: "Anchored VWAP (Cycle Low)",
        price: levels.avwap,
        tag: "Anchor VWAP",
        category: "vwap",
        color: "#2DD4BF",
        isPrimary: false,
      }] : []),
      ...(levels.ote_618 ? [{
        id: "ote_618",
        name: "ICT OTE 61.8% Retracement",
        price: levels.ote_618,
        tag: "OTE 61.8%",
        category: "fib",
        color: "#E2E8F0",
        isPrimary: false,
      }] : []),
      ...(levels.ote_786 ? [{
        id: "ote_786",
        name: "ICT OTE 78.6% Deep Discount",
        price: levels.ote_786,
        tag: "OTE 78.6%",
        category: "fib",
        color: "#CBD5E1",
        isPrimary: false,
      }] : []),
      ...(levels.macro_support ? [{
        id: "macro_support",
        name: "Macro 1–2Y Support Shelf",
        price: levels.macro_support,
        tag: "Institutional Floor",
        category: "shelf",
        color: "#059669",
        isPrimary: false,
      }] : []),
      ...(levels.swing_low_252 ? [{
        id: "swing_low_252",
        name: "52-Week Macro Low (252d)",
        price: levels.swing_low_252,
        tag: "52W Low",
        category: "shelf",
        color: "#34D399",
        isPrimary: false,
      }] : []),
    ];

    // Calculate distance from signal price
    return list.map((item) => {
      const diff = item.price - spot;
      const pct = (diff / spot) * 100;
      return {
        ...item,
        diff,
        pct,
      };
    }).sort((a, b) => b.price - a.price);
  }, [spot, strike, costBasis, oneSigmaLow, levels, setup.cushion_pct]);

  const maxPrice = Math.max(...levelItems.map((l) => l.price)) * 1.02;
  const minPrice = Math.min(...levelItems.map((l) => l.price)) * 0.98;
  const priceRange = maxPrice - minPrice;

  // Function to convert price to vertical SVG percentage (0% top to 100% bottom)
  const getScaleY = (price: number) => {
    return ((maxPrice - price) / priceRange) * 100;
  };

  const signalY = getScaleY(spot);
  const strikeY = getScaleY(strike);
  const cushionTop = Math.min(signalY, strikeY);
  const cushionHeight = Math.abs(strikeY - signalY);

  return (
    <div className={`rounded-card border border-desk-border bg-desk-card p-4 space-y-4 ${className}`}>
      {/* Header with Title and Mode Switcher */}
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-desk-border/60 pb-3">
        <div>
          <div className="flex items-center gap-2">
            <h3 className="text-xs font-bold font-mono tracking-wider uppercase text-desk-text flex items-center gap-1.5">
              <span>📐 Model Levels Distribution Chart</span>
            </h3>
            <span className="rounded bg-sky-500/15 border border-sky-500/30 px-1.5 py-0.2 text-[10px] font-mono text-sky-400 font-semibold">
              Signal: ${spot.toFixed(2)}
            </span>
          </div>
          <p className="text-[11px] text-desk-secondary mt-0.5">
            Proportional visual layout of all 13 structural defenses beneath the Signal / Entry Price.
          </p>
        </div>

        {/* View Toggle */}
        <div className="flex items-center rounded-control bg-desk-bg p-0.5 border border-desk-border text-[11px] font-mono">
          <button
            onClick={() => setViewMode("scale")}
            className={`px-2.5 py-1 rounded-control transition-all font-semibold ${
              viewMode === "scale"
                ? "bg-desk-raised text-desk-text shadow-sm"
                : "text-desk-secondary hover:text-desk-text"
            }`}
            title="Proportional vertical price scale"
          >
            📏 Vertical Scale
          </button>
          <button
            onClick={() => setViewMode("bars")}
            className={`px-2.5 py-1 rounded-control transition-all font-semibold ${
              viewMode === "bars"
                ? "bg-desk-raised text-desk-text shadow-sm"
                : "text-desk-secondary hover:text-desk-text"
            }`}
            title="Horizontal distance buffer bars"
          >
            📊 Distance Bars
          </button>
        </div>
      </div>

      {/* VIEW 1: PROPORTIONAL VERTICAL SCALE */}
      {viewMode === "scale" ? (
        <div className="relative bg-[#0B0E14] rounded-lg border border-desk-border/70 p-4 overflow-hidden">
          {/* Legend Banner */}
          <div className="flex flex-wrap items-center justify-between text-[11px] font-mono pb-3 border-b border-desk-border/40 text-desk-tertiary">
            <div className="flex items-center gap-4">
              <span className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-sky-400" />
                <strong className="text-white">Signal / Entry ($spot)</strong>
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-400" />
                <strong className="text-emerald-400">Put Strike (Target)</strong>
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-3 h-2 rounded bg-emerald-500/20 border border-emerald-500/40" />
                <span className="text-emerald-300">Safety Cushion Zone (+{setup.cushion_pct.toFixed(1)}%)</span>
              </span>
            </div>
            <span className="text-desk-secondary">Range: ${minPrice.toFixed(0)} – ${maxPrice.toFixed(0)}</span>
          </div>

          {/* Vertical Scale Container */}
          <div className="relative h-[420px] my-2 select-none">
            {/* Background Cushion Shaded Zone */}
            <div
              className="absolute left-8 right-2 rounded border border-dashed border-emerald-500/50 bg-emerald-500/10 pointer-events-none transition-all flex items-center justify-end pr-3"
              style={{
                top: `${cushionTop}%`,
                height: `${Math.max(24, cushionHeight)}%`,
              }}
            >
              <span className="text-[10px] font-mono font-bold text-emerald-400 tracking-wider uppercase opacity-80">
                🛡️ +{setup.cushion_pct.toFixed(1)}% Cushion Buffer (${(spot - strike).toFixed(2)})
              </span>
            </div>

            {/* Central Vertical Price Axis Line */}
            <div className="absolute left-8 top-0 bottom-0 w-0.5 bg-desk-border" />

            {/* Render Each Level Line Along Scale */}
            {levelItems.map((lvl) => {
              const yPct = getScaleY(lvl.price);
              const isSignal = lvl.id === "signal";
              const isStrike = lvl.id === "strike";

              return (
                <div
                  key={lvl.id}
                  className="absolute left-0 right-0 flex items-center group transition-all"
                  style={{ top: `${yPct}%`, transform: "translateY(-50%)" }}
                >
                  {/* Axis Tick Marker */}
                  <div className="w-8 flex items-center justify-end pr-1.5 shrink-0">
                    <span
                      className={`w-3 h-3 rounded-full border-2 transition-transform group-hover:scale-125 ${
                        isSignal
                          ? "bg-sky-400 border-white ring-2 ring-sky-400/40 animate-pulse"
                          : isStrike
                          ? "bg-emerald-400 border-white ring-2 ring-emerald-400/40"
                          : "border-[#0B0E14]"
                      }`}
                      style={{ backgroundColor: lvl.color }}
                    />
                  </div>

                  {/* Horizontal Connection Guide Line */}
                  <div
                    className={`h-[1px] flex-1 mr-3 transition-opacity ${
                      isSignal
                        ? "bg-sky-400/80 shadow-[0_0_8px_rgba(56,189,248,0.5)]"
                        : isStrike
                        ? "bg-emerald-400/80 shadow-[0_0_8px_rgba(16,185,129,0.5)]"
                        : "bg-desk-border/60 group-hover:bg-desk-border"
                    }`}
                  />

                  {/* Label Pill */}
                  <div
                    className={`flex items-center justify-between gap-3 px-2.5 py-1 rounded text-xs font-mono shrink-0 transition-all ${
                      isSignal
                        ? "bg-sky-500/20 border border-sky-400/60 text-white font-bold shadow-md"
                        : isStrike
                        ? "bg-emerald-500/20 border border-emerald-400/60 text-emerald-300 font-bold shadow-md"
                        : "bg-[#121821] border border-desk-border/60 text-desk-secondary group-hover:border-desk-border group-hover:text-white"
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: lvl.color }} />
                      <span className="font-semibold truncate max-w-[170px]">{lvl.name}</span>
                    </div>

                    <div className="flex items-center gap-2">
                      <span className="font-bold text-white">${lvl.price.toFixed(2)}</span>
                      <span
                        className={`text-[10px] px-1.5 py-0.2 rounded font-semibold ${
                          lvl.diff === 0
                            ? "bg-sky-500/30 text-sky-200"
                            : lvl.diff < 0
                            ? "bg-emerald-500/20 text-emerald-400"
                            : "bg-rose-500/20 text-rose-300"
                        }`}
                      >
                        {lvl.diff === 0 ? "ENTRY" : `${lvl.pct > 0 ? "+" : ""}${lvl.pct.toFixed(1)}%`}
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      ) : (
        /* VIEW 2: HORIZONTAL DISTANCE BARS */
        <div className="space-y-2 bg-[#0B0E14] rounded-lg border border-desk-border/70 p-4">
          <div className="text-[11px] font-mono text-desk-tertiary uppercase pb-2 flex justify-between border-b border-desk-border/40">
            <span>Model Defense Level</span>
            <span>Distance Below Entry ($spot)</span>
          </div>

          <div className="space-y-2 pt-1">
            {levelItems.map((lvl) => {
              const absPct = Math.abs(lvl.pct);
              const maxPct = Math.max(...levelItems.map((l) => Math.abs(l.pct)), 25);
              const barWidth = Math.min(100, (absPct / maxPct) * 100);
              const isSignal = lvl.id === "signal";
              const isStrike = lvl.id === "strike";

              return (
                <div
                  key={lvl.id}
                  className={`p-2 rounded-control border text-xs font-mono transition-all ${
                    isSignal
                      ? "bg-sky-500/10 border-sky-500/40 text-white font-bold"
                      : isStrike
                      ? "bg-emerald-500/15 border-emerald-500/40 text-emerald-300 font-bold"
                      : "bg-[#121821] border-desk-border/50 text-desk-secondary hover:text-desk-text hover:border-desk-border"
                  }`}
                >
                  <div className="flex items-center justify-between mb-1.5">
                    <div className="flex items-center gap-2">
                      <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: lvl.color }} />
                      <span className="font-semibold">{lvl.name}</span>
                      <span className="text-[10px] text-desk-tertiary">({lvl.tag})</span>
                    </div>

                    <div className="flex items-center gap-3">
                      <span className="font-bold text-white">${lvl.price.toFixed(2)}</span>
                      <span
                        className={`text-[11px] font-bold ${
                          isSignal
                            ? "text-sky-400"
                            : lvl.pct < 0
                            ? "text-emerald-400"
                            : "text-rose-400"
                        }`}
                      >
                        {isSignal ? "0.0% [ENTRY]" : `${lvl.pct > 0 ? "+" : ""}${lvl.pct.toFixed(1)}%`}
                      </span>
                    </div>
                  </div>

                  {/* Horizontal Bar Graphic */}
                  <div className="w-full h-1.5 bg-desk-bg rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all duration-300"
                      style={{
                        width: isSignal ? "100%" : `${Math.max(4, barWidth)}%`,
                        backgroundColor: lvl.color,
                        opacity: isSignal ? 0.3 : 0.85,
                      }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Safety Buffer Explainer Summary */}
      <div className="rounded-control bg-desk-raised/60 p-3 flex flex-wrap items-center justify-between gap-2 text-xs font-mono border border-desk-border/60">
        <div className="flex items-center gap-2">
          <span className="text-emerald-400 font-bold">🛡️ Kirsten 7-Gate Safety Verification:</span>
          <span className="text-desk-secondary">
            Put Strike sits <strong>${(spot - strike).toFixed(2)}</strong> beneath Entry Price, anchoring behind <strong>{levelItems.filter(l => l.price > strike && l.id !== "signal").length} layers</strong> of institutional support.
          </span>
        </div>
        <span className="font-bold text-white">
          Strike ${strike.toFixed(1)} &middot; Cushion +{setup.cushion_pct.toFixed(1)}%
        </span>
      </div>
    </div>
  );
}
