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
from core.snapshot_models import SetupModel, PositionModel, Levels, TradePlan, HeldPositionSummary, WatchoutItem, LadderStrike

try:
    from config.settings import get_company_name
except Exception:
    def get_company_name(ticker: str) -> str:
        return ticker

def derive_strike_ladder(
    spot: float,
    dte: int,
    recommended_strike: float,
    chain_puts: List[Dict[str, Any]],
    recommended_delta: Optional[float] = None,
    n_safer: int = 2,
) -> List[LadderStrike]:
    """
    Recommended strike plus the next `n_safer` lower strikes from the same expiry.
    Prices use the bid/ask midpoint. Probability of expiring out of the money is the
    market-implied 1 - |delta| (delta from the quoted IV when the chain has no delta).
    Breakeven = strike - mid. Strikes with no bid are kept and show zero premium.
    """
    rows = sorted({float(c['strike']): c for c in (chain_puts or [])}.values(),
                  key=lambda c: float(c['strike']), reverse=True)
    idx = next((i for i, c in enumerate(rows) if abs(float(c['strike']) - recommended_strike) < 1e-6), None)
    if idx is None:
        return []
    ladder: List[LadderStrike] = []
    for j, c in enumerate(rows[idx: idx + 1 + n_safer]):
        strike = float(c['strike'])
        bid = max(0.0, float(c.get('bid') or 0.0))
        ask = max(bid, float(c.get('ask') or 0.0))
        mid = round((bid + ask) / 2.0, 2)
        iv = float(c.get('iv') or 0.0)
        if j == 0 and recommended_delta is not None:
            delta = float(recommended_delta)
        else:
            delta = compute_bs_put_delta(spot, strike, dte, iv) if iv > 0 else None
        roi = (mid / strike) * 100.0 if strike > 0 else 0.0
        ladder.append(LadderStrike(
            strike=strike,
            role="recommended" if j == 0 else "safer",
            bid=round(bid, 2),
            ask=round(ask, 2),
            mid=mid,
            cushion_pct=round(((spot - strike) / spot) * 100.0, 1) if spot > 0 else 0.0,
            roi_cycle_pct=round(roi, 2),
            roi_annual_pct=round(roi * (365.0 / max(1, dte)), 1),
            pos_pct=round((1.0 - abs(delta)) * 100.0, 1) if delta is not None else 0.0,
            breakeven=round(strike - mid, 2),
            open_interest=int(c.get('open_interest') or 0),
            iv=round(iv, 3),
        ))
    return ladder


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

