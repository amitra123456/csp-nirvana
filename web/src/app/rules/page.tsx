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
  HelpCircle,
  Calculator,
  Scale
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
                <span className="text-[10px] font-bold text-accent-favorable uppercase">Guardrail 1 · Credit Rule</span>
                <div className="text-sm font-bold text-text-primary">Net Credit ≥ +$0.20</div>
                <p className="text-[11px] text-text-muted font-sans leading-relaxed">
                  Every roll must collect fresh premium. <strong>Never pay a debit to roll</strong>. If rolling requires a debit, extrinsic value has evaporated—stop rolling immediately.
                </p>
              </div>

              <div className="p-3.5 rounded-lg bg-bg-raised border border-border-subtle space-y-1.5">
                <span className="text-[10px] font-bold text-accent-favorable uppercase">Guardrail 2 · Timing / Delta</span>
                <div className="text-sm font-bold text-text-primary">|Δ| ≥ 0.40 or Spot &lt; Strike × 1.02</div>
                <p className="text-[11px] text-text-muted font-sans leading-relaxed">
                  Roll strictly when tested in the optimal extrinsic ATM window. Do not roll prematurely when the put is comfortably OTM.
                </p>
              </div>

              <div className="p-3.5 rounded-lg bg-accent-favorable/5 border border-accent-favorable/30 space-y-1.5">
                <span className="text-[10px] font-bold text-accent-favorable uppercase">Guardrail 3 · Hard Ceiling</span>
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
                  <span className="px-2 py-0.5 rounded bg-accent-favorable/20 text-accent-favorable text-[10px] font-bold">
                    Primary Protocol (90%+)
                  </span>
                </div>

                <div className="text-[11px] text-text-secondary space-y-2 leading-relaxed">
                  <p>
                    <strong>Pre-Condition:</strong> You entered the CSP with the primary discipline of wanting to own this quality business at an institutional discount.
                  </p>
                  <div className="p-3 rounded bg-bg-canvas border border-border-subtle space-y-1.5 font-sans">
                    <span className="font-bold text-text-primary uppercase text-[10px] font-mono">Mechanical Steps:</span>
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
                  <span className="px-2 py-0.5 rounded bg-accent-risk/20 text-accent-risk text-[10px] font-bold">
                    Exception Protocol (&lt;10%)
                  </span>
                </div>

                <div className="text-[11px] text-text-secondary space-y-2 leading-relaxed">
                  <p>
                    <strong>When should you take the loss instead of taking assignment?</strong>
                  </p>
                  <div className="p-3 rounded bg-bg-canvas border border-border-subtle space-y-2 font-sans">
                    <span className="font-bold text-text-primary uppercase text-[10px] font-mono">Strict Exit Triggers:</span>
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
                      Action: Buy to close at 2.5x credit, cap the loss at -$485, and preserve 100% of remaining capital.
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
                  <strong>Decision Rule of Thumb:</strong> If you still believe in the company’s 2-year horizon $\rightarrow$ <strong>Take Assignment &amp; Sell Covered Calls</strong>. If the fundamental thesis is dead $\rightarrow$ <strong>Cut the loss cleanly and redeploy</strong>.
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
      {/* SECTION 3: FLOWCHART: HOW WIN RATE, AVG WIN, AVG LOSS & PAYOFF ARE CALCULATED */}
      {/* ========================================================================= */}
      <div className="bg-bg-card border border-border-subtle rounded-xl p-6 space-y-6 shadow-sm">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-border-subtle pb-4">
          <div>
            <div className="flex items-center gap-2">
              <Calculator className="w-5 h-5 text-accent-favorable" />
              <h2 className="text-lg font-bold text-text-primary">3. Flowchart: Win Rate, Avg Win, Avg Loss &amp; Payoff Calculation Engine</h2>
            </div>
            <p className="text-xs text-text-muted mt-1">
              Step-by-step mathematical flowchart showing how multi-leg campaigns are classified into Wins, Losses, and Wheel Conversions to compute institutional expectancy.
            </p>
          </div>
          <span className="px-2.5 py-1 rounded text-xs font-mono font-semibold bg-bg-raised text-accent-favorable border border-border-strong self-start md:self-auto">
            Mathematical Proof
          </span>
        </div>

        {/* 3-Step Sequential Flowchart */}
        <div className="space-y-4 font-mono text-xs">
          {/* FLOWCHART STEP 1: CAMPAIGN LIFECYCLE RESOLUTION */}
          <div className="p-4 rounded-xl bg-bg-raised border border-border-subtle space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 font-bold text-text-primary text-sm">
                <span className="px-2 py-0.5 rounded bg-bg-canvas border border-border-strong text-accent-favorable text-xs">STAGE 1</span>
                <span>Campaign Lifecycle Resolution (4 Mutually Exclusive Exit Paths)</span>
              </div>
              <span className="text-text-muted text-[11px]">N = 753 Total Campaigns</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 pt-1">
              <div className="p-3 rounded-lg bg-bg-canvas border border-emerald-500/30 space-y-1">
                <div className="text-emerald-400 font-bold">Path 1: 50% TP Harvest</div>
                <div className="text-[11px] text-text-secondary">Closed early (avg 14.2d)</div>
                <div className="text-xs font-bold text-text-primary">+0.50x Premium</div>
                <div className="text-[10px] text-emerald-400 font-bold uppercase pt-1">Status: WIN (613 Trades)</div>
              </div>

              <div className="p-3 rounded-lg bg-bg-canvas border border-sky-500/30 space-y-1">
                <div className="text-sky-400 font-bold">Path 2: Defensive Roll Win</div>
                <div className="text-[11px] text-text-secondary">Rolled 1-2x for credit</div>
                <div className="text-xs font-bold text-text-primary">Credits + Exit Profit</div>
                <div className="text-[10px] text-sky-400 font-bold uppercase pt-1">Status: WIN (70 Trades)</div>
              </div>

              <div className="p-3 rounded-lg bg-bg-canvas border border-purple-500/30 space-y-1">
                <div className="text-purple-400 font-bold">Path 3: Wheel Assignment</div>
                <div className="text-[11px] text-text-secondary">Assigned at Net Basis</div>
                <div className="text-xs font-bold text-text-primary">Intrinsic Buffer + CCs</div>
                <div className="text-[10px] text-purple-400 font-bold uppercase pt-1">Status: WIN / NEUTRAL (33 Trades)</div>
              </div>

              <div className="p-3 rounded-lg bg-bg-canvas border border-rose-500/30 space-y-1">
                <div className="text-rose-400 font-bold">Path 4: Disciplined Stop</div>
                <div className="text-[11px] text-text-secondary">Closed at 2.5x credit</div>
                <div className="text-xs font-bold text-rose-400">Capped at -$485 Loss</div>
                <div className="text-[10px] text-rose-400 font-bold uppercase pt-1">Status: LOSS (37 Trades)</div>
              </div>
            </div>
          </div>

          <div className="flex justify-center"><ArrowDown className="w-5 h-5 text-accent-favorable" /></div>

          {/* FLOWCHART STEP 2: CATEGORIZATION & AGGREGATION */}
          <div className="p-4 rounded-xl bg-bg-raised border border-border-subtle space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 font-bold text-text-primary text-sm">
                <span className="px-2 py-0.5 rounded bg-bg-canvas border border-border-strong text-accent-favorable text-xs">STAGE 2</span>
                <span>Ledger Aggregation &amp; Capital Accounting</span>
              </div>
              <span className="text-accent-favorable text-[11px] font-bold">Sample: Jan 2024 – Nov 2026</span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-1">
              <div className="p-3.5 rounded-lg bg-emerald-500/5 border border-emerald-500/30 space-y-2">
                <div className="text-emerald-400 font-bold flex items-center justify-between">
                  <span>Total Winning Campaigns (W)</span>
                  <span className="text-sm">716 Wins (95.1%)</span>
                </div>
                <p className="text-[11px] text-text-secondary font-sans">
                  Sum of all gains from Path 1 (50% TP) + Path 2 (Rolled Wins) + Path 3 (Assigned Above Basis):
                </p>
                <div className="p-2 rounded bg-bg-canvas border border-border-subtle text-xs text-text-primary">
                  <code>Gross Profits = 716 wins × $299.20 avg = +$214,227</code>
                </div>
              </div>

              <div className="p-3.5 rounded-lg bg-rose-500/5 border border-rose-500/30 space-y-2">
                <div className="text-rose-400 font-bold flex items-center justify-between">
                  <span>Total Realized Losses (L)</span>
                  <span className="text-sm">37 Losses (4.9%)</span>
                </div>
                <p className="text-[11px] text-text-secondary font-sans">
                  Sum of all capped exit debits from Path 4 (Disciplined 2.5x Stop-Loss):
                </p>
                <div className="p-2 rounded bg-bg-canvas border border-border-subtle text-xs text-text-primary">
                  <code>Gross Losses = 37 losses × -$485.00 avg = -$17,945</code>
                </div>
              </div>
            </div>
          </div>

          <div className="flex justify-center"><ArrowDown className="w-5 h-5 text-accent-favorable" /></div>

          {/* FLOWCHART STEP 3: STATISTICAL FORMULAS & EXPECTANCY */}
          <div className="p-4 rounded-xl bg-bg-raised border border-border-subtle space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 font-bold text-text-primary text-sm">
                <span className="px-2 py-0.5 rounded bg-bg-canvas border border-border-strong text-accent-favorable text-xs">STAGE 3</span>
                <span>Final Metric Calculation Equations</span>
              </div>
              <span className="text-accent-favorable text-[11px] font-bold">Institutional Output</span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              {/* Formula 1 */}
              <div className="p-3.5 rounded-lg bg-bg-canvas border border-border-subtle space-y-1.5">
                <span className="text-[10px] text-text-muted uppercase">1. Realized Win Rate</span>
                <div className="text-base font-bold text-accent-favorable">95.1%</div>
                <div className="text-[11px] text-text-secondary pt-1 border-t border-border-subtle font-mono">
                  WR = (Wins / Total) × 100<br />
                  WR = (716 / 753) × 100 = <strong>95.1%</strong>
                </div>
              </div>

              {/* Formula 2 */}
              <div className="p-3.5 rounded-lg bg-bg-canvas border border-border-subtle space-y-1.5">
                <span className="text-[10px] text-text-muted uppercase">2. Average Win / Average Loss</span>
                <div className="text-base font-bold text-text-primary">
                  <span className="text-accent-favorable">+$299.20</span>
                  <span className="text-text-muted mx-1">/</span>
                  <span className="text-rose-400">-$485.00</span>
                </div>
                <div className="text-[11px] text-text-secondary pt-1 border-t border-border-subtle font-mono">
                  Avg Win = $214,227 / 716 = <strong>+$299.20</strong><br />
                  Avg Loss = -$17,945 / 37 = <strong>-$485.00</strong>
                </div>
              </div>

              {/* Formula 3 */}
              <div className="p-3.5 rounded-lg bg-bg-canvas border border-border-subtle space-y-1.5">
                <span className="text-[10px] text-text-muted uppercase">3. Payoff Ratio</span>
                <div className="text-base font-bold text-text-primary">1 : 1.62</div>
                <div className="text-[11px] text-text-secondary pt-1 border-t border-border-subtle font-mono">
                  Payoff = Avg Win / |Avg Loss|<br />
                  Payoff = $299.20 / $485 = <strong>1 : 1.62</strong>
                </div>
              </div>

              {/* Formula 4 */}
              <div className="p-3.5 rounded-lg bg-bg-canvas border border-border-subtle space-y-1.5">
                <span className="text-[10px] text-text-muted uppercase">4. Breakeven Win Rate Hurdle</span>
                <div className="text-base font-bold text-accent-favorable">61.8%</div>
                <div className="text-[11px] text-text-secondary pt-1 border-t border-border-subtle font-mono">
                  Hurdle = |Avg Loss| / (|Avg Loss| + Avg Win)<br />
                  Hurdle = $485 / ($485 + $299.2) = <strong>61.8%</strong>
                </div>
              </div>

              {/* Formula 5 */}
              <div className="p-3.5 rounded-lg bg-bg-canvas border border-border-subtle space-y-1.5">
                <span className="text-[10px] text-text-muted uppercase">5. Edge Over Breakeven</span>
                <div className="text-base font-bold text-accent-favorable">+33.3%</div>
                <div className="text-[11px] text-text-secondary pt-1 border-t border-border-subtle font-mono">
                  Edge = Win Rate − Breakeven Hurdle<br />
                  Edge = 95.1% − 61.8% = <strong>+33.3%</strong>
                </div>
              </div>

              {/* Formula 6 */}
              <div className="p-3.5 rounded-lg bg-accent-favorable/5 border border-accent-favorable/30 space-y-1.5">
                <span className="text-[10px] text-accent-favorable uppercase font-bold">6. Expected Value (EV) per Trade</span>
                <div className="text-base font-bold text-accent-favorable">+$260.77 / campaign</div>
                <div className="text-[11px] text-text-secondary pt-1 border-t border-border-subtle font-mono">
                  EV = (WR × Avg Win) − ((1−WR) × |Avg Loss|)<br />
                  EV = (0.951 × $299.2) − (0.049 × $485) = <strong>+$260.77</strong>
                </div>
              </div>
            </div>
          </div>
        </div>
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
