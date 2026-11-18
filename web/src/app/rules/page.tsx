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
      {/* SECTION 2: OPERATIONAL EXECUTION: ASSIGNMENT VS. LOSS TRIAGE PROTOCOL */}
      {/* ========================================================================= */}
      <div className="space-y-6">
        <div>
          <h2 className="text-lg font-bold text-text-primary">2. Operational Execution: Assignment vs. Taking the Loss Protocol</h2>
          <p className="text-xs text-text-muted mt-1">
            Systematic decision tree for deep in-the-money positions (&gt;7% ITM) or expiration: Planned Wheel Assignment vs. Disciplined Stop Loss.
          </p>
        </div>

        {/* ----------------------------------------------------------------------- */}
        {/* ASSIGNMENT OR TAKE THE LOSS CRITERIA PROTOCOL */}
        {/* ----------------------------------------------------------------------- */}
        <div className="bg-bg-card border border-border-subtle rounded-xl p-6 space-y-6 shadow-sm">
          <div className="flex items-center gap-3 border-b border-border-subtle pb-4">
            <div className="p-2 rounded-lg bg-bg-raised text-accent-risk">
              <Briefcase className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-text-primary">Assignment vs. Taking the Loss Triage Protocol</h3>
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
