"""
Centralized Pure Derivation Engine for CSP-Nirvana
===================================================
One source of truth for all mathematical derivations.
Computes:
- Setup metrics: cushion, ROC, credit, collateral, cost basis, market odds, levels, plan, score.
- Position metrics: mark, PnL, status (itm/near/otm), next_step.
No other module or UI layer computes these metrics.
"""

from __future__ import annotations
import math
from typing import Dict, Any, Optional, List
import numpy as np
import pandas as pd
from core.snapshot_models import SetupModel, PositionModel, Levels, TradePlan, HeldPositionSummary, WatchoutItem

try:
    from config.settings import get_company_name
except Exception:
    def get_company_name(ticker: str) -> str:
        return ticker

def compute_bs_put_delta(spot: float, strike: float, dte: int, iv: float, r: float = 0.045) -> float:
    """Computes analytical Black-Scholes Put Delta."""
    if spot <= 0 or strike <= 0 or iv <= 0:
        return -0.20
    t = max(1, dte) / 365.0
    sigma = max(0.01, iv)
    d1 = (math.log(spot / strike) + (r + 0.5 * sigma * sigma) * t) / (sigma * math.sqrt(t))
    cdf_d1 = 0.5 * (1.0 + math.erf(d1 / math.sqrt(2.0)))
    put_delta = cdf_d1 - 1.0
    return round(min(-0.01, max(-0.99, put_delta)), 3)

def derive_levels(bars: pd.DataFrame) -> Dict[str, Optional[float]]:
    """Computes technical indicator levels strictly from completed daily bars."""
    if bars is None or len(bars) < 20:
        return {
            "sma50": None, "sma200": None, "avwap": None,
            "vwap20": None, "ote_618": None, "ote_786": None
        }

    close = bars['Close']
    sma50 = round(float(close.rolling(50).mean().iloc[-1]), 2) if len(bars) >= 50 else None
    sma200 = round(float(close.rolling(200).mean().iloc[-1]), 2) if len(bars) >= 200 else None

    # 20-day VWAP
    recent_20 = bars.iloc[-20:]
    vol_20 = recent_20['Volume'].sum()
    if vol_20 > 0 and 'High' in recent_20 and 'Low' in recent_20:
        typical_20 = (recent_20['High'] + recent_20['Low'] + recent_20['Close']) / 3.0
        vwap20 = round(float(np.average(typical_20, weights=recent_20['Volume'])), 2)
    else:
        vwap20 = round(float(recent_20['Close'].mean()), 2)

    # 60-day Dealing Range & Anchored VWAP from Swing Low
    recent_60 = bars.iloc[-60:] if len(bars) >= 60 else bars
    swing_high = float(recent_60['High'].max())
    swing_low = float(recent_60['Low'].min())
    swing_range = max(0.01, swing_high - swing_low)
    ote_618 = round(swing_high - 0.618 * swing_range, 2)
    ote_786 = round(swing_high - 0.786 * swing_range, 2)

    low_idx = recent_60['Low'].idxmin()
    bars_from_low = bars.loc[low_idx:]
    if len(bars_from_low) > 0 and 'Volume' in bars_from_low:
        vol_sum = bars_from_low['Volume'].sum()
        if vol_sum > 0:
            typ = (bars_from_low['High'] + bars_from_low['Low'] + bars_from_low['Close']) / 3.0
            avwap = round(float(np.average(typ, weights=bars_from_low['Volume'])), 2)
        else:
            avwap = round(float(bars_from_low['Close'].mean()), 2)
    else:
        avwap = round(float(bars['Close'].iloc[-1]), 2)

    return {
        "sma50": sma50,
        "sma200": sma200,
        "avwap": avwap,
        "vwap20": vwap20,
        "ote_618": ote_618,
        "ote_786": ote_786
    }

def derive_trend(spot: float, bars: pd.DataFrame, levels: Dict[str, Optional[float]]) -> str:
    """Classifies price trend into one of: downtrend, pullback, test_200, range, breakout."""
    sma50 = levels.get("sma50")
    sma200 = levels.get("sma200")

    if bars is not None and len(bars) >= 20:
        high_20 = float(bars['High'].iloc[-20:].max())
        if spot >= high_20 * 0.99:
            return "breakout"

    if sma200 and abs(spot - sma200) / sma200 <= 0.02:
        return "test_200"

    if sma50 and sma200:
        if spot < sma50 and sma50 < sma200:
            return "downtrend"
        if spot < sma50 and spot >= sma200:
            return "pullback"
        if spot >= sma50 and spot > sma200:
            return "pullback"

    return "range"

