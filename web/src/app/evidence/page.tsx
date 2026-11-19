'use client';

import React, { useEffect, useState, useMemo } from 'react';
import { Snapshot, ScoreQuintileItem, ScoreTierItem, FactorAttributionItem } from '@/types/snapshot';
import { formatCurrency, formatPercent, formatNumber } from '@/lib/data';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, Cell, ReferenceLine, CartesianGrid } from 'recharts';
import { CheckCircle2, AlertTriangle, Info, ArrowUpRight, TrendingUp, ShieldCheck, Target, Layers, Award, Sparkles, RefreshCw, Zap, Database } from 'lucide-react';

export default function EvidencePage() {
  const [snapshot, setSnapshot] = useState<Snapshot | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'quintiles' | 'tiers' | 'factors'>('quintiles');
  const [dataSource, setDataSource] = useState<'backtest' | 'live_signals'>('backtest');

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

  // Compute live metrics dynamically from the Closed Trades ledger (Signals Page)
  const liveLedgerStats = useMemo(() => {
    const trades = snapshot?.closed_trades || [];
    if (!trades.length) return null;

    const wins = trades.filter((t) => t.result === 'WIN');
    const losses = trades.filter((t) => t.result === 'LOSS');
    const totalWinPnl = wins.reduce((sum, t) => sum + (t.realized_gain || 0) * 100, 0);
    const totalLossPnl = losses.reduce((sum, t) => sum + (t.realized_gain || 0) * 100, 0);
    const netPnl = totalWinPnl + totalLossPnl;
    const avgWin = wins.length > 0 ? totalWinPnl / wins.length : 0;
    const avgLoss = losses.length > 0 ? totalLossPnl / losses.length : 0;
    const winRate = (wins.length / trades.length) * 100;
    const payoff = avgWin > 0 ? Math.abs(avgLoss / avgWin) : 0;
    const breakevenWinRate = (avgWin + Math.abs(avgLoss)) > 0 ? (Math.abs(avgLoss) / (avgWin + Math.abs(avgLoss))) * 100 : 0;
    const rollsCount = trades.filter((t) => (t.rolls || 0) > 0).length;

    return {
      tradesCount: trades.length,
      winsCount: wins.length,
      lossesCount: losses.length,
      winRate,
      avgWin,
      avgLoss,
      netPnl,
      payoff,
      breakevenWinRate,
      rollsCount,
      asOf: snapshot?.run?.as_of_et || 'Nov 18, 2026',
    };
  }, [snapshot]);

  if (loading) {
    return (
      <div className="h-64 flex items-center justify-center text-text-muted">Loading backtest evidence...</div>
    );
  }

  const backtest = snapshot?.backtest;
  const monthlyData = backtest?.monthly_pnl || [];
  const sqData = backtest?.score_quintiles;
  const quintiles = sqData?.quintiles || [];
  const tiers = sqData?.tiers || [];
  const factors = sqData?.factors || [];
  const summary = sqData?.summary;

  // Active view values (toggled between multi-year backtest and live signals page ledger)
  const isLive = dataSource === 'live_signals';
  const displayTrades = isLive ? (liveLedgerStats?.tradesCount ?? 0) : (backtest?.trades ?? 0);
  const displayWinRate = isLive ? (liveLedgerStats?.winRate ?? 0) : (backtest?.win_rate ?? 0);
  const displayAvgWin = isLive ? (liveLedgerStats?.avgWin ?? 0) : (backtest?.avg_win ?? 0);
  const displayAvgLoss = isLive ? (liveLedgerStats?.avgLoss ?? 0) : (backtest?.avg_loss ?? 0);
  const displayNetPnl = isLive ? (liveLedgerStats?.netPnl ?? 0) : (backtest?.net_pnl ?? 0);
  const displayBreakeven = isLive ? (liveLedgerStats?.breakevenWinRate ?? 0) : (backtest?.breakeven_win_rate ?? 0);
  const displayPayoff = displayAvgWin > 0 && displayAvgLoss ? Math.abs(displayAvgLoss / displayAvgWin).toFixed(1) : '—';
  const displayEdge = (displayWinRate - displayBreakeven).toFixed(1);

  // Every figure below comes from the snapshot. No hard-coded fallbacks: if a value is missing we show "—".
  const hasBacktest = !!backtest && typeof backtest.win_rate === 'number';
  const bWinRate = (backtest?.win_rate ?? 0) / 100;
  const bAvgWin = backtest?.avg_win ?? 0;
  const bAvgLoss = Math.abs(backtest?.avg_loss ?? 0);
  const dynamicEV = hasBacktest ? (bWinRate * bAvgWin) - ((1 - bWinRate) * bAvgLoss) : 0;
  const dynamicPayoff = bAvgWin > 0 && bAvgLoss > 0 ? (bAvgLoss / bAvgWin).toFixed(1) : '—';
  const winsPerLoss = bAvgWin > 0 && bAvgLoss > 0 ? Math.round(bAvgLoss / bAvgWin) : null;
  const signedCurrency = (v: number) => `${v < 0 ? '-' : '+'}${formatCurrency(Math.abs(v))}`;
  const edgeVal = displayWinRate - displayBreakeven;
  const monthRange = monthlyData.length
    ? `${monthlyData[0].month} to ${monthlyData[monthlyData.length - 1].month}`
    : null;
  // Does a higher entry score lead to better simulated results? Compare the top and bottom fifths.
  const topQ = quintiles[0];
  const bottomQ = quintiles[quintiles.length - 1];
  const scoreHelps = topQ && bottomQ ? topQ.profit_factor > bottomQ.profit_factor && topQ.win_rate >= bottomQ.win_rate : null;

  return (
    <div className="space-y-8 py-2">
      {/* Title Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-border-subtle pb-6">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold tracking-tight text-text-primary">Historical Analysis · Simulated Backtest &amp; Score Check</h1>
            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded text-xs font-mono font-semibold uppercase bg-accent-caution/10 border border-accent-caution/40 text-accent-caution">
              <AlertTriangle className="w-3.5 h-3.5" />
              Simulated · model prices
            </span>
          </div>
          <p className="mt-1 text-sm text-text-muted">
            Day-by-day simulation of {backtest?.trades ? formatNumber(backtest.trades) : '—'} cash-secured put trades. Option prices are Black-Scholes estimates from daily bars, not real quotes or fills, and bid/ask spreads are not charged. Treat these numbers as a model, not a track record.
          </p>
        </div>
        <div className="flex flex-col items-end gap-1 text-xs font-mono text-text-muted">
          <span>Simulator run: {backtest?.as_of ? new Date(backtest.as_of).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : '—'}</span>
        </div>
      </div>

      {/* Plain-language caution next to the headline numbers */}
      <div className="flex items-start gap-3 rounded-xl border border-accent-caution/40 bg-accent-caution/5 p-4 text-sm text-text-secondary">
        <Info className="w-5 h-5 text-accent-caution shrink-0 mt-0.5" />
        <p>
          A high win rate is normal for selling out-of-the-money puts; what matters is the size of the losses.
          {winsPerLoss ? <> In this simulation each average loss wipes out about <strong className="text-text-primary">{winsPerLoss} average wins</strong>.</> : null}{' '}
          Simulated results usually look better than real trading, so do not read these figures as expected performance.
        </p>
      </div>

      {/* Dynamic Dataset Selector Toggle */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-bg-raised/60 p-2.5 rounded-xl border border-border-subtle">
        <div className="flex items-center gap-2">
          <span className="text-xs font-mono text-text-muted uppercase tracking-wider pl-1">Data Perspective:</span>
          <div className="inline-flex bg-bg-canvas p-1 rounded-lg border border-border-strong text-xs font-mono">
            <button
              onClick={() => setDataSource('backtest')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded transition-all ${
                dataSource === 'backtest'
                  ? 'bg-desk-accent text-white font-bold shadow'
                  : 'text-text-muted hover:text-text-primary'
              }`}
            >
              <Database className="w-3.5 h-3.5" />
              Simulated backtest ({backtest?.trades ? formatNumber(backtest.trades) : '—'} trades)
            </button>
            <button
              onClick={() => setDataSource('live_signals')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded transition-all ${
                dataSource === 'live_signals'
                  ? 'bg-accent-favorable text-black font-bold shadow'
                  : 'text-text-muted hover:text-text-primary'
              }`}
            >
              <Zap className="w-3.5 h-3.5" />
              Signals page ledger, simulated ({liveLedgerStats?.tradesCount ?? '—'} trades)
            </button>
          </div>
        </div>

        <div className="flex items-center gap-2 text-xs font-mono text-text-muted pr-1">
          {isLive ? (
            <span>Most recent closed trades from the simulator (<code>snapshot.closed_trades</code>)</span>
          ) : (
            <span>{monthRange ? `Monthly P&L shown: ${monthRange}` : 'Date range not in snapshot'}</span>
          )}
        </div>
      </div>

      {/* Bottom Line Summary Banner with Dynamic Metrics */}
      <div className="bg-bg-card border border-border-subtle rounded-xl p-5 shadow-sm">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="text-xs font-mono uppercase tracking-wider text-text-muted">
                {isLive ? 'Signals page ledger (simulated)' : 'Simulated backtest'}
              </span>
              <span className="px-2 py-0.5 rounded text-[11px] font-mono bg-bg-raised text-desk-secondary border border-border-strong">
                Model prices · no spreads charged
              </span>
            </div>
            <p className="text-base text-text-primary font-medium">
              Across <span className="font-mono text-text-primary font-bold">{formatNumber(displayTrades)}</span> simulated trades the model booked{' '}
              <span className={`font-mono font-bold ${displayNetPnl >= 0 ? 'text-accent-favorable' : 'text-accent-risk'}`}>{signedCurrency(displayNetPnl)}</span>, with a{' '}
              <span className="font-mono font-bold">{formatPercent(displayWinRate)}</span> win rate against a {formatPercent(displayBreakeven)} break-even win rate for these win and loss sizes.
            </p>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <div className="px-3 py-1.5 rounded-lg bg-bg-raised border border-border-strong text-xs font-mono text-text-muted">
              Win rate minus break-even: <span className={`font-bold ${edgeVal >= 0 ? 'text-accent-favorable' : 'text-accent-risk'}`}>{edgeVal >= 0 ? '+' : ''}{displayEdge} pts</span>
            </div>
          </div>
        </div>
      </div>

      {/* 4 KPI Cards with Dynamic Switching */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-bg-card border border-border-subtle rounded-xl p-5 space-y-2">
          <div className="flex items-center justify-between text-xs text-text-muted font-mono uppercase tracking-wider">
            <span>Total Trades</span>
            <TrendingUp className="w-4 h-4 text-accent-favorable" />
          </div>
          <div className="text-2xl font-bold font-mono text-text-primary">{formatNumber(displayTrades)}</div>
          <div className="flex items-center justify-between text-xs text-text-muted">
            <span>{isLive ? 'Recent closed trades' : 'Closed simulated trades'}</span>
            <span className="font-mono text-[11px] px-1.5 py-0.5 rounded bg-bg-raised text-desk-accent border border-border-strong">
              Simulated
            </span>
          </div>
        </div>

        <div className="bg-bg-card border border-border-subtle rounded-xl p-5 space-y-2">
          <div className="flex items-center justify-between text-xs text-text-muted font-mono uppercase tracking-wider">
            <span>Win Rate</span>
            <ShieldCheck className="w-4 h-4 text-accent-favorable" />
          </div>
          <div className="text-2xl font-bold font-mono text-accent-favorable">{formatPercent(displayWinRate)}</div>
          <div className="text-xs text-text-muted">
            Breakeven hurdle: <span className="font-mono">{formatPercent(displayBreakeven)}</span>
          </div>
        </div>

        <div className="bg-bg-card border border-border-subtle rounded-xl p-5 space-y-2">
          <div className="flex items-center justify-between text-xs text-text-muted font-mono uppercase tracking-wider">
            <span>Avg Win / Avg Loss</span>
            <ArrowUpRight className="w-4 h-4 text-text-muted" />
          </div>
          <div className="text-2xl font-bold font-mono text-text-primary">
            <span className="text-accent-favorable">{formatCurrency(displayAvgWin)}</span>
            <span className="text-text-muted text-lg mx-1.5">/</span>
            <span className="text-accent-risk">{formatCurrency(displayAvgLoss)}</span>
          </div>
          <div className="text-xs text-text-muted">
            Payoff ratio: 1 : {displayPayoff}
          </div>
        </div>

        <div className="bg-bg-card border border-border-subtle rounded-xl p-5 space-y-2">
          <div className="flex items-center justify-between text-xs text-text-muted font-mono uppercase tracking-wider">
            <span>Net P&L (simulated)</span>
            <span className="text-xs font-mono text-text-muted font-bold">{isLive ? 'LEDGER' : 'TOTAL'}</span>
          </div>
          <div className={`text-2xl font-bold font-mono ${displayNetPnl >= 0 ? 'text-accent-favorable' : 'text-accent-risk'}`}>{signedCurrency(displayNetPnl)}</div>
          <div className="text-xs text-text-muted">{isLive ? `Sum of the last ${formatNumber(displayTrades)} simulated closes` : 'Sum of simulated trade P&L'}</div>
        </div>
      </div>

      {/* Side-by-Side Dual Ledger Reconciliation Matrix */}
      <div className="bg-bg-card border border-border-subtle rounded-xl p-6 space-y-4 shadow-sm">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <RefreshCw className="w-4 h-4 text-desk-accent" />
            <h3 className="text-sm font-bold text-text-primary uppercase tracking-wider font-mono">
              Signals Page Ledger vs. Full Simulation
            </h3>
          </div>
          <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-accent-caution/10 text-accent-caution border border-accent-caution/30">
            Both simulated
          </span>
        </div>

        <div className="overflow-x-auto rounded-lg border border-border-subtle bg-bg-raised/40">
          <table className="w-full text-xs font-mono text-left">
            <thead className="bg-[#121821] text-desk-tertiary uppercase text-[11px] border-b border-border-subtle">
              <tr>
                <th className="py-2.5 px-4">Measure</th>
                <th className="py-2.5 px-4 text-text-primary font-bold">Signals page ledger ({liveLedgerStats?.tradesCount ?? '—'} trades)</th>
                <th className="py-2.5 px-4 text-text-primary font-bold">Full simulation ({backtest?.trades ? formatNumber(backtest.trades) : '—'} trades)</th>
                <th className="py-2.5 px-4">What it means</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border-subtle text-text-secondary">
              <tr className="hover:bg-bg-raised/50">
                <td className="py-2.5 px-4 font-bold text-text-primary">Win rate</td>
                <td className="py-2.5 px-4 text-text-primary font-bold">{liveLedgerStats ? `${liveLedgerStats.winRate.toFixed(1)}% (${liveLedgerStats.winsCount}W / ${liveLedgerStats.lossesCount}L)` : '—'}</td>
                <td className="py-2.5 px-4 text-text-primary font-bold">{hasBacktest ? `${backtest!.win_rate.toFixed(1)}%` : '—'}</td>
                <td className="py-2.5 px-4 text-[11px] font-sans">Break-even win rate for these win and loss sizes: {liveLedgerStats ? `${liveLedgerStats.breakevenWinRate.toFixed(1)}%` : '—'} (ledger) and {hasBacktest ? `${backtest!.breakeven_win_rate.toFixed(1)}%` : '—'} (simulation).</td>
              </tr>
              <tr className="hover:bg-bg-raised/50">
                <td className="py-2.5 px-4 font-bold text-text-primary">Average win</td>
                <td className="py-2.5 px-4 text-accent-favorable font-bold">{liveLedgerStats ? signedCurrency(liveLedgerStats.avgWin) : '—'}</td>
                <td className="py-2.5 px-4 text-accent-favorable font-bold">{hasBacktest ? signedCurrency(bAvgWin) : '—'}</td>
                <td className="py-2.5 px-4 text-[11px] font-sans">Mostly trades closed at the 50% take-profit target.</td>
              </tr>
              <tr className="hover:bg-bg-raised/50">
                <td className="py-2.5 px-4 font-bold text-text-primary">Average loss</td>
                <td className="py-2.5 px-4 text-accent-risk font-bold">{liveLedgerStats ? signedCurrency(liveLedgerStats.avgLoss) : '—'}</td>
                <td className="py-2.5 px-4 text-accent-risk font-bold">{hasBacktest ? signedCurrency(-bAvgLoss) : '—'}</td>
                <td className="py-2.5 px-4 text-[11px] font-sans">Losses come from assignment below the net cost basis. There is no fixed loss cap.</td>
              </tr>
              <tr className="hover:bg-bg-raised/50">
                <td className="py-2.5 px-4 font-bold text-text-primary">Average loss ÷ average win</td>
                <td className="py-2.5 px-4 text-text-primary">{liveLedgerStats && liveLedgerStats.payoff > 0 ? `${liveLedgerStats.payoff.toFixed(1)}×` : '—'}</td>
                <td className="py-2.5 px-4 text-text-primary">{dynamicPayoff === '—' ? '—' : `${dynamicPayoff}×`}</td>
                <td className="py-2.5 px-4 text-[11px] font-sans">{winsPerLoss ? `One average loss erases about ${winsPerLoss} average wins.` : '—'}</td>
              </tr>
              <tr className="hover:bg-bg-raised/50">
                <td className="py-2.5 px-4 font-bold text-text-primary">Net P&L</td>
                <td className={`py-2.5 px-4 font-bold ${(liveLedgerStats?.netPnl ?? 0) >= 0 ? 'text-accent-favorable' : 'text-accent-risk'}`}>{liveLedgerStats ? signedCurrency(liveLedgerStats.netPnl) : '—'}</td>
                <td className={`py-2.5 px-4 font-bold ${(backtest?.net_pnl ?? 0) >= 0 ? 'text-accent-favorable' : 'text-accent-risk'}`}>{hasBacktest ? signedCurrency(backtest!.net_pnl) : '—'}</td>
                <td className="py-2.5 px-4 text-[11px] font-sans">Simulated with model prices. Not checked against real fills.</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      {/* NEW: Score Predictive Efficacy & Factor Attribution Section */}
      <div className="bg-bg-card border border-border-subtle rounded-xl p-6 space-y-6 shadow-sm">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-border-subtle pb-4">
          <div>
            <div className="flex items-center gap-2">
              <Award className="w-5 h-5 text-accent-favorable" />
              <h2 className="text-lg font-bold text-text-primary">Does the Nirvana Score Predict Results?</h2>
              <span className="px-2 py-0.5 rounded text-[11px] font-mono bg-accent-caution/10 border border-accent-caution/30 text-accent-caution">
                Simulated
              </span>
            </div>
            <p className="text-xs text-text-muted mt-1">
              Simulated trades grouped by their score at entry. If the score worked, the top fifth (Q1) would clearly beat the bottom fifth (Q5).
            </p>
            {scoreHelps !== null && (
              <p className={`text-sm mt-2 font-medium ${scoreHelps ? 'text-accent-favorable' : 'text-accent-caution'}`}>
                {scoreHelps
                  ? `In this simulation the top fifth did better than the bottom fifth (profit factor ${topQ!.profit_factor.toFixed(2)}× vs ${bottomQ!.profit_factor.toFixed(2)}×).`
                  : `In this simulation the top fifth did not beat the bottom fifth (profit factor ${topQ!.profit_factor.toFixed(2)}× vs ${bottomQ!.profit_factor.toFixed(2)}×, win rate ${topQ!.win_rate.toFixed(1)}% vs ${bottomQ!.win_rate.toFixed(1)}%). The score is not shown to add value here.`}
              </p>
            )}
          </div>

          {/* Segmented View Switcher */}
          <div className="flex items-center bg-bg-raised p-1 rounded-lg border border-border-strong text-xs font-mono">
            <button
              onClick={() => setActiveTab('quintiles')}
              className={`px-3 py-1.5 rounded transition-colors ${activeTab === 'quintiles' ? 'bg-bg-canvas text-accent-favorable font-bold shadow' : 'text-text-muted hover:text-text-primary'}`}
            >
              Quintiles (Q1–Q5)
            </button>
            <button
              onClick={() => setActiveTab('tiers')}
              className={`px-3 py-1.5 rounded transition-colors ${activeTab === 'tiers' ? 'bg-bg-canvas text-accent-favorable font-bold shadow' : 'text-text-muted hover:text-text-primary'}`}
            >
              Score Tiers
            </button>
            <button
              onClick={() => setActiveTab('factors')}
              className={`px-3 py-1.5 rounded transition-colors ${activeTab === 'factors' ? 'bg-bg-canvas text-accent-favorable font-bold shadow' : 'text-text-muted hover:text-text-primary'}`}
            >
              Factor Edge Attribution
            </button>
          </div>
        </div>

        {/* Key figures straight from the snapshot (hidden when the snapshot does not provide them) */}
        {summary && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-4 rounded-lg bg-bg-raised border border-border-subtle space-y-1">
              <div className="flex items-center gap-2 text-xs font-mono uppercase tracking-wider text-text-muted">
                <Sparkles className="w-4 h-4 text-text-muted" />
                <span>Top 40% of scores (Q1 + Q2)</span>
              </div>
              <div className="text-xl font-bold font-mono text-text-primary">{summary.top_40_win_rate}% win rate</div>
              <div className="text-xs text-text-muted font-mono">
                Profit factor: <span className="text-text-primary font-bold">{summary.top_40_profit_factor}×</span>
              </div>
            </div>

            <div className="p-4 rounded-lg bg-bg-raised border border-border-subtle space-y-1">
              <div className="flex items-center gap-2 text-xs font-mono uppercase tracking-wider text-text-muted">
                <ShieldCheck className="w-4 h-4 text-text-muted" />
                <span>Strike below 1–2 year support</span>
              </div>
              <div className="text-xl font-bold font-mono text-text-primary">{summary.macro_shelf_loss_reduction_pct}% fewer losses</div>
              <div className="text-xs text-text-muted font-mono">Compared with strikes above that level (simulated)</div>
            </div>

            <div className="p-4 rounded-lg bg-bg-raised border border-border-subtle space-y-1">
              <div className="flex items-center gap-2 text-xs font-mono uppercase tracking-wider text-text-muted">
                <Target className="w-4 h-4 text-text-muted" />
                <span>50-day above 200-day average</span>
              </div>
              <div className="text-xl font-bold font-mono text-text-primary">{summary.golden_cross_profit_contribution_pct}% of net profit</div>
              <div className="text-xs text-text-muted font-mono">Share of simulated profit from these trades</div>
            </div>
          </div>
        )}

        {/* Tab 1: Quintiles Table */}
        {activeTab === 'quintiles' && (
          <div className="space-y-4">
            <div className="overflow-x-auto rounded-lg border border-border-subtle">
              <table className="w-full text-xs font-mono text-left">
                <thead className="bg-bg-raised text-text-muted uppercase border-b border-border-subtle">
                  <tr>
                    <th className="py-2.5 px-3">Cohort</th>
                    <th className="py-2.5 px-3">Entry Score</th>
                    <th className="py-2.5 px-3 text-right">Trades</th>
                    <th className="py-2.5 px-3 text-right">Win Rate</th>
                    <th className="py-2.5 px-3 text-right">50% TP Rate</th>
                    <th className="py-2.5 px-3 text-right">Avg Days to TP</th>
                    <th className="py-2.5 px-3 text-right">Profit Factor</th>
                    <th className="py-2.5 px-3 text-right">Gross Win</th>
                    <th className="py-2.5 px-3 text-right">Gross Loss</th>
                    <th className="py-2.5 px-3 text-right">Net Realized P&L</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border-subtle">
                  {quintiles.map((q, idx) => (
                    <tr key={idx} className="hover:bg-bg-raised/50 transition-colors">
                      <td className="py-2 px-3 font-bold text-text-primary flex items-center gap-2">
                        {idx === 0 && <span className="w-2 h-2 rounded-full bg-accent-favorable shrink-0" />}
                        {idx === 1 && <span className="w-2 h-2 rounded-full bg-accent-favorable/80 shrink-0" />}
                        {idx === 2 && <span className="w-2 h-2 rounded-full bg-accent-caution shrink-0" />}
                        {idx === 3 && <span className="w-2 h-2 rounded-full bg-text-muted shrink-0" />}
                        {idx === 4 && <span className="w-2 h-2 rounded-full bg-accent-risk shrink-0" />}
                        {q.quintile}
                      </td>
                      <td className="py-2 px-3 text-text-secondary">{q.score_range}</td>
                      <td className="py-2 px-3 text-right text-text-primary">{q.trades}</td>
                      <td className="py-2 px-3 text-right font-bold text-accent-favorable">{q.win_rate.toFixed(1)}%</td>
                      <td className="py-2 px-3 text-right text-text-primary">{q.tp_50_rate.toFixed(1)}%</td>
                      <td className="py-2 px-3 text-right text-text-secondary">{q.avg_days_to_tp.toFixed(1)}d</td>
                      <td className="py-2 px-3 text-right font-bold text-text-primary">{q.profit_factor.toFixed(2)}x</td>
                      <td className="py-2 px-3 text-right text-accent-favorable">+${formatNumber(q.gross_win)}</td>
                      <td className="py-2 px-3 text-right text-accent-risk">-${formatNumber(q.gross_loss)}</td>
                      <td className={`py-2 px-3 text-right font-bold ${q.net_pnl >= 0 ? 'text-accent-favorable' : 'text-accent-risk'}`}>{signedCurrency(q.net_pnl)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Visualizer Chart: Win Rate & Profit Factor by Quintile */}
            <div className="h-56 w-full pt-2">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={quintiles} margin={{ top: 10, right: 10, left: 10, bottom: 20 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#253041" opacity={0.5} />
                  <XAxis dataKey="quintile" stroke="#8E9AA8" fontSize={11} tickLine={false} />
                  {/* Axis starts at 0 so small differences are not exaggerated */}
                  <YAxis stroke="#8E9AA8" fontSize={11} tickLine={false} domain={[0, 100]} tickFormatter={(v) => `${v}%`} />
                  <Tooltip
                    contentStyle={{ backgroundColor: '#121821', borderColor: '#253041', borderRadius: '8px', color: '#E8ECF1' }}
                    formatter={(val: number) => [`${val.toFixed(1)}%`, 'Win Rate']}
                    labelStyle={{ color: '#8E9AA8', fontFamily: 'monospace' }}
                  />
                  <Bar dataKey="win_rate" radius={[4, 4, 0, 0]} fill="#6CB4FF" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}

        {/* Tab 2: Calibrated Score Tiers */}
        {activeTab === 'tiers' && (
          <div className="overflow-x-auto rounded-lg border border-border-subtle">
            <table className="w-full text-xs font-mono text-left">
              <thead className="bg-bg-raised text-text-muted uppercase border-b border-border-subtle">
                <tr>
                  <th className="py-2.5 px-3">Score Tier</th>
                  <th className="py-2.5 px-3">Score Cutoff</th>
                  <th className="py-2.5 px-3 text-right">Trades</th>
                  <th className="py-2.5 px-3 text-right">Win Rate</th>
                  <th className="py-2.5 px-3 text-right">50% TP Rate</th>
                  <th className="py-2.5 px-3 text-right">Avg Velocity</th>
                  <th className="py-2.5 px-3 text-right">Profit Factor</th>
                  <th className="py-2.5 px-3 text-right">Avg Win</th>
                  <th className="py-2.5 px-3 text-right">Avg Loss</th>
                  <th className="py-2.5 px-3 text-right">Net Realized P&L</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border-subtle">
                {tiers.map((t, idx) => (
                  <tr key={idx} className="hover:bg-bg-raised/50 transition-colors">
                    <td className="py-2 px-3 font-bold text-text-primary">{t.tier}</td>
                    <td className="py-2 px-3 text-text-secondary">{t.score_range}</td>
                    <td className="py-2 px-3 text-right text-text-primary">{t.trades}</td>
                    <td className="py-2 px-3 text-right font-bold text-accent-favorable">{t.win_rate.toFixed(1)}%</td>
                    <td className="py-2 px-3 text-right text-text-primary">{t.tp_50_rate.toFixed(1)}%</td>
                    <td className="py-2 px-3 text-right text-text-secondary">{t.avg_days_to_tp.toFixed(1)}d</td>
                    <td className="py-2 px-3 text-right font-bold text-text-primary">{t.profit_factor.toFixed(2)}x</td>
                    <td className="py-2 px-3 text-right text-accent-favorable">+${formatNumber(t.avg_win)}</td>
                    <td className="py-2 px-3 text-right text-accent-risk">-${formatNumber(Math.abs(t.avg_loss))}</td>
                    <td className={`py-2 px-3 text-right font-bold ${t.net_pnl >= 0 ? 'text-accent-favorable' : 'text-accent-risk'}`}>{signedCurrency(t.net_pnl)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Tab 3: Component Factor Attribution */}
        {activeTab === 'factors' && (
          <div className="space-y-4">
            <div className="overflow-x-auto rounded-lg border border-border-subtle">
              <table className="w-full text-xs font-mono text-left">
                <thead className="bg-bg-raised text-text-muted uppercase border-b border-border-subtle">
                  <tr>
                    <th className="py-2.5 px-3">Component Factor Tested</th>
                    <th className="py-2.5 px-3">State / Condition</th>
                    <th className="py-2.5 px-3 text-right">Sample Trades</th>
                    <th className="py-2.5 px-3 text-right">Win Rate %</th>
                    <th className="py-2.5 px-3 text-right">Profit Factor</th>
                    <th className="py-2.5 px-3 text-right">Net Realized P&L</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border-subtle">
                  {factors.map((f, idx) => (
                    <tr key={idx} className={`hover:bg-bg-raised/50 transition-colors ${f.condition.includes('Active') || f.condition.includes('Fortified') || f.condition.includes('within') ? 'bg-bg-canvas/30' : ''}`}>
                      <td className="py-2 px-3 font-semibold text-text-primary">{f.factor}</td>
                      <td className="py-2 px-3">
                        <span className={`px-2 py-0.5 rounded text-[11px] ${f.condition.includes('Active') || f.condition.includes('Fortified') || f.condition.includes('within') ? 'bg-accent-favorable/10 text-accent-favorable border border-accent-favorable/20 font-bold' : 'text-text-muted'}`}>
                          {f.condition}
                        </span>
                      </td>
                      <td className="py-2 px-3 text-right text-text-primary">{f.trades}</td>
                      <td className="py-2 px-3 text-right font-bold text-accent-favorable">{f.win_rate.toFixed(1)}%</td>
                      <td className="py-2 px-3 text-right font-bold text-text-primary">{f.profit_factor.toFixed(2)}x</td>
                      <td className={`py-2 px-3 text-right font-bold ${f.net_pnl >= 0 ? 'text-accent-favorable' : 'text-accent-risk'}`}>
                        {f.net_pnl >= 0 ? `+$${formatNumber(f.net_pnl)}` : `-$${formatNumber(Math.abs(f.net_pnl))}`}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="p-4 rounded-lg bg-bg-canvas border border-border-subtle text-xs text-text-secondary space-y-1">
              <span className="font-bold text-text-primary uppercase tracking-wider text-[11px]">How to read this:</span>
              <p>
                Each row compares simulated trades with and without one condition. The factors overlap and these are in-sample results from the same simulation, so a difference here is a lead to test on real quotes, not proof that the factor works.
              </p>
            </div>
          </div>
        )}
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

      {/* How the simulator books each trade (no invented percentages; figures come from the snapshot) */}
      <div className="bg-bg-card border border-border-subtle rounded-xl p-6 space-y-6 shadow-sm">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-border-subtle pb-4">
          <div>
            <div className="flex items-center gap-2">
              <Layers className="w-5 h-5 text-text-muted" />
              <h2 className="text-lg font-bold text-text-primary">How the Simulator Books Each Trade</h2>
            </div>
            <p className="text-xs text-text-muted mt-1">
              Every simulated trade ends in one of three ways. Rolls extend a trade; they are not counted as separate wins.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="p-4 rounded-xl border border-border-subtle bg-bg-raised space-y-2">
            <div className="text-sm font-bold text-text-primary">1. Take profit at 50%</div>
            <p className="text-xs text-text-muted leading-relaxed">
              The put is bought back when its model price falls to half the credit received. Counted as a win.
            </p>
          </div>
          <div className="p-4 rounded-xl border border-border-subtle bg-bg-raised space-y-2">
            <div className="text-sm font-bold text-text-primary">2. Roll when tested</div>
            <p className="text-xs text-text-muted leading-relaxed">
              When the stock nears the strike, the put is rolled out in time for a net credit, up to 2 times. The trade continues and is judged when it finally closes.
            </p>
          </div>
          <div className="p-4 rounded-xl border border-border-subtle bg-bg-raised space-y-2">
            <div className="text-sm font-bold text-text-primary">3. Expiry or assignment</div>
            <p className="text-xs text-text-muted leading-relaxed">
              At expiry the put either expires worthless (win) or is assigned. Assignment above the net cost basis is counted as a win; below it is a loss. There is no stop-loss, so losses are not capped.
            </p>
          </div>
        </div>

        <div className="overflow-x-auto rounded-xl border border-border-subtle bg-bg-raised/40">
          <table className="w-full text-xs font-mono text-left">
            <thead className="bg-[#121821] text-desk-tertiary uppercase text-[11px] border-b border-border-subtle">
              <tr>
                <th className="py-3 px-4">Measure (full simulation)</th>
                <th className="py-3 px-4 text-text-primary font-bold">Value</th>
                <th className="py-3 px-4">How it is calculated</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border-subtle text-text-secondary">
              <tr className="hover:bg-bg-raised/50">
                <td className="py-3 px-4 font-bold text-text-primary">Win rate</td>
                <td className="py-3 px-4 text-text-primary font-bold">{hasBacktest ? `${backtest!.win_rate.toFixed(1)}%` : '—'}</td>
                <td className="py-3 px-4 text-[11px] font-sans">Winning trades ÷ all closed trades</td>
              </tr>
              <tr className="hover:bg-bg-raised/50">
                <td className="py-3 px-4 font-bold text-text-primary">Average win / average loss</td>
                <td className="py-3 px-4 font-bold"><span className="text-accent-favorable">{hasBacktest ? signedCurrency(bAvgWin) : '—'}</span> / <span className="text-accent-risk">{hasBacktest ? signedCurrency(-bAvgLoss) : '—'}</span></td>
                <td className="py-3 px-4 text-[11px] font-sans">Mean P&amp;L of winning and of losing trades, including roll credits</td>
              </tr>
              <tr className="hover:bg-bg-raised/50">
                <td className="py-3 px-4 font-bold text-text-primary">Break-even win rate</td>
                <td className="py-3 px-4 text-text-primary font-bold">{hasBacktest ? `${backtest!.breakeven_win_rate.toFixed(1)}%` : '—'}</td>
                <td className="py-3 px-4 text-[11px] font-sans">|Avg loss| ÷ (|Avg loss| + Avg win): the win rate needed just to break even</td>
              </tr>
              <tr className="hover:bg-bg-raised/50">
                <td className="py-3 px-4 font-bold text-text-primary">Expected P&amp;L per trade</td>
                <td className={`py-3 px-4 font-bold ${dynamicEV >= 0 ? 'text-accent-favorable' : 'text-accent-risk'}`}>{hasBacktest ? signedCurrency(dynamicEV) : '—'}</td>
                <td className="py-3 px-4 text-[11px] font-sans">Win rate × Avg win − (1 − Win rate) × |Avg loss|</td>
              </tr>
            </tbody>
          </table>
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
              <span><strong>Cash-secured assignment:</strong> Collateral is set aside for every put and assignment is settled at expiry. No margin is used.</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-accent-favorable mt-0.5">•</span>
              <span><strong>Split &amp; Corporate Action Adjustments:</strong> Uses official Alpaca split-adjusted continuous pricing series.</span>
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
              <span><strong>Real option prices and spreads:</strong> Option prices are Black-Scholes estimates, not market quotes, and no bid/ask spread or commission is charged. Real fills are worse.</span>
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
    </div>
  );
}
