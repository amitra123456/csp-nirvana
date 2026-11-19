'use client';

import React, { useEffect, useState } from 'react';
import type { Backtest } from '@/types/snapshot';
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
  HelpCircle,
  Calculator,
  Scale
} from 'lucide-react';

export default function RulesPage() {
  const [activePreset, setActivePreset] = useState<'conservative' | 'core' | 'aggressive'>('core');
  // The worked example below uses the simulator's own numbers from the latest snapshot (nothing hard-coded).
  const [bt, setBt] = useState<Backtest | null>(null);
  useEffect(() => {
    fetch('/api/snapshot')
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => setBt(d?.backtest ?? null))
      .catch(() => setBt(null));
  }, []);
  const money = (v: number) =>
    `${v < 0 ? '-' : '+'}$${Math.abs(v).toLocaleString('en-US', { maximumFractionDigits: 2, minimumFractionDigits: 2 })}`;
  const ex = bt && bt.trades > 0 ? (() => {
    const wins = Math.round((bt.trades * bt.win_rate) / 100);
    const losses = bt.trades - wins;
    const avgWin = bt.avg_win;
    const avgLoss = Math.abs(bt.avg_loss);
    const wr = bt.win_rate / 100;
    const breakeven = avgWin + avgLoss > 0 ? (avgLoss / (avgWin + avgLoss)) * 100 : 0;
    return {
      trades: bt.trades, wins, losses, avgWin, avgLoss,
      grossWin: wins * avgWin, grossLoss: losses * avgLoss,
      payoff: avgWin > 0 ? avgLoss / avgWin : 0,
      breakeven, edge: bt.win_rate - breakeven,
      ev: wr * avgWin - (1 - wr) * avgLoss,
      winRate: bt.win_rate,
    };
  })() : null;

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
          Complete mathematical criteria: 7-Factor Nirvana Composite Scoring Engine followed by the operational Assignment vs. Taking the Loss Triage Protocol.
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
              Signals page (Core preset) shows: <strong className="text-accent-favorable">Score ≥ 65</strong>
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
              Points added when the strike sits below the support level
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
              Volume spike = day volume ≥ 1.8× its 20-day average
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
            <span>Sizing tiers</span>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 divide-y md:divide-y-0 md:divide-x divide-border-subtle text-xs font-mono">
            <div className="p-4 space-y-1.5 bg-accent-favorable/5">
              <div className="flex items-center justify-between">
                <span className="font-bold text-accent-favorable">Tier 1: Score ≥ 82.0</span>
                <span className="px-2 py-0.5 rounded bg-accent-favorable/20 text-accent-favorable font-bold">2X Conviction</span>
              </div>
              <p className="text-text-muted text-[11px]">
                Features Golden Cross + Macro Support Shelf fortification + Whale Volume absorption. Allocated 2 contracts.
              </p>
            </div>
            <div className="p-4 space-y-1.5">
              <div className="flex items-center justify-between">
                <span className="font-bold text-text-primary">Tier 2: Score 65.0 – 81.9</span>
                <span className="px-2 py-0.5 rounded bg-bg-raised text-text-secondary font-bold border border-border-strong">1X Standard</span>
              </div>
              <p className="text-text-muted text-[11px]">
                Solid qualified candidate meeting all cushion and institutional dealing range criteria. Allocated 1 contract.
              </p>
            </div>
            <div className="p-4 space-y-1.5 bg-accent-risk/5">
              <div className="flex items-center justify-between">
                <span className="font-bold text-accent-risk">Tier 3: Score &lt; 65.0</span>
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
      {/* SECTION 2: OPERATIONAL EXECUTION: DEFENSIVE ROLLING & ASSIGNMENT VS. LOSS */}
      {/* ========================================================================= */}
      <div className="space-y-6">
        <div>
          <h2 className="text-lg font-bold text-text-primary">2. Operational Execution: Defensive Rolling &amp; Assignment vs. Loss Protocol</h2>
          <p className="text-xs text-text-muted mt-1">
            Systematic decision architecture governing multi-cycle defense: when to roll, the strict 2-roll hard ceiling, and the final assignment vs. stop-loss triage.
          </p>
        </div>

        {/* ----------------------------------------------------------------------- */}
        {/* CARD A: DEFENSIVE ROLLING RULES & THE 2-ROLL HARD CAP */}
        {/* ----------------------------------------------------------------------- */}
        <div className="bg-bg-card border border-border-subtle rounded-xl p-6 space-y-6 shadow-sm">
          <div className="flex items-center gap-3 border-b border-border-subtle pb-4">
            <div className="p-2 rounded-lg bg-bg-raised text-accent-favorable">
              <RefreshCw className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-text-primary">Defensive Rolling Rules &amp; The Strict 2-Roll Cap</h3>
              <p className="text-xs text-text-muted">Why we never roll indefinitely, and how 2 defensive rolls protect capital velocity</p>
            </div>
          </div>

          <div className="space-y-4 font-mono text-xs">
            {/* The 3 Hard Guardrails */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="p-3.5 rounded-lg bg-bg-raised border border-border-subtle space-y-1.5">
                <span className="text-[11px] font-bold text-accent-favorable uppercase">Guardrail 1 · Credit Rule</span>
                <div className="text-sm font-bold text-text-primary">Net Credit ≥ +$0.20</div>
                <p className="text-[11px] text-text-muted font-sans leading-relaxed">
                  Every roll must collect fresh premium. <strong>Never pay a debit to roll</strong>. If rolling requires a debit, extrinsic value has evaporated—stop rolling immediately.
                </p>
              </div>

              <div className="p-3.5 rounded-lg bg-bg-raised border border-border-subtle space-y-1.5">
                <span className="text-[11px] font-bold text-accent-favorable uppercase">Guardrail 2 · Timing / Delta</span>
                <div className="text-sm font-bold text-text-primary">|Δ| ≥ 0.40 or Spot &lt; Strike × 1.02</div>
                <p className="text-[11px] text-text-muted font-sans leading-relaxed">
                  Roll strictly when tested in the optimal extrinsic ATM window. Do not roll prematurely when the put is comfortably OTM.
                </p>
              </div>

              <div className="p-3.5 rounded-lg bg-accent-favorable/5 border border-accent-favorable/30 space-y-1.5">
                <span className="text-[11px] font-bold text-accent-favorable uppercase">Guardrail 3 · Hard Ceiling</span>
                <div className="text-sm font-bold text-emerald-400">Strict Cap: Max 2 Rolls (3 Cycles)</div>
                <p className="text-[11px] text-text-muted font-sans leading-relaxed">
                  Total campaign age capped at <strong>~90–105 calendar days</strong>. If still tested after Roll #2, you are forbidden from rolling a 3rd time.
                </p>
              </div>
            </div>

            {/* Why Indefinite Rolling Fails Callout */}
            <div className="p-4 rounded-lg bg-bg-canvas border border-border-strong space-y-2">
              <div className="text-xs font-bold text-accent-caution uppercase flex items-center gap-2">
                <AlertTriangle className="w-4 h-4" />
                Why You Should NOT Roll Indefinitely ("As Long as Rolling Works")
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-[11px] text-text-secondary font-sans leading-relaxed">
                <div>
                  <strong className="text-text-primary block font-mono">1. Extrinsic Collapse:</strong>
                  Deep ITM options become pure intrinsic value. Rolling out 6–9 months to find $0.20 credit destroys annualized ROC.
                </div>
                <div>
                  <strong className="text-text-primary block font-mono">2. ROC Opportunity Cost:</strong>
                  Locking collateral for 6+ months defending one loser forfeits 4 fresh Tier-1 candidates generating 24%+ annualized returns.
                </div>
                <div>
                  <strong className="text-text-primary block font-mono">3. Secular Breakdown:</strong>
                  A quality stock that fails to stabilize after 70–90 days is in a secular bear trend, not an intermediate pullback.
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* ----------------------------------------------------------------------- */}
        {/* CARD B: ASSIGNMENT OR TAKE THE LOSS CRITERIA PROTOCOL */}
        {/* ----------------------------------------------------------------------- */}
        <div className="bg-bg-card border border-border-subtle rounded-xl p-6 space-y-6 shadow-sm">
          <div className="flex items-center gap-3 border-b border-border-subtle pb-4">
            <div className="p-2 rounded-lg bg-bg-raised text-accent-risk">
              <Briefcase className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-text-primary">Assignment vs. Taking the Loss Triage Protocol</h3>
              <p className="text-xs text-text-muted">Decision tree for deep ITM positions (&gt;7% ITM) or expiration when Roll #2 has completed</p>
            </div>
          </div>

          <div className="space-y-4 font-mono text-xs">
            {/* Condition Header */}
            <div className="p-3.5 rounded-lg bg-bg-raised border border-border-subtle">
              <div className="flex items-center justify-between">
                <span className="font-bold text-text-primary">TRIGGER CONDITION: Deep ITM (&gt;7%), Expiration, or Roll #2 Completed</span>
                <span className="text-accent-risk text-[11px] font-bold">Rolling Prohibited</span>
              </div>
              <p className="text-text-muted text-[11px] mt-1 font-sans">
                When Roll #2 expires below strike or stock drops deeply ITM, paying a debit to roll is forbidden. The trader executes one of two disciplined choices:
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
                  <span className="px-2 py-0.5 rounded bg-accent-favorable/20 text-accent-favorable text-[11px] font-bold">
                    Primary Protocol (90%+)
                  </span>
                </div>

                <div className="text-[11px] text-text-secondary space-y-2 leading-relaxed">
                  <p>
                    <strong>Pre-Condition:</strong> You entered the CSP with the primary discipline of wanting to own this quality business at an institutional discount.
                  </p>
                  <div className="p-3 rounded bg-bg-canvas border border-border-subtle space-y-1.5 font-sans">
                    <span className="font-bold text-text-primary uppercase text-[11px] font-mono">Mechanical Steps:</span>
                    <ol className="list-decimal pl-4 space-y-1 text-text-muted">
                      <li><strong>Take Physical Delivery:</strong> Accept assignment of 100 shares per contract at Strike $K.</li>
                      <li><strong>Zero Margin Borrow:</strong> Position is funded 100% with cash collateral already held in the account. Zero risk of liquidation.</li>
                      <li><strong>Calculate Net Cost Basis:</strong> <code>Basis = Strike - Total Cumulative Credits Collected</code>.</li>
                      <li><strong>Launch Covered Call Ladder:</strong> Immediately sell 30–45 DTE OTM Covered Calls at or above Net Basis (<code>Call Strike ≥ Basis</code>).</li>
                      <li><strong>Compound Premium:</strong> Collect monthly call dividends while waiting for mean-reversion.</li>
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
                  <span className="px-2 py-0.5 rounded bg-accent-risk/20 text-accent-risk text-[11px] font-bold">
                    Exception Protocol (&lt;10%)
                  </span>
                </div>

                <div className="text-[11px] text-text-secondary space-y-2 leading-relaxed">
                  <p>
                    <strong>When should you take the loss instead of taking assignment?</strong>
                  </p>
                  <div className="p-3 rounded bg-bg-canvas border border-border-subtle space-y-2 font-sans">
                    <span className="font-bold text-text-primary uppercase text-[11px] font-mono">Strict Exit Triggers:</span>
                    <ul className="list-disc pl-4 space-y-1 text-text-muted">
                      <li>
                        <strong>1. Fundamental Thesis Invalidation:</strong> Severe corporate deterioration (fraud, SEC investigation, loss of moat, permanent impairment).
                      </li>
                      <li>
                        <strong>2. Structural Breakdown with Whale Volume:</strong> Stock breaks definitively below 2-year macro support shelf on massive institutional liquidation volume.
                      </li>
                      <li>
                        <strong>3. Collateral Re-Allocation:</strong> Reclaiming capital to deploy into a fresh Tier 1 (Score ≥ 82) candidate yielding 24%+ annualized.
                      </li>
                    </ul>
                    <div className="text-accent-risk font-bold pt-1 border-t border-border-subtle font-mono">
                      Action: Buy to close at the market. There is no fixed loss cap: the loss is the buy-back price minus all credits collected.
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Summary Comparison Callout */}
            <div className="p-4 rounded-lg bg-bg-canvas border border-border-subtle flex flex-col md:flex-row md:items-center justify-between gap-3 text-xs">
              <div className="flex items-center gap-3">
                <HelpCircle className="w-5 h-5 text-accent-favorable shrink-0" />
                <span className="text-text-secondary font-sans">
                  <strong>Decision Rule of Thumb:</strong> If you still believe in the company’s 2-year horizon → <strong>Take Assignment &amp; Sell Covered Calls</strong>. If the fundamental thesis is dead → <strong>Cut the loss cleanly and redeploy</strong>.
                </span>
              </div>
              <span className="px-3 py-1 rounded bg-bg-raised text-text-primary font-bold border border-border-strong shrink-0">
                Judgement call
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* SECTION 3: WORKED EXAMPLE - HOW WIN RATE, AVG WIN/LOSS & BREAK-EVEN ARE CALCULATED */}
      {/* ========================================================================= */}
      <div className="bg-bg-card border border-border-subtle rounded-xl p-6 space-y-6 shadow-sm">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-border-subtle pb-4">
          <div>
            <div className="flex items-center gap-2">
              <Calculator className="w-5 h-5 text-text-muted" />
              <h2 className="text-lg font-bold text-text-primary">How Win Rate, Average Win/Loss &amp; Break-even Are Calculated</h2>
            </div>
            <p className="text-xs text-text-muted mt-1">
              Worked example using the simulator&apos;s latest results. Rolls extend a trade; a trade is a loss only if it is assigned below its net cost basis.
            </p>
          </div>
          <span className="px-2.5 py-1 rounded text-xs font-mono font-semibold bg-accent-caution/10 text-accent-caution border border-accent-caution/30 self-start md:self-auto">
            Simulated · model prices
          </span>
        </div>

        {!ex ? (
          <div className="p-4 rounded-lg bg-bg-raised border border-border-subtle text-xs text-text-muted font-mono">
            Backtest figures are not available in the current snapshot.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 font-mono text-xs">
            <div className="p-3.5 rounded-lg bg-bg-canvas border border-border-subtle space-y-1.5">
              <span className="text-[11px] text-text-muted uppercase">1. Win rate</span>
              <div className="text-base font-bold text-text-primary">{ex.winRate.toFixed(1)}%</div>
              <div className="text-[11px] text-text-secondary pt-1 border-t border-border-subtle">
                Wins ÷ Trades = {ex.wins.toLocaleString()} ÷ {ex.trades.toLocaleString()}
              </div>
            </div>

            <div className="p-3.5 rounded-lg bg-bg-canvas border border-border-subtle space-y-1.5">
              <span className="text-[11px] text-text-muted uppercase">2. Average win / average loss</span>
              <div className="text-base font-bold">
                <span className="text-accent-favorable">{money(ex.avgWin)}</span>
                <span className="text-text-muted mx-1">/</span>
                <span className="text-rose-400">{money(-ex.avgLoss)}</span>
              </div>
              <div className="text-[11px] text-text-secondary pt-1 border-t border-border-subtle">
                {ex.wins.toLocaleString()} wins total {money(ex.grossWin)}; {ex.losses.toLocaleString()} losses total {money(-ex.grossLoss)}
              </div>
            </div>

            <div className="p-3.5 rounded-lg bg-bg-canvas border border-border-subtle space-y-1.5">
              <span className="text-[11px] text-text-muted uppercase">3. Loss size vs win size</span>
              <div className="text-base font-bold text-text-primary">{ex.payoff.toFixed(1)}×</div>
              <div className="text-[11px] text-text-secondary pt-1 border-t border-border-subtle">
                |Avg loss| ÷ Avg win: one average loss erases about {Math.round(ex.payoff)} average wins
              </div>
            </div>

            <div className="p-3.5 rounded-lg bg-bg-canvas border border-border-subtle space-y-1.5">
              <span className="text-[11px] text-text-muted uppercase">4. Break-even win rate</span>
              <div className="text-base font-bold text-text-primary">{ex.breakeven.toFixed(1)}%</div>
              <div className="text-[11px] text-text-secondary pt-1 border-t border-border-subtle">
                |Avg loss| ÷ (|Avg loss| + Avg win): the win rate needed just to break even
              </div>
            </div>

            <div className="p-3.5 rounded-lg bg-bg-canvas border border-border-subtle space-y-1.5">
              <span className="text-[11px] text-text-muted uppercase">5. Win rate minus break-even</span>
              <div className={`text-base font-bold ${ex.edge >= 0 ? 'text-accent-favorable' : 'text-rose-400'}`}>
                {ex.edge >= 0 ? '+' : ''}{ex.edge.toFixed(1)} pts
              </div>
              <div className="text-[11px] text-text-secondary pt-1 border-t border-border-subtle">
                {ex.winRate.toFixed(1)}% − {ex.breakeven.toFixed(1)}%. A small margin means a few extra losses remove the profit.
              </div>
            </div>

            <div className="p-3.5 rounded-lg bg-bg-canvas border border-border-subtle space-y-1.5">
              <span className="text-[11px] text-text-muted uppercase">6. Expected P&amp;L per trade</span>
              <div className={`text-base font-bold ${ex.ev >= 0 ? 'text-accent-favorable' : 'text-rose-400'}`}>{money(ex.ev)}</div>
              <div className="text-[11px] text-text-secondary pt-1 border-t border-border-subtle">
                Win rate × Avg win − (1 − Win rate) × |Avg loss|
              </div>
            </div>
          </div>
        )}
      </div>

      {/* ========================================================================= */}
      {/* SECTION 4: KIRSTEN'S 4 CORE OPERATIONAL PILLARS (PRESET REFERENCE) */}
      {/* ========================================================================= */}
      <div className="bg-bg-card border border-border-subtle rounded-xl p-6 space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-base font-bold text-text-primary">4. Execution Presets &amp; Operational Thresholds</h2>
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
