'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { Snapshot, Setup, Position } from '@/types/snapshot';
import { formatCurrency, formatPercent } from '@/lib/data';
import { AlertTriangle, ChevronRight, Zap, Shield, ArrowRight, RefreshCw } from 'lucide-react';

export default function PhoneBriefPage() {
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
      <div className="min-h-screen bg-bg-canvas text-text-primary p-4 flex items-center justify-center">
        <div className="text-text-muted text-sm font-mono flex items-center gap-2">
          <RefreshCw className="w-4 h-4 animate-spin text-accent-favorable" /> Loading phone brief...
        </div>
      </div>
    );
  }

  const setups = snapshot?.setups || [];
  const top3Setups = [...setups].sort((a, b) => b.score - a.score).slice(0, 3);
  const urgentPositions = (snapshot?.positions || []).filter(
    (p) => p.status === 'itm' || p.dte <= 7 || p.next_step === 'decide'
  );
  const itmCount = (snapshot?.positions || []).filter((p) => p.status === 'itm').length;

  return (
    <div className="min-h-screen bg-bg-canvas text-text-primary max-w-md mx-auto p-4 space-y-5 pb-20">
      {/* Top Bar */}
      <div className="flex items-center justify-between border-b border-border-subtle pb-3">
        <div className="flex items-center gap-2">
          <div className="w-2.5 h-2.5 rounded-full bg-accent-favorable animate-pulse" />
          <span className="font-bold tracking-tight text-sm">CSP NIRVANA</span>
        </div>
        <div className="text-xs font-mono text-text-muted">
          {snapshot?.run.as_of_et ? new Date(snapshot.run.as_of_et).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }) : '—'} ET
        </div>
      </div>

      {/* 3 Quick KPI Pills */}
      <div className="grid grid-cols-3 gap-2">
        <div className="bg-bg-card border border-border-subtle rounded-lg p-2.5 text-center">
          <div className="text-xs text-text-muted font-mono uppercase">Setups</div>
          <div className="text-lg font-bold font-mono text-accent-favorable">{setups.length}</div>
        </div>
        <div className="bg-bg-card border border-border-subtle rounded-lg p-2.5 text-center">
          <div className="text-xs text-text-muted font-mono uppercase">Win Rate</div>
          <div className="text-lg font-bold font-mono text-text-primary">{formatPercent(snapshot?.backtest.win_rate ?? 0)}</div>
        </div>
        <div className="bg-bg-card border border-border-subtle rounded-lg p-2.5 text-center">
          <div className="text-xs text-text-muted font-mono uppercase">ITM Alert</div>
          <div className={`text-lg font-bold font-mono ${itmCount > 0 ? 'text-accent-risk' : 'text-accent-favorable'}`}>
            {itmCount}
          </div>
        </div>
      </div>

      {/* Urgent: Decide This Week */}
      {urgentPositions.length > 0 && (
        <div className="bg-bg-card border border-accent-risk/40 rounded-xl p-4 space-y-3">
          <div className="flex items-center justify-between text-xs font-bold uppercase tracking-wider text-accent-risk">
            <span className="flex items-center gap-1.5">
              <AlertTriangle className="w-4 h-4" /> Action Required ({urgentPositions.length})
            </span>
            <Link href="/positions" className="text-[11px] underline">Manage All</Link>
          </div>
          <div className="space-y-2">
            {urgentPositions.map((pos) => (
              <div key={`${pos.ticker}-${pos.strike}`} className="flex items-center justify-between p-2 rounded bg-bg-raised text-xs">
                <div>
                  <span className="font-bold font-mono">{pos.ticker} ${pos.strike}P</span>
                  <div className="text-[10px] text-text-muted">Exp: {pos.expiry} · {pos.dte}d</div>
                </div>
                <div className="text-right">
                  <span className={`font-mono font-bold ${pos.pnl >= 0 ? 'text-accent-favorable' : 'text-accent-risk'}`}>
                    {formatCurrency(pos.pnl)}
                  </span>
                  <div className="text-[10px] font-mono text-accent-caution uppercase">{pos.next_step.replace('_', ' ')}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Top 3 Setups */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-xs font-mono uppercase tracking-wider text-text-muted font-semibold">
            Top 3 Pullback Setups
          </span>
          <span className="text-xs font-mono text-text-muted">Ranked by Score</span>
        </div>

        <div className="space-y-2.5">
          {top3Setups.map((s, idx) => (
            <Link
              key={s.ticker}
              href={`/ticket/${s.ticker}`}
              className="block bg-bg-card border border-border-subtle hover:border-accent-favorable/50 rounded-xl p-3.5 transition-colors"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="w-5 h-5 rounded-full bg-bg-raised text-[10px] font-mono flex items-center justify-center text-text-muted border border-border-subtle">
                    {idx + 1}
                  </span>
                  <div>
                    <span className="font-bold text-base font-mono">{s.ticker}</span>
                    <span className="text-xs text-text-muted ml-1.5">{s.name.slice(0, 12)}</span>
                  </div>
                </div>
                <div className="text-right">
                  <span className="text-base font-bold font-mono text-accent-favorable">{s.score.toFixed(1)}</span>
                  <span className="text-[10px] text-text-muted font-mono block">SCORE</span>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-2 mt-3 pt-3 border-t border-border-subtle text-xs font-mono">
                <div>
                  <span className="text-[10px] text-text-muted block">PUT STRIKE</span>
                  <span>${s.strike}</span>
                </div>
                <div>
                  <span className="text-[10px] text-text-muted block">CUSHION</span>
                  <span className="text-accent-favorable">+{s.cushion_pct.toFixed(1)}%</span>
                </div>
                <div>
                  <span className="text-[10px] text-text-muted block">ROC / CYCLE</span>
                  <span className="text-accent-favorable">{s.roc_cycle_pct.toFixed(1)}%</span>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </div>

      {/* Two Bottom Action Buttons */}
      <div className="grid grid-cols-2 gap-3 pt-2">
        <Link
          href="/"
          className="flex items-center justify-center gap-1.5 py-3 rounded-lg bg-bg-raised border border-border-strong text-xs font-mono font-semibold hover:bg-bg-hover text-text-primary text-center"
        >
          View All {setups.length} Setups
        </Link>
        <Link
          href="/positions"
          className="flex items-center justify-center gap-1.5 py-3 rounded-lg bg-accent-favorable text-bg-canvas text-xs font-mono font-bold hover:bg-accent-favorable/90 text-center"
        >
          Positions ({snapshot?.positions.length ?? 0})
        </Link>
      </div>
    </div>
  );
}