def derive_setup(
    quote: Dict[str, Any],
    chain_row: Dict[str, Any],
    bars: pd.DataFrame,
    fundamentals: Dict[str, Any],
    news: Dict[str, Any],
    rules: Dict[str, Any],
    held_position: Optional[Dict[str, Any]] = None
) -> SetupModel:
    """
    Pure derivation function that takes raw inputs and produces a verified SetupModel.
    Nothing else in the codebase computes these numbers.
    """
    ticker = str(quote['ticker']).upper()
    name = str(quote.get('name', '')).strip()
    if not name or name.upper() == ticker:
        name = get_company_name(ticker)
    spot = float(quote['price'])
    spot_ts = str(quote.get('timestamp', quote.get('spot_ts', '')))
    
    strike = float(chain_row['strike'])
    expiry = str(chain_row['expiry'])
    dte = int(chain_row['dte'])
    bid = float(chain_row['bid'])
    ask = float(chain_row.get('ask', bid))
    mid = round((bid + ask) / 2.0, 2)
    iv = float(chain_row.get('iv', 0.40))
    raw_delta = chain_row.get('delta')
    if raw_delta is not None:
        delta = float(raw_delta)
    else:
        delta = compute_bs_put_delta(spot, strike, dte, iv)
    open_interest = int(chain_row.get('open_interest', 0))

    # Core Mathematical Formulas
    cushion_pct = round(((spot - strike) / spot) * 100.0, 1)
    credit = round(bid * 100.0, 2)
    collateral = round(strike * 100.0, 2)
    cost_basis = round(strike - bid, 2)
    roc_cycle_pct = round((bid / strike) * 100.0, 2)
    roc_annual_pct = round(roc_cycle_pct * (365.0 / max(1, dte)), 1)

    # Market & Model Implied Probabilities
    odds_otm_market_pct = round(min(99.9, max(0.1, (1.0 - abs(delta)) * 100.0)), 1)
    odds_touch_market_pct = round(min(99.9, max(0.1, 2.0 * abs(delta) * 100.0)), 1)
    odds_model_pct = round(float(news.get('odds_model_pct', odds_otm_market_pct)), 1)

    # 1-Sigma Expected Move Floor
    t_ann = max(0.001, dte / 365.0)
    one_sigma_low = round(spot * math.exp(-iv * math.sqrt(t_ann)), 2)

    # Technical Levels & Trend
    levels_dict = derive_levels(bars)
    trend_val = derive_trend(spot, bars, levels_dict)

    # Plan: 50% TP, 60% TP, Roll Trigger, 30% Stress Drop
    tp50 = round(bid * 0.50, 2)
    tp60 = round(bid * 0.40, 2)
    roll_trigger_price = round(strike * 1.02, 2)
    stress_spot = spot * 0.70
    if stress_spot < cost_basis:
        stress_loss = round(((stress_spot - cost_basis) * 100.0), 0)
    else:
        stress_loss = 0.0

    plan_model = TradePlan(
        tp50=tp50,
        tp60=tp60,
        roll_trigger_price=roll_trigger_price,
        stress_drop_pct=30.0,
        stress_loss=stress_loss
    )

    # Watchouts
    watchouts: List[WatchoutItem] = []
    if strike > one_sigma_low:
        watchouts.append(WatchoutItem(
            severity="medium",
            title="Strike Above 1σ Low",
            detail=f"Put strike ${strike:.2f} is higher than the 1-standard-deviation move floor (${one_sigma_low:.2f})."
        ))
    if news.get('is_in_blackout'):
        watchouts.append(WatchoutItem(
            severity="high",
            title="Earnings Blackout",
            detail=f"Option spans earnings report on {news.get('earnings_date', 'upcoming')}."
        ))

    # Score breakdown (7 parts: cushion, valuation, levels, news_flow, candles, probability, yield)
    score_parts = news.get('score_parts', {
        "cushion": [min(20.0, round(cushion_pct * 1.4, 1)), 20.0],
        "valuation": [min(20.0, round(float(fundamentals.get('fcf_yield_pct', 5.0)) * 2.5, 1)), 20.0],
        "levels": [18.0, 20.0],
        "news_flow": [14.0, 15.0],
        "candles": [float(news.get('candle_score', 8.0)), 10.0],
        "probability": [min(8.0, round(odds_otm_market_pct * 0.08, 1)), 8.0],
        "yield": [min(7.0, round(roc_cycle_pct * 2.0, 1)), 7.0]
    })
    total_score = round(sum(p[0] for p in score_parts.values()), 1)

    held_pos_summary = None
    if held_position:
        h_strike = float(held_position['strike'])
        held_pos_summary = HeldPositionSummary(
            strike=h_strike,
            expiry=str(held_position['expiry']),
            itm=bool(spot < h_strike)
        )

    return SetupModel(
        ticker=ticker,
        name=name,
        spot=round(spot, 2),
        spot_ts=spot_ts,
        expiry=expiry,
        dte=dte,
        strike=strike,
        bid=bid,
        ask=ask,
        mid=mid,
        iv=round(iv, 3),
        delta=round(delta, 3),
        open_interest=open_interest,
        cushion_pct=cushion_pct,
        credit=credit,
        collateral=collateral,
        roc_cycle_pct=roc_cycle_pct,
        roc_annual_pct=roc_annual_pct,
        cost_basis=cost_basis,
        odds_otm_market_pct=odds_otm_market_pct,
        odds_touch_market_pct=odds_touch_market_pct,
        odds_model_pct=odds_model_pct,
        one_sigma_low=one_sigma_low,
        levels=Levels(**levels_dict),
        score=total_score,
        score_parts=score_parts,
        trend=trend_val,
        held_position=held_pos_summary,
        watchouts=watchouts,
        plan=plan_model
    )

