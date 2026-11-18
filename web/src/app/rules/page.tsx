'use client';

import React, { useState } from 'react';
import {
  Shield,
  Target,
  AlertOctagon,
  Zap,
  Filter,
  Flame,
  CheckCircle2,
  AlertTriangle,
  ArrowRight,
  ArrowDown,
  RefreshCw,
  Layers,
  DollarSign,
  XCircle,
  Award,
  Sparkles,
  GitBranch,
  TrendingDown,
  TrendingUp,
  Percent,
  Briefcase,
  HelpCircle
} from 'lucide-react';

export default function RulesPage() {
  const [activePreset, setActivePreset] = useState<'conservative' | 'core' | 'aggressive'>('core');

  const presets = {
    conservative: {
      name: 'Conservative',
      desc: 'High cushion capital preservation. Tailored for larger accounts seeking consistent monthly yield with low assignment probability.',
      targetDte: 45,
      cushionMin: 18,
      deltaMax: -0.15,
      minCredit: 2.0,
      minRocCycle: 1.5,
      blackoutStrictness: 'Absolute 14-day pre-earnings lock out',
    },
    core: {
      name: 'Core',
      desc: 'Optimal risk-adjusted sweet spot. Balanced theta decay curve with institutional S/R support and pullback confirmation.',
      targetDte: 35,
      cushionMin: 12,
      deltaMax: -0.20,
      minCredit: 1.5,
      minRocCycle: 1.8,
      blackoutStrictness: 'No expiry inside 7 days of earnings; flags 14-day window',
    },
    aggressive: {
      name: 'Aggressive',
      desc: 'Maximum yield acceleration. Captures high IV spikes on pullbacks with tighter cushion and faster cycles.',
      targetDte: 28,
      cushionMin: 8,
      deltaMax: -0.28,
      minCredit: 1.2,
      minRocCycle: 2.5,
      blackoutStrictness: 'Warning only on earnings; user discretion',
    },
  };

  const current = presets[activePreset];

  return (
    <div className="space-y-10 py-2">
      {/* Title Header */}
      <div className="border-b border-border-subtle pb-6">
        <div className="flex items-center gap-3">
          <h1 className="text-2xl font-bold tracking-tight text-text-primary">Strategy Rules, Scoring & Execution Protocols</h1>
          <span className="px-2.5 py-0.5 rounded text-xs font-mono font-semibold uppercase bg-bg-raised border border-border-strong text-accent-favorable">
            Institutional Quantitative Creed
          </span>
        </div>
        <p className="mt-1 text-sm text-text-muted">
          Complete mathematical criteria: 7-Factor Nirvana Composite Scoring Engine followed by detailed lifecycle flowcharts for Stock Selection, Defensive Rolling, and Planned Assignment vs. Loss Triage.
        </p>
      </div>

      {/* ========================================================================= */}
      {/* SECTION 1: NIRVANA COMPOSITE SCORING CRITERIA (0 - 100 SCALE) */}
      {/* ========================================================================= */}
      <div className="bg-bg-card border border-border-subtle rounded-xl p-6 space-y-6 shadow-sm">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-border-subtle pb-4">
          <div>
            <div className="flex items-center gap-2">
              <Award className="w-5 h-5 text-accent-favorable" />
              <h2 className="text-lg font-bold text-text-primary">1. Nirvana Composite Scoring Model (0–100 Scale)</h2>
            </div>
            <p className="text-xs text-text-muted mt-1">
              Calculated strictly at the moment of order placement. Combines 7 orthogonal quantitative factors with binary event-risk deductions.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <span className="px-3 py-1 rounded-lg bg-bg-raised border border-border-strong text-xs font-mono text-text-secondary">
              Qualified Threshold: <strong className="text-accent-favorable">Score ≥ 75.0</strong>
            </span>
            <span className="px-3 py-1 rounded-lg bg-accent-favorable/10 border border-accent-favorable/30 text-xs font-mono text-accent-favorable font-bold">
              2X Conviction: Score ≥ 82.0
            </span>
          </div>
        </div>

        {/* 7 Scoring Factor Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Factor 1: Cushion */}
          <div className="p-4 rounded-lg bg-bg-raised border border-border-subtle space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-mono text-text-muted uppercase">Factor 1 · Cushion</span>
              <span className="text-xs font-mono font-bold text-accent-favorable">Max 20 pts</span>
            </div>
            <div className="text-sm font-bold text-text-primary">Beta-Adaptive Cushion</div>
            <p className="text-xs text-text-muted leading-relaxed">
              Normalized against asset volatility: Target = <code>12% × √Beta</code>. Low-beta utilities require 10.5% cushion; high-beta growth requires 16.5% cushion.
            </p>
            <div className="text-[11px] font-mono text-text-secondary pt-1 border-t border-border-subtle">
              Score = min(20, (Cushion / Target) × 16.0)
            </div>
          </div>

          {/* Factor 2: Valuation */}
          <div className="p-4 rounded-lg bg-bg-raised border border-border-subtle space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-mono text-text-muted uppercase">Factor 2 · Valuation</span>
              <span className="text-xs font-mono font-bold text-accent-favorable">Max 20 pts</span>
            </div>
            <div className="text-sm font-bold text-text-primary">Lens 1 Intrinsic Safety</div>
            <p className="text-xs text-text-muted leading-relaxed">
              Based on Free Cash Flow (FCF) yield & Reverse DCF growth hurdles. Protects against capital impairment by screening out unhedged bubble valuations.
            </p>
            <div className="text-[11px] font-mono text-text-secondary pt-1 border-t border-border-subtle">
              Score = min(20, FCF Yield % × 2.5)
            </div>
          </div>

          {/* Factor 3: Technical Levels & Macro S/R */}
          <div className="p-4 rounded-lg bg-bg-raised border border-border-subtle space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-mono text-text-muted uppercase">Factor 3 · Levels</span>
              <span className="text-xs font-mono font-bold text-accent-favorable">Max 20 pts</span>
            </div>
            <div className="text-sm font-bold text-text-primary">Macro S/R & Trend Integration</div>
            <p className="text-xs text-text-muted leading-relaxed">
              Base 12.0 pts. <strong>+4 pts</strong> Golden Cross (50 &gt; 200 SMA), <strong>+3 pts</strong> Strike fortified under 1–2Y Macro Shelf, <strong>-4 pts</strong> Secular bear penalty. <strong>-4 pts</strong> High-Beta Mid-Air Suspension (β ≥ 1.30 above macro shelf).
            </p>
            <div className="text-[11px] font-mono text-text-secondary pt-1 border-t border-border-subtle">
              Fortified shelf drops loss rate by -57%
            </div>
          </div>

          {/* Factor 4: Sentiment & Divergence */}
          <div className="p-4 rounded-lg bg-bg-raised border border-border-subtle space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-mono text-text-muted uppercase">Factor 4 · Sentiment</span>
              <span className="text-xs font-mono font-bold text-accent-favorable">Max 15 pts</span>
            </div>
            <div className="text-sm font-bold text-text-primary">Whale Absorption Divergence</div>
            <p className="text-xs text-text-muted leading-relaxed">
              Multi-horizon news sentiment (1d/5d/20d) crossed with institutional dark pool flow. Detects retail panic selling into institutional block accumulation.
            </p>
            <div className="text-[11px] font-mono text-text-secondary pt-1 border-t border-border-subtle">
              Whale Absorption: 15.0 pts | Neutral: 12.0 pts
            </div>
          </div>

          {/* Factor 5: Candlestick Confirmation */}
          <div className="p-4 rounded-lg bg-bg-raised border border-border-subtle space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-mono text-text-muted uppercase">Factor 5 · Price Action</span>
              <span className="text-xs font-mono font-bold text-accent-favorable">Max 10 pts</span>
            </div>
            <div className="text-sm font-bold text-text-primary">Whale Volume & Reversals</div>
            <p className="text-xs text-text-muted leading-relaxed">
              Hammer / Dragonfly lower wick rejection (+1.5 pts). <strong>+3.0 pts</strong> for Whale Volume Spike (≥ 1.8x 20d average) on an up close / rejection candle.
            </p>
            <div className="text-[11px] font-mono text-text-secondary pt-1 border-t border-border-subtle">
              Whale Vol on Up Day: 98.1% win rate
            </div>
          </div>

          {/* Factor 6: Statistical PoS */}
          <div className="p-4 rounded-lg bg-bg-raised border border-border-subtle space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-mono text-text-muted uppercase">Factor 6 · Probability</span>
              <span className="text-xs font-mono font-bold text-accent-favorable">Max 8 pts</span>
            </div>
            <div className="text-sm font-bold text-text-primary">Analytical & Structural PoS</div>
            <p className="text-xs text-text-muted leading-relaxed">
              Black-Scholes cumulative distribution function <code>N(d2)</code> augmented with structural support boosts. Strictly demands &gt;88% baseline PoS OTM.
            </p>
            <div className="text-[11px] font-mono text-text-secondary pt-1 border-t border-border-subtle">
              Score = min(8, ((PoS - 60) / 38) × 8.0)
            </div>
          </div>

          {/* Factor 7: Cycle ROC */}
          <div className="p-4 rounded-lg bg-bg-raised border border-border-subtle space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-mono text-text-muted uppercase">Factor 7 · Yield</span>
              <span className="text-xs font-mono font-bold text-accent-favorable">Max 7 pts</span>
            </div>
            <div className="text-sm font-bold text-text-primary">Return on Collateral (ROC)</div>
            <p className="text-xs text-text-muted leading-relaxed">
              Return on cash-secured capital (<code>Bid / Strike × 100</code>). Filters out negligible premium; rewards 1.5%–2.5% 35-day cycle return.
            </p>
            <div className="text-[11px] font-mono text-text-secondary pt-1 border-t border-border-subtle">
              Score = min(7, (Cycle ROC / 2.5) × 7.0)
            </div>
          </div>

          {/* Binary Risk Deductions */}
          <div className="p-4 rounded-lg bg-bg-raised border border-accent-risk/30 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-mono text-accent-risk uppercase">Binary Penalties</span>
              <span className="text-xs font-mono font-bold text-accent-risk">Up to -25 pts</span>
            </div>
            <div className="text-sm font-bold text-accent-risk">Blackout & Mid-Air Deductions</div>
            <p className="text-xs text-text-muted leading-relaxed">
              <strong>-25 pts:</strong> Option spans earnings within 7 days (Rule 1 violation).<br />
              <strong>-8 pts:</strong> Pre-earnings digestion window (8 to 14 days).<br />
              <strong>-4 pts:</strong> High-Beta Mid-Air Suspension (β ≥ 1.30 above 2Y Macro Shelf).
            </p>
            <div className="text-[11px] font-mono text-accent-risk pt-1 border-t border-border-subtle">
              Severe jump-risk & growth blow-through elimination
            </div>
          </div>
        </div>

        {/* Sizing & Conviction Matrix Table */}
        <div className="rounded-lg border border-border-subtle overflow-hidden">
          <div className="bg-bg-raised px-4 py-2.5 border-b border-border-subtle text-xs font-mono font-bold uppercase tracking-wider text-text-muted flex items-center justify-between">
            <span>Score Conviction & Allocation Sizing Matrix</span>
            <span>Empirical Audit (753 Trades)</span>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 divide-y md:divide-y-0 md:divide-x divide-border-subtle text-xs font-mono">
            <div className="p-4 space-y-1.5 bg-accent-favorable/5">
              <div className="flex items-center justify-between">
                <span className="font-bold text-accent-favorable">Tier 1: Score ≥ 82.0</span>
                <span className="px-2 py-0.5 rounded bg-accent-favorable/20 text-accent-favorable font-bold">2X Conviction</span>
              </div>
              <p className="text-text-muted text-[11px]">
                Features Golden Cross + Macro Support Shelf fortification + Whale Volume absorption. <strong>96.7% Win Rate</strong> · <strong>6.67x Profit Factor</strong>. Allocated 2 contracts.
              </p>
            </div>
            <div className="p-4 space-y-1.5">
              <div className="flex items-center justify-between">
                <span className="font-bold text-text-primary">Tier 2: Score 75.0 – 81.9</span>
                <span className="px-2 py-0.5 rounded bg-bg-raised text-text-secondary font-bold border border-border-strong">1X Standard</span>
              </div>
              <p className="text-text-muted text-[11px]">
                Solid qualified candidate meeting all cushion and institutional dealing range criteria. <strong>96.1% Win Rate</strong> · <strong>3.56x Profit Factor</strong>. Allocated 1 contract.
              </p>
            </div>
            <div className="p-4 space-y-1.5 bg-accent-risk/5">
              <div className="flex items-center justify-between">
                <span className="font-bold text-accent-risk">Tier 3: Score &lt; 75.0</span>
                <span className="px-2 py-0.5 rounded bg-accent-risk/20 text-accent-risk font-bold">Filtered / Held Back</span>
              </div>
              <p className="text-text-muted text-[11px]">
                Sub-par setup: deficient cushion, secular bear trend, or earnings proximity. Omitted from daily picks and placed in Held Back ledger.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* SECTION 2: THREE COMPREHENSIVE PROTOCOL FLOWCHARTS */}
      {/* ========================================================================= */}
      <div className="space-y-6">
        <div>
          <h2 className="text-lg font-bold text-text-primary">2. Operational Execution & Lifecycle Flowcharts</h2>
          <p className="text-xs text-text-muted mt-1">
            Three distinct procedural cards covering candidate filtering, defensive rolling triggers, and planned assignment vs loss management.
          </p>
        </div>

        {/* ----------------------------------------------------------------------- */}
        {/* CARD 1: STOCK SELECTION CRITERIA FLOWCHART */}
        {/* ----------------------------------------------------------------------- */}
        <div className="bg-bg-card border border-border-subtle rounded-xl p-6 space-y-6 shadow-sm">
          <div className="flex items-center gap-3 border-b border-border-subtle pb-4">
            <div className="p-2 rounded-lg bg-bg-raised text-accent-favorable">
              <Filter className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-text-primary">Flowchart Card #1: Stock Selection & Strike Qualification</h3>
              <p className="text-xs text-text-muted">8-step mechanical funnel executed every day at 3:35 PM ET across the 108 institutional assets</p>
            </div>
          </div>

          {/* Visual Step-by-Step Flow Nodes */}
          <div className="space-y-3 font-mono text-xs">
            {/* Step 1 */}
            <div className="p-3.5 rounded-lg bg-bg-raised border border-border-subtle flex flex-col md:flex-row md:items-center justify-between gap-3">
              <div className="flex items-start gap-3">
                <span className="px-2 py-0.5 rounded bg-bg-canvas border border-border-strong text-accent-favorable font-bold shrink-0">STEP 1</span>
                <div>
                  <span className="font-bold text-text-primary">Universe Pre-Screen (108 Institutional Equities)</span>
                  <p className="text-text-muted text-[11px] mt-0.5">Liquid S&P 500 / Nasdaq megacaps with listed weekly options, deep market liquidity, and institutional following.</p>
                </div>
              </div>
              <span className="text-accent-favorable font-bold text-right shrink-0">108 Candidates</span>
            </div>

            <div className="flex justify-center"><ArrowDown className="w-4 h-4 text-text-muted" /></div>

            {/* Step 2 */}
            <div className="p-3.5 rounded-lg bg-bg-raised border border-border-subtle flex flex-col md:flex-row md:items-center justify-between gap-3">
              <div className="flex items-start gap-3">
                <span className="px-2 py-0.5 rounded bg-bg-canvas border border-border-strong text-accent-favorable font-bold shrink-0">STEP 2</span>
                <div>
                  <span className="font-bold text-text-primary">Pullback & SMC Dealing Range Confirmation</span>
                  <p className="text-text-muted text-[11px] mt-0.5">Asset must be in a pullback or consolidation discount: <code>Close ≤ 20 SMA</code> OR <code>Day Move ≤ -0.8%</code> OR <code>RSI(14) ≤ 45</code>. We never chase green breakouts.</p>
                </div>
              </div>
              <span className="text-accent-caution font-bold text-right shrink-0">Filter: Pullback Only</span>
            </div>

            <div className="flex justify-center"><ArrowDown className="w-4 h-4 text-text-muted" /></div>

            {/* Step 3 */}
            <div className="p-3.5 rounded-lg bg-bg-raised border border-border-subtle flex flex-col md:flex-row md:items-center justify-between gap-3">
              <div className="flex items-start gap-3">
                <span className="px-2 py-0.5 rounded bg-bg-canvas border border-border-strong text-accent-favorable font-bold shrink-0">STEP 3</span>
                <div>
                  <span className="font-bold text-text-primary">Beta-Adaptive Strike & Cushion Selection (~35 DTE)</span>
                  <p className="text-text-muted text-[11px] mt-0.5">Target Cushion = <code>12.0% × √Beta</code>. Round strike down to nearest grid. Net basis must sit behind ICT OTE (61.8%–78.6%) or 1–2Y Macro Support Shelf.</p>
                </div>
              </div>
              <span className="text-accent-favorable font-bold text-right shrink-0">Cushion: 10.5% – 18.0%</span>
            </div>

            <div className="flex justify-center"><ArrowDown className="w-4 h-4 text-text-muted" /></div>

            {/* Step 4 */}
            <div className="p-3.5 rounded-lg bg-bg-raised border border-border-subtle flex flex-col md:flex-row md:items-center justify-between gap-3">
              <div className="flex items-start gap-3">
                <span className="px-2 py-0.5 rounded bg-bg-canvas border border-border-strong text-accent-favorable font-bold shrink-0">STEP 4</span>
                <div>
                  <span className="font-bold text-text-primary">Liquidity & Yield Hurdle Gating</span>
                  <p className="text-text-muted text-[11px] mt-0.5">Verified via real quoted bid: <code>Bid ≥ $1.20</code> (or $0.80 for low-beta), <code>Cycle ROC ≥ 1.0%</code> (≥12% annualized), <code>Open Interest ≥ 100</code>, <code>Spread ≤ 25%</code>.</p>
                </div>
              </div>
              <span className="text-text-primary font-bold text-right shrink-0">Guarantees Viability</span>
            </div>

            <div className="flex justify-center"><ArrowDown className="w-4 h-4 text-text-muted" /></div>

            {/* Step 5 */}
            <div className="p-3.5 rounded-lg bg-bg-raised border border-accent-risk/40 flex flex-col md:flex-row md:items-center justify-between gap-3">
              <div className="flex items-start gap-3">
                <span className="px-2 py-0.5 rounded bg-accent-risk/20 text-accent-risk font-bold shrink-0">GATE 5</span>
                <div>
                  <span className="font-bold text-accent-risk">Earnings Blackout Rule #1 Check</span>
                  <p className="text-text-muted text-[11px] mt-0.5">Does the 35-day option cycle span an upcoming earnings release? If within 7 days: <strong>REJECTED</strong>. If within 14 days: -8 pts deduction.</p>
                </div>
              </div>
              <div className="text-right shrink-0">
                <span className="text-accent-risk font-bold">Hard Lockout &lt; 7d</span>
              </div>
            </div>

            <div className="flex justify-center"><ArrowDown className="w-4 h-4 text-text-muted" /></div>

            {/* Step 6 */}
            <div className="p-3.5 rounded-lg bg-bg-raised border border-accent-favorable/40 flex flex-col md:flex-row md:items-center justify-between gap-3">
              <div className="flex items-start gap-3">
                <span className="px-2 py-0.5 rounded bg-accent-favorable/20 text-accent-favorable font-bold shrink-0">GATE 6</span>
                <div>
                  <span className="font-bold text-text-primary">Nirvana Composite Scoring & Sizing Allocation</span>
                  <p className="text-text-muted text-[11px] mt-0.5">Compute 0–100 score. If <strong>Score ≥ 82</strong>: Tag as <strong>2X Allocation</strong> (2 Contracts; requires 1–2Y Macro Shelf fortification if β ≥ 1.30 to block mid-air growth traps). If <strong>75 ≤ Score &lt; 82</strong>: Tag as <strong>1X Allocation</strong> (1 Contract). If &lt;75: Held Back.</p>
                </div>
              </div>
              <div className="text-right shrink-0">
                <span className="text-accent-favorable font-bold">🎯 Qualified Setup Issued</span>
              </div>
            </div>
          </div>
        </div>

        {/* ----------------------------------------------------------------------- */}
        {/* CARD 2: ROLL CRITERIA FLOWCHART */}
        {/* ----------------------------------------------------------------------- */}
        <div className="bg-bg-card border border-border-subtle rounded-xl p-6 space-y-6 shadow-sm">
          <div className="flex items-center gap-3 border-b border-border-subtle pb-4">
            <div className="p-2 rounded-lg bg-bg-raised text-accent-caution">
              <RefreshCw className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-text-primary">Flowchart Card #2: Defensive Rolling Action Protocol</h3>
              <p className="text-xs text-text-muted">Mechanical rules governing when to harvest 50% profit vs when and how to execute a defensive roll</p>
            </div>
          </div>

          <div className="space-y-4 font-mono text-xs">
            {/* Step 1: Active Monitoring */}
            <div className="p-3.5 rounded-lg bg-bg-raised border border-border-subtle">
              <div className="flex items-center justify-between">
                <span className="font-bold text-text-primary">ACTIVE MONITORING (Candle-by-Candle Tracking)</span>
                <span className="text-accent-favorable text-[11px]">Mark-to-Market Daily</span>
              </div>
              <p className="text-text-muted text-[11px] mt-1">
                Evaluate daily close price, remaining DTE, option mark, and current put delta (Δ).
              </p>
            </div>

            {/* Decision Fork: Profit Target vs Testing */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Left Branch: Take Profit */}
              <div className="p-4 rounded-lg bg-accent-favorable/5 border border-accent-favorable/30 space-y-2">
                <div className="flex items-center gap-2 text-accent-favorable font-bold">
                  <CheckCircle2 className="w-4 h-4" />
                  <span>PATH A: 50% Take-Profit Target Hit</span>
                </div>
                <div className="text-[11px] text-text-secondary leading-relaxed">
                  <strong>Trigger:</strong> Option value decays to <code>≤ 50% of open credit</code> (e.g. sold at $2.00, now bid at $1.00).<br />
                  <strong>Action:</strong> 🎯 <strong>BUY BACK TO CLOSE</strong>.<br />
                  <strong>Result:</strong> Realize 50% max profit early; releases 100% of cash collateral to cycle into fresh setups. Average holding duration is only <strong>8.8 to 9.2 days</strong>.
                </div>
              </div>

              {/* Right Branch: Underlying Tested */}
              <div className="p-4 rounded-lg bg-accent-caution/5 border border-accent-caution/30 space-y-2">
                <div className="flex items-center gap-2 text-accent-caution font-bold">
                  <AlertTriangle className="w-4 h-4" />
                  <span>PATH B: Position Tested / In The Money</span>
                </div>
                <div className="text-[11px] text-text-secondary leading-relaxed">
                  <strong>When do we decide to roll?</strong><br />
                  • <strong>Trigger 1 (ATM Touch Window):</strong> Spot drops to within <code>0% to 3% ITM</code> (or spot &lt; Strike × 1.02). This is where extrinsic time-value is at its peak!<br />
                  • <strong>Trigger 2 (Delta Expansion):</strong> Put Delta crosses <code>|Δ| &gt; 0.40</code>.<br />
                  • <strong>Roll Budget Check:</strong> Has position already used 2 rolls? (<code>rolls &lt; 2</code>).
                </div>
              </div>
            </div>

            {/* Rolling Feasibility Gate */}
            <div className="p-4 rounded-lg bg-bg-raised border border-border-strong space-y-3">
              <div className="flex items-center justify-between">
                <span className="font-bold text-accent-caution flex items-center gap-2">
                  <GitBranch className="w-4 h-4" />
                  THE GOLDEN CREDIT RULE OF ROLLING
                </span>
                <span className="px-2 py-0.5 rounded bg-bg-canvas text-[11px] font-bold border border-border-subtle">
                  Strict Requirement
                </span>
              </div>
              <p className="text-text-muted text-[11px] leading-relaxed">
                We roll <strong>OUT</strong> in time (~35 DTE further) and <strong>DOWN</strong> in strike if possible. However, the trade must satisfy one cardinal rule:
              </p>
              <div className="p-3 rounded bg-bg-canvas border border-border-subtle text-[11px] space-y-1.5">
                <div className="text-accent-favorable font-bold">
                  ✓ IF Net Credit ≥ +$0.20 Available:
                </div>
                <p className="text-text-secondary pl-3">
                  Execute the roll. Buy back existing put, sell next 35 DTE put. Total credit collected increases, which lowers our net cost basis further. Record <code>Rolls += 1</code>.
                </p>
                <div className="text-accent-risk font-bold pt-1">
                  ✗ IF Net Credit is NOT Available (Requires Paying a Debit) OR Rolls = 2:
                </div>
                <p className="text-text-secondary pl-3">
                  <strong>NEVER pay a debit to roll</strong>. If the stock has gapped deeply ITM (&gt;7% ITM) where extrinsic value has evaporated, rolling for a credit is mathematically impossible. <strong>Do NOT roll</strong>. Transition immediately to <strong>Flowchart Card #3</strong> (Planned Assignment or Loss).
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* ----------------------------------------------------------------------- */}
        {/* CARD 3: ASSIGNMENT OR TAKE THE LOSS CRITERIA FLOWCHART */}
        {/* ----------------------------------------------------------------------- */}
        <div className="bg-bg-card border border-border-subtle rounded-xl p-6 space-y-6 shadow-sm">
          <div className="flex items-center gap-3 border-b border-border-subtle pb-4">
            <div className="p-2 rounded-lg bg-bg-raised text-accent-risk">
              <Briefcase className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-text-primary">Flowchart Card #3: Assignment vs. Taking the Loss Triage Protocol</h3>
              <p className="text-xs text-text-muted">Decision tree for deep ITM positions (&gt;7% ITM) or expiration where rolling is unviable</p>
            </div>
          </div>

          <div className="space-y-4 font-mono text-xs">
            {/* Condition Header */}
            <div className="p-3.5 rounded-lg bg-bg-raised border border-border-subtle">
              <div className="flex items-center justify-between">
                <span className="font-bold text-text-primary">TRIGGER CONDITION: Deep ITM (&gt;7%) or 0 DTE Expiration Below Strike</span>
                <span className="text-accent-risk text-[11px] font-bold">Rolling Prohibited</span>
              </div>
              <p className="text-text-muted text-[11px] mt-1">
                When a stock drops deeply beneath the strike, option extrinsic value collapses to near zero. Paying a debit to roll is forbidden. The trader faces two disciplined choices:
              </p>
            </div>

            {/* Decision Fork: Wheel Assignment vs Stop-Out Loss */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Option 1: Planned Assignment & The Wheel */}
              <div className="p-5 rounded-lg bg-bg-raised border-2 border-accent-favorable/50 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-accent-favorable font-bold text-sm">
                    <Layers className="w-4 h-4" />
                    <span>OPTION A: Planned Assignment (The Wheel Pivot)</span>
                  </div>
                  <span className="px-2 py-0.5 rounded bg-accent-favorable/20 text-accent-favorable text-[10px] font-bold">
                    Primary Protocol (90%+)
                  </span>
                </div>

                <div className="text-[11px] text-text-secondary space-y-2 leading-relaxed">
                  <p>
                    <strong>Pre-Condition:</strong> You entered the CSP with the primary discipline of wanting to own this quality business at an institutional discount.
                  </p>
                  <div className="p-3 rounded bg-bg-canvas border border-border-subtle space-y-1.5">
                    <span className="font-bold text-text-primary uppercase text-[10px]">Mechanical Steps:</span>
                    <ol className="list-decimal pl-4 space-y-1 text-text-muted">
                      <li><strong>Take Physical Delivery:</strong> Accept assignment of 100 shares per contract at Strike $K.</li>
                      <li><strong>Zero Margin Borrow:</strong> Position is funded 100% with cash collateral already held in the account. Zero risk of margin call or liquidation.</li>
                      <li><strong>Calculate Net Cost Basis:</strong> <code>Basis = Strike - Total Cumulative Credits Collected</code>.</li>
                      <li><strong>Launch Covered Call Ladder:</strong> Immediately sell 30–45 DTE Out-of-the-Money Covered Calls at or above Net Basis (<code>Call Strike ≥ Basis</code>).</li>
                      <li><strong>Compound Premium:</strong> Collect monthly call dividends while waiting for mean-reversion. If shares are called away, realize full cycle profit!</li>
                    </ol>
                  </div>
                </div>
              </div>

              {/* Option 2: Taking the Loss */}
              <div className="p-5 rounded-lg bg-bg-raised border-2 border-accent-risk/50 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-accent-risk font-bold text-sm">
                    <XCircle className="w-4 h-4" />
                    <span>OPTION B: Taking the Loss (Buy Back to Close)</span>
                  </div>
                  <span className="px-2 py-0.5 rounded bg-accent-risk/20 text-accent-risk text-[10px] font-bold">
                    Exception Protocol (&lt;10%)
                  </span>
                </div>

                <div className="text-[11px] text-text-secondary space-y-2 leading-relaxed">
                  <p>
                    <strong>When should you take the loss instead of taking assignment?</strong>
                  </p>
                  <div className="p-3 rounded bg-bg-canvas border border-border-subtle space-y-2">
                    <span className="font-bold text-text-primary uppercase text-[10px]">Strict Exit Triggers:</span>
                    <ul className="list-disc pl-4 space-y-1 text-text-muted">
                      <li>
                        <strong>1. Fundamental Thesis Invalidation:</strong> Severe corporate deterioration (fraud, SEC investigation, loss of core competitive moat, catastrophic permanent impairment).
                      </li>
                      <li>
                        <strong>2. Structural Breakdown with Whale Volume:</strong> Stock breaks definitively below 2-year macro support shelf on massive institutional liquidation volume (no rebound thesis).
                      </li>
                      <li>
                        <strong>3. Collateral Re-Allocation (Opportunity Cost):</strong> Holding the stock to sell Covered Calls would lock up collateral that can generate significantly higher annualized returns in a fresh Tier 1 (Score ≥ 82) candidate.
                      </li>
                    </ul>
                    <div className="text-accent-risk font-bold pt-1 border-t border-border-subtle">
                      Action: Buy back put to close, accept defined loss, and preserve 100% of remaining capital.
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Summary Comparison Callout */}
            <div className="p-4 rounded-lg bg-bg-canvas border border-border-subtle flex flex-col md:flex-row md:items-center justify-between gap-3 text-xs">
              <div className="flex items-center gap-3">
                <HelpCircle className="w-5 h-5 text-accent-favorable shrink-0" />
                <span className="text-text-secondary">
                  <strong>Decision Rule of Thumb:</strong> If you still believe in the company’s 2-year horizon $\rightarrow$ <strong>Take Assignment & Sell Covered Calls</strong>. If the fundamental thesis is dead $\rightarrow$ <strong>Cut the loss cleanly and redeploy</strong>.
                </span>
              </div>
              <span className="px-3 py-1 rounded bg-bg-raised text-text-primary font-bold border border-border-strong shrink-0">
                100% Discretion-Free
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* SECTION 3: KIRSTEN'S 4 CORE OPERATIONAL PILLARS (PRESET REFERENCE) */}
      {/* ========================================================================= */}
      <div className="bg-bg-card border border-border-subtle rounded-xl p-6 space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-base font-bold text-text-primary">3. Execution Presets & Operational Thresholds</h2>
            <p className="text-xs text-text-muted">Select a preset to inspect default gating criteria</p>
          </div>
          <div className="flex bg-bg-raised p-1 rounded-lg border border-border-strong self-start font-mono text-xs">
            {(['conservative', 'core', 'aggressive'] as const).map((p) => (
              <button
                key={p}
                onClick={() => setActivePreset(p)}
                className={`px-4 py-1.5 uppercase tracking-wider rounded-md font-semibold transition-colors ${
                  activePreset === p
                    ? 'bg-accent-favorable text-bg-canvas'
                    : 'text-text-muted hover:text-text-primary'
                }`}
              >
                {p}
              </button>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 pt-2">
          <div className="p-4 rounded-lg bg-bg-canvas border border-border-subtle space-y-1">
            <span className="text-xs font-mono uppercase text-text-muted">Target Expiry (DTE)</span>
            <div className="text-xl font-bold font-mono text-text-primary">{current.targetDte} Days</div>
            <p className="text-xs text-text-muted">Peak theta acceleration zone</p>
          </div>

          <div className="p-4 rounded-lg bg-bg-canvas border border-border-subtle space-y-1">
            <span className="text-xs font-mono uppercase text-text-muted">Minimum Cushion Gate</span>
            <div className="text-xl font-bold font-mono text-accent-favorable">{current.cushionMin}%</div>
            <p className="text-xs text-text-muted">Distance from spot to strike</p>
          </div>

          <div className="p-4 rounded-lg bg-bg-canvas border border-border-subtle space-y-1">
            <span className="text-xs font-mono uppercase text-text-muted">Target Max Delta</span>
            <div className="text-xl font-bold font-mono text-text-primary">{current.deltaMax}</div>
            <p className="text-xs text-text-muted">Implied probability threshold</p>
          </div>

          <div className="p-4 rounded-lg bg-bg-canvas border border-border-subtle space-y-1">
            <span className="text-xs font-mono uppercase text-text-muted">Minimum Bid Credit</span>
            <div className="text-xl font-bold font-mono text-text-primary">${current.minCredit.toFixed(2)}</div>
            <p className="text-xs text-text-muted">Guarantees contract viability</p>
          </div>

          <div className="p-4 rounded-lg bg-bg-canvas border border-border-subtle space-y-1">
            <span className="text-xs font-mono uppercase text-text-muted">Target Return on Capital</span>
            <div className="text-xl font-bold font-mono text-accent-favorable">{current.minRocCycle}% / cycle</div>
            <p className="text-xs text-text-muted">&gt;{((current.minRocCycle * 365) / current.targetDte).toFixed(1)}% annualized rate</p>
          </div>

          <div className="p-4 rounded-lg bg-bg-canvas border border-border-subtle space-y-1">
            <span className="text-xs font-mono uppercase text-text-muted">Earnings Policy</span>
            <div className="text-sm font-semibold text-accent-caution">{current.blackoutStrictness}</div>
            <p className="text-xs text-text-muted">Blackout gating protection</p>
          </div>
        </div>
      </div>
    </div>
  );
}
