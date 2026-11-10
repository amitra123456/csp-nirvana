#!/usr/bin/env python3
"""
CSP-Nirvana: Institutional Cash-Secured Put Screener & Analytics CLI
===================================================================
Anchors short put strikes behind SMC dealing ranges, Anchored VWAP,
and institutional support floors with 100% cash-secured discipline.
"""

import sys
import argparse
from pathlib import Path

if hasattr(sys.stdout, "reconfigure"):
    sys.stdout.reconfigure(encoding="utf-8")

PROJECT_ROOT = Path(__file__).resolve().parent
if str(PROJECT_ROOT) not in sys.path:
    sys.path.insert(0, str(PROJECT_ROOT))

from config.settings import DEFAULT_UNIVERSE, DEFAULTS, BANNER_CREED
from core.options_scanner import run_screener

def main():
    parser = argparse.ArgumentParser(
        description="CSP-Nirvana // Institutional Cash-Secured Put Screener"
    )
    parser.add_argument("--tickers", type=str, default="", help="Comma separated tickers (e.g. HOOD,NVDA,PLTR)")
    parser.add_argument("--dte", type=int, default=DEFAULTS["target_dte"], help=f"Target DTE (default {DEFAULTS['target_dte']})")
    parser.add_argument("--cushion", type=float, default=DEFAULTS["cushion_pct"], help=f"Cushion below spot %% (default {DEFAULTS['cushion_pct']}%%)")
    parser.add_argument("--min-premium", type=float, default=DEFAULTS["min_premium"], help=f"Min bid premium (default ${DEFAULTS['min_premium']})")
    parser.add_argument("--min-roc", type=float, default=DEFAULTS["min_roc_pct"], help=f"Min ROC %% (default {DEFAULTS['min_roc_pct']}%%)")
    parser.add_argument("--red-only", action="store_true", help="Only show pullbacks / red days")
    parser.add_argument("--no-bear-cushion", action="store_true", help="Disable the mandatory >=12%% cushion shield on bear regimes")
    args = parser.parse_args()

    symbols = [s.strip().upper() for s in args.tickers.split(",")] if args.tickers else DEFAULT_UNIVERSE

    print(BANNER_CREED)
    print(f"Scanning {len(symbols)} high-conviction assets (Target DTE: {args.dte}, Cushion: {args.cushion}%)...")

    results, _ = run_screener(
        tickers=symbols,
        target_dte=args.dte,
        cushion_pct=args.cushion,
        min_premium=args.min_premium,
        min_roc_pct=args.min_roc,
        red_only=args.red_only,
        enforce_bear_cushion=not args.no_bear_cushion
    )

    if not results:
        print("\nNo candidates passed the strict filters with current parameters.")
        return

    print("\n" + "=" * 155)
    print(f"{'TICKER':<7} {'SPOT':<8} {'DAY %':<7} {'REGIME':<16} {'STRIKE':<8} {'CUSHION':<9} {'EXPIRY':<12} {'BID':<7} {'BASIS':<8} {'ROC %':<7} {'ANN %':<7} {'PoS(SMC)':<9} {'PoS(50TP)':<10} {'MOVE(1s)':<9} {'DP INDEX':<10} {'SMC OTE'}")
    print("=" * 155)
    for r in results:
        ote_tag = "YES (OTE)" if r['ote_in_range'] else "Below 50%"
        pa = r.get('prob_amp', {})
        dp = r.get('dark_pool', {})
        pos_smc = f"{pa.get('empirical_pos_otm', 0.0):.1f}%" if pa else "-"
        pos_50 = f"{pa.get('prob_50_tp', 0.0):.1f}%" if pa else "-"
        move_1s = f"+/-{pa.get('implied_move_pct', 0.0):.1f}%" if pa else "-"
        dp_str = f"{dp.get('dark_pool_ratio_pct', 0.0):.1f}% {'[BUY]' if dp.get('is_accumulating', False) else ''}" if dp else "-"
        reg_badge = r.get('regime_badge', 'Neutral')
        print(f"{r['ticker']:<7} ${r['spot']:<7.2f} {r['day_change_pct']:>+5.2f}% {reg_badge:<16} ${r['strike']:<7.2f} {r['cushion_pct']:>5.1f}% OTM {r['expiry']:<12} ${r['bid']:<6.2f} ${r['cost_basis']:<7.2f} {r['roc_cycle_pct']:>5.2f}% {r['annualized_roc_pct']:>5.1f}% {pos_smc:>9} {pos_50:>10} {move_1s:>9} {dp_str:<10}  {ote_tag}")
    print("=" * 155 + "\n")

if __name__ == '__main__':
    main()
