"""
Options Chain Scanner & Candidate Evaluation Engine
===================================================
Scans options chains ~35 DTE, matches strikes to cushion & SMC levels,
and validates return on collateral (ROC) and probability of success.
"""

from __future__ import annotations
import math
from datetime import datetime
from typing import Dict, Any, List, Tuple
import pandas as pd
import yfinance as yf

try:
    from core.smc_engine import fetch_ohlcv, compute_smc_structure
    from core.dark_pool_engine import compute_dark_pool_telemetry
    from core.probability_amplitude import compute_probability_and_amplitude
    from config.settings import DEFAULTS
except (ImportError, ModuleNotFoundError):
    from csp_nirvana.core.smc_engine import fetch_ohlcv, compute_smc_structure
    from csp_nirvana.core.dark_pool_engine import compute_dark_pool_telemetry
    from csp_nirvana.core.probability_amplitude import compute_probability_and_amplitude
    from csp_nirvana.config.settings import DEFAULTS

def scan_single_ticker(
    ticker: str,
    target_dte: int = DEFAULTS["target_dte"],
    dte_min: int = DEFAULTS["dte_min"],
    dte_max: int = DEFAULTS["dte_max"],
    cushion_pct: float = DEFAULTS["cushion_pct"],
    min_premium: float = DEFAULTS["min_premium"],
    min_roc_pct: float = DEFAULTS["min_roc_pct"],
    df_ohlcv: pd.DataFrame = None,
    smc: Dict[str, Any] = None
) -> List[Dict[str, Any]]:
    """Scans option chains for a single ticker."""
    try:
        t = yf.Ticker(ticker)
        expirations = t.options
        if not expirations:
            return []

        today = datetime.now().date()
        valid_expiries = []
        for exp_str in expirations:
            exp_date = datetime.strptime(exp_str, "%Y-%m-%d").date()
            dte = (exp_date - today).days
            if dte_min <= dte <= dte_max:
                valid_expiries.append((abs(dte - target_dte), dte, exp_str))

        if not valid_expiries:
            all_exp = []
            for exp_str in expirations:
                dte = (datetime.strptime(exp_str, "%Y-%m-%d").date() - today).days
                if dte >= 20:
                    all_exp.append((abs(dte - target_dte), dte, exp_str))
            if all_exp:
                all_exp.sort()
                valid_expiries = [all_exp[0]]
            else:
                return []

        valid_expiries.sort()
        chosen_expiry = valid_expiries[0][2]
        chosen_dte = valid_expiries[0][1]

        opt_chain = t.option_chain(chosen_expiry)
        puts = opt_chain.puts
        if puts.empty:
            return []

        spot = smc['current_price']
        strike_ceiling = spot * (1.0 - (cushion_pct / 100.0))

        candidates = []
        eligible_puts = puts[puts['strike'] <= spot].sort_values(by='strike', ascending=False)

        for _, row in eligible_puts.iterrows():
            strike = float(row['strike'])
            bid = float(row['bid']) if not math.isnan(row['bid']) and row['bid'] > 0 else float(row['lastPrice'])
            ask = float(row['ask']) if not math.isnan(row['ask']) and row['ask'] > 0 else bid
            volume = int(row['volume']) if not math.isnan(row['volume']) else 0
            open_interest = int(row['openInterest']) if not math.isnan(row['openInterest']) else 0
            iv = float(row['impliedVolatility']) if 'impliedVolatility' in row and not math.isnan(row['impliedVolatility']) else 0.0

            if bid < min_premium:
                continue

            collateral = strike * 100.0
            midpoint = round((bid + ask) / 2.0, 2) if (ask > 0 and ask >= bid) else bid
            credit = bid * 100.0
            cost_basis = strike - bid
            cushion = ((spot - strike) / spot) * 100.0
            roc_cycle = (bid / strike) * 100.0
            annualized_roc = roc_cycle * (365.0 / max(1, chosen_dte))

            if roc_cycle < min_roc_pct:
                continue

            ote_in_range = smc['ote_786'] <= cost_basis <= smc['ote_618']

            candidates.append({
                'ticker': ticker,
                'spot': spot,
                'day_change_pct': smc['day_pct_change'],
                'expiry': chosen_expiry,
                'dte': chosen_dte,
                'strike': strike,
                'bid': bid,
                'ask': ask,
                'midpoint': midpoint,
                'iv': iv,
                'collateral': collateral,
                'credit': credit,
                'cost_basis': cost_basis,
                'cushion_pct': cushion,
                'roc_cycle_pct': roc_cycle,
                'annualized_roc_pct': annualized_roc,
                'tp_50_price': bid * 0.50,
                'tp_60_price': bid * 0.40,
                'volume': volume,
                'open_interest': open_interest,
                'sma50': smc['sma50'],
                'avwap': smc['anchored_vwap'],
                'ote_618': smc['ote_618'],
                'ote_705': smc['ote_705'],
                'ote_786': smc['ote_786'],
                'ote_in_range': ote_in_range,
                'is_primary_pick': strike <= strike_ceiling
            })

        return candidates
    except Exception:
        return []

def run_screener(
    tickers: List[str],
    target_dte: int = DEFAULTS["target_dte"],
    cushion_pct: float = DEFAULTS["cushion_pct"],
    min_premium: float = DEFAULTS["min_premium"],
    min_roc_pct: float = DEFAULTS["min_roc_pct"],
    red_only: bool = False
) -> Tuple[List[Dict[str, Any]], Dict[str, pd.DataFrame]]:
    """Runs the complete institutional screener across the watchlist."""
    results = []
    ohlcv_cache = {}

    for sym in tickers:
        sym = sym.strip().upper()
        if not sym:
            continue
        try:
            df = fetch_ohlcv(sym)
            if df is None:
                continue
            ohlcv_cache[sym] = df

            smc = compute_smc_structure(df)
            if red_only and not smc['is_red_day']:
                continue

            cands = scan_single_ticker(
                ticker=sym,
                target_dte=target_dte,
                cushion_pct=cushion_pct,
                min_premium=min_premium,
                min_roc_pct=min_roc_pct,
                df_ohlcv=df,
                smc=smc
            )

            if cands:
                primary = [c for c in cands if c['is_primary_pick']]
                best = primary[0] if primary else cands[0]
                best['all_ladder_strikes'] = cands[:8]

                # Compute Dark Pool & Microstructure Telemetry safely
                dp_telemetry = compute_dark_pool_telemetry(sym, df)
                best['dark_pool'] = dp_telemetry

                # Compute Probability of Success and Move Amplitude with Dark Pool boost
                prob_amp = compute_probability_and_amplitude(
                    spot=best['spot'],
                    strike=best['strike'],
                    bid=best['bid'],
                    dte=best['dte'],
                    iv=best['iv'],
                    df=df,
                    smc=smc,
                    dp=dp_telemetry
                )
                best['prob_amp'] = prob_amp
                results.append(best)
        except Exception:
            continue

    results.sort(key=lambda x: x['roc_cycle_pct'], reverse=True)
    return results, ohlcv_cache
