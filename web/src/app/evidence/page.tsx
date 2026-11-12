'use client';

import React, { useEffect, useState } from 'react';
import { Snapshot } from '@/types/snapshot';
import { formatCurrency, formatPercent, formatNumber } from '@/lib/data';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, Cell, ReferenceLine } from 'recharts';
import { CheckCircle2, AlertTriangle, Info, ArrowUpRight, TrendingUp, ShieldCheck } from 'lucide-react';

export default function EvidencePage() {
  const [snapshot, setSnapshot] = useState<Snapshot | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/snapshot')
      .then((res) => res.json())
      .then((data) => {
        setSnapshot(data);
        setLoading(false);
      })
      .catch((err) => {
        console.error('Failed to load snapshot', err);
        setLoading(false);
      });
  }, []);

  if (loading) {
    return (
      <div className="h-64 flex items-center justify-center text-text-muted">Loading backtest evidence...</div>
    );
  }

  const backtest = snapshot?.backtest;
  const monthlyData = backtest?.monthly_pnl || [];

  return (
    <div className="space-y-8 py-2">
      {/* Title Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-border-subtle pb-6">
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-bold tracking-tight text-text-primary">Evidence · Backtest</h1>
              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded text-xs font-mono font-semibold uppercase bg-bg-raised border border-border-strong text-accent-caution">
                <Info className="w-3.5 h-3.5" />
                {backtest?.label || 'Simulated'}
              </span>
            </div>
            <p className="mt-1 text-sm text-text-muted">
              Every trade is a simulation against historical daily bars. Real historical options pricing models, daily close settlement, and mechanical rolling rules.
            </p>
          </div>
          <div className="text-right text-xs font-mono text-text-muted">
            Model as of: {backtest?.as_of ? new Date(backtest.as_of).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : '—'}
          </div>
        </div>

        {/* Bottom Line Summary Banner */}
        <div className="bg-bg-card border border-border-subtle rounded-xl p-5 shadow-sm">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
            <div className="space-y-1">
              <span className="text-xs font-mono uppercase tracking-wider text-text-muted">Bottom-Line Performance</span>
              <p className="text-base text-text-primary font-medium">
                Over <span className="font-mono text-accent-favorable font-bold">{formatNumber(backtest?.trades ?? 0)}</span> simulated trades, strategy generated{' '}
                <span className="font-mono text-accent-favorable font-bold">{formatCurrency(backtest?.net_pnl ?? 0)}</span> net profit with a{' '}
                <span className="font-mono text-accent-favorable font-bold">{formatPercent(backtest?.win_rate ?? 0)}</span> realized win rate (beating the breakeven hurdle of {formatPercent(backtest?.breakeven_win_rate ?? 0)}).
              </p>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <div className="px-3 py-1.5 rounded-lg bg-bg-raised border border-border-strong text-xs font-mono text-text-muted">
                Edge over breakeven: <span className="text-accent-favorable font-bold">+{((backtest?.win_rate ?? 0) - (backtest?.breakeven_win_rate ?? 0)).toFixed(1)}%</span>
              </div>
            </div>
          </div>
        </div>

        {/* 4 KPI Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-bg-card border border-border-subtle rounded-xl p-5 space-y-2">
            <div className="flex items-center justify-between text-xs text-text-muted font-mono uppercase tracking-wider">
              <span>Total Trades</span>
              <TrendingUp className="w-4 h-4 text-accent-favorable" />
            </div>
            <div className="text-2xl font-bold font-mono text-text-primary">{formatNumber(backtest?.trades ?? 0)}</div>
            <div className="text-xs text-text-muted">Closed CSP lifecycle executions</div>
          </div>

          <div className="bg-bg-card border border-border-subtle rounded-xl p-5 space-y-2">
            <div className="flex items-center justify-between text-xs text-text-muted font-mono uppercase tracking-wider">
              <span>Win Rate</span>
              <ShieldCheck className="w-4 h-4 text-accent-favorable" />
            </div>
            <div className="text-2xl font-bold font-mono text-accent-favorable">{formatPercent(backtest?.win_rate ?? 0)}</div>
            <div className="text-xs text-text-muted">
              Breakeven hurdle: <span className="font-mono">{formatPercent(backtest?.breakeven_win_rate ?? 0)}</span>
            </div>
          </div>

          <div className="bg-bg-card border border-border-subtle rounded-xl p-5 space-y-2">
            <div className="flex items-center justify-between text-xs text-text-muted font-mono uppercase tracking-wider">
              <span>Avg Win / Avg Loss</span>
              <ArrowUpRight className="w-4 h-4 text-text-muted" />
            </div>
            <div className="text-2xl font-bold font-mono text-text-primary">
              <span className="text-accent-favorable">{formatCurrency(backtest?.avg_win ?? 0)}</span>
              <span className="text-text-muted text-lg mx-1.5">/</span>
              <span className="text-accent-risk">{formatCurrency(backtest?.avg_loss ?? 0)}</span>
            </div>
            <div className="text-xs text-text-muted">
              Payoff ratio: 1 : {backtest?.avg_win && backtest.avg_loss ? Math.abs(backtest.avg_loss / backtest.avg_win).toFixed(1) : '—'}
            </div>
          </div>

          <div className="bg-bg-card border border-border-subtle rounded-xl p-5 space-y-2">
            <div className="flex items-center justify-between text-xs text-text-muted font-mono uppercase tracking-wider">
              <span>Net P&L</span>
              <span className="text-xs font-mono text-accent-favorable font-bold">TOTAL</span>
            </div>
            <div className="text-2xl font-bold font-mono text-accent-favorable">{formatCurrency(backtest?.net_pnl ?? 0)}</div>
            <div className="text-xs text-text-muted">Compounded cumulative ledger</div>
          </div>
        </div>

        {/* Win Rate vs Breakeven Bar */}
        <div className="bg-bg-card border border-border-subtle rounded-xl p-6 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold uppercase tracking-wider text-text-muted">Win Rate vs. Breakeven Hurdle</h3>
            <span className="text-xs font-mono text-accent-favorable">Required to profit: {formatPercent(backtest?.breakeven_win_rate ?? 0)}</span>
          </div>

          <div className="space-y-2">
            <div className="relative h-6 bg-bg-raised rounded-full overflow-hidden border border-border-strong">
              {/* Actual Win Rate Bar */}
              <div
                className="h-full bg-accent-favorable transition-all duration-500 rounded-full"
                style={{ width: `${Math.min(100, backtest?.win_rate ?? 0)}%` }}
              />
              {/* Breakeven Marker */}
              {backtest?.breakeven_win_rate && (
                <div
                  className="absolute top-0 bottom-0 w-0.5 bg-accent-risk z-10"
                  style={{ left: `${backtest.breakeven_win_rate}%` }}
                >
                  <div className="absolute -top-7 -translate-x-1/2 bg-bg-canvas border border-accent-risk text-accent-risk text-[10px] font-mono px-1.5 py-0.5 rounded shadow">
                    BE {backtest.breakeven_win_rate.toFixed(1)}%
                  </div>
                </div>
              )}
            </div>
            <div className="flex justify-between text-xs font-mono text-text-muted pt-1">
              <span>0%</span>
              <span className="text-accent-favorable font-bold">Actual Win Rate: {formatPercent(backtest?.win_rate ?? 0)}</span>
              <span>100%</span>
            </div>
          </div>
        </div>

        {/* Monthly Net P&L Chart */}
        <div className="bg-bg-card border border-border-subtle rounded-xl p-6 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-base font-bold text-text-primary">Monthly Net P&L</h3>
              <p className="text-xs text-text-muted">Simulated realized returns per monthly cycle ($ USD)</p>
            </div>
            <div className="flex items-center gap-4 text-xs font-mono">
              <span className="flex items-center gap-1.5">
                <span className="w-3 h-3 rounded bg-accent-favorable" /> Positive Month
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-3 h-3 rounded bg-accent-risk" /> Negative Month
              </span>
            </div>
          </div>

          <div className="h-64 w-full pt-4">
            {monthlyData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={monthlyData} margin={{ top: 10, right: 10, left: 10, bottom: 20 }}>
                  <XAxis dataKey="month" stroke="#8E9AA8" fontSize={11} tickLine={false} />
                  <YAxis stroke="#8E9AA8" fontSize={11} tickLine={false} tickFormatter={(v) => `$${(v / 1000).toFixed(0)}k`} />
                  <Tooltip
                    contentStyle={{ backgroundColor: '#121821', borderColor: '#253041', borderRadius: '8px', color: '#E8ECF1' }}
                    formatter={(val: number) => [`$${val.toLocaleString()}`, 'P&L']}
                    labelStyle={{ color: '#8E9AA8', fontFamily: 'monospace' }}
                  />
                  <ReferenceLine y={0} stroke="#253041" strokeDasharray="3 3" />
                  <Bar dataKey="pnl" radius={[4, 4, 0, 0]}>
                    {monthlyData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.pnl >= 0 ? '#6CB4FF' : '#FF8B5C'} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center text-text-muted text-sm font-mono">
                No monthly breakdown data available in snapshot.
              </div>
            )}
          </div>
        </div>

        {/* Coverage Comparison: What it covers vs what it doesn't */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-bg-card border border-border-subtle rounded-xl p-6 space-y-4">
            <div className="flex items-center gap-2 text-accent-favorable font-semibold">
              <CheckCircle2 className="w-5 h-5" />
              <h3 className="text-base">What this simulation covers</h3>
            </div>
            <ul className="space-y-3 text-sm text-text-secondary">
              <li className="flex items-start gap-2">
                <span className="text-accent-favorable mt-0.5">•</span>
                <span><strong>Mechanical 50% Profit Target:</strong> Auto-closes when option price decays to half the open credit.</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-accent-favorable mt-0.5">•</span>
                <span><strong>Red Day Pullback Filters:</strong> Exact multi-factor entry timing (Stage 1 RSI, volume, dealing range).</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-accent-favorable mt-0.5">•</span>
                <span><strong>Full Assignment & Margin:</strong> Accurate cash-collateral deduction and assignment at settlement.</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-accent-favorable mt-0.5">•</span>
                <span><strong>Split & Corporate Action Adjustments:</strong> Uses official Alpaca split-adjusted continuous pricing series.</span>
              </li>
            </ul>
          </div>

          <div className="bg-bg-card border border-border-subtle rounded-xl p-6 space-y-4">
            <div className="flex items-center gap-2 text-accent-caution font-semibold">
              <AlertTriangle className="w-5 h-5" />
              <h3 className="text-base">What this simulation does NOT cover</h3>
            </div>
            <ul className="space-y-3 text-sm text-text-secondary">
              <li className="flex items-start gap-2">
                <span className="text-accent-caution mt-0.5">•</span>
                <span><strong>Intraday Flash Touches:</strong> Settlement is evaluated at daily close; intraday touch volatility is excluded.</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-accent-caution mt-0.5">•</span>
                <span><strong>Wide Slippage on Earnings:</strong> Assumes fills at theoretical mid-point; earnings illiquidity can widen spreads.</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-accent-caution mt-0.5">•</span>
                <span><strong>Early Assignment Before Expiry:</strong> Deep ITM puts with negligible extrinsic value can be exercised prior to Friday expiry.</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-accent-caution mt-0.5">•</span>
                <span><strong>Broker Margin Borrow Rates:</strong> Cost of carry or borrowing margin interest fees are not deducted.</span>
              </li>
            </ul>
          </div>
        </div>

        {/* Score Quintile Panel */}
        <div className="bg-bg-card border border-border-subtle rounded-xl p-6 space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-base font-bold text-text-primary">Score Quintile Predictive Efficacy</h3>
            <span className="px-2.5 py-1 rounded bg-bg-raised border border-border-strong text-xs font-mono text-text-muted">
              Status: In Development
            </span>
          </div>
          <p className="text-sm text-text-muted">
            Score quintiles are not tested yet because historical backtest runs historically logged technical candle triggers rather than storing the composite 7-factor scoring engine weights at the exact time of order placement.
          </p>
          <div className="p-4 rounded-lg bg-bg-canvas border border-border-subtle text-xs font-mono text-text-muted">
            Upcoming feature: Will track correlation between entry score &gt;90 vs &lt;75 and subsequent maximum adverse excursion (MAE).
          </div>
        </div>
    </div>
  );
}
