"use client";

import React, { useEffect, useRef, useState } from "react";
import { createChart, ColorType, LineStyle, CandlestickSeries, HistogramSeries, IChartApi } from "lightweight-charts";

interface SignalChartModalProps {
  ticker: string | null;
  name?: string;
  signalPrice?: number;
  strike?: number;
  expiry?: string;
  onClose: () => void;
}

/**
 * Daily candlestick chart (TradingView Lightweight Charts) for one setup,
 * with two horizontal lines only: the signal price and the CSP strike.
 */
export function SignalChartModal({ ticker, name, signalPrice, strike, expiry, onClose }: SignalChartModalProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  // Close on Escape, lock page scroll while open
  useEffect(() => {
    if (!ticker) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [ticker, onClose]);

  useEffect(() => {
    if (!ticker || !containerRef.current) return;
    let chart: IChartApi | null = null;
    let cancelled = false;
    const el = containerRef.current;
    const onResize = () => chart && chart.applyOptions({ width: el.clientWidth, height: el.clientHeight });

    (async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await fetch(`/api/bars?ticker=${encodeURIComponent(ticker)}`);
        if (!res.ok) throw new Error(`No daily price data for ${ticker} yet.`);
        const data = await res.json();
        const bars: { time: string; open: number; high: number; low: number; close: number; volume: number }[] = data.bars || [];
        if (cancelled) return;
        el.innerHTML = "";
        chart = createChart(el, {
          width: el.clientWidth,
          height: el.clientHeight || 460,
          layout: { background: { type: ColorType.Solid, color: "#0B0E14" }, textColor: "#A3AEBC", fontSize: 12 },
          grid: { vertLines: { color: "rgba(30,39,51,0.6)" }, horzLines: { color: "rgba(30,39,51,0.6)" } },
          rightPriceScale: { borderColor: "#1E2733", scaleMargins: { top: 0.08, bottom: 0.18 } },
          timeScale: { borderColor: "#1E2733", rightOffset: 8, barSpacing: 7 },
          crosshair: { mode: 1 },
        });
        const candles = chart.addSeries(CandlestickSeries, {
          upColor: "#10B981", downColor: "#EF4444",
          borderUpColor: "#10B981", borderDownColor: "#EF4444",
          wickUpColor: "#10B981", wickDownColor: "#EF4444",
        });
        candles.setData(bars.map((b) => ({ time: b.time, open: b.open, high: b.high, low: b.low, close: b.close })));
        const vol = chart.addSeries(HistogramSeries, { priceFormat: { type: "volume" }, priceScaleId: "" });
        vol.priceScale().applyOptions({ scaleMargins: { top: 0.85, bottom: 0 } });
        vol.setData(bars.map((b) => ({
          time: b.time, value: b.volume,
          color: b.close >= b.open ? "rgba(16,185,129,0.25)" : "rgba(239,68,68,0.25)",
        })));

        if (typeof signalPrice === "number") {
          candles.createPriceLine({
            price: signalPrice, color: "#38BDF8", lineWidth: 2, lineStyle: LineStyle.Solid,
            axisLabelVisible: true, title: `Signal $${signalPrice.toFixed(2)}`,
          });
        }
        if (typeof strike === "number") {
          candles.createPriceLine({
            price: strike, color: "#F2B24C", lineWidth: 2, lineStyle: LineStyle.Dashed,
            axisLabelVisible: true, title: `CSP strike $${strike.toFixed(2)}`,
          });
        }
        chart.timeScale().fitContent();
        window.addEventListener("resize", onResize);
      } catch (e: any) {
        if (!cancelled) setError(e?.message || "Could not load the chart.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
      window.removeEventListener("resize", onResize);
      if (chart) chart.remove();
    };
  }, [ticker, signalPrice, strike]);

  if (!ticker) return null;

  const cushion = signalPrice && strike ? ((signalPrice - strike) / signalPrice) * 100 : null;

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/70 p-3 sm:p-6"
      role="dialog"
      aria-modal="true"
      aria-label={`${ticker} daily chart`}
      onClick={onClose}
    >
      <div
        className="w-full max-w-5xl rounded-card border border-desk-border bg-desk-card shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-desk-border px-4 py-3">
          <div>
            <h2 className="text-base font-bold text-desk-text">
              <span className="font-mono text-desk-accent">{ticker}</span>
              {name ? <span className="ml-2 text-sm font-normal text-desk-secondary">{name}</span> : null}
              <span className="ml-2 text-xs font-normal text-desk-tertiary">Daily</span>
            </h2>
            <p className="mt-0.5 text-xs text-desk-secondary">
              <span className="inline-block h-0.5 w-4 align-middle bg-[#38BDF8] mr-1" />Signal price
              {typeof signalPrice === "number" ? ` $${signalPrice.toFixed(2)}` : ""}
              <span className="inline-block h-0.5 w-4 align-middle bg-[#F2B24C] ml-4 mr-1" />CSP strike
              {typeof strike === "number" ? ` $${strike.toFixed(2)}` : ""}
              {expiry ? ` (exp ${expiry})` : ""}
              {cushion !== null ? ` · ${cushion.toFixed(1)}% below the signal price` : ""}
            </p>
          </div>
          <button
            onClick={onClose}
            className="rounded-control border border-desk-border px-3 py-1.5 text-xs font-semibold text-desk-secondary hover:text-desk-text"
            aria-label="Close chart"
          >
            Close (Esc)
          </button>
        </div>
        <div className="relative h-[60vh] min-h-[320px] w-full">
          <div ref={containerRef} className="absolute inset-0" />
          {loading && (
            <div className="absolute inset-0 flex items-center justify-center text-sm text-desk-secondary">Loading chart…</div>
          )}
          {error && (
            <div className="absolute inset-0 flex items-center justify-center p-6 text-center text-sm text-desk-riskText">{error}</div>
          )}
        </div>
      </div>
    </div>
  );
}

export default SignalChartModal;
