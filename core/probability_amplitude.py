"""
Probability of Success (PoS) and Move Amplitude Model
======================================================
Calculates:
1. Black-Scholes Baseline PoS (1 - |Delta|)
2. Structural SMC PoS (accounting for institutional demand floors)
3. Probability of Early 50% Take-Profit (PoS 50% TP)
4. Market-Implied 1-Sigma Expected Move and Volatility Floor
5. Upside Mean-Reversion Target Amplitude (to 20 EMA, 50 SMA, and Equilibrium)
6. Expected Velocity (Days to 50% Profit Target)
"""

from __future__ import annotations
import math
from typing import Dict, Any
import numpy as np
import pandas as pd
from scipy.stats import norm

def calculate_parkinson_volatility(df: pd.DataFrame, window: int = 20) -> float:
    """Computes Parkinson extreme-value volatility based on High/Low prices."""
    if len(df) < window:
        return 0.30
    recent = df.iloc[-window:]
    hl = np.log(recent['High'] / recent['Low'])
    pv = np.sqrt((1.0 / (4.0 * math.log(2) * window)) * np.sum(hl ** 2)) * math.sqrt(252)
    return float(pv)

def compute_probability_and_amplitude(
    spot: float,
    strike: float,
    bid: float,
    dte: int,
    iv: float,
    df: pd.DataFrame,
    smc: Dict[str, Any],
    dp: Dict[str, Any] = None,
    regime: Dict[str, Any] = None,
    lens1: Dict[str, Any] = None,
    lens2: Dict[str, Any] = None,
    sentiment: Dict[str, Any] = None,
    r: float = 0.045
) -> Dict[str, Any]:
    """
    Computes analytical & empirical PoS, dark pool alignment, projected move amplitude,
    and integrates Valuation (Lens 1) and Multi-Horizon News Sentiment into the core model.
    """
    T = max(1, dte) / 365.0
    sigma = iv if iv > 0.10 else calculate_parkinson_volatility(df)

    # 1. Theoretical Black-Scholes d1, d2
    d1 = (math.log(spot / strike) + (r + 0.5 * sigma ** 2) * T) / (sigma * math.sqrt(T))
    d2 = d1 - sigma * math.sqrt(T)

    bs_delta = -norm.cdf(-d1)
    bs_pos_otm = norm.cdf(d2) * 100.0  # P(S_T > K)
    prob_of_touch = min(99.0, 2.0 * abs(bs_delta) * 100.0)

    # 2. Structural & SMC Adjustment Factors
    cost_basis = strike - bid
    structural_boost = 0.0
    if strike <= smc['sma50']:
        structural_boost += 3.0
    if strike <= smc['anchored_vwap']:
        structural_boost += 3.5
    if smc['ote_786'] <= cost_basis <= smc['ote_618'] or cost_basis < smc['ote_786']:
        structural_boost += 4.5

    # Dark Pool Telemetry Boost
    if dp:
        if dp.get('is_accumulating', False):
            structural_boost += 3.5
        if strike <= dp.get('dark_pool_shelf_price', spot):
            structural_boost += 2.5

    # Regime Alignment Boost
    if regime:
        rid = regime.get('regime_id', 2)
        if rid == 2:  # Bull Retracement (Ideal CSP)
            structural_boost += 2.5
        elif rid == 3:  # Dead Chop / Rangebound (High Theta)
            structural_boost += 2.0
        elif rid == 4:  # Springboard at 200 MA
            structural_boost += 1.5
        elif rid == 5:  # Secular Bear / Breakdown
            structural_boost -= 3.0

    # Volume spike check (capitulation wash)
    if len(df) >= 20:
        vol_ratio = df['Volume'].iloc[-1] / df['Volume'].iloc[-20:].mean()
        if vol_ratio >= 2.0:
            structural_boost += 4.0
        elif vol_ratio >= 1.5:
            structural_boost += 2.0

    # 3. Valuation (Lens 1) & Intrinsic Margin of Safety Boost
    valuation_boost = 0.0
    if lens1:
        fcf_yield = lens1.get('fcf_yield_pct', 0.0)
        upside = lens1.get('analyst_upside_pct', 0.0)
        dcf_hurdle = lens1.get('reverse_dcf_growth_pct')

        if fcf_yield >= 3.0:
            valuation_boost += 2.5
        elif fcf_yield >= 1.5:
            valuation_boost += 1.5
        elif fcf_yield < 0:
            valuation_boost -= 2.5

        if upside >= 25.0:
            valuation_boost += 1.5
        elif upside < -10.0:
            valuation_boost -= 1.5

        if dcf_hurdle is not None and dcf_hurdle > 45.0:
            valuation_boost -= 1.5

    # 4. Institutional Microstructure Shield (Lens 2) Confluence
    microstructure_boost = 0.0
    if lens2:
        if lens2.get('below_avwap') and lens2.get('below_dp'):
            microstructure_boost += 3.5  # Dual Whale Shield
        elif lens2.get('below_avwap') or lens2.get('below_dp'):
            microstructure_boost += 1.5
        else:
            microstructure_boost -= 2.0  # Inside range / unshielded

    # 5. Multi-Horizon News Sentiment & Whale Divergence Boost
    sentiment_boost = 0.0
    if sentiment:
        s5 = sentiment.get('score_5d', 0.0)
        div_badge = sentiment.get('divergence_badge', '')

        if "Whale Absorption" in div_badge:
            sentiment_boost += 4.0  # Golden Setup: selling peak IV into whale accumulation
        elif "FOMO Trap" in div_badge:
            sentiment_boost -= 3.0  # High risk of cycle exhaustion
        elif "Liquidation" in div_badge:
            sentiment_boost -= 4.0  # True institutional liquidation
        else:
            if s5 >= 15.0:
                sentiment_boost += 1.5
            elif s5 <= -20.0:
                sentiment_boost -= 2.0

    total_boost = structural_boost + valuation_boost + microstructure_boost + sentiment_boost
    empirical_pos_otm = min(99.0, max(45.0, bs_pos_otm + total_boost))

    # 6. Probability of Hitting 50% Take-Profit Early
    prob_50_tp = min(96.0, empirical_pos_otm * 1.08)

    # 7. Implied 1-Sigma Expected Move
    implied_move_dollar = spot * sigma * math.sqrt(T)
    implied_move_pct = (implied_move_dollar / spot) * 100.0
    one_sigma_lower = spot - implied_move_dollar
    one_sigma_upper = spot + implied_move_dollar

    # 8. Bullish Mean-Reversion Target Amplitude
    ema20 = float(df['Close'].ewm(span=20).mean().iloc[-1]) if len(df) >= 20 else spot
    sma50 = smc['sma50'] if not math.isnan(smc['sma50']) else spot
    eq_target = smc['equilibrium']

    amp_to_ema20 = ((ema20 - spot) / spot) * 100.0
    amp_to_sma50 = ((sma50 - spot) / spot) * 100.0
    amp_to_eq = ((eq_target - spot) / spot) * 100.0

    # 9. Downside Cushions
    downside_to_strike = -((spot - strike) / spot) * 100.0
    downside_to_basis = -((spot - cost_basis) / spot) * 100.0
    downside_to_floor = -((spot - smc['swing_low']) / spot) * 100.0

    # 10. Estimated Velocity in Trading Days
    est_days_to_50tp = max(3, int(dte * 0.38))

    # 11. Holistic Nirvana Composite Score (0 - 100 Scale)
    # Weights: Cushion Safety (25%), Fundamentals (20%), Microstructure (20%), Sentiment (15%), PoS (10%), ROC (10%)
    cushion_subscore = min(25.0, (abs(downside_to_strike) / 18.0) * 25.0)

    val_yield = lens1.get('fcf_yield_pct', 2.0) if lens1 else 2.0
    val_subscore = min(20.0, max(0.0, (val_yield / 4.0) * 20.0))

    if lens2 and lens2.get('below_avwap') and lens2.get('below_dp'):
        ms_subscore = 20.0
    elif lens2 and (lens2.get('below_avwap') or lens2.get('below_dp')):
        ms_subscore = 12.0
    else:
        ms_subscore = 6.0

    if sentiment and "Whale Absorption" in sentiment.get('divergence_badge', ''):
        sent_subscore = 15.0
    elif sentiment and sentiment.get('score_5d', 0.0) >= 0.0:
        sent_subscore = 10.0
    else:
        sent_subscore = 6.0

    pos_subscore = min(10.0, max(0.0, ((empirical_pos_otm - 60.0) / 38.0) * 10.0))

    cycle_roc_val = (bid / strike) * 100.0 if strike > 0 else 1.0
    roc_subscore = min(10.0, max(0.0, (cycle_roc_val / 2.5) * 10.0))

    nirvana_score = round(min(100.0, max(30.0, cushion_subscore + val_subscore + ms_subscore + sent_subscore + pos_subscore + roc_subscore)), 1)

    return {
        'bs_delta': float(bs_delta),
        'bs_pos_otm': float(bs_pos_otm),
        'empirical_pos_otm': float(empirical_pos_otm),
        'prob_of_touch': float(prob_of_touch),
        'prob_50_tp': float(prob_50_tp),
        'nirvana_score': float(nirvana_score),
        'valuation_boost': float(valuation_boost),
        'microstructure_boost': float(microstructure_boost),
        'sentiment_boost': float(sentiment_boost),
        'sigma_annual': float(sigma * 100.0),
        'implied_move_dollar': float(implied_move_dollar),
        'implied_move_pct': float(implied_move_pct),
        'one_sigma_lower': float(one_sigma_lower),
        'one_sigma_upper': float(one_sigma_upper),
        'upside_targets': {
            'ema20': {'price': ema20, 'amp_pct': amp_to_ema20},
            'sma50': {'price': sma50, 'amp_pct': amp_to_sma50},
            'equilibrium': {'price': eq_target, 'amp_pct': amp_to_eq}
        },
        'downside_cushions': {
            'strike_cushion_pct': downside_to_strike,
            'basis_cushion_pct': downside_to_basis,
            'structural_floor_pct': downside_to_floor
        },
        'est_days_to_50tp': est_days_to_50tp
    }
