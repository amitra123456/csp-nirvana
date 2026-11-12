'use client';

import React, { useState } from 'react';
import { Shield, Target, Calendar, AlertOctagon, Zap, Filter, Flame } from 'lucide-react';

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
    <div className="space-y-8 py-2">
      {/* Title */}
        <div className="border-b border-border-subtle pb-6">
          <h1 className="text-2xl font-bold tracking-tight text-text-primary">Strategy Rules & Risk Engine</h1>
          <p className="mt-1 text-sm text-text-muted">
            Mechanical multi-factor rules governing Cash Secured Put candidate screening, risk gating, and systematic lifecycle management.
          </p>
        </div>

        {/* Preset Selector */}
        <div className="bg-bg-card border border-border-subtle rounded-xl p-6 space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h2 className="text-base font-bold text-text-primary">Execution Presets</h2>
              <p className="text-xs text-text-muted">Select a preset to inspect filtering thresholds and gating criteria</p>
            </div>
            <div className="flex bg-bg-raised p-1 rounded-lg border border-border-strong self-start">
              {(['conservative', 'core', 'aggressive'] as const).map((p) => (
                <button
                  key={p}
                  onClick={() => setActivePreset(p)}
                  className={`px-4 py-1.5 text-xs font-mono uppercase tracking-wider rounded-md font-semibold transition-colors ${
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

        {/* 4 Core Pillars of the Pipeline */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Pillar 1: Red Day Pullback */}
          <div className="bg-bg-card border border-border-subtle rounded-xl p-6 space-y-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-bg-raised text-accent-favorable">
                <Flame className="w-5 h-5" />
              </div>
              <h3 className="text-base font-bold text-text-primary">1. Red Day Pullback Trigger (Stage 1)</h3>
            </div>
            <p className="text-sm text-text-secondary leading-relaxed">
              We never sell puts on green breakout days when implied volatility is compressed. Candidate tickers must undergo a constructive pullback into institutional support:
            </p>
            <ul className="text-xs font-mono space-y-2 text-text-muted border-l-2 border-border-strong pl-3">
              <li>• Daily close &lt; open or daily return &lt; -0.75%</li>
              <li>• Candlestick verification: hammer wicks, doji reversal candles, or absorption volume at prior support</li>
              <li>• Spot within optimal trade entry (OTE 61.8% - 78.6% Fibonacci retracement)</li>
            </ul>
          </div>

          {/* Pillar 2: Validation Gates */}
          <div className="bg-bg-card border border-border-subtle rounded-xl p-6 space-y-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-bg-raised text-accent-caution">
                <Filter className="w-5 h-5" />
              </div>
              <h3 className="text-base font-bold text-text-primary">2. The 7 Strict Validation Gates</h3>
            </div>
            <p className="text-sm text-text-secondary leading-relaxed">
              Any candidate failing any gate is rejected and recorded under <em>Held Back</em> with an explicit reason:
            </p>
            <ul className="text-xs font-mono space-y-2 text-text-muted border-l-2 border-border-strong pl-3">
              <li>• Freshness: Underlying quote age &le; 15 minutes</li>
              <li>• Liquidity: Bid &gt; $0, Ask &ge; Bid, Spread &le; 25% of mid, Open Interest &ge; 100</li>
              <li>• Cushion: 12% &le; Cushion &le; 30% (prevents deep lottery tickets)</li>
              <li>• Implied Volatility: 5% &le; IV &le; 300%</li>
              <li>• Anomaly Check: Spot move &gt; 25% verified for corporate splits</li>
            </ul>
          </div>

          {/* Pillar 3: Earnings Blackout */}
          <div className="bg-bg-card border border-border-subtle rounded-xl p-6 space-y-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-bg-raised text-accent-risk">
                <AlertOctagon className="w-5 h-5" />
              </div>
              <h3 className="text-base font-bold text-text-primary">3. Earnings Blackout Protocol</h3>
            </div>
            <p className="text-sm text-text-secondary leading-relaxed">
              Earnings surprises create binary tail risks that invalidate technical support levels:
            </p>
            <ul className="text-xs font-mono space-y-2 text-text-muted border-l-2 border-border-strong pl-3">
              <li>• <strong>Hard Lockout:</strong> Never sell options expiring within 1 week of an earnings announcement</li>
              <li>• <strong>UI Blackout Window:</strong> Signals generated within 2 weeks prior to earnings or 1 week post are flagged with a prominent cautionary blackout tag</li>
            </ul>
          </div>

          {/* Pillar 4: Lifecycle Management */}
          <div className="bg-bg-card border border-border-subtle rounded-xl p-6 space-y-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-bg-raised text-accent-favorable">
                <Target className="w-5 h-5" />
              </div>
              <h3 className="text-base font-bold text-text-primary">4. Systematic Position Lifecycle</h3>
            </div>
            <p className="text-sm text-text-secondary leading-relaxed">
              Discretion is replaced with mathematical exit triggers:
            </p>
            <ul className="text-xs font-mono space-y-2 text-text-muted border-l-2 border-border-strong pl-3">
              <li>• <strong>TP 50:</strong> Close candidate when 50% of original credit is captured (freeing collateral)</li>
              <li>• <strong>Roll Trigger:</strong> If spot drops within 2% of strike, initiate roll down and out for net credit</li>
              <li>• <strong>Roll Limit:</strong> Maximum 2 rolls per position; if exceeded, take physical delivery and write Covered Calls</li>
            </ul>
          </div>
        </div>
    </div>
  );
}
