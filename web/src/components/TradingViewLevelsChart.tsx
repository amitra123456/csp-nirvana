"use client";

import React, { useEffect, useRef, useState, useMemo, useCallback } from "react";
import { Setup } from "@/types/snapshot";
import { createChart, ColorType, LineStyle, CandlestickSeries, HistogramSeries, IChartApi } from "lightweight-charts";

interface TradingViewLevelsChartProps {
  setup: Setup;
  className?: string;
}

interface ZoneBox {
  id: string;
  label: string;
  topPrice: number;
  bottomPrice: number;
  fillColor: string;
  borderColor: string;
  textColor: string;
}

interface RenderedZone {
  id: string;
  label: string;
  y: number;
  height: number;
  fill: string;
  stroke: string;
  text: string;
}

export function TradingViewLevelsChart({ setup, className = "" }: TradingViewLevelsChartProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const chartRef = useRef<IChartApi | null>(null);
  const seriesRef = useRef<any>(null);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [zones, setZones] = useState<RenderedZone[]>([]);

  const spot = setup.spot;
  const strike = setup.strike;
  const costBasis = setup.cost_basis;
  const oneSigmaLow = setup.one_sigma_low;
  const levels = setup.levels || {};
  const macroFloor = levels.macro_support || levels.swing_low_252;

  // Memoize defined zone boxes so reference never changes unless inputs change
  const definedZoneBoxes: ZoneBox[] = useMemo(() => {
    return [
      // 1. Cushion Safety Zone: Between Spot and Strike
      {
        id: "cushion",
        label: `🛡️ CUSHION SAFETY BUFFER (+${setup.cushion_pct.toFixed(1)}% to Strike $${strike.toFixed(1)})`,
        topPrice: spot,
        bottomPrice: strike,
        fillColor: "rgba(16, 185, 129, 0.08)",
        borderColor: "rgba(16, 185, 129, 0.6)",
        textColor: "#34D399",
      },
      // 2. ICT OTE Discount Zone: Between 61.8% and 78.6%
      ...(levels.ote_618 && levels.ote_786 ? [{
        id: "ote",
        label: `📦 ICT OTE INSTITUTIONAL BUY ZONE ($${levels.ote_786.toFixed(1)} – $${levels.ote_618.toFixed(1)})`,
        topPrice: Math.max(levels.ote_618, levels.ote_786),
        bottomPrice: Math.min(levels.ote_618, levels.ote_786),
        fillColor: "rgba(168, 85, 247, 0.08)",
        borderColor: "rgba(168, 85, 247, 0.6)",
        textColor: "#C084FC",
      }] : []),
      // 3. Macro Support Shelf Floor: Around 1-2Y shelf (±1.5%)
      ...(macroFloor ? [{
        id: "macro",
        label: `🏛️ 1–2Y MACRO ACCUMULATION SHELF ($${macroFloor.toFixed(1)})`,
        topPrice: macroFloor * 1.015,
        bottomPrice: macroFloor * 0.985,
        fillColor: "rgba(5, 150, 105, 0.12)",
        borderColor: "rgba(16, 185, 129, 0.7)",
        textColor: "#10B981",
      }] : []),
      // 4. Tail Risk / Wheel Assignment Zone: Below cost basis down to 1-sigma
      ...(costBasis && oneSigmaLow && costBasis > oneSigmaLow ? [{
        id: "tail",
        label: `⚠️ TAIL RISK / WHEEL ASSIGNMENT BUFFER (Basis $${costBasis.toFixed(1)} → 1σ $${oneSigmaLow.toFixed(1)})`,
        topPrice: costBasis,
        bottomPrice: oneSigmaLow,
        fillColor: "rgba(244, 63, 94, 0.06)",
        borderColor: "rgba(244, 63, 94, 0.4)",
        textColor: "#F87171",
      }] : []),
    ];
  }, [setup.cushion_pct, spot, strike, costBasis, oneSigmaLow, levels.ote_618, levels.ote_786, macroFloor]);

  // Keep definedZoneBoxes in a ref so event callbacks never recreate
  const zoneBoxesRef = useRef<ZoneBox[]>(definedZoneBoxes);
  zoneBoxesRef.current = definedZoneBoxes;

  // Stable function to calculate pixel positions
  const updateZonesFromSeries = useCallback(() => {
    const series = seriesRef.current;
    if (!series) return;

    const boxes = zoneBoxesRef.current;
    const computed: RenderedZone[] = [];
    for (const b of boxes) {
      const yTop = series.priceToCoordinate(b.topPrice);
      const yBottom = series.priceToCoordinate(b.bottomPrice);
      if (yTop !== null && yBottom !== null) {
        const minY = Math.min(yTop, yBottom);
        const height = Math.max(16, Math.abs(yBottom - yTop));
        computed.push({
          id: b.id,
          label: b.label,
          y: minY,
          height: height,
          fill: b.fillColor,
          stroke: b.borderColor,
          text: b.textColor,
        });
      }
    }
    setZones(computed);
  }, []);

  // Main Chart Initialization: Run ONLY when ticker changes!
  useEffect(() => {
    if (!containerRef.current) return;

    let chart: IChartApi | null = null;
    let isCancelled = false;

    async function initChart() {
      setLoading(true);
      setError(null);

      try {
        const res = await fetch(`/api/bars?ticker=${encodeURIComponent(setup.ticker)}`);
        if (!res.ok) {
          throw new Error(`Failed to load historical candles for ${setup.ticker}`);
        }
        const data = await res.json();
        const bars = data.bars || [];

        if (isCancelled || !containerRef.current) return;

        // Clean container
        containerRef.current.innerHTML = "";

        // Initialize TradingView Lightweight Chart
        chart = createChart(containerRef.current, {
          width: containerRef.current.clientWidth,
          height: containerRef.current.clientHeight || 520,
          layout: {
            background: { type: ColorType.Solid, color: "#0B0E14" },
            textColor: "#8792A2",
            fontSize: 11,
            fontFamily: "monospace",
          },
          grid: {
            vertLines: { color: "rgba(30, 39, 51, 0.6)" },
            horzLines: { color: "rgba(30, 39, 51, 0.6)" },
          },
          crosshair: {
            mode: 1, // Normal crosshair
            vertLine: { color: "#6CB4FF", width: 1, style: LineStyle.Dashed },
            horzLine: { color: "#6CB4FF", width: 1, style: LineStyle.Dashed },
          },
          timeScale: {
            borderColor: "#1E2733",
            timeVisible: true,
            rightOffset: 15,
            barSpacing: 8,
          },
          rightPriceScale: {
            borderColor: "#1E2733",
            autoScale: true,
            scaleMargins: { top: 0.08, bottom: 0.12 },
          },
        });

        chartRef.current = chart;

        // Candlestick series
        const candleSeries = chart.addSeries(CandlestickSeries, {
          upColor: "#10B981",
          downColor: "#EF4444",
          borderUpColor: "#10B981",
          borderDownColor: "#EF4444",
          wickUpColor: "#10B981",
          wickDownColor: "#EF4444",
        });
        seriesRef.current = candleSeries;

        // Volume series
        const volumeSeries = chart.addSeries(HistogramSeries, {
          priceFormat: { type: "volume" },
          priceScaleId: "", // Overlay on chart
        });
        volumeSeries.priceScale().applyOptions({
          scaleMargins: { top: 0.82, bottom: 0 },
        });

        // Set historical candle data
        if (bars.length > 0) {
          candleSeries.setData(
            bars.map((b: any) => ({
              time: b.time,
              open: b.open,
              high: b.high,
              low: b.low,
              close: b.close,
            }))
          );

          volumeSeries.setData(
            bars.map((b: any) => ({
              time: b.time,
              value: b.volume,
              color: b.close >= b.open ? "rgba(16, 185, 129, 0.25)" : "rgba(239, 68, 68, 0.25)",
            }))
          );
        }

        // =====================================================================
        // MARK ALL MODEL LEVELS AS SOLID / DASHED / DOTTED PRICE LINES
        // =====================================================================

        // 1. Live Spot Reference Line
        candleSeries.createPriceLine({
          price: spot,
          color: "#6CB4FF",
          lineWidth: 2,
          lineStyle: LineStyle.Solid,
          axisLabelVisible: true,
          title: `SPOT $${spot.toFixed(2)}`,
        });

        // 2. Put Strike Price Line
        candleSeries.createPriceLine({
          price: strike,
          color: "#10B981",
          lineWidth: 2,
          lineStyle: LineStyle.Solid,
          axisLabelVisible: true,
          title: `PUT STRIKE $${strike.toFixed(1)} (-${setup.cushion_pct.toFixed(1)}%)`,
        });

        // 3. Break-Even Net Cost Basis
        if (costBasis) {
          candleSeries.createPriceLine({
            price: costBasis,
            color: "#F59E0B",
            lineWidth: 2,
            lineStyle: LineStyle.Dashed,
            axisLabelVisible: true,
            title: `NET BASIS $${costBasis.toFixed(2)}`,
          });
        }

        // 4. 1-Sigma Expected Move Floor
        if (oneSigmaLow) {
          candleSeries.createPriceLine({
            price: oneSigmaLow,
            color: "#F43F5E",
            lineWidth: 2,
            lineStyle: LineStyle.Dashed,
            axisLabelVisible: true,
            title: `1σ MOVE FLOOR $${oneSigmaLow.toFixed(1)}`,
          });
        }

        // 5. 50-Day Moving Average
        if (levels.sma50) {
          candleSeries.createPriceLine({
            price: levels.sma50,
            color: "#38BDF8",
            lineWidth: 1,
            lineStyle: LineStyle.Dotted,
            axisLabelVisible: true,
            title: `50 SMA $${levels.sma50.toFixed(1)}`,
          });
        }

        // 6. 200-Day Moving Average
        if (levels.sma200) {
          const isGolden = levels.sma50 && levels.sma50 > levels.sma200;
          candleSeries.createPriceLine({
            price: levels.sma200,
            color: "#A855F7",
            lineWidth: 2,
            lineStyle: LineStyle.Solid,
            axisLabelVisible: true,
            title: `${isGolden ? "GOLDEN 200 SMA" : "200 SMA"} $${levels.sma200.toFixed(1)}`,
          });
        }

        // 7. Macro 1-2 Year Support Shelf Floor
        if (macroFloor) {
          candleSeries.createPriceLine({
            price: macroFloor,
            color: "#059669",
            lineWidth: 2,
            lineStyle: LineStyle.Solid,
            axisLabelVisible: true,
            title: `1-2Y MACRO SHELF $${macroFloor.toFixed(1)}`,
          });
        }

        // 8. Macro 1Y AVWAP (VPOC)
        if (levels.macro_vpoc) {
          candleSeries.createPriceLine({
            price: levels.macro_vpoc,
            color: "#818CF8",
            lineWidth: 1,
            lineStyle: LineStyle.Dashed,
            axisLabelVisible: true,
            title: `MACRO AVWAP $${levels.macro_vpoc.toFixed(1)}`,
          });
        }

        // 9. Anchored VWAP (Cycle Low)
        if (levels.avwap) {
          candleSeries.createPriceLine({
            price: levels.avwap,
            color: "#2DD4BF",
            lineWidth: 1,
            lineStyle: LineStyle.Dotted,
            axisLabelVisible: true,
            title: `AVWAP $${levels.avwap.toFixed(1)}`,
          });
        }

        // 10. 20-Day VWAP
        if (levels.vwap20) {
          candleSeries.createPriceLine({
            price: levels.vwap20,
            color: "#94A3B8",
            lineWidth: 1,
            lineStyle: LineStyle.Dotted,
            axisLabelVisible: true,
            title: `20D VWAP $${levels.vwap20.toFixed(1)}`,
          });
        }

        // 11. ICT OTE 61.8% Retracement
        if (levels.ote_618) {
          candleSeries.createPriceLine({
            price: levels.ote_618,
            color: "#E2E8F0",
            lineWidth: 1,
            lineStyle: LineStyle.Dotted,
            axisLabelVisible: true,
            title: `OTE 61.8% $${levels.ote_618.toFixed(1)}`,
          });
        }

        // 12. ICT OTE 78.6% Deep Discount
        if (levels.ote_786) {
          candleSeries.createPriceLine({
            price: levels.ote_786,
            color: "#CBD5E1",
            lineWidth: 1,
            lineStyle: LineStyle.Dotted,
            axisLabelVisible: true,
            title: `OTE 78.6% $${levels.ote_786.toFixed(1)}`,
          });
        }

        // 13. 52-Week Macro Low
        if (levels.swing_low_252) {
          candleSeries.createPriceLine({
            price: levels.swing_low_252,
            color: "#E11D48",
            lineWidth: 1,
            lineStyle: LineStyle.Dashed,
            axisLabelVisible: true,
            title: `52W LOW $${levels.swing_low_252.toFixed(1)}`,
          });
        }

        // Compute initial zone box pixel coordinates
        updateZonesFromSeries();
        setLoading(false);

        // Update zone box pixel coordinates on zoom/pan
        chart.timeScale().subscribeVisibleLogicalRangeChange(() => {
          updateZonesFromSeries();
        });

        // Resize handler
        const handleResize = () => {
          if (containerRef.current && chart) {
            chart.applyOptions({
              width: containerRef.current.clientWidth,
              height: containerRef.current.clientHeight,
            });
            updateZonesFromSeries();
          }
        };
        window.addEventListener("resize", handleResize);

        return () => {
          window.removeEventListener("resize", handleResize);
        };
      } catch (err: any) {
        if (!isCancelled) {
          setError(err.message || "Failed to initialize chart");
          setLoading(false);
        }
      }
    }

    initChart();

    return () => {
      isCancelled = true;
      if (chart) {
        chart.remove();
        chartRef.current = null;
        seriesRef.current = null;
      }
    };
  }, [setup.ticker]); // STRICTLY DEPEND ONLY ON TICKER TO PREVENT RE-RENDER LOOPS

  return (
    <div className={`relative w-full h-full min-h-[460px] overflow-hidden ${className}`}>
      {/* Loading Spinner: Shows strictly once on initial ticker load */}
      {loading && (
        <div className="absolute inset-0 z-20 flex flex-col items-center justify-center bg-[#0B0E14] backdrop-blur-sm">
          <div className="w-8 h-8 rounded-full border-2 border-desk-accent border-t-transparent animate-spin mb-3" />
          <span className="text-xs font-mono text-desk-secondary">Loading Candles &amp; Plotting Levels...</span>
        </div>
      )}

      {/* Error Fallback */}
      {error && (
        <div className="absolute inset-0 z-20 flex flex-col items-center justify-center p-6 text-center bg-[#0B0E14]">
          <span className="text-sm font-bold text-desk-riskText mb-1">Chart Data Unavailable</span>
          <span className="text-xs text-desk-secondary font-mono">{error}</span>
        </div>
      )}

      {/* Lightweight-Charts Container */}
      <div ref={containerRef} className="w-full h-full" />

      {/* Synchronized SVG Shaded Price Zones & Boxes Overlay */}
      {!loading && !error && (
        <svg className="absolute inset-0 pointer-events-none w-full h-full z-10">
          {zones.map((z) => (
            <g key={z.id}>
              {/* Shaded Box / Price Zone */}
              <rect
                x={0}
                y={z.y}
                width="100%"
                height={z.height}
                fill={z.fill}
                stroke={z.stroke}
                strokeWidth="1"
                strokeDasharray="4 3"
              />
              {/* Zone Tag & Badge */}
              <rect
                x={12}
                y={z.y + 4}
                width={Math.min(340, z.label.length * 7.5)}
                height={18}
                rx={3}
                fill="#121821"
                stroke={z.stroke}
                strokeWidth="1"
              />
              <text
                x={18}
                y={z.y + 17}
                fill={z.text}
                fontSize="10"
                fontFamily="monospace"
                fontWeight="bold"
              >
                {z.label}
              </text>
            </g>
          ))}
        </svg>
      )}
    </div>
  );
}
