"use client";

import { useEffect, useState, useMemo } from "react";
import Link from "next/link";
import { Snapshot, Position } from "@/types/snapshot";
import { formatCurrency, formatPercent } from "@/lib/data";

export default function PositionsPage() {
  const [snapshot, setSnapshot] = useState<Snapshot | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"itm" | "near" | "otm">("itm");

  useEffect(() => {
    async function loadData() {
      try {
        const res = await fetch("/api/snapshot");
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

  const portfolio = snapshot?.portfolio;
  const positions = useMemo(() => snapshot?.positions || [], [snapshot]);

  const itmPositions = useMemo(() => {
    return positions.filter((p) => p.status === "itm").sort((a, b) => a.dte - b.dte);
  }, [positions]);

  const nearPositions = useMemo(() => {
    return positions.filter((p) => p.status === "near");
  }, [positions]);

  const otmPositions = useMemo(() => {
    return positions.filter((p) => p.status === "otm");
  }, [positions]);

  // If all ITM assigned calculation
  const itmAssignmentTotal = useMemo(() => {
    return itmPositions.reduce((sum, p) => sum + p.strike * 100 * p.contracts, 0);
  }, [itmPositions]);

  if (loading) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="h-10 w-48 bg-desk-card rounded-control" />
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-4">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="h-24 bg-desk-card rounded-control" />
          ))}
        </div>
        <div className="h-96 bg-desk-card rounded-card" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Title */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-desk-text">Live Positions & Ledger</h1>
        <p className="text-sm text-desk-secondary">
          Real trading positions ledger tracking live marks, theta harvest progress, and defensive roll limits.
        </p>
      </div>

      {/* KPI Strip (5 metrics) */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-4 font-mono text-xs">
        <div className="rounded-control bg-desk-card p-4 border border-desk-border">
          <span className="text-desk-secondary block font-sans">Open Positions</span>
          <span className="text-2xl font-bold text-desk-text mt-1 block">{portfolio?.open_count ?? 0}</span>
        </div>

        <div className="rounded-control bg-desk-card p-4 border border-desk-border">
          <span className="text-desk-secondary block font-sans">Cash Set Aside</span>
          <span className="text-xl font-bold text-desk-text mt-1 block">{formatCurrency(portfolio?.collateral)}</span>
        </div>

        <div className="rounded-control bg-desk-card p-4 border border-desk-border">
          <span className="text-desk-secondary block font-sans">Credit Collected</span>
          <span className="text-xl font-bold text-desk-accent mt-1 block">{formatCurrency(portfolio?.credit_collected)}</span>
        </div>

        <div className="rounded-control bg-desk-card p-4 border border-desk-border">
          <span className="text-desk-secondary block font-sans">Unrealized P&L</span>
          <span className={`text-xl font-bold mt-1 block ${(portfolio?.unrealized ?? 0) >= 0 ? "text-desk-accent" : "text-desk-riskText"}`}>
            {formatCurrency(portfolio?.unrealized)}
          </span>
        </div>

        <div className="rounded-control bg-desk-card p-4 border border-desk-border">
          <span className="text-desk-secondary block font-sans">Out of Rolls</span>
          <span className={`text-2xl font-bold mt-1 block ${(portfolio?.out_of_rolls ?? 0) > 0 ? "text-desk-riskText" : "text-desk-text"}`}>
            {portfolio?.out_of_rolls ?? 0}
          </span>
        </div>
      </div>

      {/* Group Chips / Tabs */}
      <div className="flex items-center gap-2 border-b border-desk-border pb-3">
        <button
          onClick={() => setActiveTab("itm")}
          className={`min-h-[44px] rounded-control px-4 py-2 text-xs font-semibold flex items-center gap-2 transition-colors ${
            activeTab === "itm"
              ? "bg-desk-raised text-desk-text border border-desk-border"
              : "text-desk-secondary hover:text-desk-text"
          }`}
        >
          <span>In the money</span>
          <span className="rounded-full bg-desk-risk/20 px-2 py-0.5 text-[11px] text-desk-riskText font-bold">
            {itmPositions.length}
          </span>
        </button>

        <button
          onClick={() => setActiveTab("near")}
          className={`min-h-[44px] rounded-control px-4 py-2 text-xs font-semibold flex items-center gap-2 transition-colors ${
            activeTab === "near"
              ? "bg-desk-raised text-desk-text border border-desk-border"
              : "text-desk-secondary hover:text-desk-text"
          }`}
        >
          <span>Near strike (&le; 3%)</span>
          <span className="rounded-full bg-desk-caution/20 px-2 py-0.5 text-[11px] text-desk-cautionText font-bold">
            {nearPositions.length}
          </span>
        </button>

        <button
          onClick={() => setActiveTab("otm")}
          className={`min-h-[44px] rounded-control px-4 py-2 text-xs font-semibold flex items-center gap-2 transition-colors ${
            activeTab === "otm"
              ? "bg-desk-raised text-desk-text border border-desk-border"
              : "text-desk-secondary hover:text-desk-text"
          }`}
        >
          <span>Out of the money</span>
          <span className="rounded-full bg-desk-accent/20 px-2 py-0.5 text-[11px] text-desk-accent font-bold">
            {otmPositions.length}
          </span>
        </button>
      </div>

      {/* Main Grid: Active Tab Content + Right Rail */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Tab Content (3 cols) */}
        <div className="lg:col-span-3 space-y-4">
          {activeTab === "itm" && (
            <div className="rounded-card border border-desk-border bg-desk-card overflow-hidden">
              <div className="p-4 border-b border-desk-border bg-desk-raised/60 flex items-center justify-between">
                <div>
                  <h2 className="text-sm font-bold text-desk-riskText uppercase tracking-wider">
                    In the money positions — action required
                  </h2>
                  <p className="text-xs text-desk-secondary">Sorted by remaining days to expiry.</p>
                </div>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead className="border-b border-desk-border bg-desk-raised text-xs text-desk-secondary font-medium uppercase tracking-wider">
                    <tr>
                      <th className="py-3 px-4">Position</th>
                      <th className="py-3 px-3">Spot vs. Strike</th>
                      <th className="py-3 px-3">Mark (Mid)</th>
                      <th className="py-3 px-3">Unrealized P&L</th>
                      <th className="py-3 px-3">Rolls Used</th>
                      <th className="py-3 px-3">Expiry / DTE</th>
                      <th className="py-3 px-4 text-right">Next Step</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-desk-border font-mono text-xs">
                    {itmPositions.length === 0 ? (
                      <tr>
                        <td colSpan={7} className="py-12 text-center text-desk-secondary font-sans text-sm">
                          🎉 No positions currently in the money. All contracts trading safely OTM.
                        </td>
                      </tr>
                    ) : (
                      itmPositions.map((p) => {
                        const isUrgent = p.dte <= 9;
                        return (
                          <tr key={p.ticker} className="hover:bg-desk-raised/60 transition-colors">
                            <td className="py-3.5 px-4 font-sans font-bold">
                              <span className="text-sm font-mono text-desk-text">{p.ticker}</span>
                              <span className="block text-xs font-mono text-desk-secondary">${p.strike.toFixed(2)} Put ({p.contracts}x)</span>
                            </td>

                            <td className="py-3.5 px-3">
                              <span className="text-desk-riskText font-bold">{p.spot_vs_strike_pct.toFixed(1)}%</span>
                              <span className="block text-[11px] text-desk-tertiary">Spot ${p.spot.toFixed(2)}</span>
                            </td>

                            <td className="py-3.5 px-3">
                              <span className="text-desk-text font-bold">${p.mark_mid.toFixed(2)}</span>
                              <span className="block text-[11px] text-desk-secondary">Entry ${p.open_credit.toFixed(2)}</span>
                            </td>

                            <td className="py-3.5 px-3">
                              <span className="text-desk-riskText font-bold">{formatCurrency(p.pnl)}</span>
                            </td>

                            <td className="py-3.5 px-3">
                              <span className={`px-2 py-0.5 rounded text-[11px] font-bold ${
                                p.rolls >= p.rolls_max
                                  ? "bg-desk-risk/20 text-desk-riskText border border-desk-risk/40"
                                  : "bg-desk-raised text-desk-secondary"
                              }`}>
                                {p.rolls} / {p.rolls_max}
                              </span>
                            </td>

                            <td className="py-3.5 px-3">
                              <span className="text-desk-text">{p.expiry}</span>
                              <span className={`block font-bold text-[11px] ${isUrgent ? "text-desk-cautionText font-bold" : "text-desk-secondary"}`}>
                                {p.dte} days left {isUrgent && "⚠️"}
                              </span>
                            </td>

                            <td className="py-3.5 px-4 text-right">
                              <button
                                onClick={() => alert(`Next step for ${p.ticker}: ${p.next_step.toUpperCase()} (Strike $${p.strike}, Spot $${p.spot})`)}
                                className={`min-h-[34px] rounded-control px-3 py-1 text-xs font-bold uppercase transition-colors ${
                                  p.next_step === "plan_assignment"
                                    ? "bg-desk-risk text-desk-bg hover:opacity-90"
                                    : "bg-desk-caution text-desk-bg hover:opacity-90"
                                }`}
                              >
                                {p.next_step.replace("_", " ")}
                              </button>
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {activeTab === "near" && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {nearPositions.length === 0 ? (
                <div className="col-span-2 rounded-card border border-desk-border bg-desk-card p-12 text-center text-desk-secondary text-sm">
                  No positions within 3% of strike price.
                </div>
              ) : (
                nearPositions.map((p) => (
                  <div key={p.ticker} className="rounded-card border border-desk-caution/30 bg-desk-card p-4 space-y-3 font-mono text-xs">
                    <div className="flex items-center justify-between border-b border-desk-border/60 pb-2">
                      <span className="text-base font-bold text-desk-text font-mono">{p.ticker} ${p.strike} Put</span>
                      <span className="rounded bg-desk-caution/15 px-2 py-0.5 text-desk-cautionText font-bold">Near Strike</span>
                    </div>
                    <div className="grid grid-cols-2 gap-2 text-desk-secondary">
                      <div>Spot: <strong className="text-desk-text">${p.spot.toFixed(2)}</strong></div>
                      <div>Buffer: <strong className="text-desk-cautionText">{p.spot_vs_strike_pct.toFixed(1)}%</strong></div>
                      <div>Mark: <strong className="text-desk-text">${p.mark_mid.toFixed(2)}</strong></div>
                      <div>Expiry: <strong className="text-desk-text">{p.expiry} ({p.dte}d)</strong></div>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}

          {activeTab === "otm" && (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {otmPositions.length === 0 ? (
                <div className="col-span-3 rounded-card border border-desk-border bg-desk-card p-12 text-center text-desk-secondary text-sm">
                  No active OTM positions recorded in ledger.
                </div>
              ) : (
                otmPositions.map((p) => {
                  const profitRatio = p.open_credit > 0 ? Math.max(0, (p.open_credit - p.mark_mid) / p.open_credit) * 100 : 0;
                  const progressTo50 = Math.min(100, (profitRatio / 50.0) * 100);

                  return (
                    <div key={p.ticker} className="rounded-card border border-desk-border bg-desk-card p-4 space-y-3 font-mono text-xs">
                      <div className="flex items-center justify-between border-b border-desk-border/60 pb-2">
                        <span className="text-base font-bold text-desk-text font-mono">{p.ticker} ${p.strike} Put</span>
                        <span className="text-desk-accent font-bold">{profitRatio.toFixed(0)}% Captured</span>
                      </div>
                      <div className="space-y-1">
                        <div className="flex justify-between text-[11px] text-desk-secondary">
                          <span>Progress to 50% TP</span>
                          <span>{progressTo50.toFixed(0)}%</span>
                        </div>
                        <div className="w-full h-2 bg-desk-bg rounded-full overflow-hidden">
                          <div className="h-full bg-desk-accent rounded-full" style={{ width: `${progressTo50}%` }} />
                        </div>
                      </div>
                      <div className="flex justify-between text-[11px] text-desk-secondary pt-1">
                        <span>Mark: ${p.mark_mid.toFixed(2)}</span>
                        <span>DTE: {p.dte}d</span>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          )}
        </div>

        {/* Right Rail: Assignment Exposure & Rule Checks */}
        <div className="space-y-6">
          <div className="rounded-card border border-desk-border bg-desk-card p-5 space-y-4">
            <h2 className="text-sm font-bold text-desk-text uppercase tracking-wider">
              If all {itmPositions.length} ITM assigned
            </h2>

            <div className="space-y-3 font-mono">
              <div>
                <span className="text-xs text-desk-secondary block font-sans">Capital needed for shares</span>
                <span className="text-xl font-bold text-desk-riskText">{formatCurrency(itmAssignmentTotal)}</span>
              </div>

              <div>
                <span className="text-xs text-desk-secondary block font-sans">Remaining Free Cash</span>
                <span className="text-sm font-bold text-desk-text">
                  {formatCurrency(Math.max(0, (portfolio?.collateral || 0) - itmAssignmentTotal))}
                </span>
              </div>
            </div>

            <div className="rounded-control bg-desk-raised p-3 text-xs text-desk-secondary space-y-1.5 font-sans">
              <div className="font-semibold text-desk-text">Assignment Protocol:</div>
              <p>1. If out of rolls, prepare to take delivery at net cost basis.</p>
              <p>2. Stage sell-to-close covered calls at or above assigned basis upon execution.</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