def derive_levels(bars: pd.DataFrame) -> Dict[str, Any]:
    """Computes technical indicator levels strictly from completed daily bars."""
    if bars is None or len(bars) < 20:
        return {
            "sma50": None, "sma200": None, "avwap": None,
            "vwap20": None, "ote_618": None, "ote_786": None,
            "swing_low_252": None, "macro_support": None, "macro_vpoc": None,
            "is_near_macro_support": False
        }

    close = bars['Close']
    spot = float(close.iloc[-1])
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

    # Macro 252-day (52-Week) and 500-day (2-Year) Structural Levels
    n_bars = len(bars)
    bars_252 = bars.iloc[-252:] if n_bars >= 252 else bars
    swing_low_252 = round(float(bars_252['Low'].min()), 2) if 'Low' in bars_252 else None

    # Macro 252-day AVWAP (Macro Volume POC Shelf)
    if 'Volume' in bars_252 and bars_252['Volume'].sum() > 0:
        typ_252 = (bars_252['High'] + bars_252['Low'] + bars_252['Close']) / 3.0
        macro_vpoc = round(float(np.average(typ_252, weights=bars_252['Volume'])), 2)
    else:
        macro_vpoc = sma200

    # Macro Historical Pivot Supports below spot (local minima across entire series)
    macro_support = swing_low_252
    if 'Low' in bars and n_bars >= 40:
        lows = bars['Low'].values
        pivots = []
        w = 12
        for i in range(w, n_bars - w):
            if lows[i] == min(lows[i-w:i+w+1]) and lows[i] < spot * 0.99:
                pivots.append(lows[i])
        if pivots:
            macro_support = round(float(max(pivots)), 2)

    is_near_macro_support = bool(macro_support and abs(spot - macro_support) / spot <= 0.035)

    return {
        "sma50": sma50,
        "sma200": sma200,
        "avwap": avwap,
        "vwap20": vwap20,
        "ote_618": ote_618,
        "ote_786": ote_786,
        "swing_low_252": swing_low_252,
        "macro_support": macro_support,
        "macro_vpoc": macro_vpoc,
        "is_near_macro_support": is_near_macro_support
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

    # 2X Conviction & Structural Indicators (#5 Golden Cross + #6 Whale Volume + Macro Shelf)
    vol_mult = 1.0
    if bars is not None and len(bars) >= 20 and 'Volume' in bars:
        vol_20 = float(bars['Volume'].iloc[-20:].mean())
        if vol_20 > 0:
            vol_mult = float(bars['Volume'].iloc[-1] / vol_20)

    is_up_day = bool(bars is not None and len(bars) >= 2 and float(bars['Close'].iloc[-1]) >= float(bars['Close'].iloc[-2]))
    sma50 = levels_dict.get('sma50')
    sma200 = levels_dict.get('sma200')
    is_golden_cross = bool(sma50 and sma200 and sma50 > sma200 and spot > sma200)
    is_near_macro = bool(levels_dict.get('is_near_macro_support'))
    macro_shelf = levels_dict.get('macro_support') or levels_dict.get('swing_low_252')
    is_under_macro = bool(macro_shelf and strike <= macro_shelf)

    # 1. Cushion Subscore (Max 20 pts) - Beta-Adaptive Normalized
    beta = float(fundamentals.get('beta', 1.0)) if fundamentals and fundamentals.get('beta') else 1.0
    beta = max(0.5, min(2.5, beta))
    target_cushion = 12.0 * math.sqrt(beta)
    cushion_subscore = min(20.0, max(2.0, round((cushion_pct / target_cushion) * 16.0, 1)))

    if beta >= 1.30 and not (is_under_macro or is_near_macro):
        watchouts.append(WatchoutItem(
            severity="medium",
            title="High-Beta Mid-Air Suspension",
            detail=f"Beta is elevated ({beta:.2f}) and put strike ${strike:.2f} is not fortified by a 1-2Y Macro Support Shelf. Applied -4 pt structural deduction."
        ))

    # 2. Valuation Subscore (Max 20 pts)
    val_subscore = min(20.0, max(2.0, round(float(fundamentals.get('fcf_yield_pct', 4.0)) * 2.5, 1)))

    # 3. Technical Levels Subscore (Max 20 pts) - Macro S/R & Trend Integration
    levels_base = 12.0
    if is_golden_cross:
        levels_base += 4.0  # +4 pts for Golden Cross secular bull market
    elif sma200 and spot > sma200:
        levels_base += 2.0  # +2 pts for trading above 200-day SMA
    elif sma200 and spot < sma200:
        levels_base -= 4.0  # -4 pts penalty for falling secular bear market

    if is_under_macro:
        levels_base += 3.0  # +3 pts: strike safely fortified under 1-2Y Macro Shelf
    elif is_near_macro:
        levels_base += 2.0  # +2 pts: stock testing major macro accumulation shelf

    # High-Beta Mid-Air Structural Deduction:
    # High-beta assets (beta >= 1.30) suspended in mid-air without 1-2Y macro support fortification
    # suffer severe factor leakage during broader tech market selloffs.
    if beta >= 1.30 and not (is_under_macro or is_near_macro):
        levels_base -= 4.0  # -4 pts penalty: High-Beta Mid-Air Suspension

    levels_subscore = min(20.0, max(2.0, round(levels_base, 1)))

    # 4. News Flow & Sentiment (Max 15 pts)
    news_flow_subscore = 14.0

    # 5. Candlestick Confirmation (Max 10 pts) - Whale Volume Integration
    candle_base = float(news.get('candle_score', 7.0))
    if is_up_day and vol_mult >= 1.8:
        candle_base += 3.0  # +3 pts: Whale Volume confirmation on up day (98.6% win rate conviction)
    elif is_up_day and vol_mult >= 1.4:
        candle_base += 1.5  # +1.5 pts: Above-average accumulation volume
    candle_subscore = min(10.0, max(1.0, round(candle_base, 1)))

    # 6. Statistical Probability Subscore (Max 8 pts)
    prob_subscore = min(8.0, max(1.0, round(odds_otm_market_pct * 0.08, 1)))

    # 7. Cycle Yield Subscore (Max 7 pts)
    yield_subscore = min(7.0, max(1.0, round(roc_cycle_pct * 2.0, 1)))

    # Score breakdown (7 parts: cushion, valuation, levels, news_flow, candles, probability, yield)
    score_parts = news.get('score_parts', {
        "cushion": [cushion_subscore, 20.0],
        "valuation": [val_subscore, 20.0],
        "levels": [levels_subscore, 20.0],
        "news_flow": [news_flow_subscore, 15.0],
        "candles": [candle_subscore, 10.0],
        "probability": [prob_subscore, 8.0],
        "yield": [yield_subscore, 7.0]
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

    sizing_tier = "1x"
    sizing_reason = "Standard 1X Allocation (1 Contract)"
    recommended_contracts = 1

    if is_up_day and vol_mult >= 1.8:
        sizing_tier = "2x"
        sizing_reason = f"Whale Volume Conviction ({vol_mult:.1f}x Volume) · 98.6% Win Rate"
        recommended_contracts = 2
    elif is_golden_cross and vol_mult >= 1.4:
        sizing_tier = "2x"
        sizing_reason = f"Golden Cross Alignment ({vol_mult:.1f}x Volume) · 4.27 Profit Factor"
        recommended_contracts = 2
    elif is_near_macro and vol_mult >= 1.3:
        sizing_tier = "2x"
        sizing_reason = f"Testing 1-2Y Macro Support Shelf · Institutional Floor"
        recommended_contracts = 2

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
        sizing_tier=sizing_tier,
        sizing_reason=sizing_reason,
        recommended_contracts=recommended_contracts,
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