def derive_position(
    ledger_row: Dict[str, Any],
    quote: Dict[str, Any],
    option_quote: Dict[str, Any]
) -> PositionModel:
    """
    Pure derivation function for real open positions in the portfolio ledger.
    """
    ticker = str(ledger_row['ticker']).upper()
    strike = float(ledger_row['strike'])
    expiry = str(ledger_row['expiry'])
    contracts = int(ledger_row.get('contracts', 1))
    rolls = int(ledger_row.get('rolls', 0))
    rolls_max = int(ledger_row.get('rolls_max', 2))
    open_credit = float(ledger_row['open_credit'])
    
    spot = float(quote['price'])
    mark_bid = float(option_quote['bid'])
    mark_ask = float(option_quote.get('ask', mark_bid))
    mark_mid = round((mark_bid + mark_ask) / 2.0, 2)
    mark_source = str(option_quote.get('source', 'alpaca:indicative'))

    # Remaining DTE
    dte = int(ledger_row.get('dte', 30))

    # Spot vs. Strike
    spot_vs_strike_pct = round(((spot - strike) / strike) * 100.0, 1)

    # Realized + Unrealized PnL: (open_credit - mark_mid) * 100 * contracts
    pnl = round((open_credit - mark_mid) * 100.0 * contracts, 2)

    # Status: itm, near, otm
    if spot < strike:
        status_val = "itm"
    elif spot <= strike * 1.03:
        status_val = "near"
    else:
        status_val = "otm"

    # Next step: decide, hold, plan_assignment
    if status_val == "itm":
        if rolls >= rolls_max:
            next_step_val = "plan_assignment"
        else:
            next_step_val = "decide"
    else:
        next_step_val = "hold"

    return PositionModel(
        ticker=ticker,
        strike=strike,
        expiry=expiry,
        dte=dte,
        contracts=contracts,
        rolls=rolls,
        rolls_max=rolls_max,
        open_credit=open_credit,
        mark_bid=mark_bid,
        mark_ask=mark_ask,
        mark_mid=mark_mid,
        mark_source=mark_source,
        spot=round(spot, 2),
        spot_vs_strike_pct=spot_vs_strike_pct,
        pnl=pnl,
        status=status_val,
        next_step=next_step_val
    )
